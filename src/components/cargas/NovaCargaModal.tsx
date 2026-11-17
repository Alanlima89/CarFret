import React, { useState, useEffect } from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import { CargoTrip, CargoStatus, OCStatus } from '../../types/logistics';
import { formatBRL, getWeightInKg, getWeightInTons } from '../../utils/formatters';
import { SearchableSelect } from '../ui/SearchableSelect';
import {
  X,
  Truck,
  Calendar,
  DollarSign,
  AlertCircle,
  Sparkles,
  User,
  CheckCircle,
  HelpCircle,
  Layers,
  FileSpreadsheet,
  Building2,
  TrendingUp,
  Wallet,
  Percent,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cargoToEdit?: CargoTrip | null;
  onSaved?: (cargo: CargoTrip) => void;
}

export const NovaCargaModal: React.FC<Props> = ({ isOpen, onClose, cargoToEdit, onSaved }) => {
  const {
    clients,
    partners,
    products,
    drivers,
    cavalos,
    carretas,
    freightRates,
    addCargo,
    addCargosBatch,
    updateCargo,
    getNextAvailableOcNumber,
  } = useLogistics();

  // Form states - Etapa 1: Operação
  const [clientId, setClientId] = useState('');
  const [originPartnerId, setOriginPartnerId] = useState('');
  const [destinationPartnerId, setDestinationPartnerId] = useState('');
  const [productId, setProductId] = useState('');
  const [pedidoCliente, setPedidoCliente] = useState('');

  // Lançamento em Lote por Quantidade
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchQuantity, setBatchQuantity] = useState<number>(5);

  // Form states - Etapa 2: Escala (Opcional)
  const [driverId, setDriverId] = useState('');
  const [cavaloId, setCavaloId] = useState('');
  const [carretaId, setCarretaId] = useState('');
  const [carreta2Id, setCarreta2Id] = useState('');

  // Cronograma & Peso
  const [scheduledLoadingDate, setScheduledLoadingDate] = useState('');
  const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState('');
  const [actualLoadingDate, setActualLoadingDate] = useState('');
  const [actualAwaitingUnloadDate, setActualAwaitingUnloadDate] = useState('');
  const [actualDeliveryDate, setActualDeliveryDate] = useState('');
  const [weightKg, setWeightKg] = useState<number>(37000);

  // Valores - Frete Empresa (Receita / Tomador)
  const [freightType, setFreightType] = useState<'per_ton' | 'fixed'>('per_ton');
  const [freightRate, setFreightRate] = useState<number>(380);
  const [advancePercent, setAdvancePercent] = useState<number>(70);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [balanceAmount, setBalanceAmount] = useState<number>(0);

  // Valores - Frete Veículo Terceiro (Custo / Motorista Agregado)
  const [thirdPartyFreightType, setThirdPartyFreightType] = useState<'per_ton' | 'fixed'>('per_ton');
  const [thirdPartyFreightRate, setThirdPartyFreightRate] = useState<number>(320);
  const [thirdPartyAdvancePercent, setThirdPartyAdvancePercent] = useState<number>(70);
  const [thirdPartyAdvanceAmount, setThirdPartyAdvanceAmount] = useState<number>(0);
  const [thirdPartyBalanceAmount, setThirdPartyBalanceAmount] = useState<number>(0);

  // Observações da Coleta & Instruções
  const [collectionNotes, setCollectionNotes] = useState(
    '⚠️ EXIGIR EPI COMPLETO (Botina, capacete, óculos). Apresentar CNH original na portaria. Horário limite balança até 17h30.'
  );
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    'Apresentar código do agendamento de triagem. Conferir carimbo no canhoto e ticket de pesagem líquida.'
  );

  const [cargoStatus, setCargoStatus] = useState<CargoStatus>('aguardando_veiculo');
  const [ocStatus, setOcStatus] = useState<OCStatus>('gerada');

  // Quick preset pills for collection notes
  const quickNotesPresets = [
    'EPI Completo Obrigatório',
    'Apresentar CNH e Docto na Portaria 2',
    'Horário Limite Balança 17h30',
    'Tolerância Quebra Máx 0.25%',
    'Deslonar antes de entrar na moega',
    'Exige agendamento prévio SIGA',
  ];

  const handleAddPreset = (preset: string) => {
    if (!collectionNotes.includes(preset)) {
      setCollectionNotes((prev) => (prev ? `${prev} · ${preset}` : preset));
    }
  };

  // Populate form on edit or open
  useEffect(() => {
    if (cargoToEdit) {
      setClientId(cargoToEdit.clientId);
      setOriginPartnerId(cargoToEdit.originSupplierId);
      setDestinationPartnerId(cargoToEdit.destinationSupplierId);
      setProductId(cargoToEdit.productId);
      setPedidoCliente(cargoToEdit.pedidoCliente || '');
      setDriverId(cargoToEdit.driverId || '');
      setCavaloId(cargoToEdit.cavaloId || '');
      setCarretaId(cargoToEdit.carretaId || '');
      setCarreta2Id(cargoToEdit.carreta2Id || '');
      setScheduledLoadingDate(cargoToEdit.scheduledLoadingDate);
      setScheduledDeliveryDate(cargoToEdit.scheduledDeliveryDate);
      setActualLoadingDate(cargoToEdit.actualLoadingDate ? cargoToEdit.actualLoadingDate.slice(0, 16) : '');
      setActualAwaitingUnloadDate(cargoToEdit.actualAwaitingUnloadDate ? cargoToEdit.actualAwaitingUnloadDate.slice(0, 16) : '');
      setActualDeliveryDate(cargoToEdit.actualDeliveryDate ? cargoToEdit.actualDeliveryDate.slice(0, 16) : '');
      setWeightKg(getWeightInKg(cargoToEdit.weightTons || (cargoToEdit as any).weightKg || 37000));
      setFreightType(cargoToEdit.freightType);
      setFreightRate(cargoToEdit.freightRate);
      setAdvanceAmount(cargoToEdit.advanceAmount);
      setBalanceAmount(cargoToEdit.balanceAmount);
      setThirdPartyFreightType(cargoToEdit.thirdPartyFreightType || 'per_ton');
      setThirdPartyFreightRate(
        cargoToEdit.thirdPartyFreightRate ??
          (cargoToEdit.freightRate ? Math.round(cargoToEdit.freightRate * 0.85) : 320)
      );
      setThirdPartyAdvanceAmount(cargoToEdit.thirdPartyAdvanceAmount ?? 0);
      setThirdPartyBalanceAmount(cargoToEdit.thirdPartyBalanceAmount ?? 0);
      setCollectionNotes(cargoToEdit.collectionNotes);
      setDeliveryInstructions(cargoToEdit.deliveryInstructions);
      setCargoStatus(cargoToEdit.cargoStatus);
      setOcStatus(cargoToEdit.ocStatus);
      setIsBatchMode(false);
      setBatchQuantity(5);
    } else {
      // Default dates: tomorrow at 08:00 and 4 days later at 16:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);

      const delivery = new Date(tomorrow);
      delivery.setDate(delivery.getDate() + 3);
      delivery.setHours(17, 0, 0, 0);

      const formatInputDate = (d: Date) => {
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
      };

      setScheduledLoadingDate(formatInputDate(tomorrow));
      setScheduledDeliveryDate(formatInputDate(delivery));
      setActualLoadingDate('');
      setActualAwaitingUnloadDate('');
      setActualDeliveryDate('');

      // Auto-select first client, partners and product if available
      if (clients.length > 0) setClientId(clients[0].id);
      if (partners.length > 0) {
        setOriginPartnerId(partners[0].id);
        if (partners.length > 1) {
          setDestinationPartnerId(partners[1].id);
        } else {
          setDestinationPartnerId(partners[0].id);
        }
      }
      if (products.length > 0) setProductId(products[0].id);

      setPedidoCliente('');
      setIsBatchMode(false);
      setBatchQuantity(5);

      setWeightKg(37000);
      setFreightType('per_ton');
      setFreightRate(380);
      setAdvancePercent(70);
      setThirdPartyFreightType('per_ton');
      setThirdPartyFreightRate(320);
      setThirdPartyAdvancePercent(70);

      // Default scale is empty so user can do quick entry without mandatory driver
      setDriverId('');
      setCavaloId('');
      setCarretaId('');
      setCargoStatus('aguardando_veiculo');
      setOcStatus('gerada');
    }
  }, [cargoToEdit, isOpen, clients, partners, products]);

  // Dynamic Total Freight Calculation - Empresa (Receita)
  const weightInTons = getWeightInTons(weightKg);
  const totalFreight =
    freightType === 'per_ton'
      ? (Number(weightInTons) || 0) * (Number(freightRate) || 0)
      : Number(freightRate) || 0;

  // Dynamic Total Freight Calculation - Terceiro (Custo)
  const thirdPartyTotalFreight =
    thirdPartyFreightType === 'per_ton'
      ? (Number(weightInTons) || 0) * (Number(thirdPartyFreightRate) || 0)
      : Number(thirdPartyFreightRate) || 0;

  // Sync Empresa Advance and Balance
  useEffect(() => {
    if (!cargoToEdit) {
      const adv = (totalFreight * advancePercent) / 100;
      setAdvanceAmount(adv);
      setBalanceAmount(totalFreight - adv);
    }
  }, [totalFreight, advancePercent, cargoToEdit]);

  // Sync Terceiro Advance and Balance
  useEffect(() => {
    if (!cargoToEdit) {
      const advThird = (thirdPartyTotalFreight * thirdPartyAdvancePercent) / 100;
      setThirdPartyAdvanceAmount(advThird);
      setThirdPartyBalanceAmount(thirdPartyTotalFreight - advThird);
    }
  }, [thirdPartyTotalFreight, thirdPartyAdvancePercent, cargoToEdit]);

  // Margem Operacional Estimada (Spread)
  const estimatedSpread = totalFreight - thirdPartyTotalFreight;
  const estimatedSpreadPercent = totalFreight > 0 ? (estimatedSpread / totalFreight) * 100 : 0;

  // Lookup default freight rates when client changes
  const handleClientOrRouteLookup = (newClientId: string) => {
    setClientId(newClientId);
    const matchedRate = freightRates.find((fr) => fr.clientId === newClientId);
    if (matchedRate) {
      setFreightRate(matchedRate.unitRate);
      setFreightType(matchedRate.pricingType);
    }
  };

  // If driver changes, sync default cavalo if configured
  const handleDriverChange = (newDriverId: string) => {
    setDriverId(newDriverId);
    if (newDriverId) {
      const linkedCavalo = cavalos.find((c) => c.driverIdDefault === newDriverId);
      if (linkedCavalo && !cavaloId) {
        setCavaloId(linkedCavalo.id);
      }
    }
  };

  const handleCavaloChange = (newCavaloId: string) => {
    setCavaloId(newCavaloId);
    if (newCavaloId) {
      const cavalo = cavalos.find((c) => c.id === newCavaloId);
      if (cavalo?.driverIdDefault && !driverId) {
        setDriverId(cavalo.driverIdDefault);
      }
    }
  };

  const hasVehicleAssigned = Boolean(driverId && cavaloId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedClient = clients.find((c) => c.id === clientId);
    const selectedOrigin = partners.find((p) => p.id === originPartnerId);
    const selectedDest = partners.find((p) => p.id === destinationPartnerId);
    const selectedProduct = products.find((p) => p.id === productId);

    if (!selectedClient || !selectedOrigin || !selectedDest) {
      alert('Por favor, selecione o Cliente Tomador, a Origem e o Destino da carga.');
      return;
    }

    // Common operational payload
    const basePayload = {
      clientId,
      clientName: selectedClient.tradeName || selectedClient.companyName,
      originSupplierId: selectedOrigin.id,
      originSupplierName: selectedOrigin.companyName,
      originCityState: `${selectedOrigin.addressCity} / ${selectedOrigin.addressState}`,
      originAddress: `${selectedOrigin.addressCity} - ${selectedOrigin.addressState}. Contato: ${selectedOrigin.contactPerson}`,
      destinationSupplierId: selectedDest.id,
      destinationSupplierName: selectedDest.companyName,
      destinationCityState: `${selectedDest.addressCity} / ${selectedDest.addressState}`,
      destinationAddress: `${selectedDest.addressCity} - ${selectedDest.addressState}. Contato: ${selectedDest.contactPerson}`,
      productId,
      productName: selectedProduct?.name || 'Carga Geral',
      pedidoCliente: pedidoCliente.trim() || undefined,
      scheduledLoadingDate,
      scheduledDeliveryDate,
      actualLoadingDate: actualLoadingDate ? actualLoadingDate : undefined,
      actualAwaitingUnloadDate: actualAwaitingUnloadDate ? actualAwaitingUnloadDate : undefined,
      weightTons: getWeightInTons(weightKg),
      weightKg: Number(weightKg) || 0,
      freightType,
      freightRate: Number(freightRate) || 0,
      totalFreight,
      advanceAmount: Number(advanceAmount) || 0,
      balanceAmount: Number(balanceAmount) || 0,
      thirdPartyFreightType,
      thirdPartyFreightRate: Number(thirdPartyFreightRate) || 0,
      thirdPartyTotalFreight,
      thirdPartyAdvanceAmount: Number(thirdPartyAdvanceAmount) || 0,
      thirdPartyBalanceAmount: Number(thirdPartyBalanceAmount) || 0,
      collectionNotes,
      deliveryInstructions,
    };

    // LANÇAMENTO EM LOTE POR QUANTIDADE
    if (!cargoToEdit && isBatchMode) {
      const batchPayloads = Array.from({ length: batchQuantity }, () => ({
        ...basePayload,
        driverId: '',
        driverName: 'A Definir',
        driverPhone: '',
        driverPix: '',
        cavaloId: '',
        cavaloPlate: 'A Definir',
        carretaId: '',
        carretaPlate: 'A Definir',
        carretaType: 'Graneleira',
        cargoStatus: 'aguardando_veiculo' as CargoStatus,
        ocStatus: 'gerada' as OCStatus,
      }));

      const createdList = addCargosBatch(batchPayloads);
      if (onSaved && createdList.length > 0) onSaved(createdList[0]);
      onClose();
      return;
    }

    // INDIVIDUAL CADASTRO / EDIÇÃO
    const selectedDriver = drivers.find((d) => d.id === driverId);
    const selectedCavalo = cavalos.find((c) => c.id === cavaloId);
    const selectedCarreta = carretas.find((c) => c.id === carretaId);
    const selectedCarreta2 = carretas.find((c) => c.id === carreta2Id);

    let resolvedCargoStatus: CargoStatus;
    if (cargoToEdit) {
      if (hasVehicleAssigned && cargoStatus === 'aguardando_veiculo') {
        resolvedCargoStatus = 'aguardando_carregar';
      } else if (!hasVehicleAssigned && cargoStatus === 'aguardando_carregar') {
        resolvedCargoStatus = 'aguardando_veiculo';
      } else {
        resolvedCargoStatus = cargoStatus;
      }
    } else {
      resolvedCargoStatus = hasVehicleAssigned ? 'aguardando_carregar' : 'aguardando_veiculo';
    }

    const payload = {
      ...basePayload,
      driverId: selectedDriver ? selectedDriver.id : '',
      driverName: selectedDriver ? selectedDriver.name : 'A Definir',
      driverPhone: selectedDriver ? selectedDriver.phone : '',
      driverPix: selectedDriver ? `${selectedDriver.pixKey} (${selectedDriver.pixKeyType})` : '',
      cavaloId: selectedCavalo ? selectedCavalo.id : '',
      cavaloPlate: selectedCavalo ? selectedCavalo.plate : 'A Definir',
      carretaId: selectedCarreta ? selectedCarreta.id : '',
      carretaPlate: selectedCarreta ? selectedCarreta.plate : selectedCavalo ? 'SEM CARRETA' : 'A Definir',
      carretaType: selectedCarreta ? selectedCarreta.bodyType : 'Graneleira',
      carreta2Id: selectedCarreta2 ? selectedCarreta2.id : undefined,
      carreta2Plate: selectedCarreta2 ? selectedCarreta2.plate : undefined,
      carreta2Type: selectedCarreta2 ? selectedCarreta2.bodyType : undefined,
      cargoStatus: resolvedCargoStatus,
      ocStatus: hasVehicleAssigned ? ocStatus : 'gerada',
    };

    let resultCargo: CargoTrip;
    if (cargoToEdit) {
      resultCargo = {
        ...cargoToEdit,
        ...payload,
      };
      updateCargo(resultCargo);
    } else {
      resultCargo = addCargo(payload);
    }

    if (onSaved) onSaved(resultCargo);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 flex-wrap">
                <span>{cargoToEdit ? `Editar Carga / O.C. ${cargoToEdit.ocNumber}` : 'Programação de Carga & Fretamento'}</span>
                {!cargoToEdit && !isBatchMode && (
                  <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                    Próxima: {getNextAvailableOcNumber()}
                  </span>
                )}
                {!cargoToEdit && isBatchMode && (
                  <span className="text-xs font-mono font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded border border-violet-200">
                    Série: {getNextAvailableOcNumber()} ({batchQuantity} O.C.s)
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {isBatchMode
                  ? 'Geração múltipla em lote com status inicial "Aguardando Veículo"'
                  : 'Fluxo em 2 etapas: registre os dados operacionais agora e escale o motorista quando disponível.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {(clients.length === 0 || partners.length === 0) && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Atenção para o primeiro cadastro:</span>
                <p className="mt-0.5 text-[11px] text-amber-800">
                  Para cadastrar a carga, adicione ao menos 1 Cliente e 1 Ponto de Origem/Destino na aba <strong>Cadastros Básicos</strong>. O motorista e caminhão podem ser adicionados agora ou escalados depois.
                </p>
              </div>
            </div>
          )}

          {/* ================= REQUISITO 2: LANÇAMENTO EM LOTE POR QUANTIDADE ================= */}
          {!cargoToEdit && (
            <div className="p-3.5 bg-gradient-to-r from-violet-50 via-indigo-50/70 to-slate-50 border border-violet-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3">
                <input
                  type="checkbox"
                  id="batchMode"
                  checked={isBatchMode}
                  onChange={(e) => setIsBatchMode(e.target.checked)}
                  className="w-4 h-4 mt-0.5 sm:mt-0 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer"
                />
                <label htmlFor="batchMode" className="cursor-pointer select-none">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-violet-950 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-violet-600" />
                      Gerar Lote de Cargas
                    </span>
                    <span className="text-[10px] font-bold bg-violet-200 text-violet-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Lançamento Múltiplo
                    </span>
                  </div>
                  <p className="text-[11px] text-violet-700 mt-0.5">
                    Preencha os dados fixos e gere todas as cargas simultaneamente com status &quot;Aguardando Veículo&quot;.
                  </p>
                </label>
              </div>

              {isBatchMode && (
                <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-1.5 rounded-lg border border-violet-300 shadow-2xs">
                  <label htmlFor="batchQuantity" className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Quantidade de Cargas:
                  </label>
                  <input
                    id="batchQuantity"
                    type="number"
                    min={2}
                    max={50}
                    value={batchQuantity}
                    onChange={(e) => setBatchQuantity(Math.max(2, Math.min(50, parseInt(e.target.value) || 2)))}
                    className="w-16 text-center text-xs font-bold bg-violet-50 border border-violet-300 rounded px-2 py-1 text-violet-900 focus:ring-2 focus:ring-violet-500"
                  />
                  <span className="text-[11px] font-semibold text-slate-500">cargas</span>
                </div>
              )}
            </div>
          )}

          {/* ================= ETAPA 1: DADOS DA OPERAÇÃO ================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-black">
                  1
                </span>
                Dados da Operação & Rota (Obrigatórios)
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">Campos essenciais</span>
            </div>

            {/* Cliente Tomador e Pontos de Coleta/Entrega */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Cliente / Embarcador *</label>
                <SearchableSelect
                  required
                  value={clientId}
                  onChange={(val) => handleClientOrRouteLookup(val)}
                  placeholder="Selecione o Cliente / Embarcador..."
                  searchPlaceholder="Pesquisar por nome ou cidade do cliente..."
                  options={clients.map((c) => ({
                    value: c.id,
                    label: c.tradeName || c.companyName,
                    sublabel: `${c.addressCity || ''}${c.addressState ? '/' + c.addressState : ''} · ${c.companyName}`,
                    searchKeywords: `${c.addressCity} ${c.addressState} ${c.tradeName} ${c.companyName}`,
                  }))}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Origem / Fornecedor *</label>
                <SearchableSelect
                  required
                  value={originPartnerId}
                  onChange={(val) => setOriginPartnerId(val)}
                  placeholder="Selecione o Local de Coleta..."
                  searchPlaceholder="Pesquisar por empresa ou cidade de origem..."
                  options={partners.map((p) => ({
                    value: p.id,
                    label: p.companyName,
                    sublabel: `${p.addressCity || ''}${p.addressState ? '/' + p.addressState : ''} · ${p.role}`,
                    searchKeywords: `${p.addressCity} ${p.addressState} ${p.role}`,
                  }))}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Destino / Entrega *</label>
                <SearchableSelect
                  required
                  value={destinationPartnerId}
                  onChange={(val) => setDestinationPartnerId(val)}
                  placeholder="Selecione o Destino..."
                  searchPlaceholder="Pesquisar por empresa ou cidade de destino..."
                  options={partners.map((p) => ({
                    value: p.id,
                    label: p.companyName,
                    sublabel: `${p.addressCity || ''}${p.addressState ? '/' + p.addressState : ''} · ${p.role}`,
                    searchKeywords: `${p.addressCity} ${p.addressState} ${p.role}`,
                  }))}
                />
              </div>
            </div>

            {/* REQUISITO 1: PRODUTO, PEDIDO DO CLIENTE E DATAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Produto Transportado *</label>
                <SearchableSelect
                  required
                  value={productId}
                  onChange={(val) => setProductId(val)}
                  placeholder="Selecione o Produto..."
                  searchPlaceholder="Pesquisar produto (ex: Soja, Milho)..."
                  options={products.map((p) => ({
                    value: p.id,
                    label: p.name,
                    sublabel: `Unidade: ${p.unit.toUpperCase()}`,
                    searchKeywords: `${p.name} ${p.unit}`,
                  }))}
                />
              </div>

              {/* REQUISITO 1: CAMPO PEDIDO DO CLIENTE */}
              <div>
                <label className="text-xs font-medium text-slate-700 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 font-semibold text-indigo-900">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    Pedido do Cliente
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: PED-9821, PO-4500"
                  value={pedidoCliente}
                  onChange={(e) => setPedidoCliente(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Data de Carregamento *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledLoadingDate}
                  onChange={(e) => setScheduledLoadingDate(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Previsão de Entrega *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledDeliveryDate}
                  onChange={(e) => setScheduledDeliveryDate(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* Volume & Peso Operacional em KG */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  Peso Total da Carga (KG) *
                </label>
                <p className="text-[11px] text-slate-500">
                  Informe o peso em quilogramas (ex: 37.000 kg). Base para pesagem em balança rodoviária e faturamento.
                </p>
                <div className="text-[11px] text-indigo-700 font-semibold flex items-center gap-2 pt-0.5">
                  <span>Equivalente: <strong>{getWeightInTons(weightKg).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} Toneladas</strong></span>
                  <span>·</span>
                  <span className="text-slate-600 font-mono font-bold">{weightKg.toLocaleString('pt-BR')} kg</span>
                </div>
              </div>
              <div className="w-full sm:w-48 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={weightKg || ''}
                    placeholder="Ex: 37000"
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm font-black text-slate-900 bg-white border border-slate-300 rounded-lg pl-3 pr-10 py-2 focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    KG
                  </span>
                </div>
              </div>
            </div>

            {/* ================= 1. FRETE EMPRESA (RECEITA / TOMADOR) ================= */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-blue-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-blue-700">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                      Frete Empresa (Receita / Tomador)
                    </h5>
                    <p className="text-[11px] text-blue-700/80">
                      Valor faturado / cobrado do cliente tomador ou embarcador contratante
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-blue-800 font-semibold block">Total Previsto da Empresa</span>
                  <span className="text-sm font-black text-blue-900 font-mono">
                    {formatBRL(totalFreight)}
                    {isBatchMode && (
                      <span className="text-[10px] text-blue-600 font-normal ml-1">
                        (Lote: {formatBRL(totalFreight * batchQuantity)})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Modalidade Empresa *</label>
                  <select
                    value={freightType}
                    onChange={(e) => setFreightType(e.target.value as 'per_ton' | 'fixed')}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="per_ton">R$ por Tonelada</option>
                    <option value="fixed">Valor Fechado (Carga)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    {freightType === 'per_ton' ? 'Tarifa Empresa (R$/Ton) *' : 'Valor Fechado Empresa *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={freightRate}
                    onChange={(e) => setFreightRate(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">Adiantamento Empresa</label>
                    <span className="text-[10px] text-blue-600 font-bold">{advancePercent}%</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={advanceAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setAdvanceAmount(val);
                      setBalanceAmount(totalFreight - val);
                    }}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <div className="flex gap-1 mt-1">
                    {[70, 80, 100, 0].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setAdvancePercent(p);
                          const val = (totalFreight * p) / 100;
                          setAdvanceAmount(val);
                          setBalanceAmount(totalFreight - val);
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                          advancePercent === p
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Saldo a Receber da Empresa</label>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between h-[34px]">
                    <span className="text-[11px] text-slate-500">A Faturar:</span>
                    <strong className="text-blue-900 font-mono text-xs">{formatBRL(balanceAmount)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= 2. FRETE VEÍCULO TERCEIRO (CUSTO / MOTORISTA AGREGADO) ================= */}
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-amber-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-800">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      CÁLCULO DE FRETE - VEÍCULO TERCEIRO (CUSTO)
                    </h5>
                    <p className="text-[11px] text-amber-800/80">
                      Valor contratado e pago ao motorista terceiro / agregado ou parceiro
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-amber-900 font-semibold block">Total Previsto Terceiro</span>
                  <span className="text-sm font-black text-amber-950 font-mono">
                    {formatBRL(thirdPartyTotalFreight)}
                    {isBatchMode && (
                      <span className="text-[10px] text-amber-700 font-normal ml-1">
                        (Lote: {formatBRL(thirdPartyTotalFreight * batchQuantity)})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Modalidade Terceiro *</label>
                  <select
                    value={thirdPartyFreightType}
                    onChange={(e) => setThirdPartyFreightType(e.target.value as 'per_ton' | 'fixed')}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    <option value="per_ton">R$ por Tonelada</option>
                    <option value="fixed">Valor Fechado (Carga)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    {thirdPartyFreightType === 'per_ton' ? 'Tarifa Terceiro (R$/Ton) *' : 'Valor Total Terceiro *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={thirdPartyFreightRate}
                    onChange={(e) => setThirdPartyFreightRate(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">Adiantamento Terceiro</label>
                    <span className="text-[10px] text-amber-700 font-bold">{thirdPartyAdvancePercent}%</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={thirdPartyAdvanceAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setThirdPartyAdvanceAmount(val);
                      setThirdPartyBalanceAmount(thirdPartyTotalFreight - val);
                    }}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <div className="flex gap-1 mt-1">
                    {[70, 80, 90, 0].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setThirdPartyAdvancePercent(p);
                          const val = (thirdPartyTotalFreight * p) / 100;
                          setThirdPartyAdvanceAmount(val);
                          setThirdPartyBalanceAmount(thirdPartyTotalFreight - val);
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                          thirdPartyAdvancePercent === p
                            ? 'bg-amber-600 text-white border-amber-600 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Saldo a Pagar Terceiro</label>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between h-[34px]">
                    <span className="text-[11px] text-slate-500">Na Descarga:</span>
                    <strong className="text-amber-950 font-mono text-xs">{formatBRL(thirdPartyBalanceAmount)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= 3. FECHAMENTO OPERACIONAL & MARGEM (SPREAD) ================= */}
            <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-100">Resultado Operacional Estimado</span>
                  <div className="text-[11px] text-slate-300">
                    Receita: <span className="font-mono text-emerald-300">{formatBRL(totalFreight)}</span> · Custo: <span className="font-mono text-amber-300">{formatBRL(thirdPartyTotalFreight)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Margem Bruta (Spread)</span>
                  <div className="font-mono font-black text-sm text-emerald-400">
                    {formatBRL(estimatedSpread)}
                    <span className="text-[11px] font-bold text-emerald-300 ml-1.5">
                      ({estimatedSpreadPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observações da Coleta / Instruções */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700 block">
                  Instruções da Coleta & Segurança
                </label>
                <span className="text-[11px] text-slate-400">Aparecerá na Ordem de Carregamento</span>
              </div>
              <textarea
                rows={2}
                value={collectionNotes}
                onChange={(e) => setCollectionNotes(e.target.value)}
                placeholder="Regras de segurança, exigência de EPI, horários de pesagem..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
              />
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickNotesPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddPreset(preset)}
                    className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2 py-0.5 rounded border border-slate-200 transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ================= ETAPA 2: ESCALA DE VEÍCULO (OPCIONAL OU DESATIVADA NO MODO LOTE) ================= */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                    hasVehicleAssigned
                      ? 'bg-emerald-100 text-emerald-700'
                      : isBatchMode
                      ? 'bg-slate-200 text-slate-500'
                      : 'bg-violet-100 text-violet-700'
                  }`}
                >
                  2
                </span>
                Escala de Veículo & Motorista{' '}
                <span className="text-slate-400 font-normal lowercase">(opcional nesta etapa)</span>
              </h4>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isBatchMode
                    ? 'bg-violet-100 text-violet-800'
                    : hasVehicleAssigned
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-violet-100 text-violet-800'
                }`}
              >
                {isBatchMode
                  ? 'Escalar individualmente após criação do lote'
                  : hasVehicleAssigned
                  ? 'Veículo Escalado'
                  : 'Ficará "Aguardando Veículo"'}
              </span>
            </div>

            {isBatchMode ? (
              <div className="p-3 bg-violet-50/70 border border-violet-200 rounded-xl text-xs text-violet-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-600 shrink-0" />
                <p>
                  No <strong>Lançamento em Lote</strong>, todas as <strong>{batchQuantity} cargas</strong> são criadas com status <strong>&quot;Aguardando Veículo&quot;</strong>. Você poderá escalar cada motorista e caminhão individualmente com um clique no Painel de Cargas.
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p>
                    Você pode salvar a carga agora sem preencher os dados abaixo. Ela ficará destacada com status <strong>&quot;Aguardando Veículo&quot; (A Fretar)</strong>, permitindo que você escale o motorista a qualquer momento com 1 clique.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Motorista Condutor <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <SearchableSelect
                      value={driverId}
                      onChange={(val) => handleDriverChange(val)}
                      placeholder="-- Deixar sem motorista (A Fretar) --"
                      searchPlaceholder="Pesquisar por nome, CPF ou telefone do motorista..."
                      options={drivers.map((d) => ({
                        value: d.id,
                        label: d.name,
                        sublabel: `Cat. ${d.cnhCategory} · CPF: ${d.cpf || 'Não inf.'} · Tel: ${d.phone || ''}`,
                        searchKeywords: `${d.name} ${d.cpf || ''} ${d.cnhCategory} ${d.phone || ''}`,
                      }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Cavalo Mecânico (Placa) <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <SearchableSelect
                      value={cavaloId}
                      onChange={(val) => handleCavaloChange(val)}
                      placeholder="-- Deixar sem placa (A Definir) --"
                      searchPlaceholder="Pesquisar placa, modelo ou tipo de frota..."
                      options={cavalos.map((c) => ({
                        value: c.id,
                        label: `${c.plate} - ${c.brandModel}`,
                        sublabel: `Frota: ${c.fleetType} · Ano: ${c.year || ''}`,
                        searchKeywords: `${c.plate} ${c.brandModel} ${c.fleetType}`,
                      }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      1º Implemento / Carreta <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <SearchableSelect
                      value={carretaId}
                      onChange={(val) => setCarretaId(val)}
                      placeholder="-- Deixar sem carreta / Rígido --"
                      searchPlaceholder="Pesquisar carreta por placa..."
                      options={carretas.map((c) => ({
                        value: c.id,
                        label: `${c.plate} - ${c.bodyType}`,
                        sublabel: `Capacidade: ${c.capacityTons} TON`,
                        searchKeywords: `${c.plate} ${c.bodyType}`,
                      }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      2º Implemento <span className="text-slate-400 font-normal">(Bi-trem / Dolly)</span>
                    </label>
                    <SearchableSelect
                      value={carreta2Id}
                      onChange={(val) => setCarreta2Id(val)}
                      placeholder="-- Sem 2º implemento --"
                      searchPlaceholder="Pesquisar 2ª carreta por placa..."
                      options={carretas.map((c) => ({
                        value: c.id,
                        label: `${c.plate} - ${c.bodyType}`,
                        sublabel: `Capacidade: ${c.capacityTons} TON`,
                        searchKeywords: `${c.plate} ${c.bodyType}`,
                      }))}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          </div>

          {/* Rodapé Fixo com Botões de Ação Sempre Visíveis */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 hover:bg-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              Fechar
            </button>

            <div className="w-full sm:w-auto flex items-center justify-end gap-2">
              {isBatchMode ? (
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  Gerar Lote de {batchQuantity} Cargas (A Fretar)
                </button>
              ) : (
                <button
                  type="submit"
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-lg font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    hasVehicleAssigned
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-violet-600 hover:bg-violet-700 text-white'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  {cargoToEdit
                    ? 'Salvar Alterações da Carga'
                    : hasVehicleAssigned
                    ? 'Salvar Carga & Emitir O.C.'
                    : 'Salvar Carga (Aguardando Veículo)'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
