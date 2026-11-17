import {
  Driver,
  VehicleCavalo,
  VehicleCarreta,
  Client,
  Partner,
  Product,
  FreightRate,
  CargoTrip,
  Occurrence,
  DailyStayFee,
  CompanyProfile,
} from '../types/logistics';

export const initialCompanyProfile: CompanyProfile = {
  companyName: '',
  tradeName: '',
  cnpj: '',
  rntrc: '',
  phone: '',
  email: '',
  address: '',
  dispatcherName: '',
};

// Drivers on screen: Liniker and Alan Lima
export const initialDrivers: Driver[] = [
  {
    id: 'drv-liniker',
    name: 'Liniker',
    cpf: '384.921.408-22',
    cnhNumber: '04829104829',
    cnhCategory: 'E',
    cnhExpiration: '2028-12-31',
    phone: '(66) 99614-2201',
    bankName: 'Banco do Brasil',
    pixKey: '44.892.104/0001-89',
    pixKeyType: 'CPF',
    status: 'active',
    notes: 'Motorista ativo cadastrado',
    cnpjCpfEmpresa: '44.892.104/0001-89',
    razaoSocial: 'Liniker Transportes Rodoviários Ltda',
    antt: '58291048',
    bankCode: '001',
    bankAgency: '3208-5',
    bankAccount: '18492-0',
  },
  {
    id: 'drv-alan-lima',
    name: 'Alan Lima',
    cpf: '521.847.309-15',
    cnhNumber: '05719382014',
    cnhCategory: 'E',
    cnhExpiration: '2027-08-20',
    phone: '(66) 99841-7733',
    bankName: 'Bradesco',
    pixKey: '(66) 99841-7733',
    pixKeyType: 'Telefone',
    status: 'active',
    notes: 'Motorista ativo cadastrado',
    cnpjCpfEmpresa: '521.847.309-15',
    razaoSocial: 'Alan Lima Logística & Transportes',
    antt: '49102834',
    bankCode: '237',
    bankAgency: '1480-1',
    bankAccount: '005432-8',
  },
];

export const initialCavalos: VehicleCavalo[] = [];

export const initialCarretas: VehicleCarreta[] = [];

export const initialClients: Client[] = [];

export const initialPartners: Partner[] = [];

export const initialProducts: Product[] = [];

export const initialFreightRates: FreightRate[] = [];

export const initialCargoTrips: CargoTrip[] = [];

export const initialOccurrences: Occurrence[] = [];

export const initialDailyStayFees: DailyStayFee[] = [];
