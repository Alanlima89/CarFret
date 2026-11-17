import React, { useState } from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import { Occurrence, OccurrenceType, CargoTrip } from '../../types/logistics';
import { formatBRL, formatDate, formatDateTime } from '../../utils/formatters';
import { SearchableSelect } from '../ui/SearchableSelect';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  DollarSign,
  Search,
  Filter,
  X,
  FileText,
  User,
  ShieldAlert,
  Trash2,
} from 'lucide-react';

interface Props {
  selectedCargoFromParent?: CargoTrip | null;
  onClearSelectedCargo?: () => void;
}

export const OcorrenciasView: React.FC<Props> = ({ selectedCargoFromParent, onClearSelectedCargo }) => {
  const { occurrences, cargos, addOccurrence, updateOccurrence, deleteOccurrence } = useLogistics();

  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolvingOcc, setResolvingOcc] = useState<Occurrence | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [deletingOcc, setDeletingOcc] = useState<Occurrence | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // Form states for new occurrence
  const [selectedCargoId, setSelectedCargoId] = useState(selectedCargoFromParent?.id || (cargos[0]?.id || ''));
  const [occDate, setOccDate] = useState(new Date().toISOString().slice(0, 10));
  const [occTime, setOccTime] = useState(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
  const [occType, setOccType] = useState<OccurrenceType>('demora_descarga');
  const [occTitle, setOccTitle] = useState('');
  const [occDescription, setOccDescription] = useState('');
  const [hasFinancialImpact, setHasFinancialImpact] = useState(false);
  const [extraCostAmount, setExtraCostAmount] = useState<number>(0);
  const [responsible, setResponsible] = useState<'cliente' | 'transportadora' | 'motorista' | 'terceiro'>('cliente');
  const [reporterName, setReporterName] = useState('Motorista / Operacional');

  const occTypeLabels: Record<OccurrenceType, string> = {
    demora_descarga: 'Demora na Descarga / Fila excessiva',
    demora_carregamento: 'Demora no Carregamento / Falha armazém',
    quebra_mecanica: 'Quebra Mecânica / Pneu estourado',
    recusa_produto: 'Recusa de Produto / Divergência de qualidade',
    divergencia_pesagem: 'Divergência de Pesagem / Balança',
    avaria_carga: 'Avaria na Carga / Rasgo na lona',
    bloqueio_rota: 'Bloqueio de Rodovia / Acidente na rota',
    outros: 'Outros imprevistos operacionais',
  };

  const handleOpenNewModal = (cargoId?: string) => {
    if (cargoId) setSelectedCargoId(cargoId);
    setOccTitle('');
    setOccDescription('');
    setHasFinancialImpact(false);
    setExtraCostAmount(0);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cargo = cargos.find((c) => c.id === selectedCargoId);
    if (!cargo) return;

    addOccurrence({
      cargoId: cargo.id,
      ocNumber: cargo.ocNumber,
      date: occDate,
      time: occTime,
      type: occType,
      title: occTitle || occTypeLabels[occType],
      description: occDescription,
      financialImpact: hasFinancialImpact,
      extraCostAmount: hasFinancialImpact ? extraCostAmount : 0,
      impactResponsible: responsible,
      status: 'aberto',
      reporterName,
    });

    setIsModalOpen(false);
    if (onClearSelectedCargo) onClearSelectedCargo();
  };

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingOcc) return;

    updateOccurrence({
      ...resolvingOcc,
      status: 'resolvido',
      resolvedAt: new Date().toISOString(),
      resolutionNotes: resolutionText,
    });

    setResolvingOcc(null);
    setResolutionText('');
  };

  const filteredOccurrences = occurrences.filter((occ) => {
    const matchesSearch =
      occ.ocNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      occ.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      occ.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || occ.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalExtraCosts = occurrences.reduce((acc, o) => acc + (o.extraCostAmount || 0), 0);
  const openCount = occurrences.filter((o) => o.status !== 'resolvido').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Gestão de Ocorrências e Imprevistos em Viagem
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Registre atrasos em pátio, quebras mecânicas, divergências de balança e custos extras operacionais.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenNewModal()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrar Nova Ocorrência
          </button>
        </div>
      </div>

      {/* Delete Feedback Alert */}
      {deleteNotice && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{deleteNotice}</span>
          </div>
          <button onClick={() => setDeleteNotice(null)} className="text-red-500 hover:text-red-700 p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Total de Ocorrências Registradas</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{occurrences.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Ocorrências Pendentes / Em Aberto</span>
          <div className="text-xl font-bold text-amber-600 mt-1">{openCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Impacto Financeiro Total Acumulado</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatBRL(totalExtraCosts)}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por O.C., motivo, descrição..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {[
            { id: 'todos', label: 'Todas' },
            { id: 'aberto', label: 'Em Aberto' },
            { id: 'em_analise', label: 'Em Análise' },
            { id: 'resolvido', label: 'Resolvidas' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStatus(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
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

      {/* Occurrences List */}
      <div className="space-y-3">
        {filteredOccurrences.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            Nenhuma ocorrência encontrada. Operação fluindo normalmente!
          </div>
        ) : (
          filteredOccurrences.map((occ) => {
            const linkedCargo = cargos.find((c) => c.id === occ.cargoId);
            const isResolved = occ.status === 'resolvido';

            return (
              <div
                key={occ.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {occ.ocNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {occTypeLabels[occ.type] || occ.type}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mt-1">{occ.title}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    {occ.financialImpact && (
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block uppercase">Custo Extra</span>
                        <strong className="text-red-600 text-sm">{formatBRL(occ.extraCostAmount)}</strong>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                          isResolved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : occ.status === 'em_analise'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {isResolved ? 'Resolvido' : occ.status === 'em_analise' ? 'Em Análise' : 'Em Aberto'}
                      </span>

                      {!isResolved && (
                        <button
                          onClick={() => {
                            setResolvingOcc(occ);
                            setResolutionText('');
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                        >
                          Concluir / Resolver
                        </button>
                      )}

                      <button
                        onClick={() => setDeletingOcc(occ)}
                        className="px-2.5 py-1 text-xs font-medium text-red-700 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded transition-colors flex items-center gap-1 cursor-pointer"
                        title="Remover ocorrência da lista e da planilha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {occ.description}
                </p>

                {/* Resolution note if exists */}
                {isResolved && occ.resolutionNotes && (
                  <div className="text-xs bg-emerald-50 text-emerald-900 p-3 rounded-lg border border-emerald-200">
                    <strong className="block text-emerald-800 font-semibold mb-0.5">
                      Solução Adotada (em {formatDateTime(occ.resolvedAt)}):
                    </strong>
                    {occ.resolutionNotes}
                  </div>
                )}

                {/* Quiet Metadata */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                  <span>Data: {formatDate(occ.date)} às {occ.time}</span>
                  <span aria-hidden="true">·</span>
                  <span>Responsável Impacto: {occ.impactResponsible.toUpperCase()}</span>
                  <span aria-hidden="true">·</span>
                  <span>Registrado por: {occ.reporterName || 'Operador'}</span>
                  {linkedCargo && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Motorista: {linkedCargo.driverName}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: REGISTRAR NOVA OCORRÊNCIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Registrar Nova Ocorrência Operacional</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Vincular à Carga / O.C. *</label>
                <SearchableSelect
                  required
                  value={selectedCargoId}
                  onChange={(val) => setSelectedCargoId(val)}
                  placeholder="Selecione a Carga / Ordem de Carregamento..."
                  searchPlaceholder="Pesquisar por número da O.C., cliente, rota ou motorista..."
                  options={cargos.map((c) => ({
                    value: c.id,
                    label: `${c.ocNumber} · ${c.clientName}`,
                    sublabel: `${c.originCityState} → ${c.destinationCityState} · ${c.driverName || 'Sem motorista'} (${c.cavaloPlate || 'A definir'})`,
                    searchKeywords: `${c.ocNumber} ${c.clientName} ${c.originCityState} ${c.destinationCityState} ${c.driverName || ''} ${c.cavaloPlate || ''}`,
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Data da Ocorrência *</label>
                  <input
                    type="date"
                    required
                    value={occDate}
                    onChange={(e) => setOccDate(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Horário Aproximado *</label>
                  <input
                    type="time"
                    required
                    value={occTime}
                    onChange={(e) => setOccTime(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Imprevisto *</label>
                <SearchableSelect
                  value={occType}
                  onChange={(val) => setOccType(val as OccurrenceType)}
                  placeholder="Selecione o tipo de imprevisto..."
                  searchPlaceholder="Pesquisar tipo (ex: Fila, Quebra, Avaria)..."
                  options={Object.entries(occTypeLabels).map(([key, label]) => ({
                    value: key,
                    label: label,
                  }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Título Resumido *</label>
                <input
                  type="text"
                  required
                  value={occTitle}
                  onChange={(e) => setOccTitle(e.target.value)}
                  placeholder="Ex: Fila excessiva de 6h para descarga no silo"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Descrição Detalhada do Problema *</label>
                <textarea
                  rows={4}
                  required
                  value={occDescription}
                  onChange={(e) => setOccDescription(e.target.value)}
                  placeholder="Descreva o que ocorreu, horários de chegada, contato com fiscal do pátio, ticket de pesagem..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              {/* Impacto financeiro */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="financialImpact"
                    checked={hasFinancialImpact}
                    onChange={(e) => setHasFinancialImpact(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="financialImpact" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Gera impacto financeiro ou custo extra (Diária / Guincho / Estadia / Multa)?
                  </label>
                </div>

                {hasFinancialImpact && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Valor do Custo Extra (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={extraCostAmount}
                        onChange={(e) => setExtraCostAmount(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Responsável pelo Custo</label>
                      <SearchableSelect
                        value={responsible}
                        onChange={(val) => setResponsible(val as any)}
                        placeholder="Selecione o responsável..."
                        searchPlaceholder="Pesquisar..."
                        options={[
                          { value: 'cliente', label: 'Cliente (Repassar cobrança)' },
                          { value: 'transportadora', label: 'Transportadora' },
                          { value: 'motorista', label: 'Motorista / Agregado' },
                          { value: 'terceiro', label: 'Terceiro / Seguradora' },
                        ]}
                      />
                    </div>
                  </div>
                )}
              </div>
              </div>

              {/* Rodapé Fixo com Botões de Ação Sempre Visíveis */}
              <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  Salvar Ocorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVER OCORRÊNCIA */}
      {resolvingOcc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-emerald-50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Resolver Ocorrência: {resolvingOcc.ocNumber}</h3>
              </div>
              <button
                onClick={() => setResolvingOcc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolve} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                <p className="text-xs text-slate-600 font-medium">
                  Descreva como a ocorrência foi solucionada (acordo comercial com cliente, liberação do pátio, pagamento de diária, etc.):
                </p>
                <textarea
                  rows={4}
                  required
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Ex: Cliente autorizou o pagamento da diária e caminhão descarregou às 21h..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Rodapé Fixo */}
              <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setResolvingOcc(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  Confirmar Resolução
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR / REMOVER OCORRÊNCIA */}
      {deletingOcc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-red-50">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900 text-base">Confirmar Exclusão de Ocorrência</h3>
              </div>
              <button
                onClick={() => setDeletingOcc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <p className="text-sm text-slate-800 font-semibold">
                Deseja realmente remover esta ocorrência?
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 text-slate-600">
                <div>
                  <strong className="text-slate-800">Nº O.C.:</strong> {deletingOcc.ocNumber}
                </div>
                <div>
                  <strong className="text-slate-800">Título:</strong> {deletingOcc.title}
                </div>
                <div>
                  <strong className="text-slate-800">Data / Horário:</strong> {formatDate(deletingOcc.date)} às {deletingOcc.time}
                </div>
                {deletingOcc.financialImpact && (
                  <div className="text-red-700 font-semibold pt-0.5">
                    <strong>Impacto Financeiro:</strong> {formatBRL(deletingOcc.extraCostAmount)} ({deletingOcc.impactResponsible.toUpperCase()})
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500">
                Ao confirmar, o registro correspondente será removido da aba <strong>Ocorrencias</strong> da Planilha Google oficial e os indicadores operacionais serão recalculados em tempo real.
              </p>
            </div>

            {/* Rodapé Fixo */}
            <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingOcc(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const occNumber = deletingOcc.ocNumber;
                  deleteOccurrence(deletingOcc.id);
                  setDeletingOcc(null);
                  setDeleteNotice(`Ocorrência da ${occNumber} removida com sucesso!`);
                  setTimeout(() => setDeleteNotice(null), 3500);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sim, Remover Ocorrência
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
