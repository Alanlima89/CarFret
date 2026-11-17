import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
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
  CargoStatus,
  OCStatus,
} from '../types/logistics';
import {
  initialCompanyProfile,
  initialDrivers,
  initialCavalos,
  initialCarretas,
  initialClients,
  initialPartners,
  initialProducts,
  initialFreightRates,
  initialCargoTrips,
  initialOccurrences,
  initialDailyStayFees,
} from '../data/mockData';
import {
  formatWeightKg,
  formatWeightTons,
  generateNextOcNumber,
  getMaxOcSequence,
} from '../utils/formatters';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
  setCachedAccessToken,
  STORAGE_GOOGLE_TOKEN_KEY,
  STORAGE_GOOGLE_USER_KEY,
  STORAGE_GOOGLE_CONNECTED_KEY,
  DEFAULT_OPERATOR_USER,
} from '../services/googleAuth';
import {
  OFFICIAL_SPREADSHEET_ID,
  OFFICIAL_SPREADSHEET_URL,
  ensureSpreadsheetStructure,
  readAllDataFromSpreadsheet,
  saveSingleSheetToSpreadsheet,
  appendRowToSpreadsheet,
  appendRowsToSpreadsheet,
  updateRowInSpreadsheet,
  deleteRowFromSpreadsheet,
  saveAllDataToSpreadsheet,
  getAppsScriptUrl,
  flushPendingWrites,
  STORAGE_SHEET_ID_KEY,
  STORAGE_APPS_SCRIPT_KEY,
  DEFAULT_APPS_SCRIPT_URL,
  serializeCargo,
  serializeDriver,
  serializeCavalo,
  serializeCarreta,
  serializeClient,
  serializePartner,
  serializeProduct,
  serializeFreightRate,
  serializeOccurrence,
  serializeDailyStay,
  serializeCompany,
  LogisticsDataset,
} from '../services/googleSheetsService';

interface LogisticsContextType {
  companyProfile: CompanyProfile;
  updateCompanyProfile: (profile: CompanyProfile) => void;

  drivers: Driver[];
  addDriver: (driver: Omit<Driver, 'id'>) => Promise<Driver> | Driver;
  updateDriver: (driver: Driver) => Promise<void> | void;
  deleteDriver: (id: string) => void;

  cavalos: VehicleCavalo[];
  addCavalo: (cavalo: Omit<VehicleCavalo, 'id'>) => VehicleCavalo;
  updateCavalo: (cavalo: VehicleCavalo) => void;
  deleteCavalo: (id: string) => void;

  carretas: VehicleCarreta[];
  addCarreta: (carreta: Omit<VehicleCarreta, 'id'>) => VehicleCarreta;
  updateCarreta: (carreta: VehicleCarreta) => void;
  deleteCarreta: (id: string) => void;

  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => Client;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;

  partners: Partner[];
  addPartner: (partner: Omit<Partner, 'id'>) => Partner;
  updatePartner: (partner: Partner) => void;
  deletePartner: (id: string) => void;

  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;

  freightRates: FreightRate[];
  addFreightRate: (rate: Omit<FreightRate, 'id'>) => FreightRate;
  updateFreightRate: (rate: FreightRate) => void;
  deleteFreightRate: (id: string) => void;

  cargos: CargoTrip[];
  addCargo: (cargo: Omit<CargoTrip, 'id' | 'ocNumber' | 'createdAt'>) => CargoTrip;
  addCargosBatch: (cargos: Array<Omit<CargoTrip, 'id' | 'ocNumber' | 'createdAt'>>) => CargoTrip[];
  updateCargo: (cargo: CargoTrip) => void;
  deleteCargo: (id: string) => void;
  cancelCargo: (id: string, reason?: string) => void;
  updateCargoStatus: (
    id: string,
    status: CargoStatus,
    extraFields?: {
      ctNumber?: string;
      driverType?: 'Frota' | 'Terceiro';
      thirdPartyAdvancePaymentStatus?: string;
      thirdPartyBalancePaymentStatus?: string;
    }
  ) => void;
  updateCargoPaymentStatus: (
    id: string,
    advanceStatus?: 'Pendente' | 'Pago' | 'Frota' | string,
    balanceStatus?: 'Pendente' | 'Pago' | 'Frota' | string
  ) => void;
  updateCargoOCStatus: (id: string, ocStatus: OCStatus) => void;
  getNextAvailableOcNumber: (targetYear?: number) => string;
  assignVehicleToCargo: (
    cargoId: string,
    assignment: {
      driverId: string;
      cavaloId: string;
      carretaId?: string;
      carretaPlate?: string;
      carretaType?: string;
      carreta2Id?: string;
      carreta2Plate?: string;
      carreta2Type?: string;
      pedidoCliente?: string;
    }
  ) => CargoTrip | null;

  occurrences: Occurrence[];
  addOccurrence: (occ: Omit<Occurrence, 'id'>) => Occurrence;
  updateOccurrence: (occ: Occurrence) => void;
  deleteOccurrence: (id: string) => void;

  dailyStayFees: DailyStayFee[];
  addDailyStayFee: (stay: Omit<DailyStayFee, 'id'>) => DailyStayFee;
  updateDailyStayFee: (stay: DailyStayFee) => void;
  deleteDailyStayFee: (id: string) => void;

  // Utilities
  resetToSampleData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (json: string) => boolean;
  generateWhatsAppDispatchText: (cargo: CargoTrip) => string;

  // Google Sheets & Auth Integration
  currentUser: User | null;
  isAuthLoading: boolean;
  isLoggingIn: boolean;
  isSheetsConnected: boolean;
  isWriteAuthorized: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  spreadsheetId: string;
  spreadsheetUrl: string;
  syncError: string | null;
  loginWithGoogle: () => Promise<void>;
  logoutGoogle: () => Promise<void>;
  syncNow: () => Promise<void>;
  syncDriversNow: () => Promise<void>;
  syncAllToSheets: () => Promise<boolean>;
  connectSpreadsheetById: (id: string) => Promise<boolean>;
  clearSyncError: () => void;
  appendRowDirect: (sheetName: string, row: any[]) => Promise<boolean>;
  appendRowsDirect: (sheetName: string, rows: any[][]) => Promise<boolean>;
  isCloudSyncModalOpen: boolean;
  setIsCloudSyncModalOpen: (open: boolean) => void;
  cloudSyncNotice: string;
  setCloudSyncNotice: (notice: string) => void;
}

const STORAGE_KEY = 'cargafret_logistics_v3';

// Ensure official spreadsheet ID and Web App URL are always saved in localStorage on load
if (typeof window !== 'undefined') {
  localStorage.setItem(STORAGE_SHEET_ID_KEY, OFFICIAL_SPREADSHEET_ID);
  const existingScript = localStorage.getItem(STORAGE_APPS_SCRIPT_KEY);
  if (!existingScript || !existingScript.trim()) {
    localStorage.setItem(STORAGE_APPS_SCRIPT_KEY, DEFAULT_APPS_SCRIPT_URL);
  }
}

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

export const LogisticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Primary operational datasets
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`${STORAGE_KEY}_company`) : null;
    return saved ? JSON.parse(saved) : initialCompanyProfile;
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`${STORAGE_KEY}_drivers`) : null;
    return saved ? JSON.parse(saved) : initialDrivers;
  });

  const [cavalos, setCavalos] = useState<VehicleCavalo[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`${STORAGE_KEY}_cavalos`) : null;
    return saved ? JSON.parse(saved) : initialCavalos;
  });

  const [carretas, setCarretas] = useState<VehicleCarreta[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`${STORAGE_KEY}_carretas`) : null;
    return saved ? JSON.parse(saved) : initialCarretas;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`${STORAGE_KEY}_clients`) : null;
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [partners, setPartners] = useState<Partner[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`${STORAGE_KEY}_partners`) : null;
    return saved ? JSON.parse(saved) : initialPartners;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`${STORAGE_KEY}_products`) : null;
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [freightRates, setFreightRates] = useState<FreightRate[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`${STORAGE_KEY}_freightRates`) : null;
    return saved ? JSON.parse(saved) : initialFreightRates;
  });

  const [cargos, setCargos] = useState<CargoTrip[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`${STORAGE_KEY}_cargos`) : null;
    return saved ? JSON.parse(saved) : initialCargoTrips;
  });

  const [occurrences, setOccurrences] = useState<Occurrence[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`${STORAGE_KEY}_occurrences`) : null;
    return saved ? JSON.parse(saved) : initialOccurrences;
  });

  const [dailyStayFees, setDailyStayFees] = useState<DailyStayFee[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`${STORAGE_KEY}_dailyStayFees`) : null;
    return saved ? JSON.parse(saved) : initialDailyStayFees;
  });

  // Google Sheets & Authentication State (100% Modo Público Anônimo para a Equipe)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return DEFAULT_OPERATOR_USER as unknown as User;
  });

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // FIXED OFFICIAL SPREADSHEET ID FOR ALL USERS
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return OFFICIAL_SPREADSHEET_ID;
  });

  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(() => {
    return OFFICIAL_SPREADSHEET_URL;
  });

  const [isSheetsConnected, setIsSheetsConnected] = useState<boolean>(true);
  const [isWriteAuthorized, setIsWriteAuthorized] = useState<boolean>(true);

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Cloud Sync Connection Modal State
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [cloudSyncNotice, setCloudSyncNotice] = useState('');

  // Keep a ref to the latest state for callbacks
  const latestDataRef = useRef<LogisticsDataset>({
    companyProfile,
    drivers,
    cavalos,
    carretas,
    clients,
    partners,
    products,
    freightRates,
    cargos,
    occurrences,
    dailyStayFees,
  });

  useEffect(() => {
    latestDataRef.current = {
      companyProfile,
      drivers,
      cavalos,
      carretas,
      clients,
      partners,
      products,
      freightRates,
      cargos,
      occurrences,
      dailyStayFees,
    };
  }, [
    companyProfile,
    drivers,
    cavalos,
    carretas,
    clients,
    partners,
    products,
    freightRates,
    cargos,
    occurrences,
    dailyStayFees,
  ]);

  // Sync state to local storage as continuous offline fallback
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_company`, JSON.stringify(companyProfile));
  }, [companyProfile]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_drivers`, JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cavalos`, JSON.stringify(cavalos));
  }, [cavalos]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_carretas`, JSON.stringify(carretas));
  }, [carretas]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_clients`, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_partners`, JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_freightRates`, JSON.stringify(freightRates));
  }, [freightRates]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cargos`, JSON.stringify(cargos));
  }, [cargos]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_occurrences`, JSON.stringify(occurrences));
  }, [occurrences]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_dailyStayFees`, JSON.stringify(dailyStayFees));
  }, [dailyStayFees]);

  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  // DIRECT APPEND OF A NEW ROW (ESCRITA DIRETA NA PLANILHA GOOGLE)
  const appendRowDirect = useCallback(
    async (sheetName: string, row: any[]): Promise<boolean> => {
      const currentSheetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
      if (!currentSheetId) return false;

      const token = await getAccessToken();

      try {
        setIsSyncing(true);
        setSyncError(null);
        const ok = await appendRowToSpreadsheet(currentSheetId, token, sheetName, row);
        setLastSyncTime(new Date());
        if (ok) {
          setIsWriteAuthorized(true);
        }
        return ok;
      } catch (err: any) {
        console.warn(`[CargaFret] Gravação em '${sheetName}':`, err);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [spreadsheetId]
  );

  // DIRECT BATCH APPEND (ESCRITA DE LOTE NA PLANILHA GOOGLE)
  const appendRowsDirect = useCallback(
    async (sheetName: string, rows: any[][]): Promise<boolean> => {
      if (!rows || rows.length === 0) return true;
      const currentSheetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
      if (!currentSheetId) return false;

      const token = await getAccessToken();

      try {
        setIsSyncing(true);
        setSyncError(null);
        const ok = await appendRowsToSpreadsheet(currentSheetId, token, sheetName, rows);
        setLastSyncTime(new Date());
        if (ok) {
          setIsWriteAuthorized(true);
        }
        return ok;
      } catch (err: any) {
        console.warn(`[CargaFret] Gravação em lote em '${sheetName}':`, err);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [spreadsheetId]
  );

  // Sincroniza uma aba inteira de forma limpa e direta
  const syncSheetTab = useCallback(
    async (sheetName: string, rows: any[][]) => {
      const token = await getAccessToken();
      const currentSheetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
      if (!currentSheetId) return;

      try {
        setIsSyncing(true);
        const ok = await saveSingleSheetToSpreadsheet(currentSheetId, token, sheetName, rows);
        setLastSyncTime(new Date());
        if (ok) {
          setSyncError(null);
        }
      } catch (err: any) {
        console.warn(`[CargaFret] Sincronização na aba '${sheetName}':`, err);
      } finally {
        setIsSyncing(false);
      }
    },
    [spreadsheetId]
  );

  /**
   * INITIAL DATA FETCH & PRESERVATION (TEAM DIRECT ACCESS - ZERO LOGIN REQUIRED)
   * 1. Uses the official fixed spreadsheet ID 17cCFOkGn0Cv2v4nhk1LiLJENWc5A8xusY93KMwEjdJw
   * 2. Reads live rows from the official sheet via Google direct queries (no 403, no login forced)
   * 3. Preserves existing headers and structure
   */
  const initSheetsSync = useCallback(
    async (token?: string | null) => {
      try {
        setIsSyncing(true);
        setSyncError(null);

        const targetId = OFFICIAL_SPREADSHEET_ID;
        setSpreadsheetId(targetId);
        setSpreadsheetUrl(OFFICIAL_SPREADSHEET_URL);
        localStorage.setItem(STORAGE_SHEET_ID_KEY, targetId);

        // Fetch all existing data from the spreadsheet directly
        const { data } = await readAllDataFromSpreadsheet(targetId, token);

        // Populate app state with the live records fetched from Google Sheets
        if (data.cargos && data.cargos.length > 0) setCargos(data.cargos);
        if (data.drivers && data.drivers.length > 0) setDrivers(data.drivers);
        if (data.cavalos && data.cavalos.length > 0) setCavalos(data.cavalos);
        if (data.carretas && data.carretas.length > 0) setCarretas(data.carretas);
        if (data.clients && data.clients.length > 0) setClients(data.clients);
        if (data.partners && data.partners.length > 0) setPartners(data.partners);
        if (data.products && data.products.length > 0) setProducts(data.products);
        if (data.freightRates && data.freightRates.length > 0) setFreightRates(data.freightRates);
        if (data.occurrences && data.occurrences.length > 0) setOccurrences(data.occurrences);
        if (data.dailyStayFees && data.dailyStayFees.length > 0) setDailyStayFees(data.dailyStayFees);
        if (data.companyProfile && data.companyProfile.companyName) {
          setCompanyProfile(data.companyProfile);
        }

        setIsSheetsConnected(true);
        setLastSyncTime(new Date());

        // Descarrega quaisquer gravações pendentes na nuvem
        await flushPendingWrites(token);
      } catch (err: any) {
        console.warn('Sincronização em segundo plano:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  // Initialize data on mount: Direct Team Access immediately reads the official Google Sheet!
  useEffect(() => {
    initSheetsSync();
  }, [initSheetsSync]);

  // Modo Público sem login - Stubs de compatibilidade
  const loginWithGoogle = async () => {
    setIsLoggingIn(false);
    setIsSheetsConnected(true);
    setIsWriteAuthorized(true);
    await syncAllToSheets();
  };

  const logoutGoogle = async () => {
    setIsSheetsConnected(true);
    setIsWriteAuthorized(true);
  };

  // Synchronize all dataset tables to the Google Sheet
  const syncAllToSheets = async (): Promise<boolean> => {
    const token = await getAccessToken();
    const currentSheetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
    if (!currentSheetId) return false;

    try {
      setIsSyncing(true);
      setSyncError(null);
      const ok = await saveAllDataToSpreadsheet(currentSheetId, token, {
        companyProfile,
        drivers,
        cavalos,
        carretas,
        clients,
        partners,
        products,
        freightRates,
        cargos,
        occurrences,
        dailyStayFees,
      });
      if (ok) {
        setLastSyncTime(new Date());
      }
      return ok;
    } catch (err: any) {
      console.warn('Erro ao gravar todos os dados na planilha:', err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual Trigger: Fetch latest from sheet directly via GViz (Acesso Público Sem Login)
  const syncNow = async () => {
    const token = await getAccessToken();

    try {
      setIsSyncing(true);
      setSyncError(null);
      // Strictly READ latest data first from Sheets
      const { data } = await readAllDataFromSpreadsheet(OFFICIAL_SPREADSHEET_ID, token);

      if (data.cargos && data.cargos.length > 0) setCargos(data.cargos);
      if (data.drivers && data.drivers.length > 0) setDrivers(data.drivers);
      if (data.cavalos && data.cavalos.length > 0) setCavalos(data.cavalos);
      if (data.carretas && data.carretas.length > 0) setCarretas(data.carretas);
      if (data.clients && data.clients.length > 0) setClients(data.clients);
      if (data.partners && data.partners.length > 0) setPartners(data.partners);
      if (data.products && data.products.length > 0) setProducts(data.products);
      if (data.freightRates && data.freightRates.length > 0) setFreightRates(data.freightRates);
      if (data.occurrences && data.occurrences.length > 0) setOccurrences(data.occurrences);
      if (data.dailyStayFees && data.dailyStayFees.length > 0) setDailyStayFees(data.dailyStayFees);
      if (data.companyProfile && data.companyProfile.companyName) {
        setCompanyProfile(data.companyProfile);
      }

      setLastSyncTime(new Date());
    } catch (err: any) {
      console.warn('Aviso na sincronização manual:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Force sync drivers directly to 'Motoristas'
  const syncDriversNow = async () => {
    const token = await getAccessToken();

    try {
      setIsSyncing(true);
      setSyncError(null);
      await saveSingleSheetToSpreadsheet(
        OFFICIAL_SPREADSHEET_ID,
        token,
        'Motoristas',
        drivers.map(serializeDriver)
      );
      setLastSyncTime(new Date());
    } catch (err: any) {
      console.warn('Aviso ao sincronizar motoristas na planilha:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect to custom spreadsheet by ID if ever needed
  const connectSpreadsheetById = async (customId: string): Promise<boolean> => {
    const token = await getAccessToken();
    if (!token) return false;

    try {
      setIsSyncing(true);
      setSyncError(null);
      await ensureSpreadsheetStructure(customId, token);
      const { data } = await readAllDataFromSpreadsheet(customId, token);

      localStorage.setItem(STORAGE_SHEET_ID_KEY, customId);
      setSpreadsheetId(customId);
      setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${customId}/edit`);

      if (data.cargos) setCargos(data.cargos);
      if (data.drivers) setDrivers(data.drivers);
      if (data.cavalos) setCavalos(data.cavalos);
      if (data.carretas) setCarretas(data.carretas);
      if (data.clients) setClients(data.clients);
      if (data.partners) setPartners(data.partners);
      if (data.products) setProducts(data.products);
      if (data.freightRates) setFreightRates(data.freightRates);
      if (data.occurrences) setOccurrences(data.occurrences);
      if (data.dailyStayFees) setDailyStayFees(data.dailyStayFees);
      if (data.companyProfile) setCompanyProfile(data.companyProfile);

      setIsSheetsConnected(true);
      setLastSyncTime(new Date());
      return true;
    } catch (err: any) {
      console.error('Falha ao conectar ID de planilha:', err);
      setSyncError(`Falha ao conectar planilha: ${err.message || err}`);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // ================= CRUD IMPLEMENTATIONS WITH REAL-TIME GOOGLE SHEETS SYNC =================

  const updateCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    syncSheetTab('Empresa', [serializeCompany(profile)]);
  };

  // Drivers
  const addDriver = async (driver: Omit<Driver, 'id'>): Promise<Driver> => {
    const newDriver: Driver = { ...driver, id: `drv-${Date.now()}` };
    const updated = [newDriver, ...drivers];
    setDrivers(updated);
    await appendRowDirect('Motoristas', serializeDriver(newDriver));
    return newDriver;
  };

  const updateDriver = async (driver: Driver): Promise<void> => {
    const updated = drivers.map((d) => (d.id === driver.id ? driver : d));
    setDrivers(updated);
    const currentSheetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
    const serialized = serializeDriver(driver);
    await updateRowInSpreadsheet(currentSheetId, 'Motoristas', serialized);
    await syncSheetTab('Motoristas', updated.map(serializeDriver));
  };

  const deleteDriver = async (id: string) => {
    const item = drivers.find((d) => d.id === id);
    const confirmed = window.confirm(
      `Deseja realmente remover o motorista "${item?.name || id}"? Esta exclusão será refletida na Planilha Google.`
    );
    if (!confirmed) return;
    const updated = drivers.filter((d) => d.id !== id);
    setDrivers(updated);
    const currentSheetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
    await deleteRowFromSpreadsheet(currentSheetId, 'Motoristas', id);
    syncSheetTab('Motoristas', updated.map(serializeDriver));
  };

  // Cavalos
  const addCavalo = (cavalo: Omit<VehicleCavalo, 'id'>): VehicleCavalo => {
    const newCavalo: VehicleCavalo = { ...cavalo, id: `cav-${Date.now()}` };
    const updated = [newCavalo, ...cavalos];
    setCavalos(updated);
    appendRowDirect('Veiculos_Cavalo', serializeCavalo(newCavalo));
    return newCavalo;
  };

  const updateCavalo = (cavalo: VehicleCavalo) => {
    const updated = cavalos.map((c) => (c.id === cavalo.id ? cavalo : c));
    setCavalos(updated);
    syncSheetTab('Veiculos_Cavalo', updated.map(serializeCavalo));
  };

  const deleteCavalo = (id: string) => {
    const item = cavalos.find((c) => c.id === id);
    const confirmed = window.confirm(
      `Deseja realmente remover o veículo cavalo "${item?.plate || id}"? Esta exclusão será refletida na Planilha Google.`
    );
    if (!confirmed) return;
    const updated = cavalos.filter((c) => c.id !== id);
    setCavalos(updated);
    syncSheetTab('Veiculos_Cavalo', updated.map(serializeCavalo));
  };

  // Carretas
  const addCarreta = (carreta: Omit<VehicleCarreta, 'id'>): VehicleCarreta => {
    const newCarreta: VehicleCarreta = { ...carreta, id: `car-${Date.now()}` };
    const updated = [newCarreta, ...carretas];
    setCarretas(updated);
    appendRowDirect('Veiculos_Carreta', serializeCarreta(newCarreta));
    return newCarreta;
  };

  const updateCarreta = (carreta: VehicleCarreta) => {
    const updated = carretas.map((c) => (c.id === carreta.id ? carreta : c));
    setCarretas(updated);
    syncSheetTab('Veiculos_Carreta', updated.map(serializeCarreta));
  };

  const deleteCarreta = (id: string) => {
    const item = carretas.find((c) => c.id === id);
    const confirmed = window.confirm(
      `Deseja realmente remover o implemento carreta "${item?.plate || id}"? Esta exclusão será refletida na Planilha Google.`
    );
    if (!confirmed) return;
    const updated = carretas.filter((c) => c.id !== id);
    setCarretas(updated);
    syncSheetTab('Veiculos_Carreta', updated.map(serializeCarreta));
  };

  // Clientes
  const addClient = (client: Omit<Client, 'id'>): Client => {
    const newClient: Client = { ...client, id: `cli-${Date.now()}` };
    const updated = [newClient, ...clients];
    setClients(updated);
    appendRowDirect('Clientes', serializeClient(newClient));
    return newClient;
  };

  const updateClient = (client: Client) => {
    const updated = clients.map((c) => (c.id === client.id ? client : c));
    setClients(updated);
    syncSheetTab('Clientes', updated.map(serializeClient));
  };

  const deleteClient = (id: string) => {
    const item = clients.find((c) => c.id === id);
    const confirmed = window.confirm(
      `Deseja realmente remover o cliente "${item?.tradeName || item?.companyName || id}"? Esta exclusão será refletida na Planilha Google.`
    );
    if (!confirmed) return;
    const updated = clients.filter((c) => c.id !== id);
    setClients(updated);
    syncSheetTab('Clientes', updated.map(serializeClient));
  };

  // Parceiros
  const addPartner = (partner: Omit<Partner, 'id'>): Partner => {
    const newPartner: Partner = { ...partner, id: `par-${Date.now()}` };
    const updated = [newPartner, ...partners];
    setPartners(updated);
    appendRowDirect('Parceiros', serializePartner(newPartner));
    return newPartner;
  };

  const updatePartner = (partner: Partner) => {
    const updated = partners.map((p) => (p.id === partner.id ? partner : p));
    setPartners(updated);
    syncSheetTab('Parceiros', updated.map(serializePartner));
  };

  const deletePartner = (id: string) => {
    const item = partners.find((p) => p.id === id);
    const confirmed = window.confirm(
      `Deseja realmente remover o fornecedor/pátio "${item?.companyName || id}"? Esta exclusão será refletida na Planilha Google.`
    );
    if (!confirmed) return;
    const updated = partners.filter((p) => p.id !== id);
    setPartners(updated);
    syncSheetTab('Parceiros', updated.map(serializePartner));
  };

  // Produtos
  const addProduct = (product: Omit<Product, 'id'>): Product => {
    const newProduct: Product = { ...product, id: `prod-${Date.now()}` };
    const updated = [newProduct, ...products];
    setProducts(updated);
    appendRowDirect('Produtos', serializeProduct(newProduct));
    return newProduct;
  };

  const updateProduct = (product: Product) => {
    const updated = products.map((p) => (p.id === product.id ? product : p));
    setProducts(updated);
    syncSheetTab('Produtos', updated.map(serializeProduct));
  };

  const deleteProduct = (id: string) => {
    const item = products.find((p) => p.id === id);
    const confirmed = window.confirm(
      `Deseja realmente remover o produto "${item?.name || id}"? Esta exclusão será refletida na Planilha Google.`
    );
    if (!confirmed) return;
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    syncSheetTab('Produtos', updated.map(serializeProduct));
  };

  // Tabela de Fretes
  const addFreightRate = (rate: Omit<FreightRate, 'id'>): FreightRate => {
    const newRate: FreightRate = { ...rate, id: `fr-${Date.now()}` };
    const updated = [newRate, ...freightRates];
    setFreightRates(updated);
    appendRowDirect('Tabela_Fretes', serializeFreightRate(newRate));
    return newRate;
  };

  const updateFreightRate = (rate: FreightRate) => {
    const updated = freightRates.map((r) => (r.id === rate.id ? rate : r));
    setFreightRates(updated);
    syncSheetTab('Tabela_Fretes', updated.map(serializeFreightRate));
  };

  const deleteFreightRate = (id: string) => {
    const confirmed = window.confirm(
      'Deseja realmente remover esta tarifa da Tabela de Fretes? Esta alteração será refletida na Planilha Google.'
    );
    if (!confirmed) return;
    const updated = freightRates.filter((r) => r.id !== id);
    setFreightRates(updated);
    syncSheetTab('Tabela_Fretes', updated.map(serializeFreightRate));
  };

  // Cargas & O.C.s
  const getNextAvailableOcNumber = useCallback(
    (targetYear = new Date().getFullYear()): string => {
      return generateNextOcNumber(cargos, targetYear);
    },
    [cargos]
  );

  const addCargo = (cargoData: Omit<CargoTrip, 'id' | 'ocNumber' | 'createdAt'>): CargoTrip => {
    const year = new Date().getFullYear();
    const nextOc = generateNextOcNumber(cargos, year);
    const newCargo: CargoTrip = {
      ...cargoData,
      id: `cargo-${Date.now()}`,
      ocNumber: nextOc,
      createdAt: new Date().toISOString(),
    };
    const updated = [newCargo, ...cargos];
    setCargos(updated);
    appendRowDirect('Cargas_OC', serializeCargo(newCargo));
    return newCargo;
  };

  const addCargosBatch = (
    cargosData: Array<Omit<CargoTrip, 'id' | 'ocNumber' | 'createdAt'>>
  ): CargoTrip[] => {
    const year = new Date().getFullYear();
    const startSeq = getMaxOcSequence(cargos, year) + 1;
    const newCargos: CargoTrip[] = cargosData.map((data, idx) => {
      const ocNum = (startSeq + idx).toString().padStart(4, '0');
      return {
        ...data,
        id: `cargo-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        ocNumber: `OC-${year}-${ocNum}`,
        cargoStatus: data.cargoStatus || 'aguardando_veiculo',
        createdAt: new Date().toISOString(),
      };
    });
    const updated = [...newCargos, ...cargos];
    setCargos(updated);
    appendRowsDirect('Cargas_OC', newCargos.map(serializeCargo));
    return newCargos;
  };

  const cancelCargo = (id: string, reason?: string) => {
    let targetCargo: CargoTrip | undefined;
    const updated = cargos.map((c) => {
      if (c.id !== id) return c;
      const cancelStamp = `[CANCELADO em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}${reason ? ` - Motivo: ${reason}` : ''}]`;
      targetCargo = {
        ...c,
        cargoStatus: 'cancelado' as CargoStatus,
        internalNotes: c.internalNotes ? `${c.internalNotes} | ${cancelStamp}` : cancelStamp,
      };
      return targetCargo;
    });
    setCargos(updated);
    if (targetCargo) {
      const currentSheetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
      updateRowInSpreadsheet(currentSheetId, 'Cargas_OC', serializeCargo(targetCargo));
    }
  };

  const updateCargo = (cargo: CargoTrip) => {
    const updated = cargos.map((c) => (c.id === cargo.id ? cargo : c));
    setCargos(updated);
    const currentSheetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
    updateRowInSpreadsheet(currentSheetId, 'Cargas_OC', serializeCargo(cargo));
  };

  const deleteCargo = (id: string) => {
    const cargo = cargos.find((c) => c.id === id);
    const confirmed = window.confirm(
      `Deseja realmente excluir a Carga / Ordem de Carregamento nº "${cargo?.ocNumber || id}"? Esta exclusão será refletida na Planilha Google.`
    );
    if (!confirmed) return;
    const updated = cargos.filter((c) => c.id !== id);
    setCargos(updated);
    const currentSheetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
    deleteRowFromSpreadsheet(currentSheetId, 'Cargas_OC', id, cargo?.ocNumber);
  };

  const updateCargoStatus = (
    id: string,
    status: CargoStatus,
    extraFields?: {
      ctNumber?: string;
      driverType?: 'Frota' | 'Terceiro';
      thirdPartyAdvancePaymentStatus?: string;
      thirdPartyBalancePaymentStatus?: string;
    }
  ) => {
    let targetCargo: CargoTrip | undefined;
    const updated = cargos.map((c) => {
      if (c.id !== id) return c;
      let ocStatus = c.ocStatus;
      let actualLoadingDate = c.actualLoadingDate;
      let actualAwaitingUnloadDate = c.actualAwaitingUnloadDate;
      let actualDeliveryDate = c.actualDeliveryDate;
      let ctNumber =
        extraFields?.ctNumber !== undefined ? extraFields.ctNumber : c.ctNumber;

      if (status === 'em_transito') {
        if (ocStatus !== 'carregado') ocStatus = 'carregado';
        if (!actualLoadingDate) actualLoadingDate = new Date().toISOString();
      } else if (status === 'aguardando_descarga') {
        if (ocStatus !== 'carregado') ocStatus = 'carregado';
        if (!actualLoadingDate) actualLoadingDate = c.scheduledLoadingDate || new Date().toISOString();
        if (!actualAwaitingUnloadDate) actualAwaitingUnloadDate = new Date().toISOString();
      } else if (status === 'finalizado') {
        if (!actualLoadingDate) actualLoadingDate = c.scheduledLoadingDate;
        if (!actualAwaitingUnloadDate) actualAwaitingUnloadDate = c.actualAwaitingUnloadDate || c.scheduledDeliveryDate || new Date().toISOString();
        if (!actualDeliveryDate) actualDeliveryDate = new Date().toISOString();
      }

      // Regra de Pagamento / Frota x Terceiro:
      // Quando for inserido o número do CT-e, se o motorista for Terceiro, as colunas de pagamento
      // (Pag Adiantamento Terceiro e Pag Saldo Terceiro) mudam automaticamente para Pendente (em amarelo).
      // Caso o motorista seja da Frota, esses campos devem vir preenchidos automaticamente como Frota com destaque em Cinza.
      const matchedDriver = drivers.find((d) => d.id === c.driverId || d.name === c.driverName);
      const effectiveDriverType =
        extraFields?.driverType ||
        c.driverType ||
        matchedDriver?.driverType ||
        'Terceiro';

      let thirdPartyAdvancePaymentStatus =
        extraFields?.thirdPartyAdvancePaymentStatus !== undefined
          ? extraFields.thirdPartyAdvancePaymentStatus
          : c.thirdPartyAdvancePaymentStatus;

      let thirdPartyBalancePaymentStatus =
        extraFields?.thirdPartyBalancePaymentStatus !== undefined
          ? extraFields.thirdPartyBalancePaymentStatus
          : c.thirdPartyBalancePaymentStatus;

      if (ctNumber) {
        if (effectiveDriverType === 'Frota') {
          thirdPartyAdvancePaymentStatus = 'Frota';
          thirdPartyBalancePaymentStatus = 'Frota';
        } else {
          // Motorista Terceiro
          if (!thirdPartyAdvancePaymentStatus || thirdPartyAdvancePaymentStatus === 'Frota') {
            thirdPartyAdvancePaymentStatus = 'Pendente';
          }
          if (!thirdPartyBalancePaymentStatus || thirdPartyBalancePaymentStatus === 'Frota') {
            thirdPartyBalancePaymentStatus = 'Pendente';
          }
        }
      }

      targetCargo = {
        ...c,
        cargoStatus: status,
        ocStatus,
        actualLoadingDate,
        actualAwaitingUnloadDate,
        actualDeliveryDate,
        ctNumber,
        driverType: effectiveDriverType,
        thirdPartyAdvancePaymentStatus,
        thirdPartyBalancePaymentStatus,
      };
      return targetCargo;
    });

    setCargos(updated);
    if (targetCargo) {
      const currentSheetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
      updateRowInSpreadsheet(currentSheetId, 'Cargas_OC', serializeCargo(targetCargo));
    }
  };

  const updateCargoPaymentStatus = (
    id: string,
    advanceStatus?: 'Pendente' | 'Pago' | 'Frota' | string,
    balanceStatus?: 'Pendente' | 'Pago' | 'Frota' | string
  ) => {
    let targetCargo: CargoTrip | undefined;
    const updated = cargos.map((c) => {
      if (c.id !== id) return c;
      const newAdv = advanceStatus !== undefined ? advanceStatus : c.thirdPartyAdvancePaymentStatus;
      const newBal = balanceStatus !== undefined ? balanceStatus : c.thirdPartyBalancePaymentStatus;
      targetCargo = {
        ...c,
        thirdPartyAdvancePaymentStatus: newAdv,
        thirdPartyBalancePaymentStatus: newBal,
      };
      return targetCargo;
    });
    setCargos(updated);
    if (targetCargo) {
      const currentSheetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
      updateRowInSpreadsheet(currentSheetId, 'Cargas_OC', serializeCargo(targetCargo));
    }
  };

  const updateCargoOCStatus = (id: string, ocStatus: OCStatus) => {
    let targetCargo: CargoTrip | undefined;
    const updated = cargos.map((c) => {
      if (c.id !== id) return c;
      let cargoStatus = c.cargoStatus;
      let actualLoadingDate = c.actualLoadingDate;

      if (ocStatus === 'carregado') {
        if (cargoStatus === 'aguardando_carregar') cargoStatus = 'em_transito';
        if (!actualLoadingDate) actualLoadingDate = new Date().toISOString();
      }

      targetCargo = { ...c, ocStatus, cargoStatus, actualLoadingDate };
      return targetCargo;
    });
    setCargos(updated);
    if (targetCargo) {
      const currentSheetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
      updateRowInSpreadsheet(currentSheetId, 'Cargas_OC', serializeCargo(targetCargo));
    }
  };

  const assignVehicleToCargo = (
    cargoId: string,
    assignment: {
      driverId: string;
      cavaloId: string;
      carretaId?: string;
      carretaPlate?: string;
      carretaType?: string;
      carreta2Id?: string;
      carreta2Plate?: string;
      carreta2Type?: string;
      pedidoCliente?: string;
    }
  ): CargoTrip | null => {
    const selectedDriver = drivers.find((d) => d.id === assignment.driverId);
    const selectedCavalo = cavalos.find((c) => c.id === assignment.cavaloId);
    const selectedCarreta = assignment.carretaId ? carretas.find((c) => c.id === assignment.carretaId) : undefined;
    const selectedCarreta2 = assignment.carreta2Id ? carretas.find((c) => c.id === assignment.carreta2Id) : undefined;

    let updatedCargo: CargoTrip | null = null;
    const updated = cargos.map((c) => {
      if (c.id !== cargoId) return c;

      const carretaPlate = assignment.carretaPlate || (selectedCarreta ? selectedCarreta.plate : (assignment.carretaId ? c.carretaPlate : 'SEM CARRETA'));
      const carretaType = assignment.carretaType || (selectedCarreta ? selectedCarreta.bodyType : (c.carretaType || 'Graneleira'));

      const carreta2Plate = assignment.carreta2Plate || (selectedCarreta2 ? selectedCarreta2.plate : undefined);
      const carreta2Type = assignment.carreta2Type || (selectedCarreta2 ? selectedCarreta2.bodyType : undefined);

      // Atualiza pedido do cliente se informado ou mantém o anterior
      const pedidoCliente = assignment.pedidoCliente !== undefined
        ? assignment.pedidoCliente.trim()
        : (c.pedidoCliente || '');

      const driverType = selectedDriver?.driverType || 'Terceiro';
      let thirdPartyAdvancePaymentStatus = c.thirdPartyAdvancePaymentStatus;
      let thirdPartyBalancePaymentStatus = c.thirdPartyBalancePaymentStatus;

      if (c.ctNumber) {
        if (driverType === 'Frota') {
          thirdPartyAdvancePaymentStatus = 'Frota';
          thirdPartyBalancePaymentStatus = 'Frota';
        } else {
          if (!thirdPartyAdvancePaymentStatus || thirdPartyAdvancePaymentStatus === 'Frota') {
            thirdPartyAdvancePaymentStatus = 'Pendente';
          }
          if (!thirdPartyBalancePaymentStatus || thirdPartyBalancePaymentStatus === 'Frota') {
            thirdPartyBalancePaymentStatus = 'Pendente';
          }
        }
      }

      updatedCargo = {
        ...c,
        pedidoCliente,
        driverId: assignment.driverId,
        driverName: selectedDriver ? selectedDriver.name : c.driverName,
        driverPhone: selectedDriver ? selectedDriver.phone : c.driverPhone,
        driverPix: selectedDriver ? `${selectedDriver.pixKey} (${selectedDriver.pixKeyType})` : c.driverPix,
        driverType,
        cavaloId: assignment.cavaloId,
        cavaloPlate: selectedCavalo ? selectedCavalo.plate : c.cavaloPlate,
        carretaId: assignment.carretaId || '',
        carretaPlate,
        carretaType,
        carreta2Id: assignment.carreta2Id || undefined,
        carreta2Plate: carreta2Plate || undefined,
        carreta2Type: carreta2Type || undefined,
        cargoStatus: 'aguardando_carregar' as CargoStatus,
        ocStatus: c.ocStatus === 'gerada' ? 'gerada' : c.ocStatus,
        thirdPartyAdvancePaymentStatus,
        thirdPartyBalancePaymentStatus,
      };
      return updatedCargo;
    });

    if (updatedCargo) {
      setCargos(updated);
      const currentSheetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
      updateRowInSpreadsheet(currentSheetId, 'Cargas_OC', serializeCargo(updatedCargo));
    }
    return updatedCargo;
  };

  // Ocorrências
  const addOccurrence = (occ: Omit<Occurrence, 'id'>): Occurrence => {
    const newOcc: Occurrence = { ...occ, id: `occ-${Date.now()}` };
    const updated = [newOcc, ...occurrences];
    setOccurrences(updated);
    appendRowDirect('Ocorrencias', serializeOccurrence(newOcc));
    return newOcc;
  };

  const updateOccurrence = (occ: Occurrence) => {
    const updated = occurrences.map((o) => (o.id === occ.id ? occ : o));
    setOccurrences(updated);
    syncSheetTab('Ocorrencias', updated.map(serializeOccurrence));
  };

  const deleteOccurrence = (id: string) => {
    const updated = occurrences.filter((o) => o.id !== id);
    setOccurrences(updated);
    syncSheetTab('Ocorrencias', updated.map(serializeOccurrence));
  };

  // Diárias de Estadia
  const addDailyStayFee = (stay: Omit<DailyStayFee, 'id'>): DailyStayFee => {
    const newStay: DailyStayFee = { ...stay, id: `stay-${Date.now()}` };
    const updated = [newStay, ...dailyStayFees];
    setDailyStayFees(updated);
    appendRowDirect('Diarias_Estadia', serializeDailyStay(newStay));
    return newStay;
  };

  const updateDailyStayFee = (stay: DailyStayFee) => {
    const updated = dailyStayFees.map((s) => (s.id === stay.id ? stay : s));
    setDailyStayFees(updated);
    syncSheetTab('Diarias_Estadia', updated.map(serializeDailyStay));
  };

  const deleteDailyStayFee = (id: string) => {
    const confirmed = window.confirm(
      'Deseja realmente remover o registro de diária de estadia? Esta alteração será refletida na Planilha Google.'
    );
    if (!confirmed) return;
    const updated = dailyStayFees.filter((s) => s.id !== id);
    setDailyStayFees(updated);
    syncSheetTab('Diarias_Estadia', updated.map(serializeDailyStay));
  };

  // Reset local state to empty (clean start for real company data)
  const resetToSampleData = () => {
    setDrivers([]);
    setCavalos([]);
    setCarretas([]);
    setClients([]);
    setPartners([]);
    setProducts([]);
    setFreightRates([]);
    setCargos([]);
    setOccurrences([]);
    setDailyStayFees([]);
  };

  const exportDatabaseJson = (): string => {
    return JSON.stringify(latestDataRef.current, null, 2);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.drivers && Array.isArray(parsed.drivers)) setDrivers(parsed.drivers);
      if (parsed.cavalos && Array.isArray(parsed.cavalos)) setCavalos(parsed.cavalos);
      if (parsed.carretas && Array.isArray(parsed.carretas)) setCarretas(parsed.carretas);
      if (parsed.clients && Array.isArray(parsed.clients)) setClients(parsed.clients);
      if (parsed.partners && Array.isArray(parsed.partners)) setPartners(parsed.partners);
      if (parsed.products && Array.isArray(parsed.products)) setProducts(parsed.products);
      if (parsed.freightRates && Array.isArray(parsed.freightRates)) setFreightRates(parsed.freightRates);
      if (parsed.cargos && Array.isArray(parsed.cargos)) setCargos(parsed.cargos);
      if (parsed.occurrences && Array.isArray(parsed.occurrences)) setOccurrences(parsed.occurrences);
      if (parsed.dailyStayFees && Array.isArray(parsed.dailyStayFees)) setDailyStayFees(parsed.dailyStayFees);
      if (parsed.companyProfile) setCompanyProfile(parsed.companyProfile);
      return true;
    } catch {
      return false;
    }
  };

  const generateWhatsAppDispatchText = (cargo: CargoTrip): string => {
    const cavaloStr = cargo.cavaloPlate || 'A Definir';
    const carreta1Str = cargo.carretaPlate ? `${cargo.carretaPlate}${cargo.carretaType ? ` (${cargo.carretaType})` : ''}` : 'A Definir';
    const carreta2Str = cargo.carreta2Plate ? `${cargo.carreta2Plate}${cargo.carreta2Type ? ` (${cargo.carreta2Type})` : ''}` : '';

    const implementsBlock = carreta2Str
      ? `🚛 *1º Implemento:* ${carreta1Str}\n🚛 *2º Implemento:* ${carreta2Str}`
      : `🚛 *Carreta:* ${carreta1Str}`;

    return `🚚 *ORDEM DE CARREGAMENTO: ${cargo.ocNumber}*
📅 *Data de Emissão:* ${new Date().toLocaleDateString('pt-BR')}
${cargo.pedidoCliente ? `📋 *Pedido do Cliente:* ${cargo.pedidoCliente}\n` : ''}
👤 *Motorista:* ${cargo.driverName || 'A Definir'}
🚛 *Cavalo:* ${cavaloStr}
${implementsBlock}
📦 *Mercadoria:* ${cargo.productName || 'Não informado'}
⚖️ *Peso Estimado:* ${cargo.weightTons ? `${formatWeightKg(cargo.weightTons)} (${formatWeightTons(cargo.weightTons)})` : 'Não informado'}

📍 *LOCAL DE COLETA / CARREGAMENTO:*
• *Empresa / Fornecedor:* ${cargo.originSupplierName || 'Não informado'}
• *Cidade / UF:* ${cargo.originCityState || 'Não informado'}
• *Endereço:* ${cargo.originAddress || 'Não informado'}
• *Horário / Previsão Coleta:* ${cargo.scheduledLoadingDate ? new Date(cargo.scheduledLoadingDate).toLocaleString('pt-BR') : 'A definir'}
${cargo.collectionNotes ? `• *Instruções de Pátio / EPI / Balança:* ${cargo.collectionNotes}\n` : '• *Instruções de Pátio / EPI / Balança:* Pesagem de tara e bruto obrigatórias. Uso integral de EPI no pátio.\n'}
🏁 *LOCAL DE ENTREGA / DESCARGA:*
• *Destinatário / Cliente:* ${cargo.destinationSupplierName || cargo.clientName || 'Não informado'}
• *Cidade / UF:* ${cargo.destinationCityState || 'Não informado'}
• *Endereço:* ${cargo.destinationAddress || 'Não informado'}
• *Horário / Previsão Entrega:* ${cargo.scheduledDeliveryDate ? new Date(cargo.scheduledDeliveryDate).toLocaleString('pt-BR') : 'A definir'}
${cargo.deliveryInstructions ? `• *Instruções de Descarga / Canhoto:* ${cargo.deliveryInstructions}\n` : '• *Instruções de Descarga / Canhoto:* Obter carimbo da portaria com data, hora e assinatura legível no canhoto da NF-e.\n'}
📎 *Nota:* O arquivo PDF oficial da Ordem de Carregamento (*${cargo.ocNumber}.pdf*) foi gerado e acompanha este envio.

_CargaFret Logística & Transportes_`;
  };

  return (
    <LogisticsContext.Provider
      value={{
        companyProfile,
        updateCompanyProfile,
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
        freightRates,
        addFreightRate,
        updateFreightRate,
        deleteFreightRate,
        cargos,
        addCargo,
        addCargosBatch,
        updateCargo,
        deleteCargo,
        cancelCargo,
        updateCargoStatus,
        updateCargoPaymentStatus,
        updateCargoOCStatus,
        getNextAvailableOcNumber,
        assignVehicleToCargo,
        occurrences,
        addOccurrence,
        updateOccurrence,
        deleteOccurrence,
        dailyStayFees,
        addDailyStayFee,
        updateDailyStayFee,
        deleteDailyStayFee,
        resetToSampleData,
        exportDatabaseJson,
        importDatabaseJson,
        generateWhatsAppDispatchText,
        currentUser,
        isAuthLoading,
        isLoggingIn,
        isSheetsConnected,
        isWriteAuthorized,
        isSyncing,
        lastSyncTime,
        spreadsheetId,
        spreadsheetUrl,
        syncError,
        loginWithGoogle,
        logoutGoogle,
        syncNow,
        syncDriversNow,
        syncAllToSheets,
        connectSpreadsheetById,
        clearSyncError,
        appendRowDirect,
        appendRowsDirect,
        isCloudSyncModalOpen,
        setIsCloudSyncModalOpen,
        cloudSyncNotice,
        setCloudSyncNotice,
      }}
    >
      {children}
    </LogisticsContext.Provider>
  );
};

export const useLogistics = () => {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
};
