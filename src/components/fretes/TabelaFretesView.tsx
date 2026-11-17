import React, { useState } from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import { FreightRate } from '../../types/logistics';
import { formatBRL, formatDate } from '../../utils/formatters';
import { SearchableSelect } from '../ui/SearchableSelect';
import { DollarSign, Plus, Search, Edit2, Trash2, X, Route, ShieldCheck } from 'lucide-react';

export const TabelaFretesView: React.FC = () => {
  const { freightRates, clients, addFreightRate, updateFreightRate, deleteFreightRate } = useLogistics();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<FreightRate | null>(null);

  // Form states
  const [clientId, setClientId] = useState('');
  const [originCityState, setOriginCityState] = useState('');
  const [destinationCityState, setDestinationCityState] = useState('');
  const [pricingType, setPricingType] = useState<'per_ton' | 'fixed'>('per_ton');
  const [unitRate, setUnitRate] = useState<number>(380);
  const [vehicleRequiredType, setVehicleRequiredType] = useState('Rodotrem Graneleiro 9 Eixos');
  const [tollsIncluded, setTollsIncluded] = useState(true);
  const [validityDate, setValidityDate] = useState('2026-12-31');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingRate(null);
    setClientId(clients.length > 0 ? clients[0].id : '');
    setOriginCityState('');
    setDestinationCityState('');
    setPricingType('per_ton');
    setUnitRate(0);
    setVehicleRequiredType('Rodotrem Graneleiro');
    setTollsIncluded(true);
    setValidityDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rate: FreightRate) => {
    setEditingRate(rate);
    setClientId(rate.clientId);
    setOriginCityState(rate.originCityState);
    setDestinationCityState(rate.destinationCityState);
    setPricingType(rate.pricingType);
    setUnitRate(rate.unitRate);
    setVehicleRequiredType(rate.vehicleRequiredType);
    setTollsIncluded(rate.tollsIncluded);
    setValidityDate(rate.validityDate || '');
    setNotes(rate.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    if (editingRate) {
      updateFreightRate({
        ...editingRate,
        clientId,
        clientName: client.tradeName || client.companyName,
        originCityState,
        destinationCityState,
        pricingType,
        unitRate,
        vehicleRequiredType,
        tollsIncluded,
        validityDate,
        notes,
      });
    } else {
      addFreightRate({
        clientId,
        clientName: client.tradeName || client.companyName,
        originCityState,
        destinationCityState,
        pricingType,
        unitRate,
        vehicleRequiredType,
        tollsIncluded,
        validityDate,
        notes,
      });
    }
    setIsModalOpen(false);
  };

  const filteredRates = freightRates.filter((r) => {
    const s = searchTerm.toLowerCase();
    return (
      r.clientName.toLowerCase().includes(s) ||
      r.originCityState.toLowerCase().includes(s) ||
      r.destinationCityState.toLowerCase().includes(s) ||
      r.vehicleRequiredType.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Tabela de Fretes Acordados por Cliente & Rota
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Cadastre os valores contratuais acordados por tonelada ou valor fechado para preenchimento automático nas O.C.s.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Nova Rota / Tarifa
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por cliente, rota ou tipo de implemento..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Cards Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Cliente / Embarcador</th>
                <th className="py-3.5 px-4">Rota Acordada</th>
                <th className="py-3.5 px-4">Veículo Requerido</th>
                <th className="py-3.5 px-4 text-right">Tarifa Acordada</th>
                <th className="py-3.5 px-4">Pedágio</th>
                <th className="py-3.5 px-4">Vigência</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Nenhuma tabela de frete cadastrada.
                  </td>
                </tr>
              ) : (
                filteredRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {rate.clientName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                        <Route className="w-3.5 h-3.5 text-indigo-500" />
                        {rate.originCityState} → {rate.destinationCityState}
                      </div>
                      {rate.notes && <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{rate.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      {rate.vehicleRequiredType}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-sm">{formatBRL(rate.unitRate)}</div>
                      <div className="text-[11px] text-slate-400">
                        {rate.pricingType === 'per_ton' ? 'por Tonelada' : 'Valor Fechado'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      {rate.tollsIncluded ? (
                        <span className="text-emerald-700 font-medium">Incluso na Tarifa</span>
                      ) : (
                        <span className="text-amber-700 font-medium">Pago à Parte</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(rate.validityDate)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(rate)}
                          className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFreightRate(rate.id)}
                          className="p-1 text-slate-500 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADICIONAR / EDITAR TARIFA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingRate ? 'Editar Tabela de Frete' : 'Cadastrar Nova Rota / Frete de Cliente'}
              </h3>
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">Cliente / Embarcador *</label>
                <SearchableSelect
                  required
                  value={clientId}
                  onChange={(val) => setClientId(val)}
                  placeholder="Selecione o Cliente / Embarcador..."
                  searchPlaceholder="Pesquisar por nome ou razão social..."
                  options={clients.map((c) => ({
                    value: c.id,
                    label: c.tradeName || c.companyName,
                    sublabel: `${c.companyName} · ${c.addressCity || ''}/${c.addressState || ''}`,
                    searchKeywords: `${c.tradeName} ${c.companyName} ${c.addressCity} ${c.addressState}`,
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Cidade / Estado de Origem *</label>
                  <input
                    type="text"
                    required
                    value={originCityState}
                    onChange={(e) => setOriginCityState(e.target.value)}
                    placeholder="Ex: Sorriso / MT"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Cidade / Estado de Destino *</label>
                  <input
                    type="text"
                    required
                    value={destinationCityState}
                    onChange={(e) => setDestinationCityState(e.target.value)}
                    placeholder="Ex: Santos / SP (Porto)"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Modelo de Cobrança</label>
                  <SearchableSelect
                    value={pricingType}
                    onChange={(val) => setPricingType(val as any)}
                    placeholder="Selecione o modelo..."
                    searchPlaceholder="Pesquisar modelo..."
                    options={[
                      { value: 'per_ton', label: 'Preço por Tonelada (R$/ton)' },
                      { value: 'fixed', label: 'Valor Fechado (R$)' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {pricingType === 'per_ton' ? 'Valor por Tonelada (R$)' : 'Valor Fechado (R$)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitRate}
                    onChange={(e) => setUnitRate(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Veículo / Carreta</label>
                  <input
                    type="text"
                    value={vehicleRequiredType}
                    onChange={(e) => setVehicleRequiredType(e.target.value)}
                    placeholder="Ex: Rodotrem 9 Eixos, Bitrem Graneleiro"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Vigência do Contrato</label>
                  <input
                    type="date"
                    value={validityDate}
                    onChange={(e) => setValidityDate(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tollCheck"
                  checked={tollsIncluded}
                  onChange={(e) => setTollsIncluded(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="tollCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Pedágio incluso na tarifa contratada
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Observações do Contrato de Rota</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Condição safra 2026/27, 70% de adiantamento na emissão da OC"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  Salvar Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
