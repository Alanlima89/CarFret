import React, { useState } from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import { DailyStayFee, CargoTrip } from '../../types/logistics';
import { formatBRL, formatDateTime } from '../../utils/formatters';
import { SearchableSelect } from '../ui/SearchableSelect';
import {
  Clock,
  Plus,
  Calculator,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Search,
  X,
  Truck,
  Building,
} from 'lucide-react';

interface Props {
  selectedCargoFromParent?: CargoTrip | null;
  onClearSelectedCargo?: () => void;
}

export const CalculoDiariasView: React.FC<Props> = ({ selectedCargoFromParent, onClearSelectedCargo }) => {
  const { dailyStayFees, cargos, addDailyStayFee, updateDailyStayFee, deleteDailyStayFee } = useLogistics();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Form states
  const [cargoId, setCargoId] = useState(selectedCargoFromParent?.id || (cargos[0]?.id || ''));
  const [localType, setLocalType] = useState<'carregamento' | 'descarga'>('descarga');
  const [locationName, setLocationName] = useState('');

  // Default times: today 08:00 to today 19:00 (11 hours wait -> 6h excess with 5h tolerance)
  const defaultArrival = new Date();
  defaultArrival.setHours(7, 0, 0, 0);
  const defaultDeparture = new Date();
  defaultDeparture.setHours(18, 0, 0, 0);

  const [arrivalDateTime, setArrivalDateTime] = useState(defaultArrival.toISOString().slice(0, 16));
  const [departureDateTime, setDepartureDateTime] = useState(defaultDeparture.toISOString().slice(0, 16));
  const [toleranceHours, setToleranceHours] = useState<number>(5); // Padrão Lei 13.103/15
  const [rateType, setRateType] = useState<'valor_hora' | 'diaria_fixa' | 'por_tonelada_hora'>('valor_hora');
  const [rateValue, setRateValue] = useState<number>(65.0); // R$ 65/h
  const [notes, setNotes] = useState('');

  // Auto-calculated fields
  const arrival = new Date(arrivalDateTime).getTime();
  const departure = new Date(departureDateTime).getTime();
  const diffMillis = Math.max(0, departure - arrival);
  const totalWaitHours = Math.round((diffMillis / (1000 * 60 * 60)) * 10) / 10;
  const excessHours = Math.max(0, Math.round((totalWaitHours - toleranceHours) * 10) / 10);

  const selectedCargo = cargos.find((c) => c.id === cargoId);

  let calculatedAmount = 0;
  if (rateType === 'valor_hora') {
    calculatedAmount = excessHours * rateValue;
  } else if (rateType === 'diaria_fixa') {
    const days = Math.ceil(excessHours / 24) || 1;
    calculatedAmount = days * rateValue;
  } else if (rateType === 'por_tonelada_hora') {
    const tons = selectedCargo?.weightTons || 37;
    calculatedAmount = excessHours * rateValue * tons;
  }

  const handleOpenModal = (cargo?: CargoTrip) => {
    if (cargo) {
      setCargoId(cargo.id);
      setLocationName(cargo.destinationSupplierName);
    } else if (selectedCargo) {
      setLocationName(selectedCargo.destinationSupplierName);
    }
    setIsModalOpen(true);
  };

  const handleCargoChange = (newCargoId: string) => {
    setCargoId(newCargoId);
    const c = cargos.find((item) => item.id === newCargoId);
    if (c) {
      setLocationName(localType === 'carregamento' ? c.originSupplierName : c.destinationSupplierName);
    }
  };

  const handleLocalTypeChange = (newLocalType: 'carregamento' | 'descarga') => {
    setLocalType(newLocalType);
    const c = cargos.find((item) => item.id === cargoId);
    if (c) {
      setLocationName(newLocalType === 'carregamento' ? c.originSupplierName : c.destinationSupplierName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCargo) return;

    addDailyStayFee({
      cargoId: selectedCargo.id,
      ocNumber: selectedCargo.ocNumber,
      driverName: selectedCargo.driverName,
      vehiclePlate: `${selectedCargo.cavaloPlate} / ${selectedCargo.carretaPlate}`,
      localType,
      locationName: locationName || (localType === 'carregamento' ? selectedCargo.originSupplierName : selectedCargo.destinationSupplierName),
      arrivalDateTime,
      departureDateTime,
      toleranceHours,
      totalWaitHours,
      excessHours,
      rateType,
      rateValue,
      calculatedAmount,
      approvedAmount: calculatedAmount,
      status: 'pendente',
      notes,
    });

    setIsModalOpen(false);
    if (onClearSelectedCargo) onClearSelectedCargo();
  };

  const handleStatusUpdate = (stay: DailyStayFee, newStatus: DailyStayFee['status']) => {
    updateDailyStayFee({
      ...stay,
      status: newStatus,
    });
  };

  const filteredStays = dailyStayFees.filter((s) => {
    const matchesSearch =
      s.ocNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.locationName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalCalculated = dailyStayFees.reduce((acc, s) => acc + s.calculatedAmount, 0);
  const totalApproved = dailyStayFees
    .filter((s) => s.status !== 'pendente')
    .reduce((acc, s) => acc + s.approvedAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Cálculo de Diárias e Estadias (Lei nº 13.103/2015)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Apuração automática de horas paradas excedentes no carregamento e na descarga com base na tolerância legal de 5 horas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            <Calculator className="w-4 h-4" />
            Calcular / Lançar Nova Diária
          </button>
        </div>
      </div>

      {/* Legal Reference & Explanatory Box */}
      <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl flex items-start gap-3 text-xs text-indigo-950">
        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Regulamentação Legal (Lei nº 11.442/07 alterada pela Lei nº 13.103/15):</strong> O prazo máximo para carga e descarga do Veículo de Transporte Rodoviário de Cargas é de <strong>5 (cinco) horas</strong>, contadas da chegada do veículo ao endereço de destino. Após esse período, é devida ao Transportador Autônomo ou à Empresa de Transporte a remuneração por hora parada ou fração proporcional.
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Total de Diárias Apuradas</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{dailyStayFees.length} estadias</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Valor Total Calculado</span>
          <div className="text-xl font-bold text-indigo-700 mt-1">{formatBRL(totalCalculated)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block">Total Aprovado / Faturado</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">{formatBRL(totalApproved)}</div>
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
            placeholder="Buscar por O.C., motorista, local de espera..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {[
            { id: 'todos', label: 'Todas' },
            { id: 'pendente', label: 'Pendentes' },
            { id: 'aprovado', label: 'Aprovadas' },
            { id: 'pago_motorista', label: 'Pagas ao Motorista' },
            { id: 'cobrado_cliente', label: 'Cobradas do Cliente' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStatus(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
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

      {/* Table of Daily Stays */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">O.C. / Motorista</th>
                <th className="py-3.5 px-4">Local da Espera</th>
                <th className="py-3.5 px-4">Horários (Chegada → Saída)</th>
                <th className="py-3.5 px-4 text-center">Horas Excedentes</th>
                <th className="py-3.5 px-4 text-right">Valor Calculado</th>
                <th className="py-3.5 px-4">Status de Pagamento</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStays.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Nenhum registro de diária ou estadia encontrado.
                  </td>
                </tr>
              ) : (
                filteredStays.map((stay) => (
                  <tr key={stay.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-indigo-700">{stay.ocNumber}</div>
                      <div className="font-medium text-slate-900 text-xs">{stay.driverName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{stay.vehiclePlate}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-slate-800">
                        {stay.localType === 'carregamento' ? 'Coleta / Armazém' : 'Descarga / Terminal'}
                      </div>
                      <div className="text-xs text-slate-500">{stay.locationName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      <div>Chegada: {formatDateTime(stay.arrivalDateTime)}</div>
                      <div className="text-slate-500">Saída: {formatDateTime(stay.departureDateTime)}</div>
                      <div className="text-[11px] text-slate-400">Total espera: {stay.totalWaitHours}h (Tolerância: {stay.toleranceHours}h)</div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-mono font-black text-amber-700 text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        +{stay.excessHours}h
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="font-bold text-slate-900">{formatBRL(stay.calculatedAmount)}</div>
                      <div className="text-[11px] text-slate-400">
                        {stay.rateType === 'valor_hora' ? `${formatBRL(stay.rateValue)}/h` : 'Diária Fixa'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={stay.status}
                        onChange={(e) => handleStatusUpdate(stay, e.target.value as any)}
                        className="text-xs font-semibold rounded-md border border-slate-300 py-1 px-2.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="pendente">Pendente de Análise</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="pago_motorista">Pago ao Motorista</option>
                        <option value="cobrado_cliente">Cobrado do Cliente</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => deleteDailyStayFee(stay.id)}
                        className="text-xs text-red-600 hover:text-red-800 hover:underline"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CALCULAR / LANÇAR DIÁRIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Calculadora e Lançamento de Diária / Estadia
                </h3>
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
              {/* Seleção da Carga */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Carga / O.C. Vinculada *</label>
                <SearchableSelect
                  required
                  value={cargoId}
                  onChange={(val) => handleCargoChange(val)}
                  placeholder="Selecione a Carga / O.C..."
                  searchPlaceholder="Pesquisar por O.C., motorista, placa ou cliente..."
                  options={cargos.map((c) => ({
                    value: c.id,
                    label: `${c.ocNumber} · ${c.driverName || 'Sem motorista'} (${c.cavaloPlate || 'A definir'})`,
                    sublabel: `${c.clientName} · ${c.originCityState} → ${c.destinationCityState}`,
                    searchKeywords: `${c.ocNumber} ${c.driverName || ''} ${c.cavaloPlate || ''} ${c.clientName} ${c.originCityState} ${c.destinationCityState}`,
                  }))}
                />
              </div>

              {/* Local da Espera */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Local do Atraso *</label>
                  <SearchableSelect
                    value={localType}
                    onChange={(val) => handleLocalTypeChange(val as any)}
                    placeholder="Selecione o local..."
                    searchPlaceholder="Pesquisar..."
                    options={[
                      { value: 'descarga', label: 'No Ponto de Descarga (Cliente/Porto)' },
                      { value: 'carregamento', label: 'No Ponto de Coleta (Armazém/Fazenda)' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nome da Empresa / Pátio</label>
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Chegada na Guarita / Triagem *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={arrivalDateTime}
                    onChange={(e) => setArrivalDateTime(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Liberação da Balança / Saída *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={departureDateTime}
                    onChange={(e) => setDepartureDateTime(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              {/* Regras de Cálculo */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Tolerância Legal (Horas)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={toleranceHours}
                    onChange={(e) => setToleranceHours(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                  />
                  <span className="text-[10px] text-slate-400">Padrão da Lei: 5 horas</span>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Tipo de Remuneração</label>
                  <SearchableSelect
                    value={rateType}
                    onChange={(val) => setRateType(val as any)}
                    placeholder="Selecione o tipo..."
                    searchPlaceholder="Pesquisar..."
                    options={[
                      { value: 'valor_hora', label: 'Valor por Hora Parada' },
                      { value: 'diaria_fixa', label: 'Diária Fixa (por 24h)' },
                      { value: 'por_tonelada_hora', label: 'R$ por Ton/Hora' },
                    ]}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    {rateType === 'valor_hora' ? 'Taxa (R$/Hora)' : rateType === 'diaria_fixa' ? 'Valor Diária (R$)' : 'Taxa (R$/t/h)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rateValue}
                    onChange={(e) => setRateValue(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              {/* Simulation Result Callout */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-900 block font-medium">Resultado do Cálculo:</span>
                  <div className="text-xs text-indigo-700 mt-0.5">
                    Tempo total no pátio: <strong>{totalWaitHours}h</strong> | Excedente apurado:{' '}
                    <strong className="text-indigo-950 font-bold">{excessHours}h</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-indigo-600 block uppercase font-bold">Valor Devido</span>
                  <div className="text-lg font-black text-indigo-950 font-mono">
                    {formatBRL(calculatedAmount)}
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Observações Operacionais / Justificativa</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Anexado comprovante com ticket de balança e carimbo de entrada"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                />
              </div>
              </div>

              {/* Rodapé Fixo */}
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  Confirmar e Registrar Diária
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
