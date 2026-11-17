import React from 'react';
import { CargoTrip } from '../../types/logistics';
import { useLogistics } from '../../context/LogisticsContext';
import {
  formatBRL,
  formatDateTime,
  formatWeightKg,
  getCargoStatusLabel,
  formatCpfCnpj,
} from '../../utils/formatters';
import { getCargoStatusColorConfig, isCargoDelayedUnassigned } from './KanbanBoard';
import {
  X,
  FileText,
  Truck,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Pencil,
  Printer,
  DollarSign,
  User,
  ShieldCheck,
  Check,
  Building,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cargo: CargoTrip | null;
  onEditCargo?: (cargo: CargoTrip) => void;
  onOpenDoc?: (cargo: CargoTrip) => void;
  onOpenWhatsApp?: (cargo: CargoTrip) => void;
}

export const DetalhesCargaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  cargo,
  onEditCargo,
  onOpenDoc,
  onOpenWhatsApp,
}) => {
  const { drivers, updateCargoPaymentStatus } = useLogistics();

  if (!isOpen || !cargo) return null;

  const statusConfig = getCargoStatusColorConfig(cargo.cargoStatus);
  const isDelayed = isCargoDelayedUnassigned(cargo);

  // Identificação do Tipo de Motorista
  const matchedDriver = drivers.find(
    (d) => d.id === cargo.driverId || d.name === cargo.driverName
  );
  const driverType = cargo.driverType || matchedDriver?.driverType || 'Terceiro';

  // Normalização dos status de pagamento
  const hasCte = Boolean(cargo.ctNumber && cargo.ctNumber.trim().length > 0);
  let advStatus = cargo.thirdPartyAdvancePaymentStatus;
  let balStatus = cargo.thirdPartyBalancePaymentStatus;

  if (driverType === 'Frota') {
    advStatus = 'Frota';
    balStatus = 'Frota';
  } else if (hasCte) {
    if (!advStatus || advStatus === 'Frota') advStatus = 'Pendente';
    if (!balStatus || balStatus === 'Frota') balStatus = 'Pendente';
  } else {
    if (!advStatus) advStatus = 'Aguardando CT-e';
    if (!balStatus) balStatus = 'Aguardando CT-e';
  }

  // Handler rápido para alternar pagamento
  const handleTogglePayment = (type: 'advance' | 'balance') => {
    if (driverType === 'Frota') return;
    if (!hasCte) return;

    if (type === 'advance') {
      const nextAdv = advStatus === 'Pago' ? 'Pendente' : 'Pago';
      updateCargoPaymentStatus(cargo.id, nextAdv, cargo.thirdPartyBalancePaymentStatus);
    } else {
      const nextBal = balStatus === 'Pago' ? 'Pendente' : 'Pago';
      updateCargoPaymentStatus(cargo.id, cargo.thirdPartyAdvancePaymentStatus, nextBal);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:hidden animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="shrink-0 bg-gradient-to-r from-[#0F5897] via-[#146EBA] to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xs">
              <Truck className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base font-black tracking-tight text-white">
                  {cargo.ocNumber}
                </span>
                {cargo.pedidoCliente && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-white border border-white/25">
                    Ped. {cargo.pedidoCliente}
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${statusConfig.badgeClass} bg-white text-slate-900 border-white/60`}
                >
                  {statusConfig.label}
                </span>
                {isDelayed && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Carga Atrasada s/ Motorista
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-100/90 mt-0.5">
                Visualização completa dos dados operacionais, datas reais e controle financeiro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar detalhes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body com Rolagem Interna */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
          {/* SEÇÃO 1: DATAS REAIS REGISTRADAS (COLUNAS AC, AD, AE) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Linha do Tempo & Datas Reais Registradas
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Colunas AC · AD · AE da Cargas_OC
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Real Carregamento (AC) */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  cargo.actualLoadingDate
                    ? 'bg-sky-50/70 border-sky-300 text-sky-950'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    1. Real Carregamento (AC)
                  </span>
                  {cargo.actualLoadingDate ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-sky-200 text-sky-900 border border-sky-300">
                      Registrado
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200 text-slate-700">
                      Pendente
                    </span>
                  )}
                </div>
                <div className="font-mono font-bold text-sm text-slate-900">
                  {cargo.actualLoadingDate ? (
                    formatDateTime(cargo.actualLoadingDate)
                  ) : (
                    <span className="text-slate-400 font-normal italic text-xs">
                      Aguardando início do carregamento
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  Previsão Agendada: <strong className="font-mono text-slate-700">{formatDateTime(cargo.scheduledLoadingDate)}</strong>
                </div>
              </div>

              {/* Real Aguardando Descarga (AD) */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  cargo.actualAwaitingUnloadDate
                    ? 'bg-orange-50/70 border-orange-300 text-orange-950'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    2. Aguardando Descarga (AD)
                  </span>
                  {cargo.actualAwaitingUnloadDate ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-orange-200 text-orange-900 border border-orange-300">
                      Chegada no Destino
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200 text-slate-700">
                      Em Trânsito / Não Chegou
                    </span>
                  )}
                </div>
                <div className="font-mono font-bold text-sm text-slate-900">
                  {cargo.actualAwaitingUnloadDate ? (
                    formatDateTime(cargo.actualAwaitingUnloadDate)
                  ) : (
                    <span className="text-slate-400 font-normal italic text-xs">
                      Em rota / Aguardando fila de descarga
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  Carimbo de entrada no pátio de destino
                </div>
              </div>

              {/* Real Entrega (AE) */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  cargo.actualDeliveryDate
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    3. Real Entrega (AE)
                  </span>
                  {cargo.actualDeliveryDate ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-emerald-200 text-emerald-900 border border-emerald-300">
                      Concluída
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200 text-slate-700">
                      Pendente
                    </span>
                  )}
                </div>
                <div className="font-mono font-bold text-sm text-slate-900">
                  {cargo.actualDeliveryDate ? (
                    formatDateTime(cargo.actualDeliveryDate)
                  ) : (
                    <span className="text-slate-400 font-normal italic text-xs">
                      Viagem ainda em andamento
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  Previsão de Entrega: <strong className="font-mono text-slate-700">{formatDateTime(cargo.scheduledDeliveryDate)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: DADOS FISCAIS & FINANCEIROS (CT-E E STATUS DE PAGAMENTO AW E AX) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Dados Fiscais & Controle Financeiro de Fretes
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Colunas AS · AW · AX da Cargas_OC
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Documento Fiscal: CT-e */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Número do CT-e (Coluna AS)
                </span>
                {cargo.ctNumber ? (
                  <div className="flex items-center gap-1.5 font-mono font-bold text-base text-slate-900">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{cargo.ctNumber}</span>
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 font-medium italic flex items-center gap-1">
                    <span>⚠️</span> Não informado / Aguardando emissão
                  </div>
                )}
                {cargo.nfNumber && (
                  <span className="text-[11px] text-slate-500 font-mono block">
                    NF-e: <strong>{cargo.nfNumber}</strong>
                  </span>
                )}
              </div>

              {/* Frete Empresa (Receita) */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-900 block">
                  Frete Empresa (Receita)
                </span>
                <div className="font-mono font-black text-lg text-blue-700">
                  {formatBRL(cargo.totalFreight)}
                </div>
                <div className="text-[11px] text-blue-800/80">
                  {cargo.freightType === 'per_ton'
                    ? `${formatBRL(cargo.freightRate)}/ton (${cargo.weightTons}t)`
                    : 'Valor Fechado'}
                </div>
              </div>

              {/* Status Pagamento Adiantamento Terceiro (AW) */}
              <div
                className={`p-3 rounded-xl border space-y-1.5 transition-all ${
                  advStatus === 'Pago'
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : advStatus === 'Pendente'
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-600">
                    15. Pag Adiantamento (AW)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {cargo.thirdPartyAdvanceAmount ? formatBRL(cargo.thirdPartyAdvanceAmount) : '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  {driverType === 'Frota' ? (
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                      ⚪ Frota (Veículo Próprio)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleTogglePayment('advance')}
                      disabled={!hasCte}
                      className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider border transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                        advStatus === 'Pago'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200'
                          : advStatus === 'Pendente'
                          ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200 ring-2 ring-amber-400/20'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                      title={hasCte ? 'Clique para alternar entre Pendente e Pago' : 'Informe o CT-e para liberar o status de pagamento'}
                    >
                      {advStatus === 'Pago' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                          Pago
                        </>
                      ) : advStatus === 'Pendente' ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          Pendente
                        </>
                      ) : (
                        advStatus || 'Aguardando CT-e'
                      )}
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-slate-500">
                  Adiantamento de saída
                </div>
              </div>

              {/* Status Pagamento Saldo Terceiro (AX) */}
              <div
                className={`p-3 rounded-xl border space-y-1.5 transition-all ${
                  balStatus === 'Pago'
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : balStatus === 'Pendente'
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-600">
                    16. Pag Saldo (AX)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {cargo.thirdPartyBalanceAmount ? formatBRL(cargo.thirdPartyBalanceAmount) : '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  {driverType === 'Frota' ? (
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                      ⚪ Frota (Veículo Próprio)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleTogglePayment('balance')}
                      disabled={!hasCte}
                      className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider border transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                        balStatus === 'Pago'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200'
                          : balStatus === 'Pendente'
                          ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200 ring-2 ring-amber-400/20'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                      title={hasCte ? 'Clique para alternar entre Pendente e Pago' : 'Informe o CT-e para liberar o status de pagamento'}
                    >
                      {balStatus === 'Pago' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                          Pago
                        </>
                      ) : balStatus === 'Pendente' ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          Pendente
                        </>
                      ) : (
                        balStatus || 'Aguardando CT-e'
                      )}
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-slate-500">
                  Saldo após canhoto de entrega
                </div>
              </div>
            </div>

            {/* Custo Total Terceiro */}
            {cargo.thirdPartyTotalFreight !== undefined && cargo.thirdPartyTotalFreight > 0 && (
              <div className="flex items-center justify-between bg-amber-50/50 p-2.5 rounded-lg border border-amber-200 text-xs text-amber-950 font-medium">
                <span>Custo Total do Frete Terceiro Contratado:</span>
                <span className="font-mono font-black text-amber-900 text-sm">
                  {formatBRL(cargo.thirdPartyTotalFreight)}
                </span>
              </div>
            )}
          </div>

          {/* SEÇÃO 3: ROTA, CLIENTE, MOTORISTA E VEÍCULO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rota (Origem -> Destino) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                Rota e Locais Operacionais
              </h4>

              <div className="space-y-3 text-xs">
                {/* Origem */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold uppercase mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    Origem / Local de Coleta:
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {cargo.originSupplierName}
                  </div>
                  <div className="text-slate-700 font-medium">
                    {cargo.originCityState}
                  </div>
                  {cargo.originAddress && (
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {cargo.originAddress}
                    </div>
                  )}
                </div>

                {/* Destino */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold uppercase mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Destino / Local de Descarga:
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {cargo.destinationSupplierName}
                  </div>
                  <div className="text-slate-700 font-medium">
                    {cargo.destinationCityState}
                  </div>
                  {cargo.destinationAddress && (
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {cargo.destinationAddress}
                    </div>
                  )}
                </div>

                {/* Cliente Tomador e Produto */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cliente Tomador:</span>
                    <strong className="text-slate-800">{cargo.clientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Produto & Carga:</span>
                    <span className="text-slate-800 font-semibold">{cargo.productName}</span>
                    <span className="text-slate-500 text-[11px] block font-mono">
                      {cargo.weightTons} tons ({formatWeightKg(cargo.weightKg || cargo.weightTons * 1000)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Motorista e Veículos */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                Motorista & Conjunto Transportador
              </h4>

              <div className="space-y-3 text-xs">
                {/* Motorista */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px] font-bold uppercase">
                      Motorista Responsável:
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                        driverType === 'Frota'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {driverType}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {cargo.driverName || <span className="text-amber-800 italic font-normal">A Definir / Sem Motorista</span>}
                  </div>
                  {matchedDriver?.cpf && (
                    <div className="text-[11px] font-mono text-slate-500">
                      CPF Motorista: {formatCpfCnpj(matchedDriver.cpf)}
                    </div>
                  )}
                  {(matchedDriver?.razaoSocial || matchedDriver?.cnpjCpfEmpresa || matchedDriver?.antt) && (
                    <div className="p-2 bg-white rounded border border-slate-200 space-y-1 text-xs">
                      {matchedDriver.razaoSocial && (
                        <div className="font-semibold text-slate-900 text-[11.5px] leading-tight">
                          {matchedDriver.razaoSocial}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-[10.5px]">
                        {matchedDriver.cnpjCpfEmpresa && (
                          <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                            <strong>CNPJ/CPF Emp:</strong> {formatCpfCnpj(matchedDriver.cnpjCpfEmpresa)}
                          </span>
                        )}
                        {matchedDriver.antt && (
                          <span className="font-mono bg-sky-50 text-sky-900 font-bold px-1.5 py-0.5 rounded border border-sky-200">
                            ANTT: {matchedDriver.antt}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
                    {cargo.driverPhone && (
                      <span>Telefone: <strong className="font-mono text-slate-800">{cargo.driverPhone}</strong></span>
                    )}
                    {cargo.driverPix && (
                      <span>PIX: <strong className="font-mono text-slate-800">{cargo.driverPix}</strong></span>
                    )}
                  </div>
                </div>

                {/* Veículo Cavalo e Carreta */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="text-slate-500 text-[11px] font-bold uppercase block">
                    Conjunto Mecânico:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cavalo Mecânico:</span>
                      <strong className="font-mono text-slate-900 text-sm">
                        {cargo.cavaloPlate || <span className="text-slate-400 italic font-normal">-</span>}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Carreta (1º Implemento):</span>
                      <strong className="font-mono text-slate-900 text-sm">
                        {cargo.carretaPlate || <span className="text-slate-400 italic font-normal">-</span>}
                      </strong>
                      {cargo.carretaType && (
                        <span className="text-[10px] text-slate-500 block">
                          Tipo: {cargo.carretaType}
                        </span>
                      )}
                    </div>
                  </div>

                  {cargo.carreta2Plate && (
                    <div className="pt-1.5 border-t border-slate-200/60">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">2ª Carreta (Bitrem/Rodotrem):</span>
                      <strong className="font-mono text-slate-900 text-xs">
                        {cargo.carreta2Plate} {cargo.carreta2Type ? `(${cargo.carreta2Type})` : ''}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Instruções e Observações */}
                {(cargo.collectionNotes || cargo.deliveryInstructions || cargo.internalNotes) && (
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1">
                    {cargo.collectionNotes && (
                      <div>
                        <strong className="text-slate-700">Obs. Coleta:</strong>{' '}
                        <span className="text-slate-600">{cargo.collectionNotes}</span>
                      </div>
                    )}
                    {cargo.deliveryInstructions && (
                      <div>
                        <strong className="text-slate-700">Instruções Entrega:</strong>{' '}
                        <span className="text-slate-600">{cargo.deliveryInstructions}</span>
                      </div>
                    )}
                    {cargo.internalNotes && (
                      <div>
                        <strong className="text-slate-700">Notas Internas:</strong>{' '}
                        <span className="text-slate-500 font-mono">{cargo.internalNotes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer com Ações Rápidas Operacionais */}
        <div className="shrink-0 px-6 py-3.5 bg-slate-100/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Criada em: <strong className="font-mono text-slate-700">{formatDateTime(cargo.createdAt)}</strong>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenDoc && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDoc(cargo);
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                Visualizar O.C. (A4)
              </button>
            )}

            {onOpenWhatsApp && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWhatsApp(cargo);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar WhatsApp
              </button>
            )}

            {onEditCargo && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditCargo(cargo);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar Carga
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-white rounded-lg text-xs font-semibold transition-colors cursor-pointer ml-1"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
