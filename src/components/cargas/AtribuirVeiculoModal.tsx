import React, { useState, useEffect } from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import { CargoTrip } from '../../types/logistics';
import { formatBRL, formatDateTime, formatWeightKg } from '../../utils/formatters';
import { SearchableSelect } from '../ui/SearchableSelect';
import {
  X,
  Truck,
  UserCheck,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cargo: CargoTrip | null;
  onSuccess?: (updatedCargo: CargoTrip, openDocImmediately?: boolean) => void;
}

export const AtribuirVeiculoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  cargo,
  onSuccess,
}) => {
  const { drivers, cavalos, carretas, assignVehicleToCargo } = useLogistics();

  const [driverId, setDriverId] = useState('');
  const [cavaloId, setCavaloId] = useState('');

  // 1º Implemento
  const [carretaId, setCarretaId] = useState('');
  const [carretaPlate, setCarretaPlate] = useState('');
  const [carretaType, setCarretaType] = useState('Graneleira');
  const [isManualCarreta, setIsManualCarreta] = useState(false);

  // 2º Implemento (Segunda Carreta)
  const [carreta2Id, setCarreta2Id] = useState('');
  const [carreta2Plate, setCarreta2Plate] = useState('');
  const [carreta2Type, setCarreta2Type] = useState('Graneleira');
  const [isManualCarreta2, setIsManualCarreta2] = useState(false);

  // Número do Pedido do Cliente (editável na escala)
  const [pedidoCliente, setPedidoCliente] = useState('');

  const [error, setError] = useState<string | null>(null);

  // Initialize selection when modal opens or cargo changes
  useEffect(() => {
    if (cargo) {
      const initialDriverId = cargo.driverId || (drivers.length > 0 ? drivers[0].id : '');
      setDriverId(initialDriverId);

      // Número do Pedido
      setPedidoCliente(cargo.pedidoCliente || '');

      const drv = drivers.find((d) => d.id === initialDriverId);

      // Cavalo: usar o da carga ou o padrão do motorista se a carga ainda não tiver cavalo
      if (cargo.cavaloId) {
        setCavaloId(cargo.cavaloId);
      } else if (drv?.defaultCavaloPlate) {
        const matched = cavalos.find(
          (c) => c.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === drv.defaultCavaloPlate?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
        );
        setCavaloId(matched ? matched.id : (cavalos.length > 0 ? cavalos[0].id : ''));
      } else {
        setCavaloId(cavalos.length > 0 ? cavalos[0].id : '');
      }

      // 1º Implemento: usar o da carga ou o padrão do motorista se não houver carreta definida
      if (cargo.carretaPlate || cargo.carretaId) {
        setCarretaId(cargo.carretaId || '');
        setCarretaPlate(cargo.carretaPlate || '');
        setCarretaType(cargo.carretaType || 'Graneleira');
        const isKnown1 = carretas.some((c) => c.id === cargo.carretaId || (cargo.carretaPlate && c.plate === cargo.carretaPlate));
        setIsManualCarreta(!isKnown1 && Boolean(cargo.carretaPlate && cargo.carretaPlate !== 'SEM CARRETA' && cargo.carretaPlate !== 'A Definir'));
      } else if (drv?.defaultCarretaPlate) {
        const matchedCarreta = carretas.find(
          (c) => c.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === drv.defaultCarretaPlate?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
        );
        if (matchedCarreta) {
          setCarretaId(matchedCarreta.id);
          setCarretaPlate(matchedCarreta.plate);
          setCarretaType(matchedCarreta.bodyType || 'Graneleira');
          setIsManualCarreta(false);
        } else {
          setIsManualCarreta(true);
          setCarretaPlate(drv.defaultCarretaPlate);
          setCarretaType('Graneleira');
          setCarretaId('');
        }
      } else {
        setCarretaId('');
        setCarretaPlate('');
        setCarretaType('Graneleira');
        setIsManualCarreta(false);
      }

      // 2º Implemento
      setCarreta2Id(cargo.carreta2Id || '');
      setCarreta2Plate(cargo.carreta2Plate || '');
      setCarreta2Type(cargo.carreta2Type || 'Graneleira');
      const isKnown2 = carretas.some((c) => c.id === cargo.carreta2Id || (cargo.carreta2Plate && c.plate === cargo.carreta2Plate));
      setIsManualCarreta2(!isKnown2 && Boolean(cargo.carreta2Plate));

      setError(null);
    }
  }, [cargo, drivers, cavalos, carretas]);

  // Quando o motorista é alterado, preenche automaticamente os veículos padrões dele
  const handleDriverChange = (newDriverId: string) => {
    setDriverId(newDriverId);
    setError(null);
    if (!newDriverId) return;

    const drv = drivers.find((d) => d.id === newDriverId);
    if (!drv) return;

    // Preenchimento automático do Cavalo Padrão (permitindo alteração manual posterior)
    if (drv.defaultCavaloPlate) {
      const matchedCavalo = cavalos.find(
        (c) => c.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === drv.defaultCavaloPlate?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
      );
      if (matchedCavalo) {
        setCavaloId(matchedCavalo.id);
      }
    }

    // Preenchimento automático da Carreta Padrão (permitindo alteração manual posterior)
    if (drv.defaultCarretaPlate) {
      const matchedCarreta = carretas.find(
        (c) => c.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === drv.defaultCarretaPlate?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
      );
      if (matchedCarreta) {
        setCarretaId(matchedCarreta.id);
        setCarretaPlate(matchedCarreta.plate);
        setCarretaType(matchedCarreta.bodyType || 'Graneleira');
        setIsManualCarreta(false);
      } else {
        setIsManualCarreta(true);
        setCarretaPlate(drv.defaultCarretaPlate);
        setCarretaType('Graneleira');
        setCarretaId('');
      }
    }
  };

  // When cavalo changes, if it has a default driver and driver is empty
  const handleCavaloChange = (newCavaloId: string) => {
    setCavaloId(newCavaloId);
    const cavalo = cavalos.find((c) => c.id === newCavaloId);
    if (cavalo?.driverIdDefault && (!driverId || driverId === '')) {
      handleDriverChange(cavalo.driverIdDefault);
    }
  };

  if (!isOpen || !cargo) return null;

  const handleSubmit = (openDocImmediately = false) => {
    if (!driverId) {
      setError('Por favor, selecione um motorista responsável pela viagem.');
      return;
    }
    if (!cavaloId) {
      setError('Por favor, selecione o caminhão trator / cavalo mecânico.');
      return;
    }

    const selCarreta1 = carretas.find((c) => c.id === carretaId);
    const selCarreta2 = carretas.find((c) => c.id === carreta2Id);

    const finalCarreta1Plate = isManualCarreta
      ? carretaPlate.trim().toUpperCase()
      : selCarreta1?.plate || carretaPlate || (carretaId && !carretaId.startsWith('car-') ? carretaId.toUpperCase() : undefined);

    const finalCarreta1Type = isManualCarreta
      ? carretaType
      : selCarreta1?.bodyType || carretaType || 'Graneleira';

    const finalCarreta2Plate = isManualCarreta2
      ? carreta2Plate.trim().toUpperCase()
      : selCarreta2?.plate || carreta2Plate || (carreta2Id && !carreta2Id.startsWith('car-') ? carreta2Id.toUpperCase() : undefined);

    const finalCarreta2Type = isManualCarreta2
      ? carreta2Type
      : selCarreta2?.bodyType || carreta2Type || (finalCarreta2Plate ? 'Graneleira' : undefined);

    const updated = assignVehicleToCargo(cargo.id, {
      driverId,
      cavaloId,
      carretaId: !isManualCarreta ? carretaId : undefined,
      carretaPlate: finalCarreta1Plate,
      carretaType: finalCarreta1Type,
      carreta2Id: !isManualCarreta2 ? carreta2Id : undefined,
      carreta2Plate: finalCarreta2Plate,
      carreta2Type: finalCarreta2Type,
      pedidoCliente: pedidoCliente.trim(),
    });

    if (updated) {
      if (onSuccess) {
        onSuccess(updated, openDocImmediately);
      }
      onClose();
    }
  };

  const selectedDriver = drivers.find((d) => d.id === driverId);
  const selectedCavalo = cavalos.find((c) => c.id === cavaloId);
  const selectedCarreta = carretas.find((c) => c.id === carretaId);
  const selectedCarreta2 = carretas.find((c) => c.id === carreta2Id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Escalar Veículo & Atribuir Motorista
              </h3>
              <p className="text-xs text-slate-500">
                Ordem de Carregamento nº <strong className="text-indigo-700 font-mono">{cargo.ocNumber}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cargo Summary Card */}
        <div className="shrink-0 p-4 bg-indigo-50/50 border-b border-indigo-100/70 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Cliente:</span>
            <span className="font-bold text-slate-900">{cargo.clientName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Pedido do Cliente:</span>
            {pedidoCliente || cargo.pedidoCliente ? (
              <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                {pedidoCliente || cargo.pedidoCliente}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded animate-pulse">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Pendente / Preencher abaixo
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Rota Operacional:</span>
            <span className="text-slate-800 font-medium">
              {cargo.originCityState} → {cargo.destinationCityState}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Produto & Peso:</span>
            <span className="text-slate-800">
              {cargo.productName} · <strong>{formatWeightKg(cargo.weightTons)}</strong>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Carregamento Previsto:</span>
            <span className="text-slate-800 font-mono">
              {formatDateTime(cargo.scheduledLoadingDate)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-indigo-100">
            <span className="font-semibold text-slate-700">Frete Empresa (Receita):</span>
            <span className="font-bold text-blue-700 text-sm">{formatBRL(cargo.totalFreight)}</span>
          </div>
          {cargo.thirdPartyTotalFreight !== undefined && cargo.thirdPartyTotalFreight > 0 && (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Frete Terceiro (Custo Motorista):</span>
              <span className="font-bold text-amber-700 text-sm">{formatBRL(cargo.thirdPartyTotalFreight)}</span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* CAMPO EDITÁVEL: NÚMERO DO PEDIDO DO CLIENTE */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              !cargo.pedidoCliente && !pedidoCliente
                ? 'bg-amber-50/80 border-amber-300 shadow-2xs ring-2 ring-amber-400/20'
                : 'bg-indigo-50/40 border-indigo-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Número do Pedido do Cliente</span>
                {!cargo.pedidoCliente && !pedidoCliente ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-amber-200 text-amber-900 border border-amber-300">
                    Pendente na Carga
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Identificado
                  </span>
                )}
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {cargo.pedidoCliente ? 'Alterar / Atualizar' : 'Preencha agora'}
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={pedidoCliente}
                onChange={(e) => setPedidoCliente(e.target.value.toUpperCase())}
                placeholder="Ex: PED-2026-0042, 104829, PO-8871..."
                className={`w-full text-xs font-mono font-bold p-2.5 rounded-lg border focus:ring-2 focus:outline-none transition-all ${
                  !cargo.pedidoCliente && !pedidoCliente
                    ? 'bg-white border-amber-400 focus:ring-amber-500 text-slate-900 placeholder:text-amber-800/40'
                    : 'bg-white border-slate-300 focus:ring-indigo-500 text-slate-900'
                }`}
              />
            </div>

            <div className="mt-1.5 text-[11px] flex items-center justify-between">
              <span className={!cargo.pedidoCliente && !pedidoCliente ? 'text-amber-800 font-medium' : 'text-slate-500'}>
                {!cargo.pedidoCliente && !pedidoCliente
                  ? '⚠️ Esta carga foi cadastrada sem pedido. Digite o número acima para salvar na planilha e exibir na O.C.'
                  : 'O número do pedido será sincronizado na planilha e exibido na listagem e na O.C.'}
              </span>
              {pedidoCliente && (
                <button
                  type="button"
                  onClick={() => setPedidoCliente('')}
                  className="text-slate-400 hover:text-red-600 text-[10px] font-semibold cursor-pointer underline ml-2 shrink-0"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {drivers.length === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Nenhum motorista cadastrado:</strong> Cadastre motoristas na aba de Cadastros para poder selecioná-los nesta escala.
              </div>
            </div>
          )}

          {/* Seleção do Motorista */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Motorista Responsável <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              required
              value={driverId}
              onChange={(val) => {
                handleDriverChange(val);
              }}
              placeholder="-- Selecione o motorista responsável --"
              searchPlaceholder="Pesquisar por nome, CPF, empresa, ANTT ou telefone..."
              options={drivers.map((drv) => ({
                value: drv.id,
                label: drv.name,
                sublabel: `${drv.driverType === 'Frota' ? '[FROTA] ' : '[TERCEIRO] '}${drv.razaoSocial ? `${drv.razaoSocial} · ` : ''}CPF: ${drv.cpf || 'Não inf.'}${drv.defaultCavaloPlate ? ` · Cav: ${drv.defaultCavaloPlate}` : ''} · Tel: ${drv.phone || 'Sem tel.'}`,
                searchKeywords: `${drv.name} ${drv.driverType || ''} ${drv.cpf || ''} ${drv.razaoSocial || ''} ${drv.cnpjCpfEmpresa || ''} ${drv.antt || ''} ${drv.phone || ''} ${drv.defaultCavaloPlate || ''} ${drv.defaultCarretaPlate || ''}`,
              }))}
            />
            {selectedDriver && (
              <div className="mt-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span>Tipo:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                      selectedDriver.driverType === 'Frota'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {selectedDriver.driverType || 'Terceiro'}
                    </span>
                    {(selectedDriver.defaultCavaloPlate || selectedDriver.defaultCarretaPlate) && (
                      <span className="text-[10px] text-indigo-700 font-medium bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        ⚡ Vínculo padrão: {selectedDriver.defaultCavaloPlate || '-'} / {selectedDriver.defaultCarretaPlate || '-'}
                      </span>
                    )}
                  </div>
                  <span>CPF: <strong className="font-mono text-slate-800">{selectedDriver.cpf || '-'}</strong></span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
                  <span>CNH: <strong>{selectedDriver.cnhNumber || '-'} ({selectedDriver.cnhCategory || 'E'})</strong></span>
                  <span>Telefone: <strong>{selectedDriver.phone || '-'}</strong></span>
                </div>
                {(selectedDriver.razaoSocial || selectedDriver.cnpjCpfEmpresa || selectedDriver.antt) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80 text-slate-700">
                    {selectedDriver.razaoSocial && <span>Empresa: <strong>{selectedDriver.razaoSocial}</strong></span>}
                    {selectedDriver.cnpjCpfEmpresa && <span>CNPJ/CPF Emp.: <strong className="font-mono">{selectedDriver.cnpjCpfEmpresa}</strong></span>}
                    {selectedDriver.antt && <span>ANTT: <strong className="font-mono text-sky-800 font-bold">{selectedDriver.antt}</strong></span>}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80 text-slate-700">
                  <span>Banco: <strong>{selectedDriver.bankCode ? `[${selectedDriver.bankCode}] ` : ''}{selectedDriver.bankName || '-'}</strong></span>
                  {selectedDriver.bankAgency && <span>Agência: <strong className="font-mono">{selectedDriver.bankAgency}</strong></span>}
                  {selectedDriver.bankAccount && <span>Conta: <strong className="font-mono">{selectedDriver.bankAccount}</strong></span>}
                  <span>PIX: <strong className="font-mono text-slate-900">{selectedDriver.pixKey || '-'}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Seleção do Cavalo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Cavalo Mecânico / Caminhão Trator <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              required
              value={cavaloId}
              onChange={(val) => {
                handleCavaloChange(val);
                setError(null);
              }}
              placeholder="-- Selecione o cavalo mecânico --"
              searchPlaceholder="Pesquisar por placa, modelo ou frota..."
              options={cavalos.map((cav) => ({
                value: cav.id,
                label: `${cav.plate} - ${cav.brandModel}`,
                sublabel: `Frota: ${cav.fleetType} · Ano: ${cav.year || ''}`,
                searchKeywords: `${cav.plate} ${cav.brandModel} ${cav.fleetType}`,
              }))}
            />
            {selectedCavalo && (
              <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                <span>Placa: <strong className="font-mono text-slate-800">{selectedCavalo.plate}</strong></span>
                <span>Modelo: <strong>{selectedCavalo.brandModel}</strong></span>
                <span>Frota: <strong>{selectedCavalo.fleetType}</strong></span>
              </div>
            )}
          </div>

          {/* Seção de Implementos / Carretas */}
          <div className="pt-2 border-t border-slate-200 space-y-4">
            {/* 1º Implemento / Carreta */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. 1º Implemento / Carreta (Opcional)
                </label>
                <button
                  type="button"
                  onClick={() => setIsManualCarreta(!isManualCarreta)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                >
                  {isManualCarreta ? '← Selecionar da Lista de Cadastros' : 'Digitar Placa & Tipo Manualmente'}
                </button>
              </div>

              {!isManualCarreta ? (
                <>
                  <SearchableSelect
                    value={carretaId}
                    onChange={(val) => {
                      setCarretaId(val);
                      const matched = carretas.find((c) => c.id === val);
                      if (matched) {
                        setCarretaPlate(matched.plate);
                        setCarretaType(matched.bodyType);
                      }
                    }}
                    allowCustomValue
                    customValueLabel={(text) => `Usar placa avulsa: "${text.toUpperCase()}"`}
                    placeholder="Sem 1º implemento / Rígido (Truck, Toco)"
                    searchPlaceholder="Pesquisar por placa ou tipo de implemento..."
                    options={carretas.map((car) => ({
                      value: car.id,
                      label: `${car.plate} - ${car.bodyType}`,
                      sublabel: `Capacidade: ${car.capacityTons} TON`,
                      searchKeywords: `${car.plate} ${car.bodyType}`,
                    }))}
                  />
                  {selectedCarreta && (
                    <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                      <span>Placa: <strong className="font-mono text-slate-800">{selectedCarreta.plate}</strong></span>
                      <span>Tipo: <strong>{selectedCarreta.bodyType}</strong></span>
                      <span>Capacidade: <strong>{selectedCarreta.capacityTons} TON</strong></span>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        Placa do 1º Implemento
                      </label>
                      <input
                        type="text"
                        value={carretaPlate}
                        onChange={(e) => setCarretaPlate(e.target.value.toUpperCase())}
                        placeholder="Ex: ABC-1234 ou ABC1D23"
                        className="w-full text-xs font-mono font-bold uppercase p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        Tipo de Implemento
                      </label>
                      <select
                        value={carretaType}
                        onChange={(e) => setCarretaType(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Graneleira">Graneleira</option>
                        <option value="Caçamba / Basculante">Caçamba / Basculante</option>
                        <option value="Sider / Enlonada">Sider / Enlonada</option>
                        <option value="Baú Carga Geral">Baú Carga Geral</option>
                        <option value="Baú Refrigerado">Baú Refrigerado</option>
                        <option value="Tanque">Tanque</option>
                        <option value="Porta-Contêiner">Porta-Contêiner</option>
                        <option value="Prancha">Prancha</option>
                        <option value="Dolly">Dolly</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Modo de digitação manual de placa avulsa ativado.</span>
                    {carretaPlate && (
                      <button
                        type="button"
                        onClick={() => {
                          setCarretaPlate('');
                          setCarretaId('');
                        }}
                        className="text-red-500 hover:text-red-700 underline cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2º Implemento / Segunda Carreta */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  4. 2º Implemento / Segunda Carreta <span className="text-slate-400 font-normal lowercase">(opcional - bi-trem, rodo-trem, dolly)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsManualCarreta2(!isManualCarreta2)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                >
                  {isManualCarreta2 ? '← Selecionar da Lista de Cadastros' : 'Digitar Placa & Tipo Manualmente'}
                </button>
              </div>

              {!isManualCarreta2 ? (
                <>
                  <SearchableSelect
                    value={carreta2Id}
                    onChange={(val) => {
                      setCarreta2Id(val);
                      const matched = carretas.find((c) => c.id === val);
                      if (matched) {
                        setCarreta2Plate(matched.plate);
                        setCarreta2Type(matched.bodyType);
                      }
                    }}
                    allowCustomValue
                    customValueLabel={(text) => `Usar placa avulsa: "${text.toUpperCase()}"`}
                    placeholder="Sem 2º implemento (Não se aplica / Apenas 1 carreta)"
                    searchPlaceholder="Pesquisar placa ou tipo da 2ª carreta..."
                    options={carretas.map((car) => ({
                      value: car.id,
                      label: `${car.plate} - ${car.bodyType}`,
                      sublabel: `Capacidade: ${car.capacityTons} TON`,
                      searchKeywords: `${car.plate} ${car.bodyType}`,
                    }))}
                  />
                  {selectedCarreta2 && (
                    <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                      <span>Placa: <strong className="font-mono text-slate-800">{selectedCarreta2.plate}</strong></span>
                      <span>Tipo: <strong>{selectedCarreta2.bodyType}</strong></span>
                      <span>Capacidade: <strong>{selectedCarreta2.capacityTons} TON</strong></span>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        Placa da 2ª Carreta
                      </label>
                      <input
                        type="text"
                        value={carreta2Plate}
                        onChange={(e) => setCarreta2Plate(e.target.value.toUpperCase())}
                        placeholder="Ex: XYZ-9876 ou XYZ9B88"
                        className="w-full text-xs font-mono font-bold uppercase p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        Tipo da 2ª Carreta
                      </label>
                      <select
                        value={carreta2Type}
                        onChange={(e) => setCarreta2Type(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Graneleira">Graneleira</option>
                        <option value="Caçamba / Basculante">Caçamba / Basculante</option>
                        <option value="Sider / Enlonada">Sider / Enlonada</option>
                        <option value="Baú Carga Geral">Baú Carga Geral</option>
                        <option value="Baú Refrigerado">Baú Refrigerado</option>
                        <option value="Tanque">Tanque</option>
                        <option value="Porta-Contêiner">Porta-Contêiner</option>
                        <option value="Prancha">Prancha</option>
                        <option value="Dolly">Dolly</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Modo de digitação manual de 2ª placa avulsa ativado.</span>
                    {carreta2Plate && (
                      <button
                        type="button"
                        onClick={() => {
                          setCarreta2Plate('');
                          setCarreta2Id('');
                        }}
                        className="text-red-500 hover:text-red-700 underline cursor-pointer"
                      >
                        Limpar 2ª Carreta
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Ao confirmar a escala, o status da carga avança para <strong>"Aguardando Carregar"</strong> e a emissão da Ordem de Carregamento (O.C.) é liberada.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-4 h-4" />
              Salvar Escala
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <FileText className="w-4 h-4" />
              Salvar e Emitir O.C.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
