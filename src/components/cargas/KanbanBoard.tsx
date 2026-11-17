import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import { CargoTrip, CargoStatus } from '../../types/logistics';
import {
  formatBRL,
  formatDateTime,
  getCargoStatusLabel,
  getOCStatusLabel,
  formatWeightKg,
  extractCleanDateISO,
} from '../../utils/formatters';
import {
  LayoutGrid,
  List,
  Search,
  Filter,
  Truck,
  Clock,
  CheckCircle,
  FileText,
  AlertTriangle,
  Send,
  MoreVertical,
  ChevronRight,
  ArrowRight,
  Calendar,
  DollarSign,
  Plus,
  X,
  RotateCcw,
  UserPlus,
  UserCheck,
  AlertCircle,
  Lock,
  XCircle,
  FileSpreadsheet,
  Ban,
  Layers,
  ArrowDownCircle,
  Pencil,
  MapPin,
  ChevronDown,
  Eye,
  Minus,
  ZoomIn,
} from 'lucide-react';
import { SearchableSelect } from '../ui/SearchableSelect';
import { AtribuirVeiculoModal } from './AtribuirVeiculoModal';
import { InformarCteModal } from './InformarCteModal';
import { DetalhesCargaModal } from './DetalhesCargaModal';

interface Props {
  onOpenNovaCarga: () => void;
  onOpenDoc: (cargo: CargoTrip) => void;
  onOpenWhatsApp: (cargo: CargoTrip) => void;
  onOpenOcorrencia: (cargo: CargoTrip) => void;
  onOpenDiaria: (cargo: CargoTrip) => void;
  onEditCargo: (cargo: CargoTrip) => void;
}

type DatePreset = 'todos' | 'ontem' | 'hoje' | 'amanha' | 'essa_semana' | 'personalizado';
type DateFieldFilter = 'carregamento' | 'entrega' | 'ambas';
type StatusViewFilter =
  | 'ativas'
  | 'aguardando_veiculo'
  | 'aguardando_carregar'
  | 'em_transito'
  | 'aguardando_descarga'
  | 'finalizado'
  | 'atrasadas'
  | 'canceladas'
  | 'todas';

/**
 * Identifica se uma carga está sem motorista/veículo atribuído ("A Fretar" ou pendente)
 * com data de carregamento anterior à data atual.
 */
export const isCargoDelayedUnassigned = (cargo: CargoTrip): boolean => {
  if (cargo.cargoStatus === 'cancelado' || cargo.cargoStatus === 'finalizado') return false;

  const isPendingVehicle =
    cargo.cargoStatus === 'aguardando_veiculo' ||
    !cargo.driverName ||
    cargo.driverName.toLowerCase().includes('definir') ||
    !cargo.cavaloPlate ||
    cargo.cavaloPlate.toLowerCase().includes('definir');

  if (!isPendingVehicle) return false;

  const dateStr = (cargo.scheduledLoadingDate || cargo.actualLoadingDate || '').trim();
  if (!dateStr) return false;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const loadDayStr = dateStr.slice(0, 10);

  // Se a data for no formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(loadDayStr)) {
    return loadDayStr < todayStr;
  }

  const loadDate = new Date(dateStr);
  if (isNaN(loadDate.getTime())) return false;
  return loadDate.getTime() < now.getTime();
};

export const getCargoStatusColorConfig = (status: CargoStatus) => {
  switch (status) {
    case 'aguardando_veiculo':
      return {
        label: 'Aguardando Veículo',
        badgeClass: 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200/80',
        dotClass: 'bg-amber-500',
        iconEmoji: '🟡',
      };
    case 'aguardando_carregar':
      return {
        label: 'Aguardando Carregar',
        badgeClass: 'bg-indigo-100 text-indigo-950 border-indigo-300 hover:bg-indigo-200/80',
        dotClass: 'bg-indigo-500',
        iconEmoji: '🟣',
      };
    case 'em_transito':
      return {
        label: 'Em Trânsito',
        badgeClass: 'bg-sky-100 text-sky-950 border-sky-300 hover:bg-sky-200/80',
        dotClass: 'bg-sky-500',
        iconEmoji: '🔵',
      };
    case 'aguardando_descarga':
      return {
        label: 'Aguardando Descarga',
        badgeClass: 'bg-orange-100 text-orange-950 border-orange-300 hover:bg-orange-200/80',
        dotClass: 'bg-orange-500',
        iconEmoji: '🟠',
      };
    case 'finalizado':
      return {
        label: 'Finalizado / Entregue',
        badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200/80',
        dotClass: 'bg-emerald-500',
        iconEmoji: '🟢',
      };
    case 'cancelado':
      return {
        label: 'Cancelado',
        badgeClass: 'bg-red-100 text-red-950 border-red-300 hover:bg-red-200/80',
        dotClass: 'bg-red-500',
        iconEmoji: '🔴',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200/80',
        dotClass: 'bg-slate-400',
        iconEmoji: '⚪',
      };
  }
};

export const KanbanBoard: React.FC<Props> = ({
  onOpenNovaCarga,
  onOpenDoc,
  onOpenWhatsApp,
  onOpenOcorrencia,
  onOpenDiaria,
  onEditCargo,
}) => {
  const { cargos, updateCargoStatus, cancelCargo, occurrences } = useLogistics();
  const [viewMode, setViewMode] = useState<'kanban' | 'tabela'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cargafret_cargas_view_mode');
      if (saved === 'kanban' || saved === 'tabela') return saved;
    }
    return 'tabela';
  });

  const handleSetViewMode = (mode: 'kanban' | 'tabela') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cargafret_cargas_view_mode', mode);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<StatusViewFilter>('ativas');

  // Modal para Escala / Atribuição de Veículo
  const [cargoToAssign, setCargoToAssign] = useState<CargoTrip | null>(null);

  // Modal para Validação Obrigatória de CT-e ao Iniciar Viagem
  const [cargoForCte, setCargoForCte] = useState<CargoTrip | null>(null);

  // Modal para Confirmação de Cancelamento
  const [cargoToCancel, setCargoToCancel] = useState<CargoTrip | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Modal para Visualização Completa de Detalhes da Carga
  const [cargoForDetails, setCargoForDetails] = useState<CargoTrip | null>(null);

  // Date Filtering States
  const [dateFieldFilter, setDateFieldFilter] = useState<DateFieldFilter>('carregamento');
  const [datePreset, setDatePreset] = useState<DatePreset>('todos');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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
    } else if (preset === 'ontem') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = toISODate(yesterday);
      setStartDate(yesterdayStr);
      setEndDate(yesterdayStr);
    } else if (preset === 'hoje') {
      const today = toISODate(now);
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'amanha') {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const tomorrowStr = toISODate(tomorrow);
      setStartDate(tomorrowStr);
      setEndDate(tomorrowStr);
    } else if (preset === 'essa_semana') {
      const day = now.getDay();
      const diffToMon = now.getDate() - (day === 0 ? 6 : day - 1);
      const monday = new Date(now.getFullYear(), now.getMonth(), diffToMon);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      setStartDate(toISODate(monday));
      setEndDate(toISODate(sunday));
    }
  };

  const handleClearDateFilter = () => {
    setDatePreset('todos');
    setStartDate('');
    setEndDate('');
  };

  const isDateFilterActive = !!(startDate || endDate || datePreset !== 'todos');

  // Filtered cargos combining text search, product filter and date filter
  const filtered = cargos.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      c.ocNumber.toLowerCase().includes(q) ||
      (c.pedidoCliente && c.pedidoCliente.toLowerCase().includes(q)) ||
      c.clientName.toLowerCase().includes(q) ||
      c.driverName.toLowerCase().includes(q) ||
      c.cavaloPlate.toLowerCase().includes(q) ||
      c.carretaPlate.toLowerCase().includes(q) ||
      c.originCityState.toLowerCase().includes(q) ||
      c.destinationCityState.toLowerCase().includes(q);

    const matchesProduct = filterProduct === 'todos' || c.productName === filterProduct;

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'ativas') {
      matchesStatus = c.cargoStatus !== 'cancelado';
    } else if (statusFilter === 'aguardando_veiculo') {
      matchesStatus = c.cargoStatus === 'aguardando_veiculo';
    } else if (statusFilter === 'aguardando_carregar') {
      matchesStatus = c.cargoStatus === 'aguardando_carregar';
    } else if (statusFilter === 'em_transito') {
      matchesStatus = c.cargoStatus === 'em_transito';
    } else if (statusFilter === 'aguardando_descarga') {
      matchesStatus = c.cargoStatus === 'aguardando_descarga';
    } else if (statusFilter === 'finalizado') {
      matchesStatus = c.cargoStatus === 'finalizado';
    } else if (statusFilter === 'atrasadas') {
      matchesStatus = isCargoDelayedUnassigned(c);
    } else if (statusFilter === 'canceladas') {
      matchesStatus = c.cargoStatus === 'cancelado';
    } else if (statusFilter === 'todas') {
      matchesStatus = true;
    }

    if (viewMode === 'kanban' && statusFilter === 'ativas') {
      // In Kanban active board, keep cancelled excluded
      matchesStatus = c.cargoStatus !== 'cancelado';
    }

    // Date comparison - extrai e compara apenas a parte da data (ano, mês e dia), ignorando horários
    let matchesDate = true;
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

      if (dateFieldFilter === 'carregamento') {
        matchesDate = checkDateMatch(loadDateClean);
      } else if (dateFieldFilter === 'entrega') {
        matchesDate = checkDateMatch(delivDateClean);
      } else {
        matchesDate = checkDateMatch(loadDateClean) || checkDateMatch(delivDateClean);
      }
    }

    return matchesSearch && matchesProduct && matchesStatus && matchesDate;
  });

  // Count pending vehicle assignments (excluding cancelled) and delayed unassigned loads
  const pendingVehiclesCount = cargos.filter((c) => c.cargoStatus === 'aguardando_veiculo').length;
  const delayedUnassignedCargos = cargos.filter(isCargoDelayedUnassigned);
  const delayedUnassignedCount = delayedUnassignedCargos.length;
  const activeCount = cargos.filter((c) => c.cargoStatus !== 'cancelado').length;
  const cancelledCount = cargos.filter((c) => c.cargoStatus === 'cancelado').length;

  // Dupla Barra de Rolagem Horizontal Sincronizada e Adaptação Responsiva ao Zoom
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

  // Zoom dinâmico da Tabela de Cargas com persistência local
  const [tableZoom, setTableZoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cargafret_zoom_cargas');
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
        localStorage.setItem('cargafret_zoom_cargas', String(next));
      }
      return next;
    });
  };

  const handleZoomOut = () => {
    setTableZoom((prev) => {
      const next = Math.max(70, prev - 10);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cargafret_zoom_cargas', String(next));
      }
      return next;
    });
  };

  const handleZoomReset = () => {
    setTableZoom(100);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cargafret_zoom_cargas', '100');
    }
  };

  useEffect(() => {
    if (viewMode !== 'tabela') return;

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
  }, [viewMode, filtered.length, statusFilter, searchTerm, filterProduct, tableZoom]);

  const handleConfirmCancel = () => {
    if (!cargoToCancel) return;
    cancelCargo(cargoToCancel.id, cancelReason);
    setCargoToCancel(null);
    setCancelReason('');
  };

  const columns: {
    id: CargoStatus;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    headerBg: string;
  }[] = [
    {
      id: 'aguardando_veiculo',
      title: 'A Fretar / Sem Veículo',
      subtitle: 'Programadas · Falta escalar motorista',
      icon: <UserPlus className="w-4 h-4 text-violet-600" />,
      color: 'border-violet-300 bg-violet-500/10',
      headerBg: 'bg-violet-50/70 border-violet-200',
    },
    {
      id: 'aguardando_carregar',
      title: 'Aguardando Carregar',
      subtitle: 'Escaladas · Veículos em pátio',
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      color: 'border-amber-400 bg-amber-500/10',
      headerBg: 'bg-amber-50/70 border-amber-200',
    },
    {
      id: 'em_transito',
      title: 'Em Trânsito',
      subtitle: 'Cargas na rodovia rumo ao destino',
      icon: <Truck className="w-4 h-4 text-sky-600" />,
      color: 'border-sky-400 bg-sky-500/10',
      headerBg: 'bg-sky-50/70 border-sky-200',
    },
    {
      id: 'aguardando_descarga',
      title: 'Aguardando Descarga',
      subtitle: 'Chegada no destino · Fila de descarga',
      icon: <ArrowDownCircle className="w-4 h-4 text-indigo-600" />,
      color: 'border-indigo-400 bg-indigo-500/10',
      headerBg: 'bg-indigo-50/70 border-indigo-200',
    },
    {
      id: 'finalizado',
      title: 'Finalizado / Entregue',
      subtitle: 'Descarga concluída · Canhoto OK',
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      color: 'border-emerald-400 bg-emerald-500/10',
      headerBg: 'bg-emerald-50/70 border-emerald-200',
    },
  ];

  // Distinct products for filter
  const uniqueProducts = Array.from(new Set(cargos.map((c) => c.productName)));

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            Painel de Acompanhamento das Cargas
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Fluxo operacional em 2 etapas: programação da carga (a fretar), escala de motoristas/veículos e emissão de O.C.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Segmented View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => handleSetViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => handleSetViewMode('tabela')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'tabela'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Tabela Dinâmica
            </button>
          </div>

          <button
            onClick={onOpenNovaCarga}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Carga
          </button>
        </div>
      </div>

      {/* DESTAQUE OPERACIONAL: CARGAS ATRASADAS SEM MOTORISTA / A FRETAR */}
      {delayedUnassignedCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-950 via-yellow-950 to-stone-900 text-white rounded-xl shadow-xs border border-amber-600/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Atenção Operacional · Cargas Atrasadas sem Motorista
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-stone-950">
                  {delayedUnassignedCount} {delayedUnassignedCount === 1 ? 'ATRASADA' : 'ATRASADAS'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-white mt-0.5">
                {delayedUnassignedCount} {delayedUnassignedCount === 1 ? 'carga com data de carregamento vencida' : 'cargas com data de carregamento vencida'} ainda sem motorista/veículo
              </h4>
              <p className="text-xs text-amber-100/80 mt-0.5">
                Cargas pendentes com data de carregamento anterior à de hoje foram destacadas com aviso e linha em amarelo suave no painel para facilitar o controle diário.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const firstDelayed = delayedUnassignedCargos[0];
              if (firstDelayed) setCargoToAssign(firstDelayed);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-stone-950" />
            Escalar Carga Atrasada
          </button>
        </div>
      )}

      {/* DESTAQUE OPERACIONAL: CARGAS AGUARDANDO VEÍCULO (A FRETAR) */}
      {pendingVehiclesCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white rounded-xl shadow-xs border border-violet-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300 shrink-0">
              <UserPlus className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                  Atenção Operacional · Cargas a Fretar
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-violet-500 text-white">
                  {pendingVehiclesCount} {pendingVehiclesCount === 1 ? 'PENDENTE' : 'PENDENTES'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-white mt-0.5">
                {pendingVehiclesCount} {pendingVehiclesCount === 1 ? 'carga aguardando' : 'cargas aguardando'} atribuição de motorista e caminhão
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                A emissão de Ordem de Carregamento (O.C.) é liberada assim que o veículo e motorista forem escalados.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const firstPending = cargos.find((c) => c.cargoStatus === 'aguardando_veiculo');
              if (firstPending) setCargoToAssign(firstPending);
            }}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            Escalar Próxima Carga
          </button>
        </div>
      )}

      {/* Primary Search, Status and Product Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por O.C., Pedido do Cliente, motorista, cliente, placa ou rota..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro Rápido por Status da Carga */}
          <div className="flex items-center gap-1.5 min-w-[210px] sm:min-w-[230px]">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              Status:
            </span>
            <SearchableSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter((val || 'ativas') as StatusViewFilter)}
              placeholder="Status da Carga"
              searchPlaceholder="Filtrar por status..."
              allowClear={false}
              options={[
                { value: 'ativas', label: `⚡ Ativas (${activeCount})` },
                { value: 'aguardando_veiculo', label: `🟡 A Fretar / Aguardando Veículo (${pendingVehiclesCount})` },
                { value: 'aguardando_carregar', label: `🟣 Aguardando Carregar (${cargos.filter((c) => c.cargoStatus === 'aguardando_carregar').length})` },
                { value: 'em_transito', label: `🔵 Em Trânsito (${cargos.filter((c) => c.cargoStatus === 'em_transito').length})` },
                { value: 'aguardando_descarga', label: `🟠 Aguardando Descarga (${cargos.filter((c) => c.cargoStatus === 'aguardando_descarga').length})` },
                { value: 'finalizado', label: `🟢 Finalizado / Entregue (${cargos.filter((c) => c.cargoStatus === 'finalizado').length})` },
                ...(delayedUnassignedCount > 0 ? [{ value: 'atrasadas', label: `⚠️ Atrasadas s/ Motorista (${delayedUnassignedCount})` }] : []),
                { value: 'canceladas', label: `🔴 Canceladas (${cancelledCount})` },
                { value: 'todas', label: `📋 Todas as Cargas (${cargos.length})` },
              ]}
            />
          </div>

          {/* Status filter tabs for table view */}
          {viewMode === 'tabela' && (
            <div className="hidden xl:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ativas')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'ativas'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ativas ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('aguardando_veiculo')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'aguardando_veiculo'
                    ? 'bg-white text-violet-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A Fretar ({pendingVehiclesCount})
              </button>
              {delayedUnassignedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('atrasadas')}
                  className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'atrasadas'
                      ? 'bg-amber-200 text-amber-950 shadow-2xs font-black border border-amber-400'
                      : 'text-amber-900 hover:text-amber-950 font-bold bg-amber-50/80'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Atrasadas ({delayedUnassignedCount})
                </button>
              )}
              <button
                type="button"
                onClick={() => setStatusFilter('canceladas')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'canceladas'
                    ? 'bg-white text-red-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Canceladas ({cancelledCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('todas')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'todas'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({cargos.length})
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 min-w-[200px] sm:min-w-[240px]">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Produto:</span>
            <SearchableSelect
              value={filterProduct}
              onChange={(val) => setFilterProduct(val || 'todos')}
              placeholder="Todos os Produtos"
              searchPlaceholder="Pesquisar produto..."
              allowClear={false}
              options={[
                { value: 'todos', label: `Todos os Produtos (${cargos.length})` },
                ...uniqueProducts.map((p) => ({
                  value: p,
                  label: p,
                })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS POR PERÍODO / DATA */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Filtrar por Data:
            </span>

            {/* Seletor de Campo de Data */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setDateFieldFilter('carregamento')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
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
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  dateFieldFilter === 'entrega'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Entrega / Descarga
              </button>
              <button
                type="button"
                onClick={() => setDateFieldFilter('ambas')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  dateFieldFilter === 'ambas'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ambas
              </button>
            </div>
          </div>

          {/* Atalhos Rápidos de Período: Exatamente Ontem, Hoje, Amanhã e Essa Semana */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Período:</span>
            {(
              [
                { id: 'ontem', label: 'Ontem' },
                { id: 'hoje', label: 'Hoje' },
                { id: 'amanha', label: 'Amanhã' },
                { id: 'essa_semana', label: 'Essa Semana' },
              ] as { id: DatePreset; label: string }[]
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (datePreset === preset.id) {
                    handleClearDateFilter();
                  } else {
                    handleApplyPreset(preset.id);
                  }
                }}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  datePreset === preset.id
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs ring-2 ring-indigo-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs Personalizados de Início e Fim */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">De:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('personalizado');
              }}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Até:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('personalizado');
              }}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {isDateFilterActive && (
            <button
              type="button"
              onClick={handleClearDateFilter}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors ml-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar Filtro de Datas
            </button>
          )}

          <div className="text-xs text-slate-500 ml-auto font-medium">
            Exibindo <strong className="text-slate-900">{filtered.length}</strong> de{' '}
            <strong className="text-slate-900">{cargos.length}</strong> cargas
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'kanban' ? (
        /* ================= 5 KANBAN COLUMNS ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {columns.map((col) => {
            const columnCargos = filtered.filter((c) => c.cargoStatus === col.id);

            return (
              <div
                key={col.id}
                className="bg-slate-100/70 rounded-xl p-3 border border-slate-200/80 flex flex-col min-h-[580px]"
              >
                {/* Column Header */}
                <div className={`p-3 rounded-lg border mb-3 ${col.headerBg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {col.icon}
                      <h3 className="font-bold text-xs text-slate-900">{col.title}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-slate-700 shadow-2xs border border-slate-200">
                      {columnCargos.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">{col.subtitle}</p>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-0.5">
                  {columnCargos.length === 0 ? (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs text-center p-3">
                      Nenhuma carga neste status {isDateFilterActive ? 'para o período' : ''}
                    </div>
                  ) : (
                    columnCargos.map((cargo) => {
                      const cargoOccurrences = occurrences.filter((o) => o.cargoId === cargo.id);
                      const hasOpenOcc = cargoOccurrences.some((o) => o.status !== 'resolvido');
                      const isWaitingVehicle = cargo.cargoStatus === 'aguardando_veiculo';
                      const isDelayed = isCargoDelayedUnassigned(cargo);

                      return (
                        <div
                          key={cargo.id}
                          className={`bg-white rounded-xl border p-3.5 shadow-xs transition-shadow space-y-2.5 ${
                            isDelayed
                              ? 'bg-amber-50/70 border-amber-400 hover:border-amber-500 ring-2 ring-amber-400/50'
                              : isWaitingVehicle
                              ? 'border-violet-300 hover:border-violet-400 ring-1 ring-violet-200/50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Card Top: OC & Date */}
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-xs font-black font-mono hover:underline cursor-pointer ${
                                    isDelayed
                                      ? 'text-amber-950 font-black'
                                      : isWaitingVehicle
                                      ? 'text-violet-700'
                                      : 'text-indigo-700'
                                  }`}
                                  onClick={() => {
                                    if (isWaitingVehicle || isDelayed) {
                                      setCargoToAssign(cargo);
                                    } else {
                                      onOpenDoc(cargo);
                                    }
                                  }}
                                >
                                  {cargo.ocNumber}
                                </span>
                                {isDelayed ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.2 bg-amber-200 text-amber-950 border border-amber-400 rounded uppercase">
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-900" />
                                    Atrasada
                                  </span>
                                ) : isWaitingVehicle ? (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-violet-100 text-violet-800 rounded uppercase">
                                    A Fretar
                                  </span>
                                ) : null}
                              </div>

                              {/* REQUISITO 1: PEDIDO DO CLIENTE NO CARD */}
                              {cargo.pedidoCliente && (
                                <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded mt-1">
                                  <FileSpreadsheet className="w-3 h-3 text-indigo-500 shrink-0" />
                                  Ped: {cargo.pedidoCliente}
                                </div>
                              )}

                              {/* REGISTRO DO CT-e NO CARD */}
                              {cargo.ctNumber && (
                                <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded mt-1 font-mono">
                                  <FileText className="w-3 h-3 text-emerald-600 shrink-0" />
                                  CT-e: {cargo.ctNumber}
                                </div>
                              )}

                              <div className="text-xs text-slate-600 font-medium mt-0.5">{cargo.clientName}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-900">{formatBRL(cargo.totalFreight)}</span>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {formatWeightKg(cargo.weightTons)} · {cargo.freightType === 'per_ton' ? `${formatBRL(cargo.freightRate)}/t` : 'Fechado'}
                              </div>
                              {cargo.thirdPartyTotalFreight !== undefined && cargo.thirdPartyTotalFreight > 0 && (
                                <div className="text-[10px] font-semibold text-amber-700">
                                  Custo: {formatBRL(cargo.thirdPartyTotalFreight)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Route */}
                          <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                              <span className="truncate">{cargo.originCityState}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                              <span className="truncate">{cargo.destinationCityState}</span>
                            </div>
                          </div>

                          {/* DATAS DE CARREGAMENTO E DESCARGA */}
                          <div className="bg-slate-50/90 rounded-lg p-2 border border-slate-200/70 space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 flex items-center gap-1 text-[10px]">
                                <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
                                Carregamento:
                              </span>
                              <strong className="text-slate-800 text-[10px]">
                                {formatDateTime(cargo.actualLoadingDate || cargo.scheduledLoadingDate)}
                              </strong>
                            </div>

                            {cargo.actualAwaitingUnloadDate && (
                              <div className="flex items-center justify-between text-indigo-700 bg-indigo-50/70 -mx-1 px-1 py-0.5 rounded">
                                <span className="flex items-center gap-1 text-[10px] font-semibold">
                                  <ArrowDownCircle className="w-3 h-3 text-indigo-600 shrink-0" />
                                  Real Descarga:
                                </span>
                                <strong className="text-[10px] font-mono">
                                  {formatDateTime(cargo.actualAwaitingUnloadDate)}
                                </strong>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 flex items-center gap-1 text-[10px]">
                                <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                                Descarga/Entrega:
                              </span>
                              <strong className="text-slate-800 text-[10px]">
                                {formatDateTime(cargo.actualDeliveryDate || cargo.scheduledDeliveryDate)}
                              </strong>
                            </div>
                          </div>

                          {/* Product and Driver/Vehicle */}
                          <div className="text-xs space-y-1">
                            <div className="text-slate-600 flex items-center justify-between text-[11px]">
                              <span>Produto:</span>
                              <strong className="text-slate-800">{cargo.productName}</strong>
                            </div>

                            {/* DESTACADO: Escala de Veículo */}
                            {isWaitingVehicle ? (
                              <div className="bg-violet-50 border border-violet-200 rounded-lg p-2 space-y-1.5 mt-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-violet-900 font-bold flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 text-violet-600" />
                                    Sem Veículo Escalado
                                  </span>
                                </div>
                                <button
                                  onClick={() => setCargoToAssign(cargo)}
                                  className="w-full py-1 px-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  Atribuir Motorista / Escalar
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="text-slate-600 flex items-center justify-between text-[11px]">
                                  <span>Motorista:</span>
                                  <strong className="text-slate-800 truncate ml-1">{cargo.driverName}</strong>
                                </div>
                                <div className="text-slate-600 flex items-center justify-between font-mono text-[10px]">
                                  <span>Placas:</span>
                                  <span className="text-slate-700">
                                    {cargo.cavaloPlate} / {cargo.carretaPlate || 'Sem Carreta'}
                                    {cargo.carreta2Plate ? ` / ${cargo.carreta2Plate}` : ''}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <span>{getOCStatusLabel(cargo.ocStatus).label}</span>
                              {hasOpenOcc && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                                    <AlertTriangle className="w-3 h-3" /> Ocorrência
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Actions Bar */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              {isWaitingVehicle ? (
                                <button
                                  onClick={() => setCargoToAssign(cargo)}
                                  title="Atribua o motorista e caminhão para emitir a O.C."
                                  className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Lock className="w-3.5 h-3.5 text-violet-500" />
                                  <span className="text-[10px] text-violet-700 font-bold">O.C.</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => onOpenDoc(cargo)}
                                  title="Visualizar Ordem de Carregamento"
                                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              )}

                              {!isWaitingVehicle && (
                                <button
                                  onClick={() => onOpenWhatsApp(cargo)}
                                  title="Enviar via WhatsApp ao motorista"
                                  className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => onOpenOcorrencia(cargo)}
                                title="Registrar Ocorrência"
                                className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setCargoForDetails(cargo)}
                                title="Visualizar Detalhes Completos da Carga"
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* REQUISITO 3: CANCELAR CARGA NO CARD */}
                              <button
                                onClick={() => setCargoToCancel(cargo)}
                                title="Cancelar Carga (muda status para CANCELADO na planilha)"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Move to next stage button */}
                            {col.id === 'aguardando_veiculo' && (
                              <button
                                onClick={() => setCargoToAssign(cargo)}
                                className="text-[11px] px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                              >
                                Escalar <UserCheck className="w-3 h-3" />
                              </button>
                            )}
                            {col.id === 'aguardando_carregar' && (
                              <button
                                onClick={() => setCargoForCte(cargo)}
                                className="text-[11px] px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Informar CT-e obrigatório e iniciar viagem"
                              >
                                Iniciar Viagem <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                            {col.id === 'em_transito' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateCargoStatus(cargo.id, 'aguardando_descarga')}
                                  className="text-[11px] px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                  title="Registrar chegada ao destino e aguardar descarga"
                                >
                                  Aguardando Descarga <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            {col.id === 'aguardando_descarga' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateCargoStatus(cargo.id, 'em_transito')}
                                  className="text-[10px] px-1.5 py-1 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors cursor-pointer"
                                  title="Retornar para Em Trânsito"
                                >
                                  Voltar
                                </button>
                                <button
                                  onClick={() => updateCargoStatus(cargo.id, 'finalizado')}
                                  className="text-[11px] px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                  title="Concluir entrega da carga"
                                >
                                  Concluir Entrega <CheckCircle className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            {col.id === 'finalizado' && (
                              <button
                                onClick={() => onEditCargo(cargo)}
                                className="text-[11px] px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded transition-colors cursor-pointer"
                              >
                                Detalhes
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= DYNAMIC COMPACT TABLE VIEW (PADRÃO ORDEM DE CARREGAMENTO) ================= */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs print:hidden flex flex-col w-full">
          {/* Barra de Ferramentas Superior da Tabela com Indicador e Ferramenta de Zoom no Canto Superior Direito */}
          <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Painel de Cargas</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-medium">
                {filtered.length} {filtered.length === 1 ? 'registro exibido' : 'registros exibidos'}
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

          {/* Barra de Rolagem Horizontal Superior Sincronizada */}
          <div
            ref={topScrollRef}
            onScroll={() => handleSyncScroll('top')}
            className="w-full overflow-x-auto top-scrollbar bg-slate-100/70 border-b border-slate-200 select-none"
            style={{
              display: showTopScroll ? 'block' : 'none',
            }}
            aria-label="Barra de rolagem horizontal superior sincronizada"
          >
            <div
              style={{ width: `${tableContentWidth}px`, height: '1px' }}
              className="pointer-events-none"
            />
          </div>

          {/* Container Principal da Tabela com Barra de Rolagem Vertical e Cabeçalho Fixo */}
          <div
            ref={tableScrollRef}
            onScroll={() => handleSyncScroll('table')}
            className="overflow-x-auto overflow-y-auto max-h-[65vh] custom-scrollbar w-full relative"
          >
            <table
              ref={tableRef}
              style={{ zoom: tableZoom / 100 }}
              className="w-full min-w-[70rem] text-left text-sm border-collapse"
            >
              <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3 whitespace-nowrap w-[11%] min-w-[8.75rem] bg-slate-100">O.C. / Data</th>
                  <th className="py-2.5 px-3 w-[18%] min-w-[13.5rem] bg-slate-100">Cliente / Produto</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-sky-950 font-bold w-[15%] min-w-[11.5rem] max-w-[14.5rem] bg-slate-100">Origem</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-emerald-950 font-bold w-[15%] min-w-[11.5rem] max-w-[14.5rem] bg-slate-100">Destino / Entrega</th>
                  <th className="py-2.5 px-3 whitespace-nowrap w-[17%] min-w-[12.5rem] bg-slate-100">Motorista & Veículo</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap w-[9%] min-w-[7.5rem] bg-slate-100">Frete Total</th>
                  <th className="py-2.5 px-3 whitespace-nowrap w-[15%] min-w-[11rem] bg-slate-100">Status da Carga</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap w-[10%] min-w-[8rem] bg-slate-100">Ações Operacionais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                      {isDateFilterActive
                        ? 'Nenhuma carga encontrada para o período selecionado.'
                        : 'Nenhuma carga cadastrada neste filtro.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((cargo) => {
                    const isWaitingVehicle = cargo.cargoStatus === 'aguardando_veiculo';
                    const isCancelled = cargo.cargoStatus === 'cancelado';
                    const isDelayed = isCargoDelayedUnassigned(cargo);

                    return (
                      <tr
                        key={cargo.id}
                        className={`transition-colors ${
                          isCancelled
                            ? 'bg-red-50/20 opacity-75 hover:bg-red-50/40'
                            : isDelayed
                            ? 'bg-amber-100/70 hover:bg-amber-100/95 border-l-4 border-l-amber-500 text-slate-900'
                            : isWaitingVehicle
                            ? 'bg-violet-50/20 hover:bg-violet-50/50'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* 1. O.C. / Data */}
                        <td className="py-1.5 px-3 font-medium text-slate-900 whitespace-nowrap min-w-[8.75rem]">
                          <div className="flex items-center gap-1.5 leading-tight flex-wrap">
                            <span
                              onClick={() => {
                                if (isCancelled) return;
                                if (isWaitingVehicle || isDelayed) setCargoToAssign(cargo);
                                else onOpenDoc(cargo);
                              }}
                              className={`font-mono font-bold hover:underline cursor-pointer text-xs ${
                                isCancelled
                                  ? 'text-red-700 line-through'
                                  : isDelayed
                                  ? 'text-amber-950 font-black'
                                  : isWaitingVehicle
                                  ? 'text-violet-700'
                                  : 'text-indigo-700'
                              }`}
                            >
                              {cargo.ocNumber}
                            </span>
                            {cargo.pedidoCliente && (
                              <span
                                className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                                title={`Pedido do Cliente: ${cargo.pedidoCliente}`}
                              >
                                Ped: {cargo.pedidoCliente}
                              </span>
                            )}
                            {isDelayed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.2 bg-amber-200 text-amber-950 border border-amber-400 rounded uppercase shadow-2xs">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-900 shrink-0" />
                                A Fretar (Atrasada)
                              </span>
                            ) : isWaitingVehicle ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-violet-100 text-violet-800 rounded uppercase">
                                A Fretar
                              </span>
                            ) : null}
                            {isCancelled && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-100 text-red-700 rounded uppercase">
                                Cancelada
                              </span>
                            )}
                          </div>
                          <div className={`text-[11px] leading-tight mt-0.5 flex items-center gap-1 ${isDelayed ? 'text-amber-900 font-bold' : 'text-slate-500'}`}>
                            {isDelayed && <span className="text-[10px] text-amber-800 font-extrabold">⚠️ Vencida:</span>}
                            {formatDateTime(cargo.scheduledLoadingDate)}
                          </div>
                        </td>

                        {/* 2. Cliente / Produto */}
                        <td className="py-1.5 px-3 min-w-[13.5rem]">
                          <div className="font-medium text-slate-800 text-xs truncate max-w-[15rem]" title={cargo.clientName}>
                            {cargo.clientName}
                          </div>
                          <div className="text-[11px] text-slate-500 leading-tight mt-0.5 flex items-center gap-1.5">
                            <span className="truncate max-w-[9.5rem]">{cargo.productName}</span>
                            <span className="font-semibold text-slate-600 shrink-0">· {formatWeightKg(cargo.weightTons)}</span>
                            {cargo.ctNumber && (
                              <span className="font-mono text-[9px] font-bold text-slate-700 bg-slate-100 px-1 py-0.2 rounded border border-slate-200 shrink-0">
                                CT-e: {cargo.ctNumber}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Coluna de Origem (Destaque Azul) */}
                        <td className="py-1.5 px-3 min-w-[11.5rem] max-w-[14.5rem]">
                          <div className="leading-tight">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-black bg-sky-100 text-sky-950 border border-sky-300 shadow-2xs">
                              <span className="text-[10px] uppercase tracking-wide text-sky-800 font-extrabold">Orig:</span>
                              <span className="font-bold">{cargo.originCityState}</span>
                            </span>
                          </div>
                          <div
                            className="text-[11px] font-medium text-slate-700 truncate leading-tight mt-1 max-w-[13.5rem]"
                            title={cargo.originSupplierName ? `${cargo.originSupplierName} (${cargo.originCityState})` : cargo.originCityState}
                          >
                            {cargo.originSupplierName || 'Terminal de Origem'}
                          </div>
                        </td>

                        {/* 4. Coluna de Destino / Entrega (Destaque Verde) */}
                        <td className="py-1.5 px-3 min-w-[11.5rem] max-w-[14.5rem]">
                          <div className="leading-tight">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-black bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs">
                              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="text-[10px] uppercase tracking-wide text-emerald-800 font-extrabold">Dest:</span>
                              <span className="font-bold">{cargo.destinationCityState}</span>
                            </span>
                          </div>
                          <div
                            className="text-[11px] font-medium text-slate-700 truncate leading-tight mt-1 max-w-[13.5rem]"
                            title={cargo.destinationSupplierName ? `${cargo.destinationSupplierName} (${cargo.destinationCityState})` : cargo.destinationCityState}
                          >
                            {cargo.destinationSupplierName || 'Terminal de Destino'}
                          </div>
                        </td>

                        {/* 5. Motorista & Veículo */}
                        <td className="py-1.5 px-3 whitespace-nowrap min-w-[12.5rem]">
                          {isCancelled ? (
                            <span className="text-xs text-slate-400 italic">Cancelada</span>
                          ) : isDelayed ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-400 shadow-2xs">
                                <AlertTriangle className="w-3 h-3 text-amber-900 shrink-0" /> Sem Veículo (Atrasada)
                              </span>
                              <button
                                onClick={() => setCargoToAssign(cargo)}
                                className="text-[11px] font-bold text-amber-950 hover:underline cursor-pointer"
                              >
                                Escalar Agora
                              </button>
                            </div>
                          ) : isWaitingVehicle ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-200">
                                <UserPlus className="w-3 h-3" /> Sem Veículo
                              </span>
                              <button
                                onClick={() => setCargoToAssign(cargo)}
                                className="text-[11px] font-bold text-violet-700 hover:text-violet-900 underline cursor-pointer"
                              >
                                Escalar
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium text-slate-800 text-xs leading-tight truncate max-w-[12.5rem]">{cargo.driverName}</div>
                              <div className="text-[11px] text-slate-500 font-mono leading-tight mt-0.5">
                                {cargo.cavaloPlate} / {cargo.carretaPlate || 'Sem Carreta'}
                                {cargo.carreta2Plate ? ` / ${cargo.carreta2Plate}` : ''}
                              </div>
                            </>
                          )}
                        </td>

                        {/* 6. Frete Total */}
                        <td className="py-1.5 px-3 text-right whitespace-nowrap min-w-[7.5rem]">
                          <div className="font-bold text-slate-900 text-xs leading-tight">{formatBRL(cargo.totalFreight)}</div>
                          {cargo.thirdPartyTotalFreight !== undefined && cargo.thirdPartyTotalFreight > 0 ? (
                            <div className="text-[10px] font-medium text-amber-700 leading-tight mt-0.5">
                              Custo: {formatBRL(cargo.thirdPartyTotalFreight)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                              {cargo.freightType === 'per_ton' ? `${formatBRL(cargo.freightRate)}/t` : 'Fechado'}
                            </div>
                          )}
                        </td>

                        {/* 7. Status da Carga com Cores de Destaque */}
                        <td className="py-1.5 px-3 whitespace-nowrap min-w-[11rem]">
                          {(() => {
                            const stConfig = getCargoStatusColorConfig(cargo.cargoStatus);
                            if (isCancelled) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-900 border border-red-300 shadow-2xs">
                                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                                  <Ban className="w-3.5 h-3.5 text-red-600" /> Cancelado
                                </span>
                              );
                            }

                            return (
                              <div className="relative inline-flex items-center">
                                <span className={`w-2 h-2 rounded-full absolute left-2 pointer-events-none z-10 ${stConfig.dotClass}`}></span>
                                <select
                                  value={cargo.cargoStatus}
                                  onChange={(e) => {
                                    const newSt = e.target.value as CargoStatus;
                                    if (newSt === 'cancelado') {
                                      setCargoToCancel(cargo);
                                    } else if (newSt === 'em_transito') {
                                      setCargoForCte(cargo);
                                    } else {
                                      updateCargoStatus(cargo.id, newSt);
                                    }
                                  }}
                                  className={`text-xs font-bold rounded-md border py-1 pl-5.5 pr-6 appearance-none cursor-pointer shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${stConfig.badgeClass}`}
                                >
                                  <option value="aguardando_veiculo" className="bg-white text-amber-950 font-bold">🟡 Aguardando Veículo</option>
                                  <option value="aguardando_carregar" className="bg-white text-indigo-950 font-bold">🟣 Aguardando Carregar</option>
                                  <option value="em_transito" className="bg-white text-sky-950 font-bold">🔵 Em Trânsito</option>
                                  <option value="aguardando_descarga" className="bg-white text-orange-950 font-bold">🟠 Aguardando Descarga</option>
                                  <option value="finalizado" className="bg-white text-emerald-950 font-bold">🟢 Finalizado / Entregue</option>
                                  <option value="cancelado" className="bg-white text-red-950 font-bold">🔴 Cancelar Carga</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-current opacity-70 absolute right-1.5 pointer-events-none" />
                              </div>
                            );
                          })()}
                        </td>

                        {/* 8. Ações Operacionais */}
                        <td className="py-1.5 px-3 text-center whitespace-nowrap min-w-[8rem]">
                          <div className="flex items-center justify-center gap-1">
                            {/* NOVO BOTÃO: DETALHES / VISUALIZAÇÃO COMPLETA */}
                            <button
                              onClick={() => setCargoForDetails(cargo)}
                              title="Visualizar Detalhes Completos da Carga (Operacional, Datas Reais e Financeiro)"
                              className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors border border-slate-200 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {!isCancelled && isWaitingVehicle ? (
                              <>
                                <button
                                  onClick={() => setCargoToAssign(cargo)}
                                  className="px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                  title="Escalar motorista e veículo para liberar emissão da O.C."
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Escalar
                                </button>
                                <button
                                  onClick={() => onEditCargo(cargo)}
                                  title="Editar Dados da Carga (Alterar dados operacionais)"
                                  className="p-1 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors border border-slate-300 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setCargoToCancel(cargo)}
                                  title="Cancelar Carga / O.C."
                                  className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors border border-slate-300 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </>
                            ) : !isCancelled ? (
                              <>
                                <button
                                  onClick={() => onOpenDoc(cargo)}
                                  title="Visualizar e Imprimir O.C. Oficial (A4)"
                                  className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors border border-slate-200 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onOpenWhatsApp(cargo)}
                                  title="Enviar WhatsApp ao Motorista"
                                  className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors border border-slate-200 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onOpenOcorrencia(cargo)}
                                  title="Registrar Ocorrência"
                                  className="p-1 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors border border-slate-200 cursor-pointer"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onEditCargo(cargo)}
                                  title="Editar Dados da Carga"
                                  className="p-1 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors border border-slate-300 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setCargoToCancel(cargo)}
                                  title="Cancelar Carga"
                                  className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors border border-slate-300 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => onEditCargo(cargo)}
                                title="Editar Dados da Carga"
                                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Focado em Atribuição de Veículo & Motorista */}
      <AtribuirVeiculoModal
        isOpen={Boolean(cargoToAssign)}
        cargo={cargoToAssign}
        onClose={() => setCargoToAssign(null)}
        onSuccess={(updatedCargo, openDocImmediately) => {
          setCargoToAssign(null);
          if (openDocImmediately) {
            onOpenDoc(updatedCargo);
          }
        }}
      />

      {/* REQUISITO 3: MODAL DE CONFIRMAÇÃO DE CANCELAMENTO */}
      {cargoToCancel && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="shrink-0 p-5 border-b border-slate-100 flex items-center justify-between bg-red-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cancelar Carga / O.C.</h3>
                  <p className="text-xs text-slate-500">Confirmação de cancelamento operacional</p>
                </div>
              </div>
              <button
                onClick={() => setCargoToCancel(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Carga / O.C.:</span>
                  <strong className="font-mono text-indigo-700">{cargoToCancel.ocNumber}</strong>
                </div>
                {cargoToCancel.pedidoCliente && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Pedido do Cliente:</span>
                    <strong className="text-indigo-900 font-mono">{cargoToCancel.pedidoCliente}</strong>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <strong className="text-slate-800">{cargoToCancel.clientName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rota:</span>
                  <span className="text-slate-700">
                    {cargoToCancel.originCityState} → {cargoToCancel.destinationCityState}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Valor Frete:</span>
                  <strong className="text-slate-900">{formatBRL(cargoToCancel.totalFreight)}</strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Motivo do Cancelamento <span className="text-slate-400 font-normal">(Opcional)</span>:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cancelado pelo embarcador, produto indisponível..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-[11px] text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p>
                  Ao confirmar, o status desta carga mudará para <strong>&quot;CANCELADO&quot;</strong> na Planilha Google (aba <strong>Cargas_OC</strong>), tirando-a imediatamente da fila ativa de acompanhamento.
                </p>
              </div>
            </div>

            <div className="shrink-0 p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCargoToCancel(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Validação Obrigatória de CT-e ao Iniciar Viagem */}
      <InformarCteModal
        isOpen={!!cargoForCte}
        onClose={() => setCargoForCte(null)}
        cargo={cargoForCte}
        onConfirm={(ctNumber) => {
          if (cargoForCte) {
            updateCargoStatus(cargoForCte.id, 'em_transito', { ctNumber });
            setCargoForCte(null);
          }
        }}
      />

      {/* Modal de Detalhes Completos da Carga (Dados Básicos, Datas Reais e Financeiro) */}
      <DetalhesCargaModal
        isOpen={Boolean(cargoForDetails)}
        cargo={cargoForDetails}
        onClose={() => setCargoForDetails(null)}
        onEditCargo={onEditCargo}
        onOpenDoc={onOpenDoc}
        onOpenWhatsApp={onOpenWhatsApp}
      />
    </div>
  );
};
