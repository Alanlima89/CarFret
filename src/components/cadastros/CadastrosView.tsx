import React, { useState } from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import {
  Driver,
  VehicleCavalo,
  VehicleCarreta,
  Client,
  Partner,
  Product,
} from '../../types/logistics';
import { formatDate, formatCpfCnpj } from '../../utils/formatters';
import {
  Users,
  Truck,
  Building,
  Box,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CreditCard,
  Phone,
  Layers,
  MapPin,
  AlertTriangle,
  Table,
  CheckCircle2,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { SearchableSelect } from '../ui/SearchableSelect';

type SubTab = 'motoristas' | 'cavalos' | 'carretas' | 'clientes' | 'fornecedores' | 'produtos';

const BRAZILIAN_BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú Unibanco' },
  { code: '104', name: 'Caixa Econômica Federal' },
  { code: '033', name: 'Santander' },
  { code: '260', name: 'Nubank (Nu Pagamentos)' },
  { code: '077', name: 'Banco Inter' },
  { code: '748', name: 'Sicredi' },
  { code: '756', name: 'Sicoob' },
  { code: '422', name: 'Banco Safra' },
  { code: '336', name: 'C6 Bank' },
  { code: '212', name: 'Banco Original' },
  { code: '041', name: 'Banrisul' },
  { code: '070', name: 'BRB - Banco de Brasília' },
  { code: '004', name: 'Banco do Nordeste' },
  { code: '021', name: 'Banestes' },
];

export const CadastrosView: React.FC = () => {
  const {
    drivers,
    addDriver,
    updateDriver,
    deleteDriver,
    cavalos,
    addCavalo,
    updateCavalo,
    deleteCavalo,
    carretas,
    addCarreta,
    updateCarreta,
    deleteCarreta,
    clients,
    addClient,
    updateClient,
    deleteClient,
    partners,
    addPartner,
    updatePartner,
    deletePartner,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    syncDriversNow,
    isSyncing,
    isSheetsConnected,
  } = useLogistics();

  const [activeTab, setActiveTab] = useState<SubTab>('motoristas');
  const [search, setSearch] = useState('');
  const [driverSyncMsg, setDriverSyncMsg] = useState('');

  // Modal states
  const [modalType, setModalType] = useState<SubTab | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // DRIVER FORM
  const [driverName, setDriverName] = useState('');
  const [driverCpf, setDriverCpf] = useState('');
  const [driverCnh, setDriverCnh] = useState('');
  const [driverCnhCat, setDriverCnhCat] = useState('E');
  const [driverCnhExp, setDriverCnhExp] = useState('2028-12-31');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverBank, setDriverBank] = useState('Banco do Brasil');
  const [driverPix, setDriverPix] = useState('');
  const [driverPixType, setDriverPixType] = useState<'CPF' | 'Telefone' | 'Email' | 'Aleatória'>('CPF');
  const [driverNotes, setDriverNotes] = useState('');

  // NOVOS CAMPOS DO MOTORISTA (COLUNAS M A S NA PLANILHA)
  const [driverCnpjEmpresa, setDriverCnpjEmpresa] = useState('');
  const [driverRazaoSocial, setDriverRazaoSocial] = useState('');
  const [driverAntt, setDriverAntt] = useState('');
  const [driverBankCode, setDriverBankCode] = useState('001');
  const [driverBankAgency, setDriverBankAgency] = useState('');
  const [driverBankAccount, setDriverBankAccount] = useState('');

  // TIPO E VÍNCULO PADRÃO DE CAVALO E CARRETA (COLUNAS T, U E V)
  const [driverType, setDriverType] = useState<'Frota' | 'Terceiro'>('Terceiro');
  const [driverDefaultCavalo, setDriverDefaultCavalo] = useState('');
  const [driverDefaultCarreta, setDriverDefaultCarreta] = useState('');

  // ESTADO DE CARREGAMENTO E ERRO DO MODAL
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // CAVALO FORM
  const [cavaloPlate, setCavaloPlate] = useState('');
  const [cavaloRenavam, setCavaloRenavam] = useState('');
  const [cavaloModel, setCavaloModel] = useState('');
  const [cavaloFleetType, setCavaloFleetType] = useState<'Frota Própria' | 'Terceiro' | 'Agregado'>('Frota Própria');
  const [cavaloYear, setCavaloYear] = useState<number>(2023);
  const [cavaloColor, setCavaloColor] = useState('Branco');
  const [cavaloDriverDefault, setCavaloDriverDefault] = useState('');

  // CARRETA FORM
  const [carretaPlate, setCarretaPlate] = useState('');
  const [carretaType, setCarretaType] = useState<any>('Graneleira');
  const [carretaCapacity, setCarretaCapacity] = useState<number>(37.5);
  const [carretaAxles, setCarretaAxles] = useState<number>(3);
  const [carretaModel, setCarretaModel] = useState('');

  // CLIENT FORM
  const [clientCompany, setClientCompany] = useState('');
  const [clientTrade, setClientTrade] = useState('');
  const [clientCnpj, setClientCnpj] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientState, setClientState] = useState('MT');
  const [clientStreet, setClientStreet] = useState('');

  // PARTNER FORM
  const [partnerCompany, setPartnerCompany] = useState('');
  const [partnerCnpj, setPartnerCnpj] = useState('');
  const [partnerContact, setPartnerContact] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerRole, setPartnerRole] = useState<any>('Origem/Carregamento');
  const [partnerCity, setPartnerCity] = useState('');
  const [partnerState, setPartnerState] = useState('MT');
  const [partnerNotes, setPartnerNotes] = useState('');

  // PRODUCT FORM
  const [prodName, setProdName] = useState('');
  const [prodUnit, setProdUnit] = useState<any>('ton');
  const [prodDesc, setProdDesc] = useState('');

  const openAddModal = (type: SubTab) => {
    setEditingItem(null);
    setModalType(type);

    if (type === 'motoristas') {
      setDriverName('');
      setDriverCpf('');
      setDriverCnh('');
      setDriverCnhCat('E');
      setDriverCnhExp('2028-12-31');
      setDriverPhone('');
      setDriverBank('Banco do Brasil');
      setDriverPix('');
      setDriverPixType('CPF');
      setDriverNotes('');
      setDriverCnpjEmpresa('');
      setDriverRazaoSocial('');
      setDriverAntt('');
      setDriverBankCode('001');
      setDriverBankAgency('');
      setDriverBankAccount('');
      setDriverType('Terceiro');
      setDriverDefaultCavalo('');
      setDriverDefaultCarreta('');
    } else if (type === 'cavalos') {
      setCavaloPlate('');
      setCavaloRenavam('');
      setCavaloModel('');
      setCavaloFleetType('Frota Própria');
      setCavaloYear(2024);
      setCavaloColor('Branco');
      setCavaloDriverDefault(drivers[0]?.id || '');
    } else if (type === 'carretas') {
      setCarretaPlate('');
      setCarretaType('Graneleira');
      setCarretaCapacity(37.5);
      setCarretaAxles(3);
      setCarretaModel('');
    } else if (type === 'clientes') {
      setClientCompany('');
      setClientTrade('');
      setClientCnpj('');
      setClientContact('');
      setClientPhone('');
      setClientEmail('');
      setClientCity('');
      setClientState('MT');
      setClientStreet('');
    } else if (type === 'fornecedores') {
      setPartnerCompany('');
      setPartnerCnpj('');
      setPartnerContact('');
      setPartnerPhone('');
      setPartnerRole('Origem/Carregamento');
      setPartnerCity('');
      setPartnerState('MT');
      setPartnerNotes('');
    } else if (type === 'produtos') {
      setProdName('');
      setProdUnit('ton');
      setProdDesc('');
    }
  };

  const openEditModal = (type: SubTab, item: any) => {
    setEditingItem(item);
    setModalType(type);
    setModalError(null);

    if (type === 'motoristas') {
      setDriverName(String(item.name || ''));
      setDriverCpf(String(item.cpf || ''));
      setDriverCnh(String(item.cnhNumber || ''));
      setDriverCnhCat(String(item.cnhCategory || 'E'));
      setDriverCnhExp(String(item.cnhExpiration || ''));
      setDriverPhone(String(item.phone || ''));
      setDriverBank(String(item.bankName || 'Banco do Brasil'));
      setDriverPix(String(item.pixKey || ''));
      setDriverPixType((item.pixKeyType as any) || 'CPF');
      setDriverNotes(String(item.notes || ''));
      setDriverCnpjEmpresa(String(item.cnpjCpfEmpresa || ''));
      setDriverRazaoSocial(String(item.razaoSocial || ''));
      setDriverAntt(String(item.antt || ''));
      setDriverBankCode(String(item.bankCode || '001'));
      setDriverBankAgency(String(item.bankAgency || ''));
      setDriverBankAccount(String(item.bankAccount || ''));
      setDriverType(item.driverType === 'Frota' ? 'Frota' : 'Terceiro');
      setDriverDefaultCavalo(String(item.defaultCavaloPlate || ''));
      setDriverDefaultCarreta(String(item.defaultCarretaPlate || ''));
    } else if (type === 'cavalos') {
      setCavaloPlate(String(item.plate || ''));
      setCavaloRenavam(String(item.renavam || ''));
      setCavaloModel(String(item.brandModel || ''));
      setCavaloFleetType(item.fleetType || 'Frota Própria');
      setCavaloYear(item.year || 2024);
      setCavaloColor(String(item.color || ''));
      setCavaloDriverDefault(item.driverIdDefault || '');
    } else if (type === 'carretas') {
      setCarretaPlate(String(item.plate || ''));
      setCarretaType(item.bodyType || 'Graneleira');
      setCarretaCapacity(item.capacityTons || 32);
      setCarretaAxles(item.axles || 3);
      setCarretaModel(String(item.brandModel || ''));
    } else if (type === 'clientes') {
      setClientCompany(String(item.companyName || ''));
      setClientTrade(String(item.tradeName || ''));
      setClientCnpj(String(item.cnpj || ''));
      setClientContact(String(item.contactPerson || ''));
      setClientPhone(String(item.phone || ''));
      setClientEmail(String(item.email || ''));
      setClientCity(String(item.addressCity || ''));
      setClientState(String(item.addressState || ''));
      setClientStreet(String(item.addressStreet || ''));
    } else if (type === 'fornecedores') {
      setPartnerCompany(String(item.companyName || ''));
      setPartnerCnpj(String(item.cnpjCpf || ''));
      setPartnerContact(String(item.contactPerson || ''));
      setPartnerPhone(String(item.phone || ''));
      setPartnerRole(item.role || 'Origem/Carregamento');
      setPartnerCity(String(item.addressCity || ''));
      setPartnerState(String(item.addressState || ''));
      setPartnerNotes(String(item.notes || ''));
    } else if (type === 'produtos') {
      setProdName(String(item.name || ''));
      setProdUnit(item.unit || 'tonelada');
      setProdDesc(String(item.description || ''));
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType) return;
    setModalError(null);
    setIsSavingModal(true);

    try {
      if (modalType === 'motoristas') {
        const cleanName = String(driverName || '').trim();
        const cleanCpf = String(driverCpf || '').trim();
        const cleanCnh = String(driverCnh || '').trim();
        const cleanPhone = String(driverPhone || '').trim();
        const cleanBank = String(driverBank || '').trim();
        const cleanPix = String(driverPix || '').trim();
        const cleanNotes = String(driverNotes || '').trim();
        const cleanCnpjEmpresa = String(driverCnpjEmpresa || '').trim();
        const cleanRazaoSocial = String(driverRazaoSocial || '').trim();
        const cleanAntt = String(driverAntt || '').trim();
        const cleanBankCode = String(driverBankCode || '').trim();
        const cleanBankAgency = String(driverBankAgency || '').trim();
        const cleanBankAccount = String(driverBankAccount || '').trim();

        if (!cleanName) {
          setModalError('Por favor, informe o nome completo do motorista.');
          setIsSavingModal(false);
          return;
        }
        if (!cleanCpf) {
          setModalError('Por favor, informe o CPF do motorista.');
          setIsSavingModal(false);
          return;
        }

        const payload = {
          name: cleanName,
          cpf: cleanCpf,
          cnhNumber: cleanCnh,
          cnhCategory: driverCnhCat,
          cnhExpiration: String(driverCnhExp || ''),
          phone: cleanPhone,
          bankName: cleanBank,
          pixKey: cleanPix,
          pixKeyType: driverPixType,
          status: 'active' as const,
          notes: cleanNotes,
          cnpjCpfEmpresa: cleanCnpjEmpresa,
          razaoSocial: cleanRazaoSocial,
          antt: cleanAntt,
          bankCode: cleanBankCode,
          bankAgency: cleanBankAgency,
          bankAccount: cleanBankAccount,
          driverType: driverType || 'Terceiro',
          defaultCavaloPlate: String(driverDefaultCavalo || '').trim(),
          defaultCarretaPlate: String(driverDefaultCarreta || '').trim(),
        };

        if (editingItem) {
          await updateDriver({ ...editingItem, ...payload });
          setDriverSyncMsg(`Motorista "${payload.name}" atualizado e gravado na planilha!`);
        } else {
          await addDriver(payload);
          setDriverSyncMsg(`Motorista "${payload.name}" salvo com sucesso e gravado na planilha!`);
        }
        setTimeout(() => setDriverSyncMsg(''), 6000);
      } else if (modalType === 'cavalos') {
        const payload = {
          plate: String(cavaloPlate || '').toUpperCase().trim(),
          renavam: String(cavaloRenavam || '').trim(),
          brandModel: String(cavaloModel || '').trim(),
          fleetType: cavaloFleetType,
          year: Number(cavaloYear) || new Date().getFullYear(),
          color: String(cavaloColor || '').trim(),
          driverIdDefault: cavaloDriverDefault ? String(cavaloDriverDefault) : '',
        };
        if (editingItem) updateCavalo({ ...editingItem, ...payload });
        else addCavalo(payload);
      } else if (modalType === 'carretas') {
        const payload = {
          plate: String(carretaPlate || '').toUpperCase().trim(),
          bodyType: carretaType,
          capacityTons: Number(carretaCapacity) || 0,
          axles: Number(carretaAxles) || 3,
          brandModel: String(carretaModel || '').trim(),
          status: 'disponivel' as const,
        };
        if (editingItem) updateCarreta({ ...editingItem, ...payload });
        else addCarreta(payload);
      } else if (modalType === 'clientes') {
        const payload = {
          companyName: String(clientCompany || '').trim(),
          tradeName: String(clientTrade || clientCompany || '').trim(),
          cnpj: String(clientCnpj || '').trim(),
          contactPerson: String(clientContact || '').trim(),
          phone: String(clientPhone || '').trim(),
          email: String(clientEmail || '').trim(),
          addressCity: String(clientCity || '').trim(),
          addressState: String(clientState || '').trim(),
          addressStreet: String(clientStreet || '').trim(),
        };
        if (editingItem) updateClient({ ...editingItem, ...payload });
        else addClient(payload);
      } else if (modalType === 'fornecedores') {
        const payload = {
          companyName: String(partnerCompany || '').trim(),
          cnpjCpf: String(partnerCnpj || '').trim(),
          contactPerson: String(partnerContact || '').trim(),
          phone: String(partnerPhone || '').trim(),
          role: partnerRole,
          addressCity: String(partnerCity || '').trim(),
          addressState: String(partnerState || '').trim(),
          notes: String(partnerNotes || '').trim(),
        };
        if (editingItem) updatePartner({ ...editingItem, ...payload });
        else addPartner(payload);
      } else if (modalType === 'produtos') {
        const payload = {
          name: String(prodName || '').trim(),
          unit: prodUnit,
          description: String(prodDesc || '').trim(),
        };
        if (editingItem) updateProduct({ ...editingItem, ...payload });
        else addProduct(payload);
      }

      setModalType(null);
    } catch (err: any) {
      console.error('[CargaFret] Erro ao salvar cadastro:', err);
      setModalError(err.message || 'Erro ao gravar os dados. Verifique a conexão com a planilha.');
    } finally {
      setIsSavingModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            Cadastros Operacionais da Frota & Parceiros
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerenciamento completo de motoristas, veículos (cavalos e implementos), clientes, fornecedores e produtos.
          </p>
        </div>
        <button
          onClick={() => openAddModal(activeTab)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Novo Cadastro ({activeTab.toUpperCase()})
        </button>
      </div>

      {/* Segmented SubTabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
        {[
          { id: 'motoristas', label: `Motoristas (${drivers.length})`, icon: Users },
          { id: 'cavalos', label: `Cavalos Mecânicos (${cavalos.length})`, icon: Truck },
          { id: 'carretas', label: `Carretas / Implementos (${carretas.length})`, icon: Layers },
          { id: 'clientes', label: `Clientes (${clients.length})`, icon: Building },
          { id: 'fornecedores', label: `Fornecedores / Pátios (${partners.length})`, icon: MapPin },
          { id: 'produtos', label: `Produtos (${products.length})`, icon: Box },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as SubTab);
                setSearch('');
              }}
              className={`px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-slate-500" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Buscar em ${activeTab}...`}
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* SUBTAB 1: MOTORISTAS */}
      {activeTab === 'motoristas' && (
        <div className="space-y-3">
          {/* Status e Confirmação de Sincronização dos Motoristas */}
          {driverSyncMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-800 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{driverSyncMsg}</span>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Nome do Motorista & CPF</th>
                  <th className="py-3 px-4">Empresa / Razão Social & ANTT</th>
                  <th className="py-3 px-4">CNH / Validade</th>
                  <th className="py-3 px-4">Telefone</th>
                  <th className="py-3 px-4">Dados Bancários & PIX</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {drivers.filter((d) => 
                  String(d.name || '').toLowerCase().includes(search.toLowerCase()) || 
                  String(d.cpf || '').includes(search) || 
                  (d.razaoSocial && String(d.razaoSocial).toLowerCase().includes(search.toLowerCase())) ||
                  (d.cnpjCpfEmpresa && String(d.cnpjCpfEmpresa).includes(search))
                ).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      Nenhum motorista cadastrado ainda. Clique em "+ Novo Cadastro" para adicionar.
                    </td>
                  </tr>
                ) : (
                  drivers
                    .filter((d) => 
                      String(d.name || '').toLowerCase().includes(search.toLowerCase()) || 
                      String(d.cpf || '').includes(search) || 
                      (d.razaoSocial && String(d.razaoSocial).toLowerCase().includes(search.toLowerCase())) ||
                      (d.cnpjCpfEmpresa && String(d.cnpjCpfEmpresa).includes(search))
                    )
                    .map((driver) => (
                      <tr key={driver.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900">{driver.name}</span>
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.2 rounded uppercase border ${
                                driver.driverType === 'Frota'
                                  ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                                  : 'bg-amber-100 text-amber-950 border-amber-300'
                              }`}
                            >
                              {driver.driverType || 'Terceiro'}
                            </span>
                          </div>
                          <div className="font-mono text-xs text-slate-500 mt-0.5">{driver.cpf ? formatCpfCnpj(driver.cpf) : 'CPF não informado'}</div>
                          {(driver.defaultCavaloPlate || driver.defaultCarretaPlate) && (
                            <div className="mt-1 inline-flex items-center gap-1 font-mono text-[10.5px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded">
                              <span>🚛 Padrão:</span>
                              <strong>{driver.defaultCavaloPlate || 'S/ Cavalo'}</strong>
                              {driver.defaultCarretaPlate && <span>+ {driver.defaultCarretaPlate}</span>}
                            </div>
                          )}
                          {driver.notes && <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{driver.notes}</div>}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {driver.razaoSocial || driver.cnpjCpfEmpresa ? (
                            <div className="space-y-1">
                              {driver.razaoSocial && (
                                <div className="font-bold text-slate-900 leading-tight">
                                  {driver.razaoSocial}
                                </div>
                              )}
                              {driver.cnpjCpfEmpresa && (
                                <div className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100/90 border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                                  <span className="text-[10px] uppercase font-bold text-slate-500">CNPJ/CPF Emp:</span>
                                  <span className="font-semibold text-slate-900">{formatCpfCnpj(driver.cnpjCpfEmpresa)}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Autônomo / Direto</span>
                          )}
                          {driver.antt && (
                            <div className="mt-1 inline-flex items-center gap-1 font-mono text-[10.5px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded">
                              ANTT: {driver.antt}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div>
                            <span className="font-mono font-bold text-slate-800">{driver.cnhNumber || 'Não inf.'}</span>
                            <span className="text-slate-500 ml-1.5 font-medium">(Cat. {driver.cnhCategory})</span>
                          </div>
                          <div className="text-slate-500 text-[11px] whitespace-nowrap">
                            Val: {driver.cnhExpiration ? formatDate(driver.cnhExpiration) : 'Não inf.'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-700 whitespace-nowrap">
                          {driver.phone || '-'}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="font-semibold text-slate-800">
                            {driver.bankCode ? `[${driver.bankCode}] ` : ''}{driver.bankName || 'Banco não inf.'}
                          </div>
                          {(driver.bankAgency || driver.bankAccount) && (
                            <div className="text-[11px] text-slate-600 font-mono">
                              {driver.bankAgency ? `Ag: ${driver.bankAgency}` : ''}
                              {driver.bankAccount ? ` · Conta: ${driver.bankAccount}` : ''}
                            </div>
                          )}
                          {driver.pixKey && (
                            <div className="font-mono text-emerald-800 text-[11px] truncate max-w-xs font-medium mt-0.5">
                              PIX: {driver.pixKey} ({driver.pixKeyType})
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal('motoristas', driver)}
                              className="p-1 text-slate-500 hover:text-indigo-600"
                              title="Editar Motorista"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteDriver(driver.id)}
                              className="p-1 text-slate-500 hover:text-red-600"
                              title="Excluir Motorista"
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
      </div>
    )}

      {/* SUBTAB 2: CAVALOS MECÂNICOS */}
      {activeTab === 'cavalos' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Placa Cavalo</th>
                  <th className="py-3 px-4">Marca / Modelo</th>
                  <th className="py-3 px-4">Tipo de Vínculo</th>
                  <th className="py-3 px-4">Renavam</th>
                  <th className="py-3 px-4">Ano / Cor</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cavalos.filter((c) => c.plate.toLowerCase().includes(search.toLowerCase()) || c.brandModel.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      Nenhum cavalo mecânico cadastrado ainda. Clique em "+ Novo Cadastro" para adicionar.
                    </td>
                  </tr>
                ) : (
                  cavalos
                    .filter((c) => c.plate.toLowerCase().includes(search.toLowerCase()) || c.brandModel.toLowerCase().includes(search.toLowerCase()))
                    .map((cavalo) => (
                      <tr key={cavalo.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                          {cavalo.plate}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">{cavalo.brandModel}</td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-semibold text-slate-700">{cavalo.fleetType}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{cavalo.renavam}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {cavalo.year} · {cavalo.color}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal('cavalos', cavalo)}
                              className="p-1 text-slate-500 hover:text-indigo-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteCavalo(cavalo.id)}
                              className="p-1 text-slate-500 hover:text-red-600"
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
      )}

      {/* SUBTAB 3: CARRETAS / IMPLEMENTOS */}
      {activeTab === 'carretas' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Placa Carreta</th>
                  <th className="py-3 px-4">Tipo de Implemento</th>
                  <th className="py-3 px-4">Capacidade (Ton)</th>
                  <th className="py-3 px-4">Eixos</th>
                  <th className="py-3 px-4">Marca / Modelo</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {carretas.filter((c) => c.plate.toLowerCase().includes(search.toLowerCase()) || c.bodyType.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      Nenhuma carreta/implemento cadastrado ainda. Clique em "+ Novo Cadastro" para adicionar.
                    </td>
                  </tr>
                ) : (
                  carretas
                    .filter((c) => c.plate.toLowerCase().includes(search.toLowerCase()) || c.bodyType.toLowerCase().includes(search.toLowerCase()))
                    .map((carreta) => (
                      <tr key={carreta.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                          {carreta.plate}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">{carreta.bodyType}</td>
                        <td className="py-3.5 px-4 font-bold text-indigo-700 text-xs">
                          {carreta.capacityTons} TON
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">{carreta.axles} Eixos</td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">{carreta.brandModel || '-'}</td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal('carretas', carreta)}
                              className="p-1 text-slate-500 hover:text-indigo-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteCarreta(carreta.id)}
                              className="p-1 text-slate-500 hover:text-red-600"
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
      )}

      {/* SUBTAB 4: CLIENTES */}
      {activeTab === 'clientes' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Nome Fantasia / Razão Social</th>
                  <th className="py-3 px-4">CNPJ</th>
                  <th className="py-3 px-4">Contato / Responsável</th>
                  <th className="py-3 px-4">Telefone / Email</th>
                  <th className="py-3 px-4">Cidade / UF</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {clients.filter((c) => c.tradeName.toLowerCase().includes(search.toLowerCase()) || c.companyName.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      Nenhum cliente cadastrado ainda. Clique em "+ Novo Cadastro" para adicionar.
                    </td>
                  </tr>
                ) : (
                  clients
                    .filter((c) => c.tradeName.toLowerCase().includes(search.toLowerCase()) || c.companyName.toLowerCase().includes(search.toLowerCase()))
                    .map((client) => (
                      <tr key={client.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {client.tradeName}
                          <div className="text-xs text-slate-500">{client.companyName}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{client.cnpj}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-700">{client.contactPerson}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div>{client.phone}</div>
                          <div className="text-[11px] text-slate-400">{client.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {client.addressCity} / {client.addressState}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal('clientes', client)}
                              className="p-1 text-slate-500 hover:text-indigo-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteClient(client.id)}
                              className="p-1 text-slate-500 hover:text-red-600"
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
      )}

      {/* SUBTAB 5: FORNECEDORES / PARCEIROS */}
      {activeTab === 'fornecedores' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Razão Social / Local</th>
                  <th className="py-3 px-4">Função Operacional</th>
                  <th className="py-3 px-4">CNPJ / CPF</th>
                  <th className="py-3 px-4">Contato / Telefone</th>
                  <th className="py-3 px-4">Cidade / UF</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {partners.filter((p) => p.companyName.toLowerCase().includes(search.toLowerCase()) || p.addressCity.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      Nenhum fornecedor/pátio cadastrado ainda. Clique em "+ Novo Cadastro" para adicionar.
                    </td>
                  </tr>
                ) : (
                  partners
                    .filter((p) => p.companyName.toLowerCase().includes(search.toLowerCase()) || p.addressCity.toLowerCase().includes(search.toLowerCase()))
                    .map((partner) => (
                      <tr key={partner.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {partner.companyName}
                          {partner.notes && <div className="text-[11px] text-slate-400 truncate max-w-xs">{partner.notes}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-indigo-700">{partner.role}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{partner.cnpjCpf}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div>{partner.contactPerson}</div>
                          <div className="text-[11px] text-slate-400">{partner.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {partner.addressCity} / {partner.addressState}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal('fornecedores', partner)}
                              className="p-1 text-slate-500 hover:text-indigo-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deletePartner(partner.id)}
                              className="p-1 text-slate-500 hover:text-red-600"
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
      )}

      {/* SUBTAB 6: PRODUTOS */}
      {activeTab === 'produtos' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Nome do Produto</th>
                  <th className="py-3 px-4">Unidade de Medida</th>
                  <th className="py-3 px-4">Especificação / Descrição</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-xs text-slate-400">
                      Nenhum produto cadastrado ainda. Clique em "+ Novo Cadastro" para adicionar.
                    </td>
                  </tr>
                ) : (
                  products
                    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                    .map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900">{prod.name}</td>
                        <td className="py-3.5 px-4 text-xs uppercase font-mono font-bold text-slate-700">
                          {prod.unit}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">{prod.description || '-'}</td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal('produtos', prod)}
                              className="p-1 text-slate-500 hover:text-indigo-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteProduct(prod.id)}
                              className="p-1 text-slate-500 hover:text-red-600"
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
      )}

      {/* MODAL UNIVERSAL DE CADASTRO / EDIÇÃO */}
      {modalType && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingItem ? 'Editar Registro' : 'Novo Cadastro'}: {modalType.toUpperCase()}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {modalError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}
                {/* MOTORISTA FORM FIELDS */}
              {modalType === 'motoristas' && (
                <>
                  {/* SEÇÃO 1: IDENTIFICAÇÃO DO MOTORISTA */}
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-3">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-200 pb-1">
                      1. Identificação do Condutor
                    </span>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Nome Completo do Motorista *</label>
                      <input
                        type="text"
                        required
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="Ex: Valdir Santos da Silva"
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">CPF do Motorista *</label>
                        <input
                          type="text"
                          required
                          value={driverCpf}
                          onChange={(e) => setDriverCpf(e.target.value)}
                          placeholder="000.000.000-00"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Telefone / WhatsApp *</label>
                        <input
                          type="text"
                          required
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value)}
                          placeholder="(66) 99999-0000"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="text-xs font-semibold text-slate-700 block mb-1">CNH Nº *</label>
                        <input
                          type="text"
                          required
                          value={driverCnh}
                          onChange={(e) => setDriverCnh(e.target.value)}
                          placeholder="01234567890"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Categoria *</label>
                        <SearchableSelect
                          value={driverCnhCat}
                          onChange={(val) => setDriverCnhCat(val)}
                          placeholder="Categoria..."
                          searchPlaceholder="Pesquisar categoria..."
                          options={[
                            { value: 'E', label: 'E (Pesado / Carreta)' },
                            { value: 'D', label: 'D (Passageiro / Truck)' },
                            { value: 'C', label: 'C (Carga Simples)' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Validade CNH *</label>
                        <input
                          type="date"
                          required
                          value={driverCnhExp}
                          onChange={(e) => setDriverCnhExp(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 2: EMPRESA VINCULADA & ANTT (COLUNAS M, N, O) */}
                  <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100 space-y-3">
                    <div className="flex items-center justify-between border-b border-sky-200/70 pb-1">
                      <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider block">
                        2. Empresa / Agregado & Registro ANTT (Colunas M, N, O)
                      </span>
                      <span className="text-[10px] text-sky-700 font-medium">Opcional / Conforme Vínculo</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          CPF / CNPJ Empresa
                        </label>
                        <input
                          type="text"
                          value={driverCnpjEmpresa}
                          onChange={(e) => setDriverCnpjEmpresa(e.target.value)}
                          placeholder="00.000.000/0001-00 ou CPF"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Registro ANTT (RNTRC)
                        </label>
                        <input
                          type="text"
                          value={driverAntt}
                          onChange={(e) => setDriverAntt(e.target.value.toUpperCase())}
                          placeholder="Ex: 58291048 ou RNTRC"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Razão Social (Nome Empresarial / Transportadora)
                      </label>
                      <input
                        type="text"
                        value={driverRazaoSocial}
                        onChange={(e) => setDriverRazaoSocial(e.target.value)}
                        placeholder="Ex: Transportes & Logística Rodoviária Ltda"
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  {/* SEÇÃO 3: DADOS BANCÁRIOS COMPLETOS & PIX (COLUNAS P, Q, R, S, I, J) */}
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-3">
                    <div className="flex items-center justify-between border-b border-indigo-200/70 pb-1">
                      <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                        3. Dados Bancários Completos & PIX (Colunas P, Q, R, S)
                      </span>
                      <span className="text-[10px] text-indigo-700 font-medium">Sincronizado na Planilha (Col. P a S)</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Cód. Banco (Cod Banco - Col. P)</label>
                        <input
                          type="text"
                          value={driverBankCode}
                          onChange={(e) => {
                            const code = e.target.value;
                            setDriverBankCode(code);
                            const matched = BRAZILIAN_BANKS.find((b) => b.code === code);
                            if (matched) setDriverBank(matched.name);
                          }}
                          placeholder="Ex: 001, 237, 341..."
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-indigo-700"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Banco / Instituição (Coluna Q)</label>
                        <SearchableSelect
                          value={driverBank}
                          onChange={(val) => {
                            setDriverBank(val);
                            const matched = BRAZILIAN_BANKS.find((b) => b.name === val);
                            if (matched) setDriverBankCode(matched.code);
                          }}
                          placeholder="Selecione o banco..."
                          searchPlaceholder="Pesquisar banco..."
                          options={BRAZILIAN_BANKS.map((b) => ({
                            value: b.name,
                            label: `${b.code} - ${b.name}`,
                            searchKeywords: `${b.code} ${b.name}`,
                          }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Agência Bancária (Coluna R)</label>
                        <input
                          type="text"
                          value={driverBankAgency}
                          onChange={(e) => setDriverBankAgency(e.target.value)}
                          placeholder="Ex: 1234-5 ou 0001"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Conta (Número da Conta - Coluna S) <span className="text-indigo-600 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          value={driverBankAccount}
                          onChange={(e) => setDriverBankAccount(e.target.value)}
                          placeholder="Ex: 123456-7"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1 border-t border-indigo-200/50">
                      <div className="col-span-1">
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Chave PIX (Col. J)</label>
                        <SearchableSelect
                          value={driverPixType}
                          onChange={(val) => setDriverPixType(val as any)}
                          placeholder="Tipo de Chave..."
                          searchPlaceholder="Pesquisar tipo..."
                          options={[
                            { value: 'CPF', label: 'CPF' },
                            { value: 'Telefone', label: 'Telefone' },
                            { value: 'Email', label: 'E-mail' },
                            { value: 'Aleatória', label: 'Chave Aleatória' },
                          ]}
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Chave PIX (Coluna I)</label>
                        <input
                          type="text"
                          value={driverPix}
                          onChange={(e) => setDriverPix(e.target.value)}
                          placeholder="Informe a chave PIX do motorista"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 4: TIPO DE MOTORISTA & VÍNCULO PADRÃO DE VEÍCULOS (COLUNAS T, U E V) */}
                  <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/90 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-1.5">
                      <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-amber-700" />
                        4. Tipo de Motorista & Vínculo Padrão de Veículos
                      </span>
                      <span className="text-[10px] bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded font-extrabold border border-amber-300">
                        Colunas T, U e V
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-1">
                          Tipo de Motorista (Coluna V - TIPO) *
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-white border border-slate-300 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setDriverType('Terceiro')}
                            className={`py-1.5 px-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              driverType === 'Terceiro'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Terceiro
                          </button>
                          <button
                            type="button"
                            onClick={() => setDriverType('Frota')}
                            className={`py-1.5 px-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              driverType === 'Frota'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Frota
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1 leading-tight">
                          {driverType === 'Frota'
                            ? 'Motorista próprio (Custo Frota Própria)'
                            : 'Motorista terceiro (Gera pendência de frete)'}
                        </span>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-1">
                          Cavalo Padrão (Coluna T - Cavalo)
                        </label>
                        <SearchableSelect
                          value={driverDefaultCavalo}
                          onChange={(val) => setDriverDefaultCavalo(val)}
                          placeholder="Selecione o cavalo..."
                          searchPlaceholder="Pesquisar por placa ou modelo..."
                          allowClear={true}
                          allowCustomValue={true}
                          customValueLabel={(val) => `Usar placa digitada: ${val.toUpperCase()}`}
                          options={cavalos.map((c) => ({
                            value: c.plate,
                            label: `${c.plate} · ${c.brandModel}`,
                            sublabel: `Frota: ${c.fleetType} · Cor: ${c.color}`,
                          }))}
                        />
                        <span className="text-[10px] text-slate-500 block mt-1 leading-tight">
                          Preenchido automaticamente ao escalar o motorista.
                        </span>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-1">
                          Carreta Padrão (Coluna U - Carreta)
                        </label>
                        <SearchableSelect
                          value={driverDefaultCarreta}
                          onChange={(val) => setDriverDefaultCarreta(val)}
                          placeholder="Selecione a carreta..."
                          searchPlaceholder="Pesquisar por placa ou tipo..."
                          allowClear={true}
                          allowCustomValue={true}
                          customValueLabel={(val) => `Usar placa digitada: ${val.toUpperCase()}`}
                          options={carretas.map((c) => ({
                            value: c.plate,
                            label: `${c.plate} · ${c.bodyType}`,
                            sublabel: `Capacidade: ${c.capacityTons}t · ${c.axles} eixos`,
                          }))}
                        />
                        <span className="text-[10px] text-slate-500 block mt-1 leading-tight">
                          Implemento vinculado automaticamente na carga.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 5: OBSERVAÇÕES */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Observações Adicionais / Restrições</label>
                    <textarea
                      rows={2}
                      value={driverNotes}
                      onChange={(e) => setDriverNotes(e.target.value)}
                      placeholder="Ex: Motorista com experiência em bitrem e graneleira, prefere rotas MT/PA..."
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 resize-none"
                    />
                  </div>
                </>
              )}

              {/* CAVALO FORM FIELDS */}
              {modalType === 'cavalos' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Placa (Cavalo) *</label>
                      <input
                        type="text"
                        required
                        value={cavaloPlate}
                        onChange={(e) => setCavaloPlate(e.target.value)}
                        placeholder="ABC1D23"
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Renavam *</label>
                      <input
                        type="text"
                        required
                        value={cavaloRenavam}
                        onChange={(e) => setCavaloRenavam(e.target.value)}
                        placeholder="01234567890"
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Marca / Modelo *</label>
                    <input
                      type="text"
                      required
                      value={cavaloModel}
                      onChange={(e) => setCavaloModel(e.target.value)}
                      placeholder="Ex: Scania R 500 6x4 ou Volvo FH 540"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Frota</label>
                      <SearchableSelect
                        value={cavaloFleetType}
                        onChange={(val) => setCavaloFleetType(val as any)}
                        placeholder="Tipo de Frota..."
                        searchPlaceholder="Pesquisar..."
                        options={[
                          { value: 'Frota Própria', label: 'Frota Própria' },
                          { value: 'Terceiro', label: 'Terceiro' },
                          { value: 'Agregado', label: 'Agregado' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Ano</label>
                      <input
                        type="number"
                        value={cavaloYear}
                        onChange={(e) => setCavaloYear(parseInt(e.target.value) || 2024)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Cor</label>
                      <input
                        type="text"
                        value={cavaloColor}
                        onChange={(e) => setCavaloColor(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* CARRETA FORM FIELDS */}
              {modalType === 'carretas' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Placa (Carreta) *</label>
                      <input
                        type="text"
                        required
                        value={carretaPlate}
                        onChange={(e) => setCarretaPlate(e.target.value)}
                        placeholder="BDQ7B12"
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Implemento *</label>
                      <SearchableSelect
                        value={carretaType}
                        onChange={(val) => setCarretaType(val)}
                        placeholder="Tipo de Implemento..."
                        searchPlaceholder="Pesquisar implemento..."
                        options={[
                          { value: 'Graneleira', label: 'Graneleira' },
                          { value: 'Sider', label: 'Sider' },
                          { value: 'Baú', label: 'Baú' },
                          { value: 'Caçamba', label: 'Caçamba' },
                          { value: 'Prancha', label: 'Prancha' },
                          { value: 'Tanque', label: 'Tanque' },
                          { value: 'Frigorífico', label: 'Frigorífico' },
                          { value: 'Carga Geral', label: 'Carga Geral' },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Capacidade (Toneladas) *</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={carretaCapacity}
                        onChange={(e) => setCarretaCapacity(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Quantidade de Eixos</label>
                      <input
                        type="number"
                        value={carretaAxles}
                        onChange={(e) => setCarretaAxles(parseInt(e.target.value) || 3)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Marca / Modelo do Fabricante</label>
                    <input
                      type="text"
                      value={carretaModel}
                      onChange={(e) => setCarretaModel(e.target.value)}
                      placeholder="Ex: Randon Rodotrem 9 Eixos ou Guerra Bitrem"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                </>
              )}

              {/* CLIENT FORM FIELDS */}
              {modalType === 'clientes' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Nome Fantasia *</label>
                    <input
                      type="text"
                      required
                      value={clientTrade}
                      onChange={(e) => setClientTrade(e.target.value)}
                      placeholder="Ex: Bunge Brasil"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Razão Social *</label>
                    <input
                      type="text"
                      required
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                      placeholder="Ex: Bunge Alimentos S.A."
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">CNPJ *</label>
                      <input
                        type="text"
                        required
                        value={clientCnpj}
                        onChange={(e) => setClientCnpj(e.target.value)}
                        placeholder="00.000.000/0001-00"
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Contato Responsável</label>
                      <input
                        type="text"
                        value={clientContact}
                        onChange={(e) => setClientContact(e.target.value)}
                        placeholder="Ex: Mariana Esteves (Logística)"
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Telefone</label>
                      <input
                        type="text"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">E-mail</label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Cidade *</label>
                      <input
                        type="text"
                        required
                        value={clientCity}
                        onChange={(e) => setClientCity(e.target.value)}
                        placeholder="São Paulo"
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Estado (UF) *</label>
                      <input
                        type="text"
                        required
                        value={clientState}
                        onChange={(e) => setClientState(e.target.value)}
                        placeholder="SP"
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* FORNECEDOR FORM FIELDS */}
              {modalType === 'fornecedores' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Razão Social / Nome do Local *</label>
                    <input
                      type="text"
                      required
                      value={partnerCompany}
                      onChange={(e) => setPartnerCompany(e.target.value)}
                      placeholder="Ex: Terminal Integrador Portuário Santos"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Função Operacional *</label>
                      <SearchableSelect
                        value={partnerRole}
                        onChange={(val) => setPartnerRole(val as any)}
                        placeholder="Função Operacional..."
                        searchPlaceholder="Pesquisar função..."
                        options={[
                          { value: 'Origem/Carregamento', label: 'Origem / Carregamento' },
                          { value: 'Destino/Entrega', label: 'Destino / Entrega' },
                          { value: 'Pátio/Armazém', label: 'Pátio / Armazém' },
                          { value: 'Posto/Apoio', label: 'Posto / Apoio' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">CNPJ / CPF</label>
                      <input
                        type="text"
                        value={partnerCnpj}
                        onChange={(e) => setPartnerCnpj(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Cidade *</label>
                      <input
                        type="text"
                        required
                        value={partnerCity}
                        onChange={(e) => setPartnerCity(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Estado (UF) *</label>
                      <input
                        type="text"
                        required
                        value={partnerState}
                        onChange={(e) => setPartnerState(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Instruções de Pátio / Observações</label>
                    <input
                      type="text"
                      value={partnerNotes}
                      onChange={(e) => setPartnerNotes(e.target.value)}
                      placeholder="Ex: Exige agendamento prévio no portal SIGA"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </>
              )}

              {/* PRODUCT FORM FIELDS */}
              {modalType === 'produtos' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Nome do Produto *</label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="Ex: Soja em Grãos, Sorgo, Milho a Granel"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Unidade de Medida</label>
                    <SearchableSelect
                      value={prodUnit}
                      onChange={(val) => setProdUnit(val as any)}
                      placeholder="Unidade..."
                      searchPlaceholder="Pesquisar unidade..."
                      options={[
                        { value: 'ton', label: 'Tonelada (TON)' },
                        { value: 'kg', label: 'Quilograma (KG)' },
                        { value: 'sc', label: 'Sacas (SC)' },
                        { value: 'm3', label: 'Metro Cúbico (m³)' },
                        { value: 'un', label: 'Unidades (UN)' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Descrição / Especificação</label>
                    <input
                      type="text"
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      placeholder="Ex: Padrão ANEC, umidade máx 14%, impureza 1%"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                </>
              )}
              </div>

              {/* Rodapé Fixo com Botões de Ação Sempre Visíveis */}
              <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingModal}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors flex items-center gap-2"
                >
                  {isSavingModal ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Gravando...
                    </>
                  ) : (
                    'Salvar Cadastro'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
