import {
  CargoTrip,
  Driver,
  VehicleCavalo,
  VehicleCarreta,
  Client,
  Partner,
  Product,
  FreightRate,
  Occurrence,
  DailyStayFee,
  CompanyProfile,
  CargoStatus,
  OCStatus,
  OccurrenceType,
} from '../types/logistics';

// ============================================================================
// CONSTANTES OFICIAIS DA PLANILHA GOOGLE
// ============================================================================
export const OFFICIAL_SPREADSHEET_ID = '17cCFOkGn0Cv2v4nhk1LiLJENWc5A8xusY93KMwEjdJw';
export const OFFICIAL_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${OFFICIAL_SPREADSHEET_ID}/edit`;
export const SPREADSHEET_TITLE = 'CargaFret - Base de Dados Operacional (Nova)';
export const STORAGE_SHEET_ID_KEY = 'cargafret_google_sheet_id';
export const STORAGE_APPS_SCRIPT_KEY = 'cargafret_apps_script_url';
export const STORAGE_PENDING_WRITES_KEY = 'cargafret_pending_writes';

// ============================================================================
// TIPOS E ESTRUTURAS DE DADOS
// ============================================================================
export interface SheetsSyncState {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetTitle: string;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
}

export interface LogisticsDataset {
  companyProfile: CompanyProfile;
  drivers: Driver[];
  cavalos: VehicleCavalo[];
  carretas: VehicleCarreta[];
  clients: Client[];
  partners: Partner[];
  products: Product[];
  freightRates: FreightRate[];
  cargos: CargoTrip[];
  occurrences: Occurrence[];
  dailyStayFees: DailyStayFee[];
}

export interface PendingWriteItem {
  id: string;
  action: 'appendRow' | 'appendRows' | 'writeTab';
  sheetName: string;
  spreadsheetId: string;
  payload: any;
  createdAt: string;
  retryCount: number;
}

// ============================================================================
// ESTRUTURA EXATA DAS 48 COLUNAS DA ABA Cargas_OC (COLS A até AV)
// ============================================================================
export const CARGAS_OC_HEADERS = [
  'ID', // A (0)
  'Nº OC', // B (1)
  'Pedido do Cliente', // C (2)
  'Status Carga', // D (3)
  'Status O.C.', // E (4)
  'Cliente ID', // F (5)
  'Cliente Nome', // G (6)
  'Origem ID', // H (7)
  'Origem Nome', // I (8)
  'Origem Cidade/UF', // J (9)
  'Origem Endereço', // K (10)
  'Destino ID', // L (11)
  'Destino Nome', // M (12)
  'Destino Cidade/UF', // N (13)
  'Destino Endereço', // O (14)
  'Produto ID', // P (15)
  'Produto Nome', // Q (16)
  'Motorista ID', // R (17)
  'Motorista Nome', // S (18)
  'Telefone Motorista', // T (19)
  'PIX Motorista', // U (20)
  'Cavalo ID', // V (21)
  'Placa Cavalo', // W (22)
  'Carreta ID', // X (23)
  'Placa Carreta', // Y (24)
  'Tipo Carreta', // Z (25)
  'Previsão Carregamento', // AA (26)
  'Previsão Entrega', // AB (27)
  'Real Carregamento', // AC (28)
  'Real Aguardando Descarga', // AD (29)
  'Real Entrega', // AE (30)
  'Peso (Ton)', // AF (31)
  'Tipo Frete Empresa', // AG (32)
  'Taxa Frete Empresa', // AH (33)
  'Total Frete Empresa', // AI (34)
  'Adiantamento Empresa', // AJ (35)
  'Saldo Empresa', // AK (36)
  'Tipo Frete Terceiro', // AL (37)
  'Tarifa Terceiro (R$)', // AM (38)
  'Total Frete Terceiro (R$)', // AN (39)
  'Adiantamento Terceiro (R$)', // AO (40)
  'Saldo Terceiro (R$)', // AP (41)
  'Observações Coleta', // AQ (42)
  'Instruções Entrega', // AR (43)
  'Nº CT-e', // AS (44)
  'Nº NF-e', // AT (45)
  'Obs Internas', // AU (46)
  'Data Criação', // AV (47)
  'Pag Adiantamento Terceiro', // AW (48)
  'Pag Saldo Terceiro', // AX (49)
];

export const SHEETS_CONFIG = {
  Cargas_OC: {
    name: 'Cargas_OC',
    endCol: 'AX',
    headers: CARGAS_OC_HEADERS,
  },
  Motoristas: {
    name: 'Motoristas',
    endCol: 'V',
    headers: [
      'ID', // A
      'Nome', // B
      'CPF', // C
      'Nº CNH', // D
      'Categoria CNH', // E
      'Validade CNH', // F
      'Telefone', // G
      'Banco', // H
      'Chave PIX', // I
      'Tipo Chave PIX', // J
      'Status', // K
      'Observações', // L
      'CPF / CNPJ Empresa', // M
      'Razão Social', // N
      'ANTT', // O
      'Cod Banco', // P
      'Banco', // Q
      'Agência', // R
      'Conta', // S
      'Cavalo', // T
      'Carreta', // U
      'TIPO', // V
    ],
  },
  Veiculos_Cavalo: {
    name: 'Veiculos_Cavalo',
    endCol: 'H',
    headers: [
      'ID',
      'Placa',
      'Renavam',
      'Marca/Modelo',
      'Tipo Frota',
      'Ano',
      'Cor',
      'Motorista Padrão ID',
    ],
  },
  Veiculos_Carreta: {
    name: 'Veiculos_Carreta',
    endCol: 'G',
    headers: [
      'ID',
      'Placa',
      'Tipo Carroceria',
      'Capacidade (Ton)',
      'Eixos',
      'Marca/Modelo',
      'Status',
    ],
  },
  Clientes: {
    name: 'Clientes',
    endCol: 'J',
    headers: [
      'ID',
      'Razão Social',
      'Nome Fantasia',
      'CNPJ',
      'Contato',
      'Telefone',
      'Email',
      'Cidade',
      'Estado',
      'Endereço',
    ],
  },
  Parceiros: {
    name: 'Parceiros',
    endCol: 'I',
    headers: [
      'ID',
      'Empresa',
      'CNPJ/CPF',
      'Contato',
      'Telefone',
      'Função',
      'Cidade',
      'Estado',
      'Observações',
    ],
  },
  Produtos: {
    name: 'Produtos',
    endCol: 'D',
    headers: ['ID', 'Nome', 'Unidade', 'Descrição'],
  },
  Tabela_Fretes: {
    name: 'Tabela_Fretes',
    endCol: 'K',
    headers: [
      'ID',
      'Cliente ID',
      'Cliente Nome',
      'Origem Cidade/UF',
      'Destino Cidade/UF',
      'Tipo Cobrança',
      'Valor Unitário',
      'Veículo Exigido',
      'Pedágio Incluso',
      'Validade',
      'Observações',
    ],
  },
  Ocorrencias: {
    name: 'Ocorrencias',
    endCol: 'O',
    headers: [
      'ID',
      'Carga ID',
      'Nº OC',
      'Data',
      'Hora',
      'Tipo',
      'Título',
      'Descrição',
      'Impacto Financeiro',
      'Custo Extra (R$)',
      'Responsável',
      'Status',
      'Resolvido Em',
      'Notas Resolução',
      'Relator',
    ],
  },
  Diarias_Estadia: {
    name: 'Diarias_Estadia',
    endCol: 'R',
    headers: [
      'ID',
      'Carga ID',
      'Nº OC',
      'Motorista',
      'Placa',
      'Tipo Local',
      'Nome Local',
      'Chegada',
      'Saída',
      'Tolerância (h)',
      'Espera Total (h)',
      'Horas Excedentes',
      'Tipo Cobrança',
      'Valor Taxa',
      'Valor Calculado',
      'Valor Aprovado',
      'Status',
      'Observações',
    ],
  },
  Empresa: {
    name: 'Empresa',
    endCol: 'H',
    headers: [
      'Razão Social',
      'Nome Fantasia',
      'CNPJ',
      'RNTRC',
      'Telefone',
      'Email',
      'Endereço',
      'Expedidor Responsável',
    ],
  },
};

// ============================================================================
// CONFIGURAÇÃO DO GOOGLE APPS SCRIPT WEB APP (SEM LOGIN / ACESSO PÚBLICO)
// ============================================================================

/**
 * URL oficial e padrão do Web App do Google Apps Script embutida diretamente no sistema.
 * O sistema já inicializa conectado a esta URL, gravando automaticamente na planilha oficial.
 */
export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzx2zFOynwWRwZrNh7l3nqM5poXWRSCTUchPmSCUIJICCFZaSc-clrC-UnHJSiqzHio/exec';

// Garante que a URL padrão esteja ativa no armazenamento local
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem(STORAGE_APPS_SCRIPT_KEY);
  if (!saved || !saved.trim()) {
    localStorage.setItem(STORAGE_APPS_SCRIPT_KEY, DEFAULT_APPS_SCRIPT_URL);
  }
}

export function getAppsScriptUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_APPS_SCRIPT_KEY);
    if (saved && saved.trim() && saved.startsWith('https://script.google.com/macros/s/')) {
      return saved.trim();
    }
  }
  const envUrl = (import.meta.env?.VITE_APPS_SCRIPT_URL as string) || '';
  if (envUrl && envUrl.trim() && envUrl.startsWith('https://script.google.com/macros/s/')) {
    return envUrl.trim();
  }
  return DEFAULT_APPS_SCRIPT_URL.trim();
}

export function setAppsScriptUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_APPS_SCRIPT_KEY, url.trim());
    } else {
      // Se for limpo, restaura a URL padrão embutida
      localStorage.setItem(STORAGE_APPS_SCRIPT_KEY, DEFAULT_APPS_SCRIPT_URL);
    }
  }
}

/**
 * Código oficial do Google Apps Script para colar em "Extensões > Apps Script"
 */
export const APPS_SCRIPT_CODE_TEMPLATE = `/**
 * ============================================================================
 * CargaFret - Google Apps Script Web App (API de Gravação Pública Sem Login)
 * ============================================================================
 * 
 * Instruções de Implantação:
 * 1. Na planilha Google oficial (ID: ${OFFICIAL_SPREADSHEET_ID}),
 *    acesse o menu: Extensões > Apps Script.
 * 2. Apague qualquer código anterior existente e cole este script completo.
 * 3. Clique no ícone de Salvar (Ctrl+S).
 * 4. No canto superior direito, clique em "Implantar" > "Gerenciar implantações" > ícone do lápis ✏️ (ou "Nova implantação").
 * 5. Crie uma nova versão do Web App:
 *    - Descrição: "CargaFret Webhook API v4"
 *    - Executar como: "Eu (seu email)"
 *    - Quem tem acesso: "Qualquer pessoa" (ou "Anyone")
 * 6. Clique em "Implantar" e conceda as permissões de acesso da conta.
 * 7. Copie a "URL do app da Web" gerada (termina com /exec) e cole no CargaFret!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;
  
  // Trava de concorrência obrigatória: aguarda até 30 segundos
  try {
    lock.waitLock(30000);
    hasLock = true;
  } catch (lockErr) {
    return jsonResponse({
      status: "error",
      message: "Servidor ocupado. Trava de segurança ativa contra concorrência: " + lockErr.toString()
    });
  }
  
  try {
    var contents = e && e.postData ? e.postData.contents : "";
    if (!contents && e && e.parameter && e.parameter.data) {
      contents = e.parameter.data;
    }
    if (!contents) {
      return jsonResponse({ status: "error", message: "Payload vazio recebido." });
    }
    
    var data = JSON.parse(contents);
    var ss = null;
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (activeErr) {}
    
    if (!ss) {
      var targetSpreadsheetId = data.spreadsheetId || "${OFFICIAL_SPREADSHEET_ID}";
      try {
        ss = SpreadsheetApp.openById(targetSpreadsheetId);
      } catch (openErr) {}
    }
    
    if (!ss) {
      return jsonResponse({ status: "error", message: "Planilha não encontrada. Verifique o ID fornecido." });
    }
    
    var sheetName = data.sheetName || "Cargas_OC";
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      inicializarCabecalhoAba(sheet, sheetName);
    }
    
    var action = data.action;
    
    // Ação especial: Configurar cabeçalhos de todas as abas
    if (action === "setupHeaders") {
      configurarEstruturaPlanilha(ss);
      return jsonResponse({ status: "success", message: "Estrutura e cabeçalhos de colunas configurados com sucesso!" });
    }
    
    // 1. Inserir uma linha única (ex: Nova Carga ou Novo Cadastro)
    if (action === "appendRow" && data.row) {
      if (sheetName === "Cargas_OC") {
        garantirCabecalhoCargasOC(sheet);
        
        // Garante que o Nº OC esteja preenchido
        if (!data.row[1] || String(data.row[1]).trim() === "") {
          data.row[1] = obterProximoNumeroOC(sheet);
        }
        
        var targetId = String(data.row[0] || "").trim();
        var targetOC = String(data.row[1] || "").trim();
        var lastRow = sheet.getLastRow();
        var existingRowIndex = -1;
        
        // Verifica se já existe uma linha com o mesmo Nº OC (Col B) ou ID (Col A)
        if (lastRow > 1) {
          var checkRows = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 2)).getValues();
          for (var r = 0; r < checkRows.length; r++) {
            var rowId = String(checkRows[r][0] || "").trim();
            var rowOC = String(checkRows[r][1] || "").trim();
            if ((targetOC && rowOC === targetOC) || (targetId && rowId === targetId)) {
              existingRowIndex = r + 2;
              break;
            }
          }
        }
        
        if (existingRowIndex > 1) {
          // Atualiza registro existente no local correto sem mexer em nenhuma outra linha
          sheet.getRange(existingRowIndex, 1, 1, data.row.length).setValues([data.row]);
        } else {
          // Insere nova linha física logo após a linha 1 de cabeçalho, empurrando as demais com segurança
          sheet.insertRowAfter(1);
          sheet.getRange(2, 1, 1, data.row.length).setValues([data.row]);
        }
        
        // Ordena por Coluna B (Nº OC) do maior para o menor
        ordenarCargasOC(sheet);
        SpreadsheetApp.flush();
        return jsonResponse({
          status: "success",
          message: existingRowIndex > 1 ? "Carga atualizada com sucesso" : "Nova carga inserida com sucesso",
          sheet: sheetName,
          ocNumber: data.row[1]
        });
      }
      
      // Demais abas (Motoristas, etc.)
      if (sheetName === "Motoristas") {
        garantirCabecalhoMotoristas(sheet);
      } else if (sheet.getLastRow() === 0) {
        inicializarCabecalhoAba(sheet, sheetName);
      }
      
      var updated = false;
      var lastR = sheet.getLastRow();
      if (sheetName === "Motoristas" && lastR > 1 && data.row.length > 0) {
        var motId = String(data.row[0] || "").trim();
        var motCpf = data.row.length > 2 ? String(data.row[2] || "").trim() : "";
        if (motId || motCpf) {
          var checkM = sheet.getRange(2, 1, lastR - 1, Math.min(sheet.getLastColumn(), 3)).getValues();
          for (var m = 0; m < checkM.length; m++) {
            var rId = String(checkM[m][0] || "").trim();
            var rCpf = checkM[m].length >= 3 ? String(checkM[m][2] || "").trim() : "";
            if ((motId && rId === motId) || (motCpf && rCpf && rCpf === motCpf)) {
              sheet.getRange(m + 2, 1, 1, data.row.length).setValues([data.row]);
              updated = true;
              break;
            }
          }
        }
      }
      
      if (!updated) {
        sheet.appendRow(data.row);
      }
      SpreadsheetApp.flush();
      return jsonResponse({ status: "success", message: updated ? "Registro atualizado com sucesso" : "Linha gravada com sucesso", sheet: sheetName });
    }
    
    // 2. Inserir lote de linhas
    if (action === "appendRows" && data.rows && data.rows.length > 0) {
      if (sheetName === "Cargas_OC") {
        garantirCabecalhoCargasOC(sheet);
        var lastRowC = sheet.getLastRow();
        var existingIds = {};
        var existingOCs = {};
        if (lastRowC > 1) {
          var checkC = sheet.getRange(2, 1, lastRowC - 1, Math.min(sheet.getLastColumn(), 2)).getValues();
          for (var rc = 0; rc < checkC.length; rc++) {
            var cId = String(checkC[rc][0] || "").trim();
            var cOC = String(checkC[rc][1] || "").trim();
            if (cId) existingIds[cId] = rc + 2;
            if (cOC) existingOCs[cOC] = rc + 2;
          }
        }
        
        var rowsToInsert = [];
        for (var i = 0; i < data.rows.length; i++) {
          var curRow = data.rows[i];
          var curId = String(curRow[0] || "").trim();
          var curOC = String(curRow[1] || "").trim();
          var matchRowIdx = (curOC && existingOCs[curOC]) || (curId && existingIds[curId]);
          if (matchRowIdx) {
            sheet.getRange(matchRowIdx, 1, 1, curRow.length).setValues([curRow]);
          } else {
            rowsToInsert.push(curRow);
          }
        }
        
        if (rowsToInsert.length > 0) {
          sheet.insertRowsAfter(1, rowsToInsert.length);
          sheet.getRange(2, 1, rowsToInsert.length, rowsToInsert[0].length).setValues(rowsToInsert);
        }
        
        ordenarCargasOC(sheet);
        SpreadsheetApp.flush();
        return jsonResponse({ status: "success", message: data.rows.length + " cargas processadas com sucesso", sheet: sheetName });
      }
      
      // Demais abas
      if (sheetName === "Motoristas") {
        garantirCabecalhoMotoristas(sheet);
      } else if (sheet.getLastRow() === 0) {
        inicializarCabecalhoAba(sheet, sheetName);
      }
      for (var j = 0; j < data.rows.length; j++) {
        sheet.appendRow(data.rows[j]);
      }
      SpreadsheetApp.flush();
      return jsonResponse({ status: "success", message: data.rows.length + " linhas adicionadas", sheet: sheetName });
    }
    
    // 3. Atualizar linha específica por ID (Coluna A) ou Nº OC (Coluna B)
    if (action === "updateRow" && data.row) {
      if (sheetName === "Cargas_OC") {
        garantirCabecalhoCargasOC(sheet);
      } else if (sheetName === "Motoristas") {
        garantirCabecalhoMotoristas(sheet);
      }
      
      var targetId = String(data.row[0] || "").trim();
      var targetCol1 = String(data.row[1] || "").trim();
      var targetCol2 = data.row.length > 2 ? String(data.row[2] || "").trim() : "";
      var lastRow = sheet.getLastRow();
      var updated = false;
      
      if (lastRow > 1) {
        var numRows = lastRow - 1;
        var checkCols = Math.min(sheet.getLastColumn(), 3);
        var idColValues = sheet.getRange(2, 1, numRows, checkCols).getValues();
        for (var r = 0; r < idColValues.length; r++) {
          var rowId = String(idColValues[r][0] || "").trim();
          var col1 = String(idColValues[r][1] || "").trim();
          var col2 = checkCols >= 3 ? String(idColValues[r][2] || "").trim() : "";
          if (
            (targetId && rowId === targetId) ||
            (targetCol1 && col1 === targetCol1) ||
            (sheetName === "Motoristas" && targetCol2 && col2 && targetCol2 === col2)
          ) {
            var rowIndex = r + 2;
            sheet.getRange(rowIndex, 1, 1, data.row.length).setValues([data.row]);
            updated = true;
            break;
          }
        }
      }
      
      if (!updated) {
        if (sheetName === "Cargas_OC") {
          sheet.insertRowAfter(1);
          sheet.getRange(2, 1, 1, data.row.length).setValues([data.row]);
        } else {
          sheet.appendRow(data.row);
        }
      }
      if (sheetName === "Cargas_OC") {
        ordenarCargasOC(sheet);
      }
      SpreadsheetApp.flush();
      return jsonResponse({ status: "success", message: updated ? "Linha atualizada" : "Linha inserida", sheet: sheetName });
    }
    
    // 4. Excluir linha por ID ou Nº OC
    if (action === "deleteRow") {
      var delId = String(data.id || "").trim();
      var delOC = String(data.ocNumber || "").trim();
      var lastR = sheet.getLastRow();
      var deleted = false;
      
      if (lastR > 1) {
        var numR = lastR - 1;
        var ids = sheet.getRange(2, 1, numR, Math.min(sheet.getLastColumn(), 2)).getValues();
        for (var k = ids.length - 1; k >= 0; k--) {
          var cId = String(ids[k][0] || "").trim();
          var cOC = String(ids[k][1] || "").trim();
          if ((delId && cId === delId) || (delOC && cOC === delOC)) {
            sheet.deleteRow(k + 2);
            deleted = true;
            break;
          }
        }
      }
      if (deleted && sheetName === "Cargas_OC") {
        ordenarCargasOC(sheet);
      }
      SpreadsheetApp.flush();
      return jsonResponse({ status: "success", message: deleted ? "Linha excluída" : "Linha não encontrada", sheet: sheetName });
    }
    
    // 5. Atualizar/Sobrescrever toda a aba (com proteção total para Cargas_OC contra perdas)
    if (action === "writeTab" && data.rows) {
      if (sheetName === "Cargas_OC") {
        garantirCabecalhoCargasOC(sheet);
        var curLastRow = sheet.getLastRow();
        var existingMap = {};
        if (curLastRow > 1) {
          var curValues = sheet.getRange(2, 1, curLastRow - 1, Math.min(sheet.getLastColumn(), 2)).getValues();
          for (var er = 0; er < curValues.length; er++) {
            var exId = String(curValues[er][0] || "").trim();
            var exOC = String(curValues[er][1] || "").trim();
            if (exId) existingMap[exId] = er + 2;
            if (exOC) existingMap[exOC] = er + 2;
          }
        }
        
        var newRowsToInsert = [];
        for (var w = 0; w < data.rows.length; w++) {
          var rowData = data.rows[w];
          var rowId = String(rowData[0] || "").trim();
          var rowOC = String(rowData[1] || "").trim();
          var matchRow = (rowOC && existingMap[rowOC]) || (rowId && existingMap[rowId]);
          if (matchRow) {
            sheet.getRange(matchRow, 1, 1, rowData.length).setValues([rowData]);
          } else {
            newRowsToInsert.push(rowData);
          }
        }
        
        if (newRowsToInsert.length > 0) {
          sheet.insertRowsAfter(1, newRowsToInsert.length);
          sheet.getRange(2, 1, newRowsToInsert.length, newRowsToInsert[0].length).setValues(newRowsToInsert);
        }
        
        ordenarCargasOC(sheet);
        SpreadsheetApp.flush();
        return jsonResponse({ status: "success", message: "Aba Cargas_OC sincronizada com segurança sem perdas", count: data.rows.length, sheet: sheetName });
      }
      
      // Demais abas cadastrais
      if (sheetName === "Motoristas") {
        garantirCabecalhoMotoristas(sheet);
      } else if (sheet.getLastRow() === 0) {
        inicializarCabecalhoAba(sheet, sheetName);
      }
      
      var currentLastRow = sheet.getLastRow();
      var currentLastCol = Math.max(sheet.getLastColumn() || 1, (data.rows[0] ? data.rows[0].length : 19));
      
      if (currentLastRow > 1) {
        sheet.getRange(2, 1, currentLastRow - 1, currentLastCol).clearContent();
      }
      
      if (data.rows.length > 0) {
        sheet.getRange(2, 1, data.rows.length, data.rows[0].length).setValues(data.rows);
      }
      SpreadsheetApp.flush();
      return jsonResponse({ status: "success", message: "Aba atualizada com sucesso", count: data.rows.length, sheet: sheetName });
    }
    
    return jsonResponse({ status: "ignored", message: "Ação não reconhecida: " + action });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  } finally {
    if (hasLock) {
      try {
        SpreadsheetApp.flush();
      } catch (flushErr) {}
      try {
        lock.releaseLock();
      } catch (releaseErr) {}
    }
  }
}

function doGet(e) {
  var param = e && e.parameter ? e.parameter : {};
  if (param.setup === "1" || param.action === "setup") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      configurarEstruturaPlanilha(ss);
      return jsonResponse({ status: "success", message: "Estrutura e cabeçalhos de colunas configurados com sucesso!" });
    }
  }
  return jsonResponse({
    status: "online",
    app: "CargaFret Apps Script Web App API",
    spreadsheetId: "${OFFICIAL_SPREADSHEET_ID}",
    timestamp: new Date().toISOString()
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Garante e atualiza a estrutura de cabeçalhos de A a V da aba 'Motoristas'.
 */
function garantirCabecalhoMotoristas(sheet) {
  if (!sheet) return;
  var headersMotoristas = [
    "ID",                  // A (1)
    "Nome",                // B (2)
    "CPF",                 // C (3)
    "Nº CNH",              // D (4)
    "Categoria CNH",       // E (5)
    "Validade CNH",        // F (6)
    "Telefone",            // G (7)
    "Banco",               // H (8)
    "Chave PIX",           // I (9)
    "Tipo Chave PIX",      // J (10)
    "Status",              // K (11)
    "Observações",         // L (12)
    "CPF / CNPJ Empresa",  // M (13)
    "Razão Social",        // N (14)
    "ANTT",                // O (15)
    "Cod Banco",           // P (16)
    "Banco",               // Q (17)
    "Agência",             // R (18)
    "Conta",               // S (19)
    "Cavalo",              // T (20)
    "Carreta",             // U (21)
    "TIPO"                 // V (22)
  ];
  
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() < headersMotoristas.length) {
    sheet.getRange(1, 1, 1, headersMotoristas.length).setValues([headersMotoristas]);
    sheet.getRange(1, 1, 1, headersMotoristas.length)
      .setFontWeight("bold")
      .setBackground("#1e3a8a")
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    SpreadsheetApp.flush();
  }
}

/**
 * Garante os cabeçalhos de A até AX (50 colunas) da aba Cargas_OC.
 */
function garantirCabecalhoCargasOC(sheet) {
  if (!sheet) return;
  var headersCargas = [
    "ID", "Nº OC", "Pedido do Cliente", "Status Carga", "Status O.C.",
    "Cliente ID", "Cliente Nome", "Origem ID", "Origem Nome", "Origem Cidade/UF", "Origem Endereço",
    "Destino ID", "Destino Nome", "Destino Cidade/UF", "Destino Endereço",
    "Produto ID", "Produto Nome", "Motorista ID", "Motorista Nome", "Telefone Motorista", "PIX Motorista",
    "Cavalo ID", "Placa Cavalo", "Carreta ID", "Placa Carreta", "Tipo Carreta",
    "Previsão Carregamento", "Previsão Entrega", "Real Carregamento", "Real Aguardando Descarga", "Real Entrega",
    "Peso (Ton)", "Tipo Frete Empresa", "Taxa Frete Empresa", "Total Frete Empresa", "Adiantamento Empresa", "Saldo Empresa",
    "Tipo Frete Terceiro", "Tarifa Terceiro (R$)", "Total Frete Terceiro (R$)", "Adiantamento Terceiro (R$)", "Saldo Terceiro (R$)",
    "Observações Coleta", "Instruções Entrega", "Nº CT-e", "Nº NF-e", "Obs Internas", "Data Criação",
    "Pag Adiantamento Terceiro", "Pag Saldo Terceiro"
  ];
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() < headersCargas.length) {
    sheet.getRange(1, 1, 1, headersCargas.length).setValues([headersCargas]);
    sheet.getRange(1, 1, 1, headersCargas.length)
      .setFontWeight("bold")
      .setBackground("#0f5897")
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    SpreadsheetApp.flush();
  }
}

/**
 * Função utilitária para configurar as colunas A a V da aba 'Motoristas'.
 */
function configurarCabecalhosMotoristas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Motoristas");
  if (!sheet) {
    sheet = ss.insertSheet("Motoristas");
  }
  garantirCabecalhoMotoristas(sheet);
  Logger.log("Aba 'Motoristas' configurada com sucesso com colunas de A a V!");
}

/**
 * Localiza a última linha real preenchida com dados na aba Cargas_OC
 * para evitar intervalos fantasmas ou vazios.
 */
function obterUltimaLinhaReal(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  var colBValues = sheet.getRange(1, 2, lastRow, 1).getValues();
  for (var r = lastRow - 1; r >= 1; r--) {
    var val = String(colBValues[r][0] || "").trim();
    if (val !== "") {
      return r + 1;
    }
  }
  return 1;
}

/**
 * Ordena automaticamente a aba Cargas_OC com base na Coluna B (Nº OC)
 * em ordem decrescente (do maior para o menor / Z->A), garantindo que as O.C.s
 * mais recentes e de numeração maior fiquem sempre no topo (linha 2 em diante).
 */
function ordenarCargasOC(sheet) {
  if (!sheet) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) sheet = ss.getSheetByName("Cargas_OC");
  }
  if (!sheet) return;
  var lastRealRow = obterUltimaLinhaReal(sheet);
  var lastCol = sheet.getLastColumn();
  // Só ordena se houver pelo menos 1 linha de dados além do cabeçalho na linha 1
  if (lastRealRow > 1 && lastCol >= 2) {
    var numRows = lastRealRow - 1;
    var dataRange = sheet.getRange(2, 1, numRows, lastCol);
    // Coluna 2 (Coluna B: Nº OC) com ascending: false (ordem decrescente - maior para o menor)
    dataRange.sort({ column: 2, ascending: false });
  }
}

/**
 * Função utilitária que pode ser executada manualmente no Apps Script
 * para reordenar a aba Cargas_OC por Nº OC (Coluna B) decrescente a qualquer momento.
 */
function ordenarAbaCargasOCManual() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  var sheet = ss.getSheetByName("Cargas_OC");
  if (sheet) {
    ordenarCargasOC(sheet);
    Logger.log("Aba Cargas_OC ordenada com sucesso pela Coluna B (Nº OC) em ordem decrescente!");
  }
}

/**
 * Função completa que configura e formata todas as abas essenciais da planilha CargaFret.
 */
function configurarEstruturaPlanilha(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  
  var sheetM = ss.getSheetByName("Motoristas") || ss.insertSheet("Motoristas");
  garantirCabecalhoMotoristas(sheetM);
  
  var sheetC = ss.getSheetByName("Cargas_OC") || ss.insertSheet("Cargas_OC");
  garantirCabecalhoCargasOC(sheetC);
  ordenarCargasOC(sheetC);
  
  Logger.log("Estrutura das abas Motoristas e Cargas_OC atualizadas com sucesso!");
}

/**
 * Vasculha toda a Coluna B (Nº OC) da aba Cargas_OC na planilha,
 * encontra sempre o maior número atual (MAX) da série OC-2026-XXXX (extraindo os números após o hífen)
 * e retorna o próximo número (MAX + 1).
 * Garante que nunca ocorram números duplicados, independente de ordenações ou exclusões na planilha.
 */
function obterProximoNumeroOC(sheet) {
  if (!sheet) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) sheet = ss.getSheetByName("Cargas_OC");
  }
  var year = new Date().getFullYear();
  if (!sheet) return "OC-" + year + "-0001";
  
  var lastRow = sheet.getLastRow();
  var maxSeq = 0;
  
  if (lastRow > 1) {
    var values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      var val = String(values[i][0] || "").trim();
      if (!val) continue;
      
      // Procura formato OC-YYYY-XXXX (ex: OC-2026-0015)
      var match = val.match(new RegExp("OC-" + year + "-(\\d+)", "i"));
      if (match) {
        var n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxSeq) maxSeq = n;
        continue;
      }
      
      // Fallback: extrai números após o último hífen
      if (val.indexOf("-") !== -1) {
        var parts = val.split("-");
        var lastPart = parts[parts.length - 1].trim();
        var num = parseInt(lastPart, 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    }
  }
  
  var nextSeq = maxSeq + 1;
  var padded = ("0000" + nextSeq).slice(-4);
  return "OC-" + year + "-" + padded;
}

function inicializarCabecalhoAba(sheet, sheetName) {
  if (sheetName === "Motoristas") {
    garantirCabecalhoMotoristas(sheet);
  } else if (sheetName === "Cargas_OC") {
    garantirCabecalhoCargasOC(sheet);
  }
}
`;

/**
 * Envia comando de escrita/append/update/delete para o Web App do Google Apps Script.
 * Usa text/plain e no-cors para evitar bloqueios de CORS pré-flight pelo navegador.
 */
export async function sendToAppsScript(payload: {
  action: 'appendRow' | 'appendRows' | 'writeTab' | 'updateRow' | 'deleteRow' | 'setupHeaders';
  spreadsheetId: string;
  sheetName: string;
  rows?: any[][];
  row?: any[];
  id?: string;
  ocNumber?: string;
}): Promise<boolean> {
  const url = getAppsScriptUrl();
  if (!url) {
    console.info('[CargaFret Apps Script] Nenhuma URL de Web App configurada. Dados salvos localmente.');
    return false;
  }

  // Normalização de URL para garantir endpoint /exec
  let targetUrl = url.trim();
  if (targetUrl.includes('/edit')) {
    targetUrl = targetUrl.replace(/\/edit.*$/, '/exec');
  }
  if (!targetUrl.endsWith('/exec') && !targetUrl.includes('/exec?')) {
    targetUrl = targetUrl.replace(/\/?$/, '/exec');
  }

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      keepalive: true,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.warn('[CargaFret Apps Script] Falha de envio:', err);
    return false;
  }
}

// ============================================================================
// FILA DE PENDÊNCIAS LOCAL (GARANTIA TOTAL CONTRA PERDA DE DADOS)
// ============================================================================
export function getPendingWrites(): PendingWriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_PENDING_WRITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function savePendingWrites(items: PendingWriteItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PENDING_WRITES_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('[CargaFret] Erro ao salvar fila de pendências:', e);
  }
}

export function enqueuePendingWrite(
  action: 'appendRow' | 'appendRows' | 'writeTab',
  sheetName: string,
  spreadsheetId: string,
  payload: any
): void {
  const items = getPendingWrites();
  items.push({
    id: `write-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action,
    sheetName,
    spreadsheetId,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  });
  savePendingWrites(items);
}

/**
 * Descarrega a fila de gravações pendentes assim que uma conexão (Webhook ou Token) estiver ativa.
 */
export async function flushPendingWrites(accessToken?: string | null): Promise<number> {
  const items = getPendingWrites();
  if (items.length === 0) return 0;

  const remaining: PendingWriteItem[] = [];
  let flushedCount = 0;

  for (const item of items) {
    let success = false;
    try {
      if (item.action === 'appendRow') {
        success = await appendRowToSpreadsheet(
          item.spreadsheetId,
          accessToken,
          item.sheetName,
          item.payload,
          true
        );
      } else if (item.action === 'appendRows') {
        success = await appendRowsToSpreadsheet(
          item.spreadsheetId,
          accessToken,
          item.sheetName,
          item.payload,
          true
        );
      } else if (item.action === 'writeTab') {
        success = await saveSingleSheetToSpreadsheet(
          item.spreadsheetId,
          accessToken,
          item.sheetName,
          item.payload,
          true
        );
      }
    } catch {
      success = false;
    }

    if (success) {
      flushedCount++;
    } else {
      item.retryCount += 1;
      remaining.push(item);
    }
  }

  savePendingWrites(remaining);
  return flushedCount;
}

// ============================================================================
// SANITIZAÇÃO DE DADOS PARA O GOOGLE SHEETS
// ============================================================================
export function sanitizeCellValue(val: any): string | number {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    return isNaN(val) || !isFinite(val) ? 0 : val;
  }
  if (typeof val === 'boolean') {
    return val ? 'SIM' : 'NÃO';
  }
  return String(val);
}

export function sanitizeRow(row: any[]): (string | number)[] {
  return (row || []).map(sanitizeCellValue);
}

// ============================================================================
// SERIALIZADORES E DESSERIALIZADORES
// ============================================================================

export const serializeCargo = (c: CargoTrip): any[] => {
  const getStatusString = (status: CargoStatus): string => {
    switch (status) {
      case 'cancelado':
        return 'CANCELADO';
      case 'aguardando_veiculo':
        return 'Aguardando Veículo';
      case 'aguardando_carregar':
        return 'Aguardando Carregar';
      case 'em_transito':
        return 'Em Trânsito';
      case 'aguardando_descarga':
        return 'Aguardando Descarga';
      case 'finalizado':
        return 'Finalizado';
      default:
        return status || 'Aguardando Veículo';
    }
  };

  return [
    /* 0: ID */ sanitizeCellValue(c.id),
    /* 1: Nº OC */ sanitizeCellValue(c.ocNumber),
    /* 2: Pedido do Cliente */ sanitizeCellValue(c.pedidoCliente || ''),
    /* 3: Status Carga */ sanitizeCellValue(getStatusString(c.cargoStatus)),
    /* 4: Status O.C. */ sanitizeCellValue(c.ocStatus || 'gerada'),
    /* 5: Cliente ID */ sanitizeCellValue(c.clientId || ''),
    /* 6: Cliente Nome */ sanitizeCellValue(c.clientName || ''),
    /* 7: Origem ID */ sanitizeCellValue(c.originSupplierId || ''),
    /* 8: Origem Nome */ sanitizeCellValue(c.originSupplierName || ''),
    /* 9: Origem Cidade/UF */ sanitizeCellValue(c.originCityState || ''),
    /* 10: Origem Endereço */ sanitizeCellValue(c.originAddress || ''),
    /* 11: Destino ID */ sanitizeCellValue(c.destinationSupplierId || ''),
    /* 12: Destino Nome */ sanitizeCellValue(c.destinationSupplierName || ''),
    /* 13: Destino Cidade/UF */ sanitizeCellValue(c.destinationCityState || ''),
    /* 14: Destino Endereço */ sanitizeCellValue(c.destinationAddress || ''),
    /* 15: Produto ID */ sanitizeCellValue(c.productId || ''),
    /* 16: Produto Nome */ sanitizeCellValue(c.productName || ''),
    /* 17: Motorista ID */ sanitizeCellValue(c.driverId || ''),
    /* 18: Motorista Nome */ sanitizeCellValue(c.driverName || ''),
    /* 19: Telefone Motorista */ sanitizeCellValue(c.driverPhone || ''),
    /* 20: PIX Motorista */ sanitizeCellValue(c.driverPix || ''),
    /* 21: Cavalo ID */ sanitizeCellValue(c.cavaloId || ''),
    /* 22: Placa Cavalo */ sanitizeCellValue(c.cavaloPlate || ''),
    /* 23: Carreta ID */ sanitizeCellValue(c.carreta2Id ? `${c.carretaId || ''} | ${c.carreta2Id}` : c.carretaId || ''),
    /* 24: Placa Carreta */ sanitizeCellValue(c.carreta2Plate ? `${c.carretaPlate || ''} / ${c.carreta2Plate}` : c.carretaPlate || ''),
    /* 25: Tipo Carreta */ sanitizeCellValue(c.carreta2Type ? `${c.carretaType || ''} / ${c.carreta2Type}` : c.carretaType || ''),
    /* 26: Previsão Carregamento */ sanitizeCellValue(c.scheduledLoadingDate || ''),
    /* 27: Previsão Entrega */ sanitizeCellValue(c.scheduledDeliveryDate || ''),
    /* 28: Real Carregamento */ sanitizeCellValue(c.actualLoadingDate || ''),
    /* 29: Real Aguardando Descarga */ sanitizeCellValue(c.actualAwaitingUnloadDate || ''),
    /* 30: Real Entrega */ sanitizeCellValue(c.actualDeliveryDate || ''),
    /* 31: Peso (Ton) */ Number(c.weightTons) || 0,
    /* 32: Tipo Frete Empresa */ sanitizeCellValue(c.freightType || 'per_ton'),
    /* 33: Taxa Frete Empresa */ Number(c.freightRate) || 0,
    /* 34: Total Frete Empresa */ Number(c.totalFreight) || 0,
    /* 35: Adiantamento Empresa */ Number(c.advanceAmount) || 0,
    /* 36: Saldo Empresa */ Number(c.balanceAmount) || 0,
    /* 37: Tipo Frete Terceiro */ sanitizeCellValue(c.thirdPartyFreightType || 'per_ton'),
    /* 38: Tarifa Terceiro (R$) */ Number(c.thirdPartyFreightRate) || 0,
    /* 39: Total Frete Terceiro (R$) */ Number(c.thirdPartyTotalFreight) || 0,
    /* 40: Adiantamento Terceiro (R$) */ Number(c.thirdPartyAdvanceAmount) || 0,
    /* 41: Saldo Terceiro (R$) */ Number(c.thirdPartyBalanceAmount) || 0,
    /* 42: Observações Coleta */ sanitizeCellValue(c.collectionNotes || ''),
    /* 43: Instruções Entrega */ sanitizeCellValue(c.deliveryInstructions || ''),
    /* 44: Nº CT-e */ sanitizeCellValue(c.ctNumber || ''),
    /* 45: Nº NF-e */ sanitizeCellValue(c.nfNumber || ''),
    /* 46: Obs Internas */ sanitizeCellValue(c.internalNotes || ''),
    /* 47: Data Criação */ sanitizeCellValue(c.createdAt || new Date().toISOString()),
    /* 48: Pag Adiantamento Terceiro (AW) */ sanitizeCellValue(
      c.thirdPartyAdvancePaymentStatus || (c.driverType === 'Frota' ? 'Frota' : (c.ctNumber ? 'Pendente' : ''))
    ),
    /* 49: Pag Saldo Terceiro (AX) */ sanitizeCellValue(
      c.thirdPartyBalancePaymentStatus || (c.driverType === 'Frota' ? 'Frota' : (c.ctNumber ? 'Pendente' : ''))
    ),
  ];
};

export const deserializeCargo = (row: any[]): CargoTrip => {
  const getStatus = (val: string): CargoStatus => {
    const s = String(val || '').toLowerCase().trim();
    if (s.includes('cancel')) return 'cancelado';
    if (s.includes('transito') || s.includes('trânsito')) return 'em_transito';
    if (s.includes('aguardando desc') || s.includes('descarga')) return 'aguardando_descarga';
    if (s.includes('finaliz') || s.includes('conclu') || s.includes('entreg')) return 'finalizado';
    if (s.includes('aguardando carregar') || s.includes('carregar')) return 'aguardando_carregar';
    return 'aguardando_veiculo';
  };

  const getOCStatus = (val: string): OCStatus => {
    const s = String(val || '').toLowerCase().trim();
    if (s.includes('carreg') || s.includes('entreg')) return 'carregado';
    if (s.includes('enviad')) return 'enviada_motorista';
    return 'gerada';
  };

  return {
    id: String(row[0] || `cargo-${Date.now()}`),
    ocNumber: String(row[1] || `OC-${new Date().getFullYear()}-0001`),
    pedidoCliente: String(row[2] || ''),
    cargoStatus: getStatus(row[3]),
    ocStatus: getOCStatus(row[4]),
    clientId: String(row[5] || ''),
    clientName: String(row[6] || ''),
    originSupplierId: String(row[7] || ''),
    originSupplierName: String(row[8] || ''),
    originCityState: String(row[9] || ''),
    originAddress: String(row[10] || ''),
    destinationSupplierId: String(row[11] || ''),
    destinationSupplierName: String(row[12] || ''),
    destinationCityState: String(row[13] || ''),
    destinationAddress: String(row[14] || ''),
    productId: String(row[15] || ''),
    productName: String(row[16] || ''),
    driverId: String(row[17] || ''),
    driverName: String(row[18] || ''),
    driverPhone: String(row[19] || ''),
    driverPix: String(row[20] || ''),
    cavaloId: String(row[21] || ''),
    cavaloPlate: String(row[22] || ''),
    carretaId: String(row[23] || '').includes(' | ') ? String(row[23]).split(' | ')[0] : String(row[23] || ''),
    carreta2Id: String(row[23] || '').includes(' | ') ? String(row[23]).split(' | ')[1] : undefined,
    carretaPlate: String(row[24] || '').includes(' / ') ? String(row[24]).split(' / ')[0].trim() : String(row[24] || ''),
    carreta2Plate: String(row[24] || '').includes(' / ') ? String(row[24]).split(' / ')[1].trim() : undefined,
    carretaType: String(row[25] || '').includes(' / ') ? String(row[25]).split(' / ')[0].trim() : String(row[25] || ''),
    carreta2Type: String(row[25] || '').includes(' / ') ? String(row[25]).split(' / ')[1].trim() : undefined,
    scheduledLoadingDate: String(row[26] || ''),
    scheduledDeliveryDate: String(row[27] || ''),
    actualLoadingDate: row[28] ? String(row[28]) : undefined,
    actualAwaitingUnloadDate: row[29] ? String(row[29]) : undefined,
    actualDeliveryDate: row[30] ? String(row[30]) : undefined,
    weightTons: Number(row[31]) || 0,
    freightType: (row[32] as any) || 'per_ton',
    freightRate: Number(row[33]) || 0,
    totalFreight: Number(row[34]) || 0,
    advanceAmount: Number(row[35]) || 0,
    balanceAmount: Number(row[36]) || 0,
    thirdPartyFreightType: (row[37] as any) || 'per_ton',
    thirdPartyFreightRate: Number(row[38]) || 0,
    thirdPartyTotalFreight: Number(row[39]) || 0,
    thirdPartyAdvanceAmount: Number(row[40]) || 0,
    thirdPartyBalanceAmount: Number(row[41]) || 0,
    collectionNotes: String(row[42] || ''),
    deliveryInstructions: String(row[43] || ''),
    ctNumber: row[44] ? String(row[44]) : undefined,
    nfNumber: row[45] ? String(row[45]) : undefined,
    internalNotes: row[46] ? String(row[46]) : undefined,
    createdAt: String(row[47] || new Date().toISOString()),
    thirdPartyAdvancePaymentStatus: row[48] ? String(row[48]) : undefined,
    thirdPartyBalancePaymentStatus: row[49] ? String(row[49]) : undefined,
  };
};

export const serializeDriver = (d: Driver): any[] => [
  /* A (0): ID */ sanitizeCellValue(d.id),
  /* B (1): Nome */ sanitizeCellValue(d.name),
  /* C (2): CPF */ sanitizeCellValue(d.cpf),
  /* D (3): Nº CNH */ sanitizeCellValue(d.cnhNumber),
  /* E (4): Categoria CNH */ sanitizeCellValue(d.cnhCategory),
  /* F (5): Validade CNH */ sanitizeCellValue(d.cnhExpiration),
  /* G (6): Telefone */ sanitizeCellValue(d.phone),
  /* H (7): Banco */ sanitizeCellValue(d.bankName || ''),
  /* I (8): Chave PIX */ sanitizeCellValue(d.pixKey),
  /* J (9): Tipo Chave PIX */ sanitizeCellValue(d.pixKeyType),
  /* K (10): Status */ sanitizeCellValue(d.status),
  /* L (11): Observações */ sanitizeCellValue(d.notes || ''),
  /* M (12): CPF / CNPJ Empresa */ sanitizeCellValue(d.cnpjCpfEmpresa || ''),
  /* N (13): Razão Social */ sanitizeCellValue(d.razaoSocial || ''),
  /* O (14): ANTT */ sanitizeCellValue(d.antt || ''),
  /* P (15): Cod Banco */ sanitizeCellValue(d.bankCode || ''),
  /* Q (16): Banco */ sanitizeCellValue(d.bankName || ''),
  /* R (17): Agência */ sanitizeCellValue(d.bankAgency || ''),
  /* S (18): Conta */ sanitizeCellValue(d.bankAccount || ''),
  /* T (19): Cavalo */ sanitizeCellValue(d.defaultCavaloPlate || ''),
  /* U (20): Carreta */ sanitizeCellValue(d.defaultCarretaPlate || ''),
  /* V (21): TIPO */ sanitizeCellValue(d.driverType || 'Terceiro'),
];

export const deserializeDriver = (row: any[]): Driver => ({
  id: String(row[0] || `drv-${Date.now()}`),
  name: String(row[1] || ''),
  cpf: String(row[2] || ''),
  cnhNumber: String(row[3] || ''),
  cnhCategory: (row[4] ? String(row[4]) : 'E') as any,
  cnhExpiration: String(row[5] || ''),
  phone: String(row[6] || ''),
  bankName: String(row[16] || row[7] || ''),
  pixKey: String(row[8] || ''),
  pixKeyType: (row[9] ? String(row[9]) : 'CPF') as any,
  status: (row[10] ? String(row[10]) : 'active') as any,
  notes: String(row[11] || ''),
  cnpjCpfEmpresa: String(row[12] || ''),
  razaoSocial: String(row[13] || ''),
  antt: String(row[14] || ''),
  bankCode: String(row[15] || ''),
  bankAgency: String(row[17] || ''),
  bankAccount: String(row[18] || ''),
  defaultCavaloPlate: row[19] ? String(row[19]) : '',
  defaultCarretaPlate: row[20] ? String(row[20]) : '',
  driverType: row[21] && String(row[21]).toLowerCase().includes('frota') ? 'Frota' : 'Terceiro',
});

export const serializeCavalo = (c: VehicleCavalo): any[] => [
  sanitizeCellValue(c.id),
  sanitizeCellValue(c.plate),
  sanitizeCellValue(c.renavam),
  sanitizeCellValue(c.brandModel),
  sanitizeCellValue(c.fleetType),
  Number(c.year) || 2024,
  sanitizeCellValue(c.color),
  sanitizeCellValue(c.driverIdDefault || ''),
];

export const deserializeCavalo = (row: any[]): VehicleCavalo => ({
  id: row[0] || `cav-${Date.now()}`,
  plate: row[1] || '',
  renavam: row[2] || '',
  brandModel: row[3] || '',
  fleetType: (row[4] as any) || 'Frota Própria',
  year: Number(row[5]) || 2024,
  color: row[6] || '',
  driverIdDefault: row[7] || undefined,
});

export const serializeCarreta = (c: VehicleCarreta): any[] => [
  sanitizeCellValue(c.id),
  sanitizeCellValue(c.plate),
  sanitizeCellValue(c.bodyType),
  Number(c.capacityTons) || 32,
  Number(c.axles) || 3,
  sanitizeCellValue(c.brandModel),
  sanitizeCellValue(c.status),
];

export const deserializeCarreta = (row: any[]): VehicleCarreta => ({
  id: row[0] || `car-${Date.now()}`,
  plate: row[1] || '',
  bodyType: (row[2] as any) || 'Graneleira',
  capacityTons: Number(row[3]) || 32,
  axles: Number(row[4]) || 3,
  brandModel: row[5] || '',
  status: (row[6] as any) || 'disponivel',
});

export const serializeClient = (c: Client): any[] => [
  sanitizeCellValue(c.id),
  sanitizeCellValue(c.companyName),
  sanitizeCellValue(c.tradeName),
  sanitizeCellValue(c.cnpj),
  sanitizeCellValue(c.contactPerson),
  sanitizeCellValue(c.phone),
  sanitizeCellValue(c.email),
  sanitizeCellValue(c.addressCity),
  sanitizeCellValue(c.addressState),
  sanitizeCellValue(c.addressStreet),
];

export const deserializeClient = (row: any[]): Client => ({
  id: row[0] || `cli-${Date.now()}`,
  companyName: row[1] || '',
  tradeName: row[2] || '',
  cnpj: row[3] || '',
  contactPerson: row[4] || '',
  phone: row[5] || '',
  email: row[6] || '',
  addressCity: row[7] || '',
  addressState: row[8] || '',
  addressStreet: row[9] || '',
});

export const serializePartner = (p: Partner): any[] => [
  sanitizeCellValue(p.id),
  sanitizeCellValue(p.companyName),
  sanitizeCellValue(p.cnpjCpf),
  sanitizeCellValue(p.contactPerson),
  sanitizeCellValue(p.phone),
  sanitizeCellValue(p.role),
  sanitizeCellValue(p.addressCity),
  sanitizeCellValue(p.addressState),
  sanitizeCellValue(p.notes || ''),
];

export const deserializePartner = (row: any[]): Partner => ({
  id: row[0] || `par-${Date.now()}`,
  companyName: row[1] || '',
  cnpjCpf: row[2] || '',
  contactPerson: row[3] || '',
  phone: row[4] || '',
  role: (row[5] as any) || 'Origem/Carregamento',
  addressCity: row[6] || '',
  addressState: row[7] || '',
  notes: row[8] || '',
});

export const serializeProduct = (p: Product): any[] => [
  sanitizeCellValue(p.id),
  sanitizeCellValue(p.name),
  sanitizeCellValue(p.unit),
  sanitizeCellValue(p.description || ''),
];

export const deserializeProduct = (row: any[]): Product => ({
  id: row[0] || `prod-${Date.now()}`,
  name: row[1] || '',
  unit: (row[2] as any) || 'ton',
  description: row[3] || '',
});

export const serializeFreightRate = (f: FreightRate): any[] => [
  sanitizeCellValue(f.id),
  sanitizeCellValue(f.clientId),
  sanitizeCellValue(f.clientName),
  sanitizeCellValue(f.originCityState),
  sanitizeCellValue(f.destinationCityState),
  sanitizeCellValue(f.pricingType),
  Number(f.unitRate) || 0,
  sanitizeCellValue(f.vehicleRequiredType || ''),
  f.tollsIncluded ? 'SIM' : 'NÃO',
  sanitizeCellValue(f.validityDate || ''),
  sanitizeCellValue(f.notes || ''),
];

export const deserializeFreightRate = (row: any[]): FreightRate => ({
  id: row[0] || `fr-${Date.now()}`,
  clientId: row[1] || '',
  clientName: row[2] || '',
  originCityState: row[3] || '',
  destinationCityState: row[4] || '',
  pricingType: (row[5] as any) || 'per_ton',
  unitRate: Number(row[6]) || 0,
  vehicleRequiredType: row[7] || '',
  tollsIncluded: row[8] === 'SIM',
  validityDate: row[9] || undefined,
  notes: row[10] || '',
});

export const serializeOccurrence = (o: Occurrence): any[] => [
  sanitizeCellValue(o.id),
  sanitizeCellValue(o.cargoId),
  sanitizeCellValue(o.ocNumber),
  sanitizeCellValue(o.date),
  sanitizeCellValue(o.time),
  sanitizeCellValue(o.type),
  sanitizeCellValue(o.title),
  sanitizeCellValue(o.description),
  o.financialImpact ? 'SIM' : 'NÃO',
  Number(o.extraCostAmount) || 0,
  sanitizeCellValue(o.impactResponsible),
  sanitizeCellValue(o.status),
  sanitizeCellValue(o.resolvedAt || ''),
  sanitizeCellValue(o.resolutionNotes || ''),
  sanitizeCellValue(o.reporterName || ''),
];

export const deserializeOccurrence = (row: any[]): Occurrence => ({
  id: row[0] || `occ-${Date.now()}`,
  cargoId: row[1] || '',
  ocNumber: row[2] || '',
  date: row[3] || '',
  time: row[4] || '',
  type: (row[5] as OccurrenceType) || 'outros',
  title: row[6] || '',
  description: row[7] || '',
  financialImpact: row[8] === 'SIM',
  extraCostAmount: Number(row[9]) || 0,
  impactResponsible: (row[10] as any) || 'transportadora',
  status: (row[11] as any) || 'aberto',
  resolvedAt: row[12] || undefined,
  resolutionNotes: row[13] || undefined,
  reporterName: row[14] || undefined,
});

export const serializeDailyStay = (d: DailyStayFee): any[] => [
  sanitizeCellValue(d.id),
  sanitizeCellValue(d.cargoId),
  sanitizeCellValue(d.ocNumber),
  sanitizeCellValue(d.driverName),
  sanitizeCellValue(d.vehiclePlate),
  sanitizeCellValue(d.localType),
  sanitizeCellValue(d.locationName),
  sanitizeCellValue(d.arrivalDateTime),
  sanitizeCellValue(d.departureDateTime),
  Number(d.toleranceHours) || 5,
  Number(d.totalWaitHours) || 0,
  Number(d.excessHours) || 0,
  sanitizeCellValue(d.rateType),
  Number(d.rateValue) || 0,
  Number(d.calculatedAmount) || 0,
  Number(d.approvedAmount) || 0,
  sanitizeCellValue(d.status),
  sanitizeCellValue(d.notes || ''),
];

export const deserializeDailyStay = (row: any[]): DailyStayFee => ({
  id: row[0] || `stay-${Date.now()}`,
  cargoId: row[1] || '',
  ocNumber: row[2] || '',
  driverName: row[3] || '',
  vehiclePlate: row[4] || '',
  localType: (row[5] as any) || 'carregamento',
  locationName: row[6] || '',
  arrivalDateTime: row[7] || '',
  departureDateTime: row[8] || '',
  toleranceHours: Number(row[9]) || 5,
  totalWaitHours: Number(row[10]) || 0,
  excessHours: Number(row[11]) || 0,
  rateType: (row[12] as any) || 'diaria_fixa',
  rateValue: Number(row[13]) || 0,
  calculatedAmount: Number(row[14]) || 0,
  approvedAmount: Number(row[15]) || 0,
  status: (row[16] as any) || 'pendente',
  notes: row[17] || '',
});

export const serializeCompany = (c: CompanyProfile): any[] => [
  sanitizeCellValue(c.companyName),
  sanitizeCellValue(c.tradeName),
  sanitizeCellValue(c.cnpj),
  sanitizeCellValue(c.rntrc),
  sanitizeCellValue(c.phone),
  sanitizeCellValue(c.email),
  sanitizeCellValue(c.address),
  sanitizeCellValue(c.dispatcherName),
];

export const deserializeCompany = (row: any[]): CompanyProfile => ({
  companyName: row[0] || '',
  tradeName: row[1] || '',
  cnpj: row[2] || '',
  rntrc: row[3] || '',
  phone: row[4] || '',
  email: row[5] || '',
  address: row[6] || '',
  dispatcherName: row[7] || '',
});

// ============================================================================
// LEITURA DIRETA E PÚBLICA VIA GVIZ (100% CONFIÁVEL, ZERO 403)
// ============================================================================

export function parseGVizCellValue(cell: any): any {
  if (!cell) return '';
  if (cell.f !== undefined && cell.f !== null) {
    if (typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
      return String(cell.f);
    }
  }
  if (cell.v !== undefined && cell.v !== null) {
    if (typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
      const match = cell.v.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
      if (match) {
        const [_, y, m, d, hh, mm] = match;
        if (hh !== undefined) {
          return `${hh.padStart(2, '0')}:${(mm || '0').padStart(2, '0')}`;
        }
        return `${y}-${String(Number(m) + 1).padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    return cell.v;
  }
  return '';
}

export async function fetchSheetTabGViz(
  spreadsheetId: string,
  tabName: string
): Promise<{ rows: any[][] }> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
      tabName
    )}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[CargaFret GViz] Status ${res.status} para aba '${tabName}'`);
      return { rows: [] };
    }
    const text = await res.text();
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);/);
    if (!match || !match[1]) return { rows: [] };

    const json = JSON.parse(match[1]);
    if (!json.table || !json.table.rows) return { rows: [] };

    const rows: any[][] = json.table.rows.map((r: any) =>
      (r.c || []).map(parseGVizCellValue)
    );

    const validRows = rows.filter((r) =>
      r.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );

    return { rows: validRows };
  } catch (err) {
    console.warn(`[CargaFret GViz] Erro ao ler aba '${tabName}':`, err);
    return { rows: [] };
  }
}

export async function readAllDataFromSpreadsheet(
  spreadsheetId: string = OFFICIAL_SPREADSHEET_ID,
  _accessToken?: string | null
): Promise<{ hasData: boolean; data: Partial<LogisticsDataset> }> {
  const targetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
  const dataset: Partial<LogisticsDataset> = {};

  const [
    cargosRes,
    driversRes,
    cavalosRes,
    carretasRes,
    clientsRes,
    partnersRes,
    productsRes,
    freightRatesRes,
    occurrencesRes,
    dailyStayRes,
    companyRes,
  ] = await Promise.all([
    fetchSheetTabGViz(targetId, 'Cargas_OC'),
    fetchSheetTabGViz(targetId, 'Motoristas'),
    fetchSheetTabGViz(targetId, 'Veiculos_Cavalo'),
    fetchSheetTabGViz(targetId, 'Veiculos_Carreta'),
    fetchSheetTabGViz(targetId, 'Clientes'),
    fetchSheetTabGViz(targetId, 'Parceiros'),
    fetchSheetTabGViz(targetId, 'Produtos'),
    fetchSheetTabGViz(targetId, 'Tabela_Fretes'),
    fetchSheetTabGViz(targetId, 'Ocorrencias'),
    fetchSheetTabGViz(targetId, 'Diarias_Estadia'),
    fetchSheetTabGViz(targetId, 'Empresa'),
  ]);

  if (cargosRes.rows.length > 0) {
    dataset.cargos = cargosRes.rows.map(deserializeCargo);
  }
  if (driversRes.rows.length > 0) {
    dataset.drivers = driversRes.rows.map(deserializeDriver);
  }
  if (cavalosRes.rows.length > 0) {
    dataset.cavalos = cavalosRes.rows.map(deserializeCavalo);
  }
  if (carretasRes.rows.length > 0) {
    dataset.carretas = carretasRes.rows.map(deserializeCarreta);
  }
  if (clientsRes.rows.length > 0) {
    dataset.clients = clientsRes.rows.map(deserializeClient);
  }
  if (partnersRes.rows.length > 0) {
    dataset.partners = partnersRes.rows.map(deserializePartner);
  }
  if (productsRes.rows.length > 0) {
    dataset.products = productsRes.rows.map(deserializeProduct);
  }
  if (freightRatesRes.rows.length > 0) {
    dataset.freightRates = freightRatesRes.rows.map(deserializeFreightRate);
  }
  if (occurrencesRes.rows.length > 0) {
    dataset.occurrences = occurrencesRes.rows.map(deserializeOccurrence);
  }
  if (dailyStayRes.rows.length > 0) {
    dataset.dailyStayFees = dailyStayRes.rows.map(deserializeDailyStay);
  }
  if (companyRes.rows.length > 0 && companyRes.rows[0]) {
    dataset.companyProfile = deserializeCompany(companyRes.rows[0]);
  }

  const hasData =
    (dataset.cargos && dataset.cargos.length > 0) ||
    (dataset.drivers && dataset.drivers.length > 0) ||
    (dataset.clients && dataset.clients.length > 0);

  return { hasData: !!hasData, data: dataset };
}

export async function ensureSpreadsheetStructure(
  _spreadsheetId: string,
  _accessToken: string
): Promise<void> {
  // Estrutura já mantida e validada na planilha oficial
}

// ============================================================================
// PIPELINE DE ESCRITA DIRETA VIA GOOGLE APPS SCRIPT WEB APP (ZERO LOGIN)
// ============================================================================

/**
 * Grava uma nova linha na aba especificada da planilha.
 * 1. Sanitiza rigorosamente todos os campos da linha.
 * 2. Envia para o Web App do Google Apps Script (se configurado).
 * 3. Caso offline ou sem URL configurada, retém na fila local para envio automático.
 */
export async function appendRowToSpreadsheet(
  spreadsheetId: string = OFFICIAL_SPREADSHEET_ID,
  _accessToken?: string | null | undefined,
  sheetName: string = 'Cargas_OC',
  row: any[] = [],
  isFlushingQueue = false
): Promise<boolean> {
  const targetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
  const sanitized = sanitizeRow(row);

  const webhookUrl = getAppsScriptUrl();
  if (webhookUrl) {
    const ok = await sendToAppsScript({
      action: 'appendRow',
      spreadsheetId: targetId,
      sheetName,
      row: sanitized,
    });
    if (ok) {
      console.log(`[CargaFret] Linha gravada em '${sheetName}' via Google Apps Script Web App com sucesso.`);
      return true;
    }
  }

  // Se a URL ainda não foi informada ou a requisição falhou temporariamente, enfileira localmente
  if (!isFlushingQueue) {
    enqueuePendingWrite('appendRow', sheetName, targetId, sanitized);
    console.log(`[CargaFret] Linha em '${sheetName}' enfileirada para sincronização.`);
  }

  return false;
}

/**
 * Atualiza uma linha existente na planilha através do Web App.
 */
export async function updateRowInSpreadsheet(
  spreadsheetId: string = OFFICIAL_SPREADSHEET_ID,
  sheetName: string = 'Cargas_OC',
  row: any[] = []
): Promise<boolean> {
  const targetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
  const sanitized = sanitizeRow(row);

  const webhookUrl = getAppsScriptUrl();
  if (webhookUrl) {
    return await sendToAppsScript({
      action: 'updateRow',
      spreadsheetId: targetId,
      sheetName,
      row: sanitized,
    });
  }
  return false;
}

/**
 * Remove uma linha da planilha através do Web App.
 */
export async function deleteRowFromSpreadsheet(
  spreadsheetId: string = OFFICIAL_SPREADSHEET_ID,
  sheetName: string = 'Cargas_OC',
  id: string = '',
  ocNumber?: string
): Promise<boolean> {
  const targetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
  const webhookUrl = getAppsScriptUrl();
  if (webhookUrl) {
    return await sendToAppsScript({
      action: 'deleteRow',
      spreadsheetId: targetId,
      sheetName,
      id,
      ocNumber,
    });
  }
  return false;
}

/**
 * Grava um lote de linhas na aba especificada da planilha.
 */
export async function appendRowsToSpreadsheet(
  spreadsheetId: string = OFFICIAL_SPREADSHEET_ID,
  _accessToken?: string | null | undefined,
  sheetName: string = 'Cargas_OC',
  rows: any[][] = [],
  isFlushingQueue = false
): Promise<boolean> {
  if (!rows || rows.length === 0) return true;
  const targetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
  const sanitizedRows = rows.map(sanitizeRow);

  const webhookUrl = getAppsScriptUrl();
  if (webhookUrl) {
    const ok = await sendToAppsScript({
      action: 'appendRows',
      spreadsheetId: targetId,
      sheetName,
      rows: sanitizedRows,
    });
    if (ok) {
      console.log(`[CargaFret] Lote de ${rows.length} linhas gravado em '${sheetName}' via Web App.`);
      return true;
    }
  }

  if (!isFlushingQueue) {
    enqueuePendingWrite('appendRows', sheetName, targetId, sanitizedRows);
  }

  return false;
}

/**
 * Atualiza todas as linhas de dados de uma aba (mantém o cabeçalho intacto na linha 1).
 */
export async function saveSingleSheetToSpreadsheet(
  spreadsheetId: string = OFFICIAL_SPREADSHEET_ID,
  _accessToken?: string | null | undefined,
  sheetName: string = 'Cargas_OC',
  rows: any[][] = [],
  isFlushingQueue = false
): Promise<boolean> {
  const targetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
  const sanitizedRows = (rows || []).map(sanitizeRow);

  const webhookUrl = getAppsScriptUrl();
  if (webhookUrl) {
    const ok = await sendToAppsScript({
      action: 'writeTab',
      spreadsheetId: targetId,
      sheetName,
      rows: sanitizedRows,
    });
    if (ok) {
      console.log(`[CargaFret] Aba '${sheetName}' sincronizada via Google Apps Script Web App.`);
      return true;
    }
  }

  if (!isFlushingQueue) {
    enqueuePendingWrite('writeTab', sheetName, targetId, sanitizedRows);
  }

  return false;
}

/**
 * Salva todas as 11 tabelas da aplicação na planilha oficial via Apps Script Web App.
 */
export async function saveAllDataToSpreadsheet(
  spreadsheetId: string = OFFICIAL_SPREADSHEET_ID,
  accessToken?: string | null | undefined,
  data?: LogisticsDataset
): Promise<boolean> {
  if (!data) return false;
  const targetId = spreadsheetId || OFFICIAL_SPREADSHEET_ID;
  const updates = [
    { name: 'Cargas_OC', values: data.cargos.map(serializeCargo) },
    { name: 'Motoristas', values: data.drivers.map(serializeDriver) },
    { name: 'Veiculos_Cavalo', values: data.cavalos.map(serializeCavalo) },
    { name: 'Veiculos_Carreta', values: data.carretas.map(serializeCarreta) },
    { name: 'Clientes', values: data.clients.map(serializeClient) },
    { name: 'Parceiros', values: data.partners.map(serializePartner) },
    { name: 'Produtos', values: data.products.map(serializeProduct) },
    { name: 'Tabela_Fretes', values: data.freightRates.map(serializeFreightRate) },
    { name: 'Ocorrencias', values: data.occurrences.map(serializeOccurrence) },
    { name: 'Diarias_Estadia', values: data.dailyStayFees.map(serializeDailyStay) },
    { name: 'Empresa', values: [serializeCompany(data.companyProfile)] },
  ];

  let anySuccess = false;
  for (const update of updates) {
    const ok = await saveSingleSheetToSpreadsheet(targetId, accessToken, update.name, update.values);
    if (ok) anySuccess = true;
  }

  // Tenta descarregar quaisquer itens pendentes
  await flushPendingWrites(accessToken);

  return anySuccess;
}
