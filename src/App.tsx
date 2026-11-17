import React, { useState } from 'react';
import { LogisticsProvider, useLogistics } from './context/LogisticsContext';
import { HeaderNav } from './components/layout/HeaderNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { KanbanBoard } from './components/cargas/KanbanBoard';
import { OrdemCarregamentoView } from './components/ordemCarregamento/OrdemCarregamentoView';
import { OcorrenciasView } from './components/ocorrencias/OcorrenciasView';
import { CalculoDiariasView } from './components/diarias/CalculoDiariasView';
import { TabelaFretesView } from './components/fretes/TabelaFretesView';
import { CadastrosView } from './components/cadastros/CadastrosView';
import { ControleViagensView } from './components/viagens/ControleViagensView';
import { NovaCargaModal } from './components/cargas/NovaCargaModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { CloudSyncModal } from './components/settings/CloudSyncModal';
import { CargoTrip } from './types/logistics';
import {
  Table,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Zap,
} from 'lucide-react';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isNovaCargaOpen, setIsNovaCargaOpen] = useState(false);
  const [cargoToEdit, setCargoToEdit] = useState<CargoTrip | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    isSheetsConnected,
    isWriteAuthorized,
    isSyncing,
    lastSyncTime,
    spreadsheetUrl,
    syncNow,
    isCloudSyncModalOpen,
    setIsCloudSyncModalOpen,
    cloudSyncNotice,
  } = useLogistics();

  // Cross-component cargo selection for actions
  const [selectedCargoForAction, setSelectedCargoForAction] = useState<CargoTrip | null>(null);

  const handleOpenNovaCarga = (cargo?: CargoTrip) => {
    setCargoToEdit(cargo || null);
    setIsNovaCargaOpen(true);
  };

  const handleOpenDocFromChild = (cargo: CargoTrip) => {
    setSelectedCargoForAction(cargo);
    setCurrentTab('ordens');
  };

  const handleOpenWhatsAppFromChild = (cargo: CargoTrip) => {
    setSelectedCargoForAction(cargo);
    setCurrentTab('ordens');
  };

  const handleOpenOcorrenciaFromChild = (cargo: CargoTrip) => {
    setSelectedCargoForAction(cargo);
    setCurrentTab('ocorrencias');
  };

  const handleOpenDiariaFromChild = (cargo: CargoTrip) => {
    setSelectedCargoForAction(cargo);
    setCurrentTab('diarias');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* Top Header & Sticky Navigation */}
      <HeaderNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedCargoForAction(null);
          setCurrentTab(tab);
        }}
        onOpenNovaCarga={() => handleOpenNovaCarga()}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Google Sheets Direct Status Bar (Liberado para a Equipe) */}
      <div className="bg-slate-50 border-b border-slate-200/90 px-4 py-1.5 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>
              Planilha Oficial:{' '}
              <strong className="text-slate-800">CargaFret - Base de Dados Operacional (Nova)</strong>
            </span>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span>✓</span> Sincronização em Tempo Real (Modo Aberto)
            </span>
            {lastSyncTime && (
              <span className="text-slate-400 hidden sm:inline">
                · Atualizado às {lastSyncTime.toLocaleTimeString('pt-BR')}
              </span>
            )}
            {isSyncing && (
              <span className="text-indigo-600 font-medium flex items-center gap-1 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Gravando / Sincronizando com Google Sheets...
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCloudSyncModalOpen(true)}
              className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              title="Configurar Webhook ou Conta Google para gravação"
            >
              <Zap className="w-3 h-3 text-emerald-600" />
              <span>Configurar Gravação</span>
            </button>

            <button
              onClick={syncNow}
              disabled={isSyncing}
              className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              title="Recarregar dados mais recentes da Planilha Google"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Sincronizar Agora</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onOpenNovaCarga={() => handleOpenNovaCarga()}
            onOpenDoc={handleOpenDocFromChild}
          />
        )}

        {currentTab === 'cargas' && (
          <KanbanBoard
            onOpenNovaCarga={() => handleOpenNovaCarga()}
            onOpenDoc={handleOpenDocFromChild}
            onOpenWhatsApp={handleOpenWhatsAppFromChild}
            onOpenOcorrencia={handleOpenOcorrenciaFromChild}
            onOpenDiaria={handleOpenDiariaFromChild}
            onEditCargo={(cargo) => handleOpenNovaCarga(cargo)}
          />
        )}

        {currentTab === 'viagens' && <ControleViagensView />}

        {currentTab === 'ordens' && (
          <OrdemCarregamentoView
            onOpenNovaCarga={() => handleOpenNovaCarga()}
            selectedCargoFromParent={selectedCargoForAction}
          />
        )}

        {currentTab === 'ocorrencias' && (
          <OcorrenciasView
            selectedCargoFromParent={selectedCargoForAction}
            onClearSelectedCargo={() => setSelectedCargoForAction(null)}
          />
        )}

        {currentTab === 'diarias' && (
          <CalculoDiariasView
            selectedCargoFromParent={selectedCargoForAction}
            onClearSelectedCargo={() => setSelectedCargoForAction(null)}
          />
        )}

        {currentTab === 'fretes' && <TabelaFretesView />}

        {currentTab === 'cadastros' && <CadastrosView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>CargaFret</strong> · Gestão de Cargas, Fretamentos e Emissão de O.C.
          </div>
          <div className="text-[11px] text-slate-400">
            Em conformidade com a Lei nº 11.442/07 e Lei nº 13.103/15 (Estadias e Diárias)
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <NovaCargaModal
        isOpen={isNovaCargaOpen}
        onClose={() => {
          setIsNovaCargaOpen(false);
          setCargoToEdit(null);
        }}
        cargoToEdit={cargoToEdit}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        noticeMessage={cloudSyncNotice}
      />
    </div>
  );
}

export default function App() {
  return (
    <LogisticsProvider>
      <AppContent />
    </LogisticsProvider>
  );
}
