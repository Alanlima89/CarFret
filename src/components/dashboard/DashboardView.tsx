import React, { useState } from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import { formatBRL, formatDateTime } from '../../utils/formatters';
import { CargoTrip } from '../../types/logistics';
import {
  TrendingUp,
  Truck,
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Users,
  ChevronRight,
  Building,
  UserPlus,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { AtribuirVeiculoModal } from '../cargas/AtribuirVeiculoModal';
import { TransportPerformanceWidget } from './TransportPerformanceWidget';

interface Props {
  onNavigateTab: (tab: string) => void;
  onOpenNovaCarga: () => void;
  onOpenDoc?: (cargo: CargoTrip) => void;
}

export const DashboardView: React.FC<Props> = ({ onNavigateTab, onOpenNovaCarga, onOpenDoc }) => {
  const {
    cargos,
    dailyStayFees,
    occurrences,
    drivers,
    clients,
    freightRates,
  } = useLogistics();

  const [cargoToAssign, setCargoToAssign] = useState<CargoTrip | null>(null);

  // Active cargos (excluding cancelled loads from the active operational queue)
  const activeCargos = cargos.filter((c) => c.cargoStatus !== 'cancelado');
  const cancelledCount = cargos.filter((c) => c.cargoStatus === 'cancelado').length;

  // Metrics calculation
  const totalCargas = activeCargos.length;
  const aFretar = activeCargos.filter((c) => c.cargoStatus === 'aguardando_veiculo').length;
  const aguardandoCarregar = activeCargos.filter((c) => c.cargoStatus === 'aguardando_carregar').length;
  const emTransito = activeCargos.filter((c) => c.cargoStatus === 'em_transito').length;
  const aguardandoDescarga = activeCargos.filter((c) => c.cargoStatus === 'aguardando_descarga').length;
  const finalizadas = activeCargos.filter((c) => c.cargoStatus === 'finalizado').length;

  const totalOcsEmitidas = activeCargos.filter((c) => c.cargoStatus !== 'aguardando_veiculo').length;
  const ocsPendentesEnvio = activeCargos.filter((c) => c.ocStatus === 'gerada' && c.cargoStatus !== 'aguardando_veiculo').length;

  const faturamentoTotalFretes = activeCargos.reduce((acc, c) => acc + c.totalFreight, 0);
  const custoTotalTerceiros = activeCargos.reduce((acc, c) => acc + (c.thirdPartyTotalFreight || 0), 0);
  const margemOperacionalTotal = faturamentoTotalFretes - custoTotalTerceiros;
  const adiantamentosPagos = activeCargos.reduce((acc, c) => acc + c.advanceAmount, 0);

  const totalDiariasGeradas = dailyStayFees.reduce((acc, d) => acc + d.calculatedAmount, 0);
  const totalOcorrenciasAbertas = occurrences.filter((o) => o.status !== 'resolvido').length;

  // Breakdown by product
  const productDistribution: Record<string, { tons: number; count: number; totalValue: number }> = {};
  activeCargos.forEach((c) => {
    if (!productDistribution[c.productName]) {
      productDistribution[c.productName] = { tons: 0, count: 0, totalValue: 0 };
    }
    productDistribution[c.productName].tons += c.weightTons;
    productDistribution[c.productName].count += 1;
    productDistribution[c.productName].totalValue += c.totalFreight;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Painel de Controle Logístico em Tempo Real
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Gestão Operacional de Cargas & Fretamentos
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Acompanhe o fluxo de pátio, emissão de O.C., viagens em trânsito rodoviário, diárias de espera e faturamento contratual.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNovaCarga}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm rounded-xl transition-colors shadow-md flex items-center gap-2 cursor-pointer"
          >
            + Nova Carga (A Fretar / Escalar)
          </button>
        </div>
      </div>

      {/* QUICK INDICATORS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total de cargas no mês */}
        <div
          onClick={() => onNavigateTab('cargas')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total de Cargas</span>
            <Truck className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{totalCargas}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-1">
            {aFretar > 0 && (
              <span className="text-violet-700 font-bold">{aFretar} a fretar ·</span>
            )}
            <span>{emTransito} em viagem ·</span>
            <span>{aguardandoDescarga} em descarga ·</span>
            <span>{finalizadas} entregues</span>
          </div>
        </div>

        {/* KPI 2: Cargas a Fretar (Aguardando Veículo) */}
        <div
          onClick={() => onNavigateTab('cargas')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-violet-300 transition-colors cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">A Fretar (Sem Veículo)</span>
            <UserPlus className="w-4 h-4 text-violet-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className={`text-2xl font-black tracking-tight ${aFretar > 0 ? 'text-violet-700' : 'text-slate-800'}`}>
            {aFretar}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {aFretar > 0 ? (
              <span className="text-violet-700 font-semibold">Necessita escala de motorista</span>
            ) : (
              <span className="text-emerald-600">Todas com veículos escalados</span>
            )}
          </div>
        </div>

        {/* KPI 3: Cargas em trânsito no dia */}
        <div
          onClick={() => onNavigateTab('cargas')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-sky-300 transition-colors cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Cargas em Trânsito</span>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
          </div>
          <div className="text-2xl font-black text-sky-700 tracking-tight">{emTransito}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Rodando em rodovias federais e estaduais
          </div>
        </div>

        {/* KPI 4: Faturamento em fretes (Receita e Custo Terceiro) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Receita Fretes (Empresa)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatBRL(faturamentoTotalFretes)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Custo Terceiros:</span>
            <strong className="text-amber-700 font-mono">{formatBRL(custoTotalTerceiros)}</strong>
          </div>
          {custoTotalTerceiros > 0 && (
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
              Margem: {formatBRL(margemOperacionalTotal)}
            </div>
          )}
        </div>

        {/* KPI 5: Total de diárias geradas */}
        <div
          onClick={() => onNavigateTab('diarias')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-300 transition-colors cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Diárias / Estadias</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 tracking-tight">
            {formatBRL(totalDiariasGeradas)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {dailyStayFees.length} ocorrências de espera apuradas
          </div>
        </div>
      </div>

      {/* Transport Performance Widget (Recharts Active vs. Completed Loads per Week) */}
      <TransportPerformanceWidget cargos={cargos} />

      {/* Main Grid: Operational Status & Operational Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Recent Active Cargo Trips */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">Cargas e Viagens Recentes</h3>
              <p className="text-xs text-slate-500 mt-0.5">Visão rápida do fluxo atual em expedição e escala</p>
            </div>
            <button
              onClick={() => onNavigateTab('cargas')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Ver Todas <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {activeCargos.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Truck className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Nenhuma carga ativa no momento.</p>
                <p className="text-[11px] text-slate-400">
                  Clique em "+ Nova Carga" para realizar um lançamento de frete.
                </p>
              </div>
            ) : (
              activeCargos.slice(0, 6).map((cargo) => {
                const isWaitingVehicle = cargo.cargoStatus === 'aguardando_veiculo';
                return (
                  <div key={cargo.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-indigo-700">{cargo.ocNumber}</span>
                        {cargo.pedidoCliente && (
                          <span className="font-mono font-semibold text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                            Ped: {cargo.pedidoCliente}
                          </span>
                        )}
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-xs font-semibold text-slate-800">{cargo.clientName}</span>
                        {isWaitingVehicle && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-200 uppercase">
                            A Fretar
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span>{cargo.originCityState}</span>
                        <span className="text-slate-400">→</span>
                        <span>{cargo.destinationCityState}</span>
                        <span aria-hidden="true">·</span>
                        <span>{cargo.productName} ({cargo.weightTons}t)</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {isWaitingVehicle ? (
                          <span className="text-violet-700 font-bold">Sem motorista/veículo atribuído</span>
                        ) : (
                          <span>Motorista: {cargo.driverName} ({cargo.cavaloPlate} / {cargo.carretaPlate})</span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-sm">{formatBRL(cargo.totalFreight)}</div>
                      <div className="text-xs font-medium flex items-center gap-2">
                        {isWaitingVehicle && (
                          <button
                            onClick={() => setCargoToAssign(cargo)}
                            className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Escalar Veículo
                          </button>
                        )}
                        {cargo.cargoStatus === 'aguardando_carregar' && (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Aguardando Coleta
                          </span>
                        )}
                        {cargo.cargoStatus === 'em_transito' && (
                          <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            Em Trânsito
                          </span>
                        )}
                        {cargo.cargoStatus === 'aguardando_descarga' && (
                          <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            Aguardando Descarga
                          </span>
                        )}
                        {cargo.cargoStatus === 'finalizado' && (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Entregue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (1 col): Operational Center & Volume Breakdown */}
        <div className="space-y-6">
          {/* Operational Alerts Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Central de Atenção Operacional
            </h3>

            <div className="space-y-2 text-xs">
              {/* DESTAQUE SOLICITADO: ALERTA PARA CARGAS AGUARDANDO VEÍCULO */}
              {aFretar > 0 && (
                <div
                  onClick={() => {
                    const firstPending = cargos.find((c) => c.cargoStatus === 'aguardando_veiculo');
                    if (firstPending) setCargoToAssign(firstPending);
                  }}
                  className="p-3 bg-violet-50 border border-violet-200 rounded-lg text-violet-900 cursor-pointer hover:bg-violet-100 transition-colors flex items-start gap-2.5 shadow-2xs"
                >
                  <UserPlus className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="text-violet-950 font-bold">
                      {aFretar} carga(s) aguardando veículo (A Fretar)
                    </strong>
                    <p className="mt-0.5 text-[11px] text-violet-800">
                      Clique aqui para abrir o formulário rápido e atribuir motorista e caminhão.
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-violet-500 shrink-0 self-center" />
                </div>
              )}

              {totalOcorrenciasAbertas > 0 ? (
                <div
                  onClick={() => onNavigateTab('ocorrencias')}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 cursor-pointer hover:bg-amber-100 transition-colors flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>{totalOcorrenciasAbertas} ocorrência(s) em aberto</strong> aguardando resolução na rodovia ou descarga.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Sem ocorrências de rota pendentes.
                </div>
              )}

              {ocsPendentesEnvio > 0 && (
                <div
                  onClick={() => onNavigateTab('ordens')}
                  className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 cursor-pointer hover:bg-indigo-100 transition-colors flex items-start gap-2"
                >
                  <FileText className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>{ocsPendentesEnvio} O.C.(s) escalada(s)</strong> prontas para envio via WhatsApp aos motoristas.
                  </div>
                </div>
              )}

              {dailyStayFees.some((d) => d.status === 'pendente') && (
                <div
                  onClick={() => onNavigateTab('diarias')}
                  className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 cursor-pointer hover:bg-purple-100 transition-colors flex items-start gap-2"
                >
                  <Clock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    Diárias apuradas pendentes de aprovação e cobrança junto ao embarcador.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Volume by Produto */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-base text-slate-900">Volume por Produto</h3>
            <div className="space-y-3">
              {Object.keys(productDistribution).length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Nenhum volume registrado ainda.
                </div>
              ) : (
                Object.entries(productDistribution).map(([prodName, data]) => (
                  <div key={prodName} className="text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-medium">{prodName}</span>
                      <strong className="text-slate-900">{data.tons.toFixed(1)} TON</strong>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (data.tons / (cargos.reduce((a, b) => a + b.weightTons, 0) || 1)) * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{data.count} viagens</span>
                      <span>{formatBRL(data.totalValue)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Atribuição de Veículo no Dashboard */}
      <AtribuirVeiculoModal
        isOpen={Boolean(cargoToAssign)}
        cargo={cargoToAssign}
        onClose={() => setCargoToAssign(null)}
        onSuccess={(updatedCargo, openDocImmediately) => {
          setCargoToAssign(null);
          if (openDocImmediately && onOpenDoc) {
            onOpenDoc(updatedCargo);
          }
        }}
      />
    </div>
  );
};
