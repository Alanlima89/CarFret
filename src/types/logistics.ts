export type CargoStatus = 'aguardando_veiculo' | 'aguardando_carregar' | 'em_transito' | 'aguardando_descarga' | 'finalizado' | 'cancelado';

export type OCStatus = 'gerada' | 'enviada_motorista' | 'em_carregamento' | 'carregado';

export interface Driver {
  id: string;
  name: string;
  cpf: string;
  cnhNumber: string;
  cnhCategory: string;
  cnhExpiration: string;
  phone: string;
  bankName: string;
  pixKey: string;
  pixKeyType: 'CPF' | 'Telefone' | 'Email' | 'Aleatória';
  status: 'active' | 'inactive';
  notes?: string;
  cnpjCpfEmpresa?: string;
  razaoSocial?: string;
  antt?: string;
  bankCode?: string;
  bankAgency?: string;
  bankAccount?: string;
  // Vínculos e Tipo (Colunas T, U e V na aba Motoristas)
  defaultCavaloPlate?: string; // Coluna T (Cavalo)
  defaultCarretaPlate?: string; // Coluna U (Carreta)
  driverType?: 'Frota' | 'Terceiro'; // Coluna V (TIPO)
}

export interface VehicleCavalo {
  id: string;
  plate: string;
  renavam: string;
  brandModel: string;
  fleetType: 'Frota Própria' | 'Terceiro' | 'Agregado';
  year: number;
  color: string;
  driverIdDefault?: string;
}

export interface VehicleCarreta {
  id: string;
  plate: string;
  bodyType: 'Graneleira' | 'Sider' | 'Baú' | 'Caçamba' | 'Prancha' | 'Tanque' | 'Carga Geral' | 'Frigorífico';
  capacityTons: number;
  axles: number;
  brandModel?: string;
  status: 'disponivel' | 'em_viagem' | 'manutencao';
}

export interface Client {
  id: string;
  companyName: string; // Razão Social
  tradeName: string;   // Nome Fantasia
  cnpj: string;
  contactPerson: string;
  phone: string;
  email: string;
  addressCity: string;
  addressState: string;
  addressStreet: string;
}

export interface Partner {
  id: string;
  companyName: string;
  cnpjCpf: string;
  contactPerson: string;
  phone: string;
  role: 'Origem/Carregamento' | 'Destino/Entrega' | 'Pátio/Armazém' | 'Posto/Apoio';
  addressCity: string;
  addressState: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  unit: 'ton' | 'kg' | 'sc' | 'un' | 'm3';
  description?: string;
}

export interface FreightRate {
  id: string;
  clientId: string;
  clientName: string;
  originCityState: string;
  destinationCityState: string;
  pricingType: 'per_ton' | 'fixed';
  unitRate: number; // R$ por Ton ou Valor Fechado
  vehicleRequiredType: string;
  tollsIncluded: boolean;
  validityDate?: string;
  notes?: string;
}

export interface CargoTrip {
  id: string;
  ocNumber: string; // ex: OC-2026-0042
  pedidoCliente?: string; // Pedido do Cliente (Ordem de Compra / Pedido de Venda)
  clientId: string;
  clientName: string;
  
  originSupplierId: string;
  originSupplierName: string;
  originCityState: string;
  originAddress: string;

  destinationSupplierId: string;
  destinationSupplierName: string;
  destinationCityState: string;
  destinationAddress: string;

  productId: string;
  productName: string;

  driverId: string;
  driverName: string;
  driverPhone: string;
  driverPix: string;

  cavaloId: string;
  cavaloPlate: string;
  carretaId: string;
  carretaPlate: string;
  carretaType: string;
  carreta2Id?: string;
  carreta2Plate?: string;
  carreta2Type?: string;

  scheduledLoadingDate: string; // YYYY-MM-DDTHH:mm
  scheduledDeliveryDate: string; // YYYY-MM-DDTHH:mm
  actualLoadingDate?: string;
  actualAwaitingUnloadDate?: string; // Carimbo data/hora real de chegada em Aguardando Descarga
  actualDeliveryDate?: string;

  weightTons: number;
  weightKg?: number;
  // Frete Empresa (Receita / Tomador)
  freightType: 'per_ton' | 'fixed';
  freightRate: number;
  totalFreight: number;
  advanceAmount: number;
  balanceAmount: number;

  // Frete Veículo Terceiro (Custo / Motorista Agregado)
  thirdPartyFreightType?: 'per_ton' | 'fixed';
  thirdPartyFreightRate?: number;
  thirdPartyTotalFreight?: number;
  thirdPartyAdvanceAmount?: number;
  thirdPartyBalanceAmount?: number;

  // Dica rápida da solicitação: Campo de Observações da Coleta
  collectionNotes: string; // EPI completo, portaria, pesagem, etc.
  deliveryInstructions: string;

  cargoStatus: CargoStatus;
  ocStatus: OCStatus;
  createdAt: string;

  ctNumber?: string;
  nfNumber?: string;
  internalNotes?: string;

  // Controle de Viagem e Pagamentos Terceiro (Colunas AW e AX na aba Cargas_OC)
  driverType?: 'Frota' | 'Terceiro';
  thirdPartyAdvancePaymentStatus?: 'Pendente' | 'Pago' | 'Frota' | string; // Coluna AW (Pag Adiantamento Terceiro)
  thirdPartyBalancePaymentStatus?: 'Pendente' | 'Pago' | 'Frota' | string; // Coluna AX (Pag Saldo Terceiro)
}

export type OccurrenceType =
  | 'demora_descarga'
  | 'demora_carregamento'
  | 'quebra_mecanica'
  | 'recusa_produto'
  | 'divergencia_pesagem'
  | 'avaria_carga'
  | 'bloqueio_rota'
  | 'outros';

export interface Occurrence {
  id: string;
  cargoId: string;
  ocNumber: string;
  date: string;
  time: string;
  type: OccurrenceType;
  title: string;
  description: string;
  financialImpact: boolean;
  extraCostAmount: number;
  impactResponsible: 'cliente' | 'transportadora' | 'motorista' | 'terceiro';
  status: 'aberto' | 'em_analise' | 'resolvido';
  resolvedAt?: string;
  resolutionNotes?: string;
  reporterName?: string;
}

export interface DailyStayFee {
  id: string;
  cargoId: string;
  ocNumber: string;
  driverName: string;
  vehiclePlate: string;
  localType: 'carregamento' | 'descarga';
  locationName: string;
  arrivalDateTime: string;
  departureDateTime: string;
  toleranceHours: number; // Lei brasileira: 5 horas de tolerância padrão
  totalWaitHours: number;
  excessHours: number;
  rateType: 'diaria_fixa' | 'valor_hora' | 'por_tonelada_hora';
  rateValue: number;
  calculatedAmount: number;
  approvedAmount: number;
  status: 'pendente' | 'aprovado' | 'pago_motorista' | 'cobrado_cliente';
  notes?: string;
}

export interface CompanyProfile {
  companyName: string;
  tradeName: string;
  cnpj: string;
  rntrc: string;
  phone: string;
  email: string;
  address: string;
  dispatcherName: string;
}
