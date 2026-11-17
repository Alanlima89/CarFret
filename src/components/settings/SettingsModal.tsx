import React, { useState } from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import { CompanyProfile } from '../../types/logistics';
import {
  OFFICIAL_SPREADSHEET_ID,
  SPREADSHEET_TITLE,
  STORAGE_APPS_SCRIPT_KEY,
  APPS_SCRIPT_CODE_TEMPLATE,
} from '../../services/googleSheetsService';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  X,
  Building,
  CheckCircle2,
  Table,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Database,
  Link2,
  Code,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    companyProfile,
    updateCompanyProfile,
    exportDatabaseJson,
    importDatabaseJson,
    resetToSampleData,
    currentUser,
    isSheetsConnected,
    isSyncing,
    lastSyncTime,
    spreadsheetId,
    spreadsheetUrl,
    syncError,
    syncNow,
    connectSpreadsheetById,
  } = useLogistics();

  const [formData, setFormData] = useState<CompanyProfile>(companyProfile);
  const [successMessage, setSuccessMessage] = useState('');
  const [customSheetIdInput, setCustomSheetIdInput] = useState('');
  const [showCustomSheetInput, setShowCustomSheetInput] = useState(false);
  const [customSheetError, setCustomSheetError] = useState('');

  // Google Apps Script Webhook State (Gravação Pública Direta)
  const [appsScriptUrlInput, setAppsScriptUrlInput] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_APPS_SCRIPT_KEY) || ''
      : '';
  });
  const [showAppsScriptGuide, setShowAppsScriptGuide] = useState(false);
  const [isCopiedScript, setIsCopiedScript] = useState(false);

  const handleSaveAppsScriptUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = appsScriptUrlInput.trim();
    if (typeof window !== 'undefined') {
      if (clean) {
        localStorage.setItem(STORAGE_APPS_SCRIPT_KEY, clean);
      } else {
        localStorage.removeItem(STORAGE_APPS_SCRIPT_KEY);
      }
    }
    setSuccessMessage('URL do Webhook do Apps Script salva com sucesso!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const appsScriptCodeSnippet = APPS_SCRIPT_CODE_TEMPLATE;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCodeSnippet);
    setIsCopiedScript(true);
    setTimeout(() => setIsCopiedScript(false), 2500);
  };

  if (!isOpen) return null;

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyProfile(formData);
    setSuccessMessage('Dados da transportadora atualizados e sincronizados com sucesso!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleExport = () => {
    const json = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cargafret-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = importDatabaseJson(content);
      if (ok) {
        setSuccessMessage('Dados importados e sincronizados com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Formato de arquivo JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Deseja realmente limpar a visualização local do seu navegador? A Planilha Google oficial NÃO será apagada.'
      )
    ) {
      resetToSampleData();
      setSuccessMessage('Visualização limpa com sucesso! A Planilha Google oficial foi preservada.');
      setTimeout(() => setSuccessMessage(''), 3000);
      onClose();
    }
  };

  const handleConnectCustomSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSheetError('');
    if (!customSheetIdInput.trim()) return;

    // Extract ID if user pasted full URL
    let cleanId = customSheetIdInput.trim();
    const urlMatch = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      cleanId = urlMatch[1];
    }

    const success = await connectSpreadsheetById(cleanId);
    if (success) {
      setSuccessMessage('Planilha customizada conectada com sucesso!');
      setShowCustomSheetInput(false);
      setCustomSheetIdInput('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setCustomSheetError('Não foi possível acessar a planilha. Verifique as permissões de acesso do Google.');
    }
  };

  const syncedTabsList = [
    { name: 'Cargas_OC', label: 'Cargas e Ordens de Carregamento (O.C.)' },
    { name: 'Motoristas', label: 'Cadastros de Motoristas e Chaves PIX' },
    { name: 'Veiculos_Cavalo', label: 'Cavalos Mecânicos (Frota/Agregados)' },
    { name: 'Veiculos_Carreta', label: 'Carretas e Semi-Reboques' },
    { name: 'Clientes', label: 'Clientes e Tomadores de Frete' },
    { name: 'Parceiros', label: 'Pontos de Coleta, Pátios e Fornecedores' },
    { name: 'Produtos', label: 'Produtos e Mercadorias' },
    { name: 'Tabela_Fretes', label: 'Tabela de Fretes e Tarifas' },
    { name: 'Ocorrencias', label: 'Ocorrências e Custos Extras' },
    { name: 'Diarias_Estadia', label: 'Cálculo de Diárias de Estadia (Lei 13.103)' },
    { name: 'Empresa', label: 'Dados Cadastrais da Transportadora' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Configurações & Integração Google Sheets
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* ================= GOOGLE SHEETS INTEGRATION SECTION ================= */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl border border-indigo-100 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    Persistência Oficial: Google Sheets
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Modo Aberto (Sem Exigência de Login)
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comunicação direta em segundo plano. Qualquer usuário da equipe pode cadastrar e sincronizar dados sem barreiras de autenticação.
                  </p>
                </div>
              </div>
            </div>

            {/* Connected Details */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Modo de Acesso:</span>
                  <span className="font-semibold text-emerald-700 block">
                    Público & Aberto (Equipe CargaFret)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Planilha Vinculada:</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {SPREADSHEET_TITLE}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">ID da Planilha:</span>
                  <span className="font-mono text-[11px] text-slate-600 truncate block">
                    {spreadsheetId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Última Sincronização:</span>
                  <span className="text-slate-800 font-medium">
                    {lastSyncTime ? lastSyncTime.toLocaleTimeString('pt-BR') : 'Recentemente'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">

                <button
                  onClick={syncNow}
                  disabled={isSyncing}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Sincronizando...' : 'Recarregar Planilha Agora'}
                </button>

                <button
                  onClick={() => setShowCustomSheetInput(!showCustomSheetInput)}
                  className="px-2.5 py-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Vincular outro ID
                </button>

                {spreadsheetId !== OFFICIAL_SPREADSHEET_ID && (
                  <button
                    onClick={() => connectSpreadsheetById(OFFICIAL_SPREADSHEET_ID)}
                    className="px-2.5 py-1.5 text-emerald-700 hover:text-emerald-900 bg-emerald-50 border border-emerald-200 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    Restaurar Planilha Oficial Padrão
                  </button>
                )}
              </div>

              {/* Custom Spreadsheet ID Input */}
              {showCustomSheetInput && (
                <form
                  onSubmit={handleConnectCustomSheet}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2 space-y-2"
                >
                  <label className="text-xs font-medium text-slate-700 block">
                    Colar Link ou ID de outra Planilha Google:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSheetIdInput}
                      onChange={(e) => setCustomSheetIdInput(e.target.value)}
                      placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms ou URL inteira"
                      className="flex-1 text-xs bg-white border border-slate-300 rounded p-1.5"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium"
                    >
                      Conectar
                    </button>
                  </div>
                  {customSheetError && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {customSheetError}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Google Apps Script Webhook Configuration */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-indigo-600" />
                    Webhook do Google Apps Script (Gravação Direta na Nuvem)
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Permite que o aplicativo grave na planilha sem pedir login aos usuários.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAppsScriptGuide(!showAppsScriptGuide)}
                  className="text-indigo-600 hover:text-indigo-800 text-xs font-medium underline cursor-pointer"
                >
                  {showAppsScriptGuide ? 'Ocultar Código' : 'Ver Código do Script'}
                </button>
              </div>

              <form onSubmit={handleSaveAppsScriptUrl} className="flex gap-2">
                <input
                  type="url"
                  value={appsScriptUrlInput}
                  onChange={(e) => setAppsScriptUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Salvar Webhook
                </button>
              </form>

              {showAppsScriptGuide && (
                <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-800 text-[11px]">
                      Como ativar o Webhook na sua planilha:
                    </strong>
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {isCopiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopiedScript ? 'Copiado!' : 'Copiar Código'}
                    </button>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                    <li>Abra a planilha no Google Sheets e clique em <strong>Extensões &gt; Apps Script</strong>.</li>
                    <li>Cole o código abaixo e clique em <strong>Implantar &gt; Nova implantação</strong>.</li>
                    <li>Tipo: <strong>App da Web</strong> · Executar como: <strong>Eu</strong> · Quem tem acesso: <strong>Qualquer pessoa</strong>.</li>
                    <li>Copie o link gerado (termina com <code>/exec</code>) e cole no campo acima.</li>
                  </ol>
                  <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-md font-mono text-[10px] overflow-x-auto max-h-40">
                    {appsScriptCodeSnippet}
                  </pre>
                </div>
              )}
            </div>

            {/* List of tabs synchronized */}
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Abas Sincronizadas na Planilha (Tempo Real):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {syncedTabsList.map((tab) => (
                  <div
                    key={tab.name}
                    className="flex items-center gap-2 p-1.5 bg-white/80 rounded border border-slate-200/80 text-[11px]"
                  >
                    <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-[10px]">
                      {tab.name}
                    </span>
                    <span className="text-slate-600 truncate">{tab.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Empresa */}
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-500" />
              Dados da Transportadora (Emissora das O.C.s)
            </h4>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Nome Fantasia / Marca
              </label>
              <input
                type="text"
                required
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded p-2"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Razão Social Completa
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded p-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">CNPJ</label>
                <input
                  type="text"
                  required
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Registro RNTRC (ANTT)
                </label>
                <input
                  type="text"
                  required
                  value={formData.rntrc}
                  onChange={(e) => setFormData({ ...formData, rntrc: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Telefone da Central
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  E-mail Operacional
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Endereço da Sede Operacional
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded p-2"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Responsável pela Expedição / Pátio (Assinatura na O.C.)
              </label>
              <input
                type="text"
                required
                value={formData.dispatcherName}
                onChange={(e) => setFormData({ ...formData, dispatcherName: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded p-2"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium"
            >
              Salvar Dados da Transportadora
            </button>
          </form>

          {/* Backup & Dados */}
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-500" />
              Backup Manual de Segurança (JSON)
            </h4>
            <p className="text-xs text-slate-500">
              Além da sincronização contínua com a Planilha Google, você pode baixar ou carregar um arquivo JSON de backup a qualquer momento.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleExport}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Backup JSON
              </button>

              <label className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Importar Backup JSON
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Dados Padrão
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé Fixo */}
        <div className="shrink-0 px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Fechar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};
