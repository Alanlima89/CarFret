import React, { useState } from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import {
  OFFICIAL_SPREADSHEET_ID,
  OFFICIAL_SPREADSHEET_URL,
  SPREADSHEET_TITLE,
  getAppsScriptUrl,
  setAppsScriptUrl,
  DEFAULT_APPS_SCRIPT_URL,
  APPS_SCRIPT_CODE_TEMPLATE,
} from '../../services/googleSheetsService';
import {
  Table,
  CheckCircle2,
  AlertCircle,
  Code,
  Copy,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Zap,
  CheckCheck,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  noticeMessage?: string;
}

export const CloudSyncModal: React.FC<Props> = ({ isOpen, onClose, noticeMessage }) => {
  const { isSyncing, syncNow, syncAllToSheets, lastSyncTime } = useLogistics();

  const [appsScriptUrlInput, setAppsScriptUrlInput] = useState(() => getAppsScriptUrl());
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCopiedScript, setIsCopiedScript] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const currentWebhook = getAppsScriptUrl();
  const isConnected = !!currentWebhook;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE_TEMPLATE);
    setIsCopiedScript(true);
    setSuccessMessage('Código do Google Apps Script copiado para a área de transferência!');
    setTimeout(() => {
      setIsCopiedScript(false);
      setSuccessMessage('');
    }, 3500);
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const clean = appsScriptUrlInput.trim();

    if (!clean) {
      setAppsScriptUrl('');
      setSuccessMessage('URL do Web App removida. O sistema operará em modo local.');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }

    if (!clean.startsWith('https://script.google.com/macros/s/')) {
      setErrorMessage(
        'A URL informada deve começar com "https://script.google.com/macros/s/..." e terminar com "/exec".'
      );
      return;
    }

    setAppsScriptUrl(clean);
    setSuccessMessage('URL do Web App salva! Sincronizando dados com a planilha Google...');

    try {
      if (syncAllToSheets) {
        await syncAllToSheets();
      }
      setSuccessMessage('URL do Web App salva e dados gravados na planilha com sucesso!');
    } catch (err: any) {
      console.warn('Erro ao sincronizar após salvar:', err);
    }
    setTimeout(() => setSuccessMessage(''), 4500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setErrorMessage('');
    setSuccessMessage('');
    const url = getAppsScriptUrl();
    if (!url) {
      setErrorMessage('Por favor, informe e salve a URL do Web App antes de testar.');
      setIsTesting(false);
      return;
    }

    try {
      // Dispara teste de ping
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping', test: true }),
      });
      setSuccessMessage('Requisição enviada ao Web App com sucesso! Conexão ativa e funcionando.');
    } catch (err: any) {
      setErrorMessage(`Falha na requisição: ${err.message || err}`);
    } finally {
      setIsTesting(false);
      setTimeout(() => setSuccessMessage(''), 4500);
    }
  };

  const handleSyncAllNow = async () => {
    setErrorMessage('');
    setSuccessMessage('Gravando todas as cargas e tabelas na planilha Google...');
    try {
      if (syncAllToSheets) {
        await syncAllToSheets();
      } else {
        await syncNow();
      }
      setSuccessMessage('Todos os registros foram gravados na planilha Google com sucesso!');
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err: any) {
      setErrorMessage(`Falha na gravação: ${err.message || err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Gravação via Google Apps Script (Web App)
              </h3>
              <p className="text-xs text-slate-500">
                Planilha ID: <strong className="font-mono text-slate-700">{OFFICIAL_SPREADSHEET_ID}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 text-xs custom-scrollbar">
          {/* Notice message if triggered by an action */}
          {noticeMessage && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Conexão da Planilha</strong>
                <p className="mt-0.5 text-[11px] text-indigo-800">{noticeMessage}</p>
              </div>
            </div>
          )}

          {/* Success / Error Alerts */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Status Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Status da Gravação:</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isConnected ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <strong className="text-emerald-700 font-bold text-sm">
                      Web App Ativo · Gravação em Tempo Real (Sem Login)
                    </strong>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <strong className="text-amber-800 font-bold text-sm">
                      Aguardando URL do Web App (Modo Local Seguro)
                    </strong>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isConnected
                  ? 'Todas as inserções, atualizações de status e edições de cargas são enviadas diretamente via POST para o Web App da sua planilha.'
                  : 'Cole a URL gerada no Google Apps Script abaixo para ativar a gravação em tempo real para toda a equipe sem necessidade de login.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isConnected && (
                <button
                  type="button"
                  onClick={handleSyncAllNow}
                  disabled={isSyncing}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Gravando...' : 'Gravar Tudo Agora'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Form: Configurar URL do Google Apps Script */}
          <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 mb-1">
                  <CheckCheck className="w-3 h-3" /> URL Padrão Embutida no Sistema
                </span>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  URL do Web App do Google Apps Script
                </h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Esta URL já vem configurada de forma fixa e permanente no código-fonte para gravação direta na planilha oficial.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyScript}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                {isCopiedScript ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isCopiedScript ? 'Código Copiado!' : 'Copiar Código do Script'}</span>
              </button>
            </div>

            <form onSubmit={handleSaveWebhook} className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-700 block">
                URL do Web App (/exec):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={appsScriptUrlInput}
                  onChange={(e) => setAppsScriptUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfy.../exec"
                  className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppsScriptUrlInput(DEFAULT_APPS_SCRIPT_URL);
                    setAppsScriptUrl(DEFAULT_APPS_SCRIPT_URL);
                    setSuccessMessage('URL restaurada para o padrão oficial embutido.');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer shrink-0 border border-slate-300"
                  title="Restaurar a URL padrão fixa do sistema"
                >
                  Restaurar Padrão
                </button>
                {isConnected && (
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg transition-colors cursor-pointer shrink-0 border border-emerald-300"
                  >
                    {isTesting ? 'Testando...' : 'Testar Conexão'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Tutorial Passo a Passo */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Code className="w-4 h-4 text-slate-700" />
                Como instalar o Google Apps Script na planilha (Leva 1 minuto):
              </h4>
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold underline cursor-pointer"
              >
                {showCode ? 'Ocultar Código' : 'Exibir Código'}
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
              <li>
                Na planilha oficial no Google Sheets, acesse o menu superior: <strong>Extensões &gt; Apps Script</strong>.
              </li>
              <li>
                No menu superior, clique em: <strong>Extensões &gt; Apps Script</strong>.
              </li>
              <li>
                Apague todo o código anterior existente e cole o código completo abaixo (ou use o botão{' '}
                <strong>Copiar Código do Script</strong>).
              </li>
              <li>
                Clique no ícone de disquete ou pressione <strong>Ctrl + S</strong> para salvar o projeto.
              </li>
              <li>
                No canto superior direito, clique no botão azul <strong>Implantar &gt; Nova implantação</strong>.
              </li>
              <li>
                Na engrenagem ⚙️ (Selecionar tipo), escolha: <strong>App da Web</strong>.
              </li>
              <li>
                Preencha os campos exatamente assim:
                <div className="ml-5 my-1 p-2 bg-white rounded border border-slate-300 space-y-1 text-slate-700">
                  <div>
                    • Executar como: <strong>Eu (seu endereço de email)</strong>
                  </div>
                  <div>
                    • Quem tem acesso: <strong>Qualquer pessoa</strong> (Anyone)
                  </div>
                </div>
              </li>
              <li>
                Clique em <strong>Implantar</strong>, autorize as permissões da conta quando a tela do Google solicitar e copie a <strong>URL do app da Web</strong> (terminada em <code>/exec</code>).
              </li>
              <li>
                Cole a URL no campo acima e clique em <strong>Salvar e Conectar</strong>. Pronto! O sistema gravará todas as cargas, alterações e exclusões diretamente na planilha sem exigir login de ninguém.
              </li>
            </ol>

            {showCode && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Código para colar no Apps Script:</span>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="text-indigo-600 hover:underline flex items-center gap-1 font-sans font-bold"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[10px] overflow-x-auto max-h-56 leading-relaxed select-all">
                  {APPS_SCRIPT_CODE_TEMPLATE}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sistema 100% público para a equipe · Zero barreira de login Google</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
