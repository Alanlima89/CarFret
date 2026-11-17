import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import { CargoTrip, CargoStatus } from '../../types/logistics';
import { formatBRL, formatDateTime, extractCleanDateISO } from '../../utils/formatters';
import { SearchableSelect } from '../ui/SearchableSelect';
import { isCargoDelayedUnassigned } from '../cargas/KanbanBoard';
import { InformarCteModal } from '../cargas/InformarCteModal';
import {
  Navigation,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  FileText,
  Check,
  ChevronDown,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Minus,
  Plus,
  ZoomIn,
} from 'lucide-react';

type DatePreset = 'todos' | 'hoje' | 'esta_semana' | 'este_mes' | 'proximos_7_dias' | 'personalizado';
type DateFieldFilter = 'carregamento' | 'entrega' | 'ambas';
type StatusFilterType =
  | 'todos'
  | 'aguardando_veiculo'
  | 'aguardando_carregar'
  | 'em_transito'
  | 'aguardando_descarga'
  | 'finalizado'
  | 'atrasadas';
type PaymentFilterType = 'todos' | 'pendentes' | 'pagos' | 'frota';

export const ControleViagensView: React.FC = () => {
  const { cargos, drivers, updateCargoPaymentStatus, updateCargoStatus } = useLogistics();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('todos');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterType>('todos');
  const [driverTypeFilter, setDriverTypeFilter] = useState<'todos' | 'Frota' | 'Terceiro'>('todos');

  // Date Filtering States
  const [dateFieldFilter, setDateFieldFilter] = useState<DateFieldFilter>('carregamento');
  const [datePreset, setDatePreset] = useState<DatePreset>('todos');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modal para Informar/Editar CT-e diretamente desta tela
  const [cargoForCte, setCargoForCte] = useState<CargoTrip | null>(null);

  // Status de Pagamento ativo sendo alterado (para menu rápido)
  const [activePaymentMenu, setActivePaymentMenu] = useState<{
    cargoId: string;
    type: 'advance' | 'balance';
  } | null>(null);

  // Presets de Data
  const toISODate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleApplyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'todos') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'hoje') {
      const today = toISODate(now);
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'esta_semana') {
      const day = now.getDay();
      const diffToMon = now.getDate() - (day === 0 ? 6 : day - 1);
      const monday = new Date(now.getFullYear(), now.getMonth(), diffToMon);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      setStartDate(toISODate(monday));
      setEndDate(toISODate(sunday));
    } else if (preset === 'este_mes') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(toISODate(firstDay));
      setEndDate(toISODate(lastDay));
    } else if (preset === 'proximos_7_dias') {
      const in7Days = new Date(now);
      in7Days.setDate(now.getDate() + 7);
      setStartDate(toISODate(now));
      setEndDate(toISODate(in7Days));
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setPaymentFilter('todos');
    setDriverTypeFilter('todos');
    setDatePreset('todos');
    setStartDate('');
    setEndDate('');
  };

  // Helper para identificar o Tipo do Motorista da Carga
  const getCargoDriverType = useCallback(
    (cargo: CargoTrip): 'Frota' | 'Terceiro' => {
      if (cargo.driverType) return cargo.driverType;
      const matched = drivers.find((d) => d.id === cargo.driverId || d.name === cargo.driverName);
      return matched?.driverType || 'Terceiro';
    },
    [drivers]
  );

  // Helper para obter os status de pagamento normalizados
  const getCargoPaymentStatuses = useCallback(
    (cargo: CargoTrip) => {
      const driverType = getCargoDriverType(cargo);
      const hasCte = Boolean(cargo.ctNumber && cargo.ctNumber.trim().length > 0);

      let adv = cargo.thirdPartyAdvancePaymentStatus;
      let bal = cargo.thirdPartyBalancePaymentStatus;

      if (driverType === 'Frota') {
        adv = 'Frota';
        bal = 'Frota';
      } else if (hasCte) {
        if (!adv || adv === 'Frota') adv = 'Pendente';
        if (!bal || bal === 'Frota') bal = 'Pendente';
      } else {
        if (!adv) adv = 'Aguardando CT-e';
        if (!bal) bal = 'Aguardando CT-e';
      }

      return { adv, bal, driverType, hasCte };
    },
    [getCargoDriverType]
  );

  // Cargas ativas para o módulo financeiro (exclui canceladas pois não possuem movimentação de pagamento)
  const activeFinancialCargos = useMemo(
    () => cargos.filter((c) => c.cargoStatus !== 'cancelado'),
    [cargos]
  );

  // Filtered Cargos
  const filteredCargos = useMemo(() => {
    return cargos.filter((c) => {
      // REGRA: Cargas canceladas não possuem movimentação de pagamento e são ocultadas
      if (c.cargoStatus === 'cancelado') return false;

      // 1. Busca por texto
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        c.ocNumber.toLowerCase().includes(q) ||
        (c.ctNumber && c.ctNumber.toLowerCase().includes(q)) ||
        (c.pedidoCliente && c.pedidoCliente.toLowerCase().includes(q)) ||
        c.clientName.toLowerCase().includes(q) ||
        c.originSupplierName.toLowerCase().includes(q) ||
        c.originCityState.toLowerCase().includes(q) ||
        c.destinationSupplierName.toLowerCase().includes(q) ||
        c.destinationCityState.toLowerCase().includes(q) ||
        c.driverName.toLowerCase().includes(q) ||
        c.cavaloPlate.toLowerCase().includes(q) ||
        c.carretaPlate.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. Filtro de Status da Carga
      if (statusFilter === 'atrasadas') {
        if (!isCargoDelayedUnassigned(c)) return false;
      } else if (statusFilter !== 'todos') {
        if (c.cargoStatus !== statusFilter) return false;
      }

      // 3. Filtro de Tipo de Motorista
      const driverType = getCargoDriverType(c);
      if (driverTypeFilter !== 'todos' && driverType !== driverTypeFilter) {
        return false;
      }

      // 4. Filtro de Pagamentos Terceiro
      if (paymentFilter !== 'todos') {
        const { adv, bal } = getCargoPaymentStatuses(c);
        if (paymentFilter === 'frota' && driverType !== 'Frota') return false;
        if (paymentFilter === 'pendentes' && adv !== 'Pendente' && bal !== 'Pendente') return false;
        if (paymentFilter === 'pagos' && adv !== 'Pago' && bal !== 'Pago') return false;
      }

      // 5. Filtro de Período de Data - extrai e compara apenas a parte da data (ano, mês e dia), ignorando horários
      if (startDate || endDate) {
        const cleanStartDate = extractCleanDateISO(startDate);
        const cleanEndDate = extractCleanDateISO(endDate);

        const loadDateClean =
          extractCleanDateISO(c.actualLoadingDate) ||
          extractCleanDateISO(c.scheduledLoadingDate);

        const delivDateClean =
          extractCleanDateISO(c.actualDeliveryDate) ||
          extractCleanDateISO(c.scheduledDeliveryDate);

        const checkDateMatch = (targetCleanDate: string) => {
          if (!targetCleanDate) return false;
          if (cleanStartDate && targetCleanDate < cleanStartDate) return false;
          if (cleanEndDate && targetCleanDate > cleanEndDate) return false;
          return true;
        };

        let matchesDate = false;
        if (dateFieldFilter === 'carregamento') {
          matchesDate = checkDateMatch(loadDateClean);
        } else if (dateFieldFilter === 'entrega') {
          matchesDate = checkDateMatch(delivDateClean);
        } else {
          matchesDate = checkDateMatch(loadDateClean) || checkDateMatch(delivDateClean);
        }

        if (!matchesDate) return false;
      }

      return true;
    });
  }, [
    cargos,
    searchTerm,
    statusFilter,
    driverTypeFilter,
    paymentFilter,
    startDate,
    endDate,
    dateFieldFilter,
    getCargoDriverType,
    getCargoPaymentStatuses,
  ]);

  // Totais e Métricas Financeiras das viagens filtradas
  const metrics = useMemo(() => {
    let totalEmpresa = 0;
    let totalTerceiro = 0;
    let totalAdiantamento = 0;
    let totalSaldo = 0;
    let pendentesCount = 0;
    let pagosCount = 0;
    let frotaCount = 0;

    filteredCargos.forEach((c) => {
      totalEmpresa += c.totalFreight || 0;
      totalTerceiro += c.thirdPartyTotalFreight || 0;
      totalAdiantamento += c.thirdPartyAdvanceAmount || 0;
      totalSaldo += c.thirdPartyBalanceAmount || 0;

      const driverType = getCargoDriverType(c);
      if (driverType === 'Frota') {
        frotaCount++;
      } else {
        const { adv, bal } = getCargoPaymentStatuses(c);
        if (adv === 'Pendente' || bal === 'Pendente') pendentesCount++;
        if (adv === 'Pago' && bal === 'Pago') pagosCount++;
      }
    });

    return {
      totalEmpresa,
      totalTerceiro,
      totalAdiantamento,
      totalSaldo,
      pendentesCount,
      pagosCount,
      frotaCount,
      count: filteredCargos.length,
    };
  }, [filteredCargos, getCargoDriverType, getCargoPaymentStatuses]);

  // Rolagem Horizontal Sincronizada
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const isSyncingScroll = useRef<boolean>(false);
  const [tableContentWidth, setTableContentWidth] = useState<number>(0);
  const [showTopScroll, setShowTopScroll] = useState<boolean>(false);

  const handleSyncScroll = useCallback((source: 'top' | 'table') => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;

    if (source === 'top' && topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    } else if (source === 'table' && topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }

    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  }, []);

  // Zoom dinâmico da Tabela de Controle Financeiro com persistência local
  const [tableZoom, setTableZoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cargafret_zoom_financeiro');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num >= 70 && num <= 140) return num;
      }
    }
    return 100;
  });

  const handleZoomIn = () => {
    setTableZoom((prev) => {
      const next = Math.min(140, prev + 10);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cargafret_zoom_financeiro', String(next));
      }
      return next;
    });
  };

  const handleZoomOut = () => {
    setTableZoom((prev) => {
      const next = Math.max(70, prev - 10);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cargafret_zoom_financeiro', String(next));
      }
      return next;
    });
  };

  const handleZoomReset = () => {
    setTableZoom(100);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cargafret_zoom_financeiro', '100');
    }
  };

  useEffect(() => {
    const measureScroll = () => {
      if (tableScrollRef.current) {
        const sw = tableScrollRef.current.scrollWidth;
        const cw = tableScrollRef.current.clientWidth;
        setTableContentWidth(sw);
        setShowTopScroll(sw > cw + 4);
        if (topScrollRef.current) {
          topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
        }
      }
    };

    measureScroll();
    const timer = setTimeout(measureScroll, 120);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        measureScroll();
      });
      if (tableScrollRef.current) observer.observe(tableScrollRef.current);
      if (tableRef.current) observer.observe(tableRef.current);
    }

    window.addEventListener('resize', measureScroll);
    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', measureScroll);
    };
  }, [filteredCargos.length, tableZoom]);

  // Handler para alternar pagamento
  const handleTogglePayment = (
    cargo: CargoTrip,
    column: 'advance' | 'balance',
    currentStatus: string | undefined
  ) => {
    const driverType = getCargoDriverType(cargo);
    if (driverType === 'Frota') {
      // Motorista da Frota é fixo como Frota
      return;
    }

    // Se ainda não tem CT-e, avisa ou abre modal de CT-e
    if (!cargo.ctNumber || !cargo.ctNumber.trim()) {
      setCargoForCte(cargo);
      return;
    }

    const nextStatus = currentStatus === 'Pago' ? 'Pendente' : 'Pago';
    if (column === 'advance') {
      updateCargoPaymentStatus(cargo.id, nextStatus, cargo.thirdPartyBalancePaymentStatus);
    } else {
      updateCargoPaymentStatus(cargo.id, cargo.thirdPartyAdvancePaymentStatus, nextStatus);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F5897] to-indigo-700 text-white flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Controle Financeiro
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Colunas A–AX da Cargas_OC
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Visão de faturamento, frete empresa e controle de pagamentos a terceiros (Adiantamento e Saldo). Cargas canceladas são desconsideradas por não possuírem movimentação financeira.
              </p>
            </div>
          </div>
        </div>

        {/* Resumo das Viagens Ativas */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Viagens Faturadas / Ativas
            </span>
            <span className="text-lg font-black font-mono text-slate-900">
              {metrics.count} <span className="text-xs font-normal text-slate-500">viagens</span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Financeiros & Operacionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Receita Frete Empresa:</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-black text-blue-700 font-mono">
            {formatBRL(metrics.totalEmpresa)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Total faturado aos clientes</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Custo Frete Terceiro:</span>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-black text-amber-700 font-mono">
            {formatBRL(metrics.totalTerceiro)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Custo previsto a terceiros</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Adiantamentos Terceiro:</span>
            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
              Col AW
            </span>
          </div>
          <div className="text-lg font-black text-slate-900 font-mono">
            {formatBRL(metrics.totalAdiantamento)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Liberado no carregamento</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Saldos de Frete Terceiro:</span>
            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              Col AX
            </span>
          </div>
          <div className="text-lg font-black text-emerald-700 font-mono">
            {formatBRL(metrics.totalSaldo)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">A pagar após entrega e canhoto</p>
        </div>
      </div>

      {/* Barra de Filtros Primários: Status da Carga, Tipo de Motorista e Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Busca Rápida */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por O.C., CT-e, Pedido, motorista, cliente, cidade ou placa..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro por Status da Carga */}
            <div className="flex items-center gap-1.5 min-w-[200px] sm:min-w-[220px]">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                Status Carga:
              </span>
              <SearchableSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter((val || 'todos') as StatusFilterType)}
                placeholder="Todos os Status"
                searchPlaceholder="Pesquisar status..."
                allowClear={false}
                options={[
                  { value: 'todos', label: `Todos os Status Ativos (${activeFinancialCargos.length})` },
                  { value: 'aguardando_veiculo', label: '🟡 Aguardando Veículo' },
                  { value: 'aguardando_carregar', label: '🟣 Aguardando Carregar' },
                  { value: 'em_transito', label: '🔵 Em Trânsito' },
                  { value: 'aguardando_descarga', label: '🟠 Aguardando Descarga' },
                  { value: 'finalizado', label: '🟢 Finalizado / Entregue' },
                  { value: 'atrasadas', label: '⚠️ Cargas Atrasadas' },
                ]}
              />
            </div>

            {/* Filtro por Tipo de Motorista */}
            <div className="flex items-center gap-1.5 min-w-[150px]">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Tipo:</span>
              <SearchableSelect
                value={driverTypeFilter}
                onChange={(val) => setDriverTypeFilter((val || 'todos') as any)}
                placeholder="Tipo Motorista"
                searchPlaceholder="Filtrar por tipo..."
                allowClear={false}
                options={[
                  { value: 'todos', label: 'Todos os Tipos' },
                  { value: 'Terceiro', label: 'Terceiro (Com Frete Terceiro)' },
                  { value: 'Frota', label: 'Frota (Veículo Próprio)' },
                ]}
              />
            </div>

            {/* Filtro por Status de Pagamento */}
            <div className="flex items-center gap-1.5 min-w-[160px]">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Pagamentos:</span>
              <SearchableSelect
                value={paymentFilter}
                onChange={(val) => setPaymentFilter((val || 'todos') as any)}
                placeholder="Pagamentos"
                searchPlaceholder="Filtrar pagamento..."
                allowClear={false}
                options={[
                  { value: 'todos', label: 'Todos os Pagamentos' },
                  { value: 'pendentes', label: '🟡 Pendentes (A Pagar)' },
                  { value: 'pagos', label: '🟢 Pagos (Quitados)' },
                  { value: 'frota', label: '⚪ Frota (Sem Pagto Terceiro)' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Filtros por Período de Data */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Período de Data:
            </span>

            {/* Seletor do Campo de Data */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setDateFieldFilter('carregamento')}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  dateFieldFilter === 'carregamento'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Carregamento
              </button>
              <button
                type="button"
                onClick={() => setDateFieldFilter('entrega')}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  dateFieldFilter === 'entrega'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Entrega
              </button>
              <button
                type="button"
                onClick={() => setDateFieldFilter('ambas')}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  dateFieldFilter === 'ambas'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ambas
              </button>
            </div>

            {/* Botões Presets de Data */}
            <div className="flex items-center gap-1 flex-wrap">
              {(
                [
                  { id: 'todos', label: 'Todo Histórico' },
                  { id: 'hoje', label: 'Hoje' },
                  { id: 'esta_semana', label: 'Esta Semana' },
                  { id: 'este_mes', label: 'Este Mês' },
                  { id: 'proximos_7_dias', label: 'Próx. 7 Dias' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                    datePreset === preset.id
                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs de Data Início / Fim */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('personalizado');
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            <span className="text-xs text-slate-400">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('personalizado');
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />

            {(startDate || endDate || statusFilter !== 'todos' || searchTerm || paymentFilter !== 'todos' || driverTypeFilter !== 'todos') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-slate-500 hover:text-rose-600 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer ml-1"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Regra de Pagamento Informativa */}
      <div className="p-3 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-indigo-100 rounded-xl text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-indigo-600 font-black">ℹ️ Regra Operacional de Pagamento:</span>
          <span>
            Ao emitir/informar o <strong>Nº CT-e</strong>, se o motorista for <strong>Terceiro</strong>, as colunas de adiantamento e saldo tornam-se <strong>Pendente</strong> (amarelo), podendo ser alternadas para <strong>Pago</strong> (verde) com 1 clique. Para motoristas da <strong>Frota</strong>, ficam identificadas como <strong>Frota</strong> (cinza).
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
            🟡 Pendente
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
            🟢 Pago
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-300">
            ⚪ Frota
          </span>
        </div>
      </div>

      {/* TABELA COM AS EXATAS 16 COLUNAS DA ABA Cargas_OC */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Barra de Ferramentas Superior com Indicador e Ferramenta de Zoom no Canto Superior Direito */}
        <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Controle Financeiro</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">
              {filteredCargos.length} {filteredCargos.length === 1 ? 'registro exibido' : 'registros exibidos'}
            </span>
            {showTopScroll && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Dupla rolagem ativa
              </span>
            )}
          </div>

          {/* Ferramenta de Zoom: Aumentar / Diminuir / Redefinir */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs ml-auto">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mr-0.5">
              <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
              Zoom:
            </span>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={tableZoom <= 70}
              title="Diminuir Zoom (-10%)"
              className="p-1 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:cursor-not-allowed"
              aria-label="Diminuir zoom da tabela"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs font-semibold text-slate-700 min-w-[2.75rem] text-center select-none">
              {tableZoom}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={tableZoom >= 140}
              title="Aumentar Zoom (+10%)"
              className="p-1 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:cursor-not-allowed"
              aria-label="Aumentar zoom da tabela"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              disabled={tableZoom === 100}
              title="Redefinir Zoom para 100%"
              className="ml-1 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
              aria-label="Redefinir zoom para 100%"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Redefinir</span>
            </button>
          </div>
        </div>

        {/* Barra de rolagem superior sincronizada */}
        {showTopScroll && (
          <div
            ref={topScrollRef}
            onScroll={() => handleSyncScroll('top')}
            className="overflow-x-auto overflow-y-hidden border-b border-slate-200 bg-slate-50/90 py-1 px-2 custom-scrollbar"
            style={{ height: '16px' }}
          >
            <div style={{ width: `${tableContentWidth}px`, height: '1px' }} />
          </div>
        )}

        <div
          ref={tableScrollRef}
          onScroll={() => handleSyncScroll('table')}
          className="overflow-x-auto overflow-y-auto max-h-[65vh] custom-scrollbar relative"
        >
          <table
            ref={tableRef}
            style={{ zoom: tableZoom / 100 }}
            className="w-full text-left border-collapse text-xs"
          >
            <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap select-none shadow-2xs">
              <tr className="bg-slate-100">
                <th className="py-3 px-3 sticky left-0 z-30 bg-slate-100 shadow-[1px_0_0_0_#cbd5e1]">
                  1. Nº OC
                </th>
                <th className="py-3 px-3 bg-slate-100">2. Cliente Nome</th>
                <th className="py-3 px-3 bg-slate-100">3. Origem Nome</th>
                <th className="py-3 px-3 bg-slate-100">4. Origem Cidade/UF</th>
                <th className="py-3 px-3 bg-slate-100">5. Destino Nome</th>
                <th className="py-3 px-3 bg-slate-100">6. Destino Cidade/UF</th>
                <th className="py-3 px-3 bg-slate-100">7. Motorista Nome</th>
                <th className="py-3 px-3 bg-slate-100">8. Placa Cavalo</th>
                <th className="py-3 px-3 bg-slate-100">9. Placa Carreta</th>
                <th className="py-3 px-3 bg-slate-100">10. Nº CT-e</th>
                <th className="py-3 px-3 text-right bg-slate-100">11. Total Frete Empresa</th>
                <th className="py-3 px-3 text-right bg-slate-100">12. Total Frete Terceiro</th>
                <th className="py-3 px-3 text-right bg-slate-100">13. Adiantamento Terceiro</th>
                <th className="py-3 px-3 text-right bg-slate-100">14. Saldo Terceiro</th>
                <th className="py-3 px-3 text-center bg-amber-100/90 border-l border-amber-300">
                  15. Pag Adiantamento Terceiro (AW)
                </th>
                <th className="py-3 px-3 text-center bg-emerald-100/90 border-l border-emerald-300">
                  16. Pag Saldo Terceiro (AX)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCargos.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-600">Nenhuma viagem encontrada com os filtros atuais.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ajuste a busca por texto, status da carga ou o período de data selecionado.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCargos.map((cargo, idx) => {
                  const { adv, bal, driverType, hasCte } = getCargoPaymentStatuses(cargo);
                  const isDelayed = isCargoDelayedUnassigned(cargo);

                  return (
                    <tr
                      key={cargo.id}
                      className={`hover:bg-indigo-50/40 transition-colors whitespace-nowrap text-slate-700 ${
                        isDelayed ? 'bg-amber-50/70 border-l-4 border-l-amber-500' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      {/* 1. Nº OC */}
                      <td className={`py-2.5 px-3 font-mono font-bold text-indigo-700 sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0] ${
                        isDelayed ? 'bg-amber-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <span>{cargo.ocNumber}</span>
                          {cargo.pedidoCliente && (
                            <span className="text-[10px] font-sans font-normal text-slate-500" title={`Pedido: ${cargo.pedidoCliente}`}>
                              (Ped: {cargo.pedidoCliente})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Cliente Nome */}
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[200px] truncate" title={cargo.clientName}>
                        {cargo.clientName}
                      </td>

                      {/* 3. Origem Nome */}
                      <td className="py-2.5 px-3 max-w-[180px] truncate" title={cargo.originSupplierName}>
                        {cargo.originSupplierName || '-'}
                      </td>

                      {/* 4. Origem Cidade/UF */}
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {cargo.originCityState || '-'}
                      </td>

                      {/* 5. Destino Nome */}
                      <td className="py-2.5 px-3 max-w-[180px] truncate" title={cargo.destinationSupplierName}>
                        {cargo.destinationSupplierName || '-'}
                      </td>

                      {/* 6. Destino Cidade/UF */}
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {cargo.destinationCityState || '-'}
                      </td>

                      {/* 7. Motorista Nome & Badge de Tipo */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {cargo.driverName || <span className="text-amber-800 italic font-normal">A Definir</span>}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider border ${
                              driverType === 'Frota'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                          >
                            {driverType}
                          </span>
                        </div>
                      </td>

                      {/* 8. Placa Cavalo */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {cargo.cavaloPlate || <span className="text-slate-400 font-normal italic">-</span>}
                      </td>

                      {/* 9. Placa Carreta */}
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {cargo.carretaPlate ? (
                          <span>
                            {cargo.carretaPlate}
                            {cargo.carreta2Plate ? ` / ${cargo.carreta2Plate}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic font-normal">-</span>
                        )}
                      </td>

                      {/* 10. Nº CT-e */}
                      <td className="py-2.5 px-3">
                        {cargo.ctNumber ? (
                          <button
                            type="button"
                            onClick={() => setCargoForCte(cargo)}
                            className="font-mono font-bold text-slate-900 hover:text-indigo-600 underline decoration-slate-300 hover:decoration-indigo-500 cursor-pointer flex items-center gap-1"
                            title="Clique para editar o CT-e"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            {cargo.ctNumber}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCargoForCte(cargo)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors cursor-pointer flex items-center gap-1"
                            title="Clique para informar o número do CT-e"
                          >
                            <FileText className="w-3 h-3 text-amber-600" />
                            Informar CT-e
                          </button>
                        )}
                      </td>

                      {/* 11. Total Frete Empresa */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                        {formatBRL(cargo.totalFreight)}
                      </td>

                      {/* 12. Total Frete Terceiro (R$) */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800">
                        {cargo.thirdPartyTotalFreight ? formatBRL(cargo.thirdPartyTotalFreight) : '-'}
                      </td>

                      {/* 13. Adiantamento Terceiro (R$) */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {cargo.thirdPartyAdvanceAmount ? formatBRL(cargo.thirdPartyAdvanceAmount) : '-'}
                      </td>

                      {/* 14. Saldo Terceiro (R$) */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {cargo.thirdPartyBalanceAmount ? formatBRL(cargo.thirdPartyBalanceAmount) : '-'}
                      </td>

                      {/* 15. Pag Adiantamento Terceiro (Coluna AW) */}
                      <td className="py-2.5 px-3 text-center bg-amber-50/30 border-l border-amber-200">
                        {driverType === 'Frota' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 select-none">
                            <span>⚪</span> Frota
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePayment(cargo, 'advance', adv)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer shadow-2xs ${
                              adv === 'Pago'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                : adv === 'Pendente'
                                ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200 ring-1 ring-amber-400/30'
                                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                            }`}
                            title="Clique para alternar entre Pendente e Pago"
                          >
                            {adv === 'Pago' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                                Pago
                              </>
                            ) : adv === 'Pendente' ? (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-700" />
                                Pendente
                              </>
                            ) : (
                              adv || 'Aguardando'
                            )}
                          </button>
                        )}
                      </td>

                      {/* 16. Pag Saldo Terceiro (Coluna AX) */}
                      <td className="py-2.5 px-3 text-center bg-emerald-50/30 border-l border-emerald-200">
                        {driverType === 'Frota' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 select-none">
                            <span>⚪</span> Frota
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePayment(cargo, 'balance', bal)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer shadow-2xs ${
                              bal === 'Pago'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                : bal === 'Pendente'
                                ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200 ring-1 ring-amber-400/30'
                                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                            }`}
                            title="Clique para alternar entre Pendente e Pago"
                          >
                            {bal === 'Pago' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                                Pago
                              </>
                            ) : bal === 'Pendente' ? (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-700" />
                                Pendente
                              </>
                            ) : (
                              bal || 'Aguardando'
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela com Resumo de Totais */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-4">
            <span>
              Exibindo <strong>{filteredCargos.length}</strong> de <strong>{activeFinancialCargos.length}</strong> viagens ativas
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-slate-500">
              Pagamentos a Terceiros:{' '}
              <strong className="text-amber-800">{metrics.pendentesCount} pendentes</strong> ·{' '}
              <strong className="text-emerald-800">{metrics.pagosCount} quitados</strong> ·{' '}
              <strong className="text-slate-700">{metrics.frotaCount} frota</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">
              Total Faturado: <strong className="text-blue-700 font-mono">{formatBRL(metrics.totalEmpresa)}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-700">
              Total Custo: <strong className="text-amber-800 font-mono">{formatBRL(metrics.totalTerceiro)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Modal para Informar ou Editar CT-e */}
      <InformarCteModal
        isOpen={!!cargoForCte}
        onClose={() => setCargoForCte(null)}
        cargo={cargoForCte}
        onConfirm={(ctNumber) => {
          if (cargoForCte) {
            updateCargoStatus(cargoForCte.id, cargoForCte.cargoStatus, { ctNumber });
            setCargoForCte(null);
          }
        }}
      />
    </div>
  );
};
