import React, { useState } from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import { CargoTrip, OCStatus } from '../../types/logistics';
import {
  formatBRL,
  formatDateTime,
  getOCStatusLabel,
  cleanPhoneForWhatsApp,
  formatWeightKg,
  formatWeightTons,
} from '../../utils/formatters';
import {
  Printer,
  Share2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  Building,
  Truck,
  User,
  Calendar,
  X,
  Send,
  UserPlus,
  UserCheck,
  Lock,
  ShieldCheck,
  Download,
  Loader2,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  ZoomIn,
} from 'lucide-react';
import { AtribuirVeiculoModal } from '../cargas/AtribuirVeiculoModal';
import { downloadOrdemCarregamentoPDF } from '../../utils/pdfGenerator';
import { YukaerSymbol } from '../ui/YukaerLogo';

interface Props {
  onOpenNovaCarga: () => void;
  selectedCargoFromParent?: CargoTrip | null;
}

export const OrdemCarregamentoView: React.FC<Props> = ({ onOpenNovaCarga, selectedCargoFromParent }) => {
  const {
    cargos,
    companyProfile,
    updateCargoOCStatus,
    generateWhatsAppDispatchText,
    drivers,
  } = useLogistics();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [activeCargoForDoc, setActiveCargoForDoc] = useState<CargoTrip | null>(selectedCargoFromParent || null);
  const [activeCargoForWhatsApp, setActiveCargoForWhatsApp] = useState<CargoTrip | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Zoom dinâmico da Tabela de O.C.s com persistência local
  const [tableZoom, setTableZoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cargafret_zoom_ordens');
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
        localStorage.setItem('cargafret_zoom_ordens', String(next));
      }
      return next;
    });
  };

  const handleZoomOut = () => {
    setTableZoom((prev) => {
      const next = Math.max(70, prev - 10);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cargafret_zoom_ordens', String(next));
      }
      return next;
    });
  };

  const handleZoomReset = () => {
    setTableZoom(100);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cargafret_zoom_ordens', '100');
    }
  };

  // Modal para Escala de Veículo
  const [cargoToAssign, setCargoToAssign] = useState<CargoTrip | null>(null);

  // Motorista vinculado à carga atualmente aberta para emissão/impressão
  const assignedDriver = activeCargoForDoc
    ? drivers.find(
        (d) =>
          d.id === activeCargoForDoc.driverId ||
          (d.name &&
            activeCargoForDoc.driverName &&
            d.name.trim().toLowerCase() === activeCargoForDoc.driverName.trim().toLowerCase())
      )
    : undefined;

  // Filtered list (excludes cancelled cargos from active OC generation)
  const filteredCargos = cargos.filter((cargo) => {
    if (cargo.cargoStatus === 'cancelado') return false;

    const q = search.toLowerCase();
    const matchesSearch =
      cargo.ocNumber.toLowerCase().includes(q) ||
      (cargo.pedidoCliente && cargo.pedidoCliente.toLowerCase().includes(q)) ||
      (cargo.ctNumber && cargo.ctNumber.toLowerCase().includes(q)) ||
      cargo.driverName.toLowerCase().includes(q) ||
      cargo.clientName.toLowerCase().includes(q) ||
      cargo.cavaloPlate.toLowerCase().includes(q) ||
      cargo.productName.toLowerCase().includes(q);

    const matchesStatus = filterStatus === 'todos' || cargo.ocStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCopyWhatsApp = (cargo: CargoTrip) => {
    const text = generateWhatsAppDispatchText(cargo);
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleDownloadPDF = async (cargo: CargoTrip) => {
    setIsDownloadingPDF(true);
    try {
      const driver = drivers.find(
        (d) =>
          d.id === cargo.driverId ||
          (d.name && cargo.driverName && d.name.trim().toLowerCase() === cargo.driverName.trim().toLowerCase())
      );
      await downloadOrdemCarregamentoPDF(cargo, 'oc-print-document-body', companyProfile, driver);
    } catch (err) {
      console.error('Falha ao baixar PDF:', err);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleOpenWhatsAppWeb = async (cargo: CargoTrip) => {
    // 1. Download PDF automatically for easy attachment
    handleDownloadPDF(cargo);

    // 2. Open WhatsApp Web with complete instructions pre-filled
    const text = encodeURIComponent(generateWhatsAppDispatchText(cargo));
    const phone = cargo.driverPhone ? cleanPhoneForWhatsApp(cargo.driverPhone) : '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Emissão de Ordem de Carregamento (O.C.)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Gere, visualize, imprima e envie ordens operacionais aos motoristas com instruções de coleta e pesagem.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNovaCarga}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            + Nova Carga / Emitir O.C.
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between print:hidden">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por O.C., motorista, placa, cliente..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Interactive Segmented Filter Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {[
            { id: 'todos', label: 'Todas as O.C.s' },
            { id: 'gerada', label: 'Geradas' },
            { id: 'enviada_motorista', label: 'Enviadas ao Motorista' },
            { id: 'em_carregamento', label: 'Em Carregamento' },
            { id: 'carregado', label: 'Carregadas' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStatus(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                filterStatus === item.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Table List com Barra de Rolagem Vertical e Cabeçalho Fixo */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs print:hidden">
        {/* Barra de Ferramentas Superior com Indicador e Ferramenta de Zoom no Canto Superior Direito */}
        <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Ordens de Carregamento</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">
              {filteredCargos.length} {filteredCargos.length === 1 ? 'registro exibido' : 'registros exibidos'}
            </span>
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

        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] custom-scrollbar relative">
          <table
            style={{ zoom: tableZoom / 100 }}
            className="w-full text-left text-sm border-collapse"
          >
            <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600 shadow-2xs">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap bg-slate-100">O.C. / Data</th>
                <th className="py-2.5 px-3 bg-slate-100">Cliente / Produto</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-sky-950 font-bold bg-slate-100">Origem</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-emerald-950 font-bold bg-slate-100">Destino / Entrega</th>
                <th className="py-2.5 px-3 whitespace-nowrap bg-slate-100">Motorista & Veículo</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap bg-slate-100">Frete Total</th>
                <th className="py-2.5 px-3 whitespace-nowrap bg-slate-100">Status da O.C.</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap bg-slate-100">Ações Operacionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCargos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    Nenhuma Ordem de Carregamento encontrada para os critérios informados.
                  </td>
                </tr>
              ) : (
                filteredCargos.map((cargo) => {
                  const isWaitingVehicle = cargo.cargoStatus === 'aguardando_veiculo';

                  return (
                    <tr
                      key={cargo.id}
                      className={`transition-colors ${
                        isWaitingVehicle ? 'bg-violet-50/20 hover:bg-violet-50/50' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-1.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 leading-tight">
                          <span
                            onClick={() => {
                              if (isWaitingVehicle) setCargoToAssign(cargo);
                              else setActiveCargoForDoc(cargo);
                            }}
                            className={`font-mono font-bold hover:underline cursor-pointer text-xs ${
                              isWaitingVehicle ? 'text-violet-700' : 'text-indigo-700'
                            }`}
                          >
                            {cargo.ocNumber}
                          </span>
                          {isWaitingVehicle && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-violet-100 text-violet-800 rounded uppercase">
                              A Fretar
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{formatDateTime(cargo.scheduledLoadingDate)}</div>
                      </td>
                      <td className="py-1.5 px-3">
                        <div className="font-medium text-slate-800 text-xs truncate max-w-[200px]">{cargo.clientName}</div>
                        <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{cargo.productName} · {formatWeightKg(cargo.weightTons)}</div>
                      </td>
                      {/* 3. Coluna de Origem (Destaque Azul) */}
                      <td className="py-1.5 px-3 max-w-[190px]">
                        <div className="leading-tight">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-black bg-sky-100 text-sky-950 border border-sky-300 shadow-2xs">
                            <span className="text-[10px] uppercase tracking-wide text-sky-800 font-extrabold">Orig:</span>
                            <span className="font-bold">{cargo.originCityState}</span>
                          </span>
                        </div>
                        <div
                          className="text-[11px] font-medium text-slate-700 truncate leading-tight mt-1"
                          title={cargo.originSupplierName ? `${cargo.originSupplierName} (${cargo.originCityState})` : cargo.originCityState}
                        >
                          {cargo.originSupplierName || 'Terminal de Origem'}
                        </div>
                      </td>
                      {/* 4. Coluna de Destino / Entrega (Destaque Verde) */}
                      <td className="py-1.5 px-3 max-w-[190px]">
                        <div className="leading-tight">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-black bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span className="text-[10px] uppercase tracking-wide text-emerald-800 font-extrabold">Dest:</span>
                            <span className="font-bold">{cargo.destinationCityState}</span>
                          </span>
                        </div>
                        <div
                          className="text-[11px] font-medium text-slate-700 truncate leading-tight mt-1"
                          title={cargo.destinationSupplierName ? `${cargo.destinationSupplierName} (${cargo.destinationCityState})` : cargo.destinationCityState}
                        >
                          {cargo.destinationSupplierName || 'Terminal de Destino'}
                        </div>
                      </td>
                      <td className="py-1.5 px-3 whitespace-nowrap">
                        {isWaitingVehicle ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-200">
                              <UserPlus className="w-3 h-3" /> Sem Veículo
                            </span>
                            <button
                              onClick={() => setCargoToAssign(cargo)}
                              className="text-[11px] font-bold text-violet-700 hover:text-violet-900 underline cursor-pointer"
                            >
                              Atribuir Motorista
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="font-medium text-slate-800 text-xs leading-tight">{cargo.driverName}</div>
                            <div className="text-[11px] text-slate-500 font-mono leading-tight mt-0.5">
                              {cargo.cavaloPlate} / {cargo.carretaPlate || 'Sem Carreta'}
                              {cargo.carreta2Plate ? ` / ${cargo.carreta2Plate}` : ''}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-right whitespace-nowrap">
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
                      <td className="py-1.5 px-3 whitespace-nowrap">
                        <select
                          value={cargo.ocStatus}
                          onChange={(e) => updateCargoOCStatus(cargo.id, e.target.value as OCStatus)}
                          className="text-xs font-semibold rounded-md border border-slate-300 py-1 px-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                        >
                          <option value="gerada">O.C. Gerada</option>
                          <option value="enviada_motorista">Enviada ao Motorista</option>
                          <option value="em_carregamento">Em Carregamento</option>
                          <option value="carregado">Carregado / Emitido CTe</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {isWaitingVehicle ? (
                            <button
                              onClick={() => setCargoToAssign(cargo)}
                              className="px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              title="Escalar motorista e caminhão para liberar emissão de O.C."
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Escalar Veículo
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setActiveCargoForDoc(cargo)}
                                title="Visualizar e Imprimir O.C. Oficial (A4)"
                                className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors border border-slate-200 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setActiveCargoForWhatsApp(cargo)}
                                title="Enviar Ordem via WhatsApp ao Motorista"
                                className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors border border-slate-200 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </>
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

      {/* MODAL 1: VISUALIZAÇÃO E IMPRESSÃO DE ORDEM DE CARREGAMENTO (A4) */}
      {activeCargoForDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:static print:bg-white">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:border-none print:shadow-none">
            {/* Top Bar for Actions (Hidden in Print) */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Visualização da Ordem de Carregamento nº {activeCargoForDoc.ocNumber}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {activeCargoForDoc.cargoStatus === 'aguardando_veiculo' ? (
                  <button
                    onClick={() => {
                      setCargoToAssign(activeCargoForDoc);
                    }}
                    className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    Atribuir Veículo & Liberar O.C.
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleCopyWhatsApp(activeCargoForDoc)}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copiar texto formatado das instruções de carregamento"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedSuccess ? 'Copiado!' : 'Copiar Texto'}
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(activeCargoForDoc)}
                      disabled={isDownloadingPDF}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                      title="Baixar arquivo PDF formatado da O.C."
                    >
                      {isDownloadingPDF ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Baixar PDF
                    </button>
                    <button
                      onClick={() => handleOpenWhatsAppWeb(activeCargoForDoc)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      title="Baixa automaticamente o PDF da O.C. e abre o WhatsApp com o texto completo preenchido"
                    >
                      <Send className="w-3.5 h-3.5" />
                      WhatsApp + PDF
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimir (A4)
                    </button>
                  </>
                )}
                <button
                  onClick={() => setActiveCargoForDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors ml-2 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="flex-1 min-h-0 p-2 sm:p-4 overflow-y-auto custom-scrollbar print:p-0 print:m-0 print:overflow-visible text-slate-900 print:text-black font-sans leading-normal bg-slate-100/60 print:bg-white">
              {/* ALERTA SE A CARGA AINDA ESTIVER A FRETAR */}
              {activeCargoForDoc.cargoStatus === 'aguardando_veiculo' && (
                <div className="mb-4 p-4 bg-violet-50 border border-violet-300 rounded-lg text-violet-950 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-violet-600 shrink-0" />
                    <div className="text-xs">
                      <strong className="block text-sm font-bold text-violet-900">
                        Esta carga ainda não possui motorista e caminhão atribuídos.
                      </strong>
                      <span>
                        Para que a Ordem de Carregamento tenha validade operacional e possa ser enviada ao motorista, realize a escala de veículo.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setCargoToAssign(activeCargoForDoc)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    Escalar Veículo Agora
                  </button>
                </div>
              )}

              {/* Documento A4 Oficial - Ajustado Estritamente para 1 Página A4 com Fontes Aumentadas e Nítidas */}
              <div
                id="oc-print-document-body"
                className="bg-white border border-slate-200 shadow-sm rounded-lg p-3.5 sm:p-5 print:p-0 print:m-0 print:border-none print:shadow-none print:rounded-none text-slate-900 print:text-black leading-tight max-w-[820px] mx-auto print:max-w-full break-inside-avoid"
              >
                {/* 1. Cabeçalho Institucional & Controle Operacional */}
                <div className="flex items-start justify-between gap-3 pb-2 mb-1.5 border-b-2 border-slate-900 print:pb-1 print:mb-1">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <YukaerSymbol className="w-7 h-7 print:w-6 print:h-6 shrink-0" />
                      <div>
                        <h1 className="text-base sm:text-lg print:text-[13.5px] font-black uppercase tracking-tight text-slate-950 leading-tight">
                          {companyProfile.tradeName || 'CARGAFRET LOGÍSTICA & TRANSPORTES'}
                        </h1>
                        <p className="text-[10.5px] sm:text-xs print:text-[9.5px] font-semibold text-slate-700 leading-none">
                          {companyProfile.companyName || 'CargaFret Intermediação e Logística Rodoviária'}
                        </p>
                      </div>
                    </div>
                    <div className="text-[9.5px] sm:text-[10px] print:text-[8.5px] text-slate-600 pt-0.5 space-y-0.5">
                      <div>
                        <span className="font-bold text-slate-800">CNPJ:</span> {companyProfile.cnpj || '00.000.000/0001-00'}
                        <span className="mx-1.5">·</span>
                        <span className="font-bold text-slate-800">RNTRC:</span> {companyProfile.rntrc || 'Emissão Operacional'}
                        {companyProfile.phone && (
                          <>
                            <span className="mx-1.5">·</span>
                            <span className="font-bold text-slate-800">Central:</span> {companyProfile.phone}
                          </>
                        )}
                      </div>
                      {companyProfile.address && (
                        <div className="break-words max-w-md print:max-w-full">
                          <span className="font-bold text-slate-800">Endereço:</span> {companyProfile.address}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="inline-block bg-slate-900 text-white px-2.5 py-0.5 font-mono font-bold text-[9.5px] print:text-[8.5px] rounded uppercase shadow-2xs tracking-wide">
                      ORDEM DE CARREGAMENTO
                    </div>
                    <div className="text-lg sm:text-xl print:text-[16px] font-black font-mono text-slate-950 mt-0.5 tracking-tight leading-none">
                      {activeCargoForDoc.ocNumber}
                    </div>
                    <div className="text-[10px] print:text-[8.5px] text-slate-600 mt-0.5">
                      <span className="font-semibold text-slate-700">Emissão:</span> {formatDateTime(activeCargoForDoc.createdAt)}
                    </div>
                    <div className="text-[10px] print:text-[8.5px] font-semibold text-slate-700">
                      <span>Status: </span>
                      <span className="text-slate-950 uppercase font-black">{getOCStatusLabel(activeCargoForDoc.ocStatus).label}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Seção I: Identificação da Operação & Mercadoria */}
                <div className="mt-1.5 print:mt-1">
                  <div className="text-[10px] sm:text-[10.5px] print:text-[9.5px] font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-2.5 py-1 print:py-0.5 rounded flex items-center justify-between mb-1 print:bg-slate-100 border border-slate-200">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-700" />
                      1. Dados da Operação e Mercadoria
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activeCargoForDoc.pedidoCliente && (
                        <span className="font-mono text-[9.5px] print:text-[8.5px] text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-300">
                          Pedido: {activeCargoForDoc.pedidoCliente}
                        </span>
                      )}
                      {activeCargoForDoc.ctNumber && (
                        <span className="font-mono text-[9.5px] print:text-[8.5px] text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                          CT-e: {activeCargoForDoc.ctNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs print:text-[8.5px] bg-slate-50/60 p-2 sm:p-2.5 rounded border border-slate-200 print:bg-white print:border-slate-300 print:p-1.5">
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[9px] print:text-[8px] uppercase font-bold text-slate-600 block mb-0.5">Tomador / Cliente:</span>
                      <p className="font-extrabold text-slate-950 text-xs sm:text-[13px] print:text-[9.5px] break-words">{activeCargoForDoc.clientName}</p>
                      <p className="text-[9px] print:text-[8px] text-slate-500">ID: {activeCargoForDoc.clientId}</p>
                    </div>

                    <div>
                      <span className="text-[9px] print:text-[8px] uppercase font-bold text-slate-600 block mb-0.5">Pedido do Cliente:</span>
                      <p className="font-bold text-slate-950 text-xs sm:text-[13px] print:text-[9.5px] font-mono">
                        {activeCargoForDoc.pedidoCliente || 'Não informado'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] print:text-[8px] uppercase font-bold text-slate-600 block mb-0.5">Mercadoria / Produto:</span>
                      <p className="font-extrabold text-slate-950 text-xs sm:text-[13px] print:text-[9.5px]">{activeCargoForDoc.productName}</p>
                      <p className="text-[9px] print:text-[8px] text-slate-500">Granel / Carga Operacional</p>
                    </div>

                    <div>
                      <span className="text-[9px] print:text-[8px] uppercase font-bold text-slate-600 block mb-0.5">Peso Total da Carga (KG):</span>
                      <p className="font-black text-slate-950 text-sm sm:text-[15px] print:text-[11px] font-mono leading-tight">{formatWeightKg(activeCargoForDoc.weightTons)}</p>
                      <p className="text-[9px] print:text-[8px] text-slate-500 font-medium">({formatWeightTons(activeCargoForDoc.weightTons)})</p>
                    </div>
                  </div>
                </div>

                {/* 3. Seção II: Motorista Condutor, Empresa e Conjunto Transportador */}
                <div className="mt-1.5 print:mt-1">
                  <div className="text-[10px] sm:text-[10.5px] print:text-[9.5px] font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-2.5 py-1 print:py-0.5 rounded flex items-center justify-between mb-1 print:bg-slate-100 border border-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-700" />
                      <span>2. Motorista Condutor, Empresa e Conjunto Transportador</span>
                    </span>
                    {assignedDriver?.antt && (
                      <span className="font-mono text-[9px] print:text-[8px] text-sky-950 font-bold bg-white px-2 py-0.5 rounded border border-slate-300">
                        ANTT: {assignedDriver.antt}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs print:text-[8.5px] bg-slate-50/60 p-2 sm:p-2.5 rounded border border-slate-200 print:bg-white print:border-slate-300 print:p-1.5">
                    {/* Sub-bloco A: Condutor & Empresa */}
                    <div className="col-span-1 md:col-span-5 space-y-1 border-b md:border-b-0 md:border-r border-slate-200 print:border-slate-300 pb-1.5 md:pb-0 md:pr-2.5">
                      <div>
                        <span className="text-[9px] print:text-[8px] uppercase font-bold text-slate-600 block">Motorista Condutor:</span>
                        <p className="font-black text-slate-950 text-xs sm:text-[13.5px] print:text-[10.5px] break-words leading-tight">
                          {activeCargoForDoc.driverName || assignedDriver?.name || 'A Definir (Escala Pendente)'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <div>
                          <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">CPF Motorista:</span>
                          <p className="font-mono font-bold text-slate-900 text-[11px] print:text-[8.5px]">
                            {assignedDriver?.cpf || 'Não informado'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Telefone:</span>
                          <p className="font-mono font-bold text-slate-800 text-[11px] print:text-[8.5px]">
                            {activeCargoForDoc.driverPhone || assignedDriver?.phone || 'Não informado'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-slate-200 print:border-slate-200">
                        <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Razão Social / Empresa:</span>
                        <p className="font-bold text-slate-950 text-[11px] sm:text-[11.5px] print:text-[9px] break-words leading-tight">
                          {assignedDriver?.razaoSocial || (assignedDriver?.name ? `${assignedDriver.name} (Transportador)` : 'Não informada')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <div>
                          <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">CPF / CNPJ Empresa:</span>
                          <p className="font-mono font-semibold text-slate-800 text-[10.5px] print:text-[8px]">
                            {assignedDriver?.cnpjCpfEmpresa || assignedDriver?.cpf || 'Não informado'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Registro ANTT:</span>
                          <p className="font-mono font-black text-sky-950 text-[10.5px] print:text-[8px]">
                            {assignedDriver?.antt || 'Isento / Não inf.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sub-bloco B: Conjunto Veicular (Cavalo + Implementos) */}
                    <div className="col-span-1 md:col-span-3 space-y-1 border-b md:border-b-0 md:border-r border-slate-200 print:border-slate-300 pb-1.5 md:pb-0 md:pr-2.5">
                      <div>
                        <span className="text-[9px] print:text-[8px] uppercase font-bold text-slate-600 block">Cavalo Mecânico (Trator):</span>
                        <p className="font-mono font-black text-slate-950 text-sm sm:text-[15px] print:text-[11.5px] tracking-wide">
                          {activeCargoForDoc.cavaloPlate || 'A Definir'}
                        </p>
                        <p className="text-[9px] print:text-[7.5px] text-slate-600">Caminhão Trator Rodoviário</p>
                      </div>

                      <div className="pt-1 border-t border-slate-200 print:border-slate-200">
                        <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">
                          {activeCargoForDoc.carreta2Plate ? '1º Implemento (Carreta 1):' : 'Implemento (Carreta / Reboque):'}
                        </span>
                        <p className="font-mono font-black text-slate-950 text-xs sm:text-[13px] print:text-[10px]">
                          {activeCargoForDoc.carretaPlate || 'A Definir'}
                        </p>
                        <p className="text-[9px] print:text-[7.5px] text-slate-700 font-medium break-words">
                          {activeCargoForDoc.carretaType || 'Não informado'}
                        </p>
                      </div>

                      {activeCargoForDoc.carreta2Plate && (
                        <div className="pt-1 border-t border-slate-200 print:border-slate-200">
                          <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">
                            2º Implemento (Carreta 2):
                          </span>
                          <p className="font-mono font-black text-slate-950 text-xs sm:text-[13px] print:text-[10px]">
                            {activeCargoForDoc.carreta2Plate}
                          </p>
                          <p className="text-[9px] print:text-[7.5px] text-slate-700 font-medium break-words">
                            {activeCargoForDoc.carreta2Type || 'Não informado'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Sub-bloco C: Dados Bancários Completos para Pagamento */}
                    <div className="col-span-1 md:col-span-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] print:text-[8px] uppercase font-black text-indigo-950 block">
                          Dados Bancários para Liquidação:
                        </span>
                        <span className="text-[8.5px] print:text-[7.5px] text-slate-600 font-bold">Adiantamento & Saldo</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1">
                        <div className="col-span-1">
                          <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Cód. Banco:</span>
                          <p className="font-mono font-black text-slate-900 text-[11px] print:text-[8.5px]">
                            {assignedDriver?.bankCode || (assignedDriver?.bankName?.includes('Brasil') ? '001' : '-')}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Banco:</span>
                          <p className="font-bold text-slate-950 text-[11px] sm:text-[11.5px] print:text-[9px] break-words">
                            {assignedDriver?.bankName || 'Não informado'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <div>
                          <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Agência:</span>
                          <p className="font-mono font-bold text-slate-900 text-[11px] print:text-[8.5px]">
                            {assignedDriver?.bankAgency || 'Não informada'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[8.5px] print:text-[7.5px] uppercase font-black text-indigo-950 block">Conta Bancária:</span>
                          <p className="font-mono font-black text-slate-950 text-xs sm:text-[13px] print:text-[10px]">
                            {assignedDriver?.bankAccount || 'Não informada'}
                          </p>
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded p-1.5 print:p-1 mt-1">
                        <span className="text-[8.5px] print:text-[7.5px] uppercase font-black text-emerald-900 block">Chave PIX Cadastrada:</span>
                        <p className="font-mono font-extrabold text-emerald-950 text-[11px] print:text-[8.5px] break-all">
                          {activeCargoForDoc.driverPix || (assignedDriver?.pixKey ? `${assignedDriver.pixKey} (${assignedDriver.pixKeyType || 'PIX'})` : 'Não informada')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Seção III: Itinerário Operacional e Prazos */}
                <div className="mt-1.5 print:mt-1">
                  <div className="text-[10px] sm:text-[10.5px] print:text-[9.5px] font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-2.5 py-0.5 print:py-0.2 rounded flex items-center gap-1.5 mb-1 print:bg-slate-100 border border-slate-200">
                    <Building className="w-3.5 h-3.5 text-slate-700" />
                    <span>3. Itinerário e Prazos Operacionais</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs print:text-[8.5px]">
                    {/* Coleta */}
                    <div className="p-2 sm:p-2.5 rounded border border-slate-200 bg-slate-50/40 print:bg-white print:border-slate-300 print:p-1.5 space-y-1">
                      <div className="flex items-center gap-1 text-[9.5px] print:text-[8px] font-black uppercase tracking-wider text-sky-950 border-b border-slate-200 pb-0.5 mb-0.5">
                        <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                        Ponto de Coleta / Origem
                      </div>
                      <div>
                        <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Embarcador / Fornecedor:</span>
                        <p className="font-extrabold text-slate-950 text-xs sm:text-[12.5px] print:text-[9.5px] break-words">{activeCargoForDoc.originSupplierName}</p>
                      </div>
                      <div>
                        <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Cidade / UF:</span>
                        <p className="font-bold text-slate-900 text-[11px] print:text-[8.5px]">{activeCargoForDoc.originCityState}</p>
                      </div>
                      {activeCargoForDoc.originAddress && (
                        <div>
                          <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Endereço:</span>
                          <p className="text-slate-700 text-[10px] print:text-[8px] break-words">{activeCargoForDoc.originAddress}</p>
                        </div>
                      )}
                      <div className="pt-0.5 border-t border-slate-200 mt-0.5">
                        <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Agendamento de Carregamento:</span>
                        <p className="font-black text-slate-950 text-xs sm:text-[12.5px] print:text-[9.5px]">
                          {formatDateTime(activeCargoForDoc.scheduledLoadingDate)}
                        </p>
                      </div>
                    </div>

                    {/* Destino */}
                    <div className="p-2 sm:p-2.5 rounded border border-slate-200 bg-slate-50/40 print:bg-white print:border-slate-300 print:p-1.5 space-y-1">
                      <div className="flex items-center gap-1 text-[9.5px] print:text-[8px] font-black uppercase tracking-wider text-emerald-950 border-b border-slate-200 pb-0.5 mb-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        Ponto de Descarga / Destino
                      </div>
                      <div>
                        <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Destinatário / Indústria:</span>
                        <p className="font-extrabold text-slate-950 text-xs sm:text-[12.5px] print:text-[9.5px] break-words">{activeCargoForDoc.destinationSupplierName}</p>
                      </div>
                      <div>
                        <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Cidade / UF:</span>
                        <p className="font-bold text-slate-900 text-[11px] print:text-[8.5px]">{activeCargoForDoc.destinationCityState}</p>
                      </div>
                      {activeCargoForDoc.destinationAddress && (
                        <div>
                          <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Endereço:</span>
                          <p className="text-slate-700 text-[10px] print:text-[8px] break-words">{activeCargoForDoc.destinationAddress}</p>
                        </div>
                      )}
                      <div className="pt-0.5 border-t border-slate-200 mt-0.5">
                        <span className="text-[8.5px] print:text-[7.5px] uppercase font-bold text-slate-600 block">Previsão Agendada de Entrega:</span>
                        <p className="font-black text-slate-950 text-xs sm:text-[12.5px] print:text-[9.5px]">
                          {formatDateTime(activeCargoForDoc.scheduledDeliveryDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Seção IV: Requisitos Operacionais, Balança e Procedimentos */}
                <div className="mt-1.5 print:mt-1">
                  <div className="text-[10px] sm:text-[10.5px] print:text-[9.5px] font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-2.5 py-0.5 print:py-0.2 rounded flex items-center gap-1.5 mb-1 print:bg-slate-100 border border-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                    <span>4. Requisitos Operacionais, Balança e Procedimentos</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs print:text-[8.5px]">
                    <div className="p-1.5 sm:p-2 rounded border border-slate-200 bg-slate-50/40 print:bg-white print:border-slate-300 print:p-1.5">
                      <span className="text-[9px] print:text-[8px] uppercase font-bold text-slate-800 block mb-0.5">
                        Instruções de Coleta, Pátio e Pesagem:
                      </span>
                      <ul className="text-[9.5px] print:text-[8.2px] text-slate-700 space-y-0.5 print:space-y-0 leading-tight list-disc list-inside">
                        <li>Pesagem obrigatória de Tara na entrada e Peso Bruto na saída da unidade.</li>
                        <li>Uso obrigatório de EPI completo (capacete, colete, calçado e óculos).</li>
                        <li>Conferir bicas de descarga fechadas, travas e lona sem avarias antes de sair.</li>
                      </ul>
                      {activeCargoForDoc.collectionNotes && (
                        <div className="pt-0.5 border-t border-slate-200 mt-0.5">
                          <span className="text-[8.5px] print:text-[7.5px] font-bold text-slate-800 uppercase block">Obs. Coleta:</span>
                          <p className="text-[9.5px] print:text-[8.2px] text-slate-800 line-clamp-2">
                            {activeCargoForDoc.collectionNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-1.5 sm:p-2 rounded border border-slate-200 bg-slate-50/40 print:bg-white print:border-slate-300 print:p-1.5">
                      <span className="text-[9px] print:text-[8px] uppercase font-bold text-slate-800 block mb-0.5">
                        Instruções para Entrega e Liberação de Canhoto:
                      </span>
                      <ul className="text-[9.5px] print:text-[8.2px] text-slate-700 space-y-0.5 print:space-y-0 leading-tight list-disc list-inside">
                        <li>Apresentar a documentação fiscal de transporte na portaria de destino.</li>
                        <li>Exigir carimbo legível, data, horário e assinatura no canhoto original da NF-e.</li>
                        <li>Comunicar imediatamente à Central qualquer divergência de peso ou avaria.</li>
                      </ul>
                      {activeCargoForDoc.deliveryInstructions && (
                        <div className="pt-0.5 border-t border-slate-200 mt-0.5">
                          <span className="text-[8.5px] print:text-[7.5px] font-bold text-slate-800 uppercase block">Obs. Descarga:</span>
                          <p className="text-[9.5px] print:text-[8.2px] text-slate-800 line-clamp-2">
                            {activeCargoForDoc.deliveryInstructions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. Seção V: Declaração de Responsabilidade e Assinaturas */}
                <div className="mt-1.5 pt-1 border-t border-slate-300 print:mt-1 print:pt-0.5">
                  <p className="text-[8.5px] sm:text-[9px] print:text-[7.8px] text-slate-600 leading-tight mb-1.5 print:mb-1 text-justify">
                    <strong>Declaração do Transportador / Condutor:</strong> O condutor declara ter conferido as especificações desta Ordem de Carregamento, condições de segurança e amarração, comprometendo-se a cumprir o itinerário estipulado, normas de trânsito e exigências do expedidor até a entrega.
                  </p>

                  <div className="grid grid-cols-2 gap-8 sm:gap-14 pt-0.5 print:pt-0 text-center text-xs print:text-[8.5px] text-slate-700">
                    <div className="border-t border-slate-400 pt-0.5">
                      <p className="font-black text-slate-950 text-xs sm:text-[13px] print:text-[9.5px]">
                        {companyProfile.tradeName || companyProfile.companyName || 'CargaFret Logística'}
                      </p>
                      <p className="text-[9px] print:text-[7.5px] text-slate-500 font-medium">Expedição / Transportador Responsável</p>
                    </div>

                    <div className="border-t border-slate-400 pt-0.5">
                      <p className="font-black text-slate-950 text-xs sm:text-[13px] print:text-[9.5px]">
                        {activeCargoForDoc.driverName || 'Motorista Condutor'}
                      </p>
                      <p className="text-[9px] print:text-[7.5px] text-slate-500 font-medium">Assinatura do Condutor · Data: ____/____/________</p>
                    </div>
                  </div>

                  <div className="mt-1 pt-0.5 border-t border-slate-200 text-center text-[8.5px] print:text-[7.2px] text-slate-500 font-mono">
                    Documento emitido eletronicamente via Sistema CargaFret Logística · O.C. nº {activeCargoForDoc.ocNumber} · Documento Operacional
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ENVIO WHATSAPP RÁPIDO AO MOTORISTA */}
      {activeCargoForWhatsApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-emerald-50">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Disparo via WhatsApp - O.C. {activeCargoForWhatsApp.ocNumber}
                </h3>
              </div>
              <button
                onClick={() => setActiveCargoForWhatsApp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="text-xs text-slate-600">
                O texto abaixo foi formatado com todas as instruções essenciais da carga (Número da O.C., Motorista, Placas, Local de Coleta e Entrega, Horários e Pedido do Cliente):
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500">Motorista:</span>{' '}
                  <strong className="text-slate-800">{activeCargoForWhatsApp.driverName}</strong> ·{' '}
                  <span className="text-slate-500">Telefone:</span>{' '}
                  <strong className="text-slate-800">{activeCargoForWhatsApp.driverPhone || 'Não cadastrado'}</strong>
                </div>
                <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 self-start sm:self-auto">
                  <Download className="w-3.5 h-3.5" />
                  PDF é baixado automaticamente ao disparar
                </div>
              </div>

              <textarea
                readOnly
                rows={10}
                value={generateWhatsAppDispatchText(activeCargoForWhatsApp)}
                className="w-full text-xs font-mono bg-slate-900 text-emerald-300 p-4 rounded-xl border border-slate-700 focus:outline-none leading-relaxed select-all"
              />
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveCargoForWhatsApp(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
              >
                Fechar
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(activeCargoForWhatsApp)}
                  disabled={isDownloadingPDF}
                  className="px-3.5 py-2 bg-slate-850 hover:bg-slate-950 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Baixar apenas o PDF"
                >
                  {isDownloadingPDF ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Baixar PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyWhatsApp(activeCargoForWhatsApp)}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedSuccess ? 'Texto Copiado!' : 'Copiar Texto'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenWhatsAppWeb(activeCargoForWhatsApp);
                    setActiveCargoForWhatsApp(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Faz o download automático do PDF e abre a conversa do WhatsApp com o texto preenchido"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Enviar WhatsApp + Baixar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atribuição de Veículo */}
      <AtribuirVeiculoModal
        isOpen={Boolean(cargoToAssign)}
        cargo={cargoToAssign}
        onClose={() => setCargoToAssign(null)}
        onSuccess={(updatedCargo, openDocImmediately) => {
          setCargoToAssign(null);
          if (openDocImmediately) {
            setActiveCargoForDoc(updatedCargo);
          }
        }}
      />
    </div>
  );
};
