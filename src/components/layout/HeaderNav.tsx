import React from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import {
  Truck,
  LayoutDashboard,
  Trello,
  FileText,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Settings,
  Plus,
  ExternalLink,
  RefreshCw,
  Table,
  Navigation,
} from 'lucide-react';
import { YukaerLogo } from '../ui/YukaerLogo';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNovaCarga: () => void;
  onOpenSettings: () => void;
}

export const HeaderNav: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  onOpenNovaCarga,
  onOpenSettings,
}) => {
  const {
    companyProfile,
    cargos,
    occurrences,
    isSyncing,
    lastSyncTime,
    spreadsheetUrl,
    syncNow,
    setIsCloudSyncModalOpen,
  } = useLogistics();

  const openOccCount = occurrences.filter((o) => o.status !== 'resolvido').length;
  const inTransitCount = cargos.filter((c) => c.cargoStatus === 'em_transito').length;
  const awaitingUnloadCount = cargos.filter((c) => c.cargoStatus === 'aguardando_descarga').length;

  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'cargas', label: 'Painel de Cargas', icon: Trello },
    { id: 'viagens', label: 'Controle Financeiro', icon: Navigation },
    { id: 'ordens', label: 'Ordens de Carregamento', icon: FileText },
    { id: 'ocorrencias', label: 'Ocorrências', icon: AlertTriangle, badge: openOccCount },
    { id: 'diarias', label: 'Cálculo de Diárias', icon: Clock },
    { id: 'fretes', label: 'Tabela de Fretes', icon: DollarSign },
    { id: 'cadastros', label: 'Cadastros Básicos', icon: Users },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden shadow-2xs">
      {/* Barra de Acento Superior no Tom de Azul Yukaer */}
      <div className="h-1 bg-gradient-to-r from-[#0F5897] via-[#146EBA] to-[#38BDF8]" />

      {/* Top Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Novo Logotipo & Identidade Visual Yukaer */}
          <div className="flex items-center min-w-0">
            <YukaerLogo
              size="md"
              badgeText="LOGÍSTICA"
              showBadge={true}
              companyName={companyProfile.tradeName || 'CargaFret · Gestão de Transportes'}
            />
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 border-r border-slate-200 pr-3">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                {inTransitCount} em trânsito
              </span>
              {awaitingUnloadCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1.5 font-medium text-[#1264A6]">
                    <span className="w-2 h-2 rounded-full bg-[#1264A6]"></span>
                    {awaitingUnloadCount} em descarga
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-600 font-semibold">
                {cargos.length} cargas
              </span>
            </div>

            {/* Google Sheets / Apps Script Web App Status (100% Sem Login) */}
            <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-300 rounded-lg px-2 sm:px-2.5 py-1 text-xs shadow-2xs">
              <button
                onClick={() => setIsCloudSyncModalOpen(true)}
                className="flex items-center gap-1.5 hover:opacity-85 transition-opacity cursor-pointer text-left"
                title="Configurações de Gravação via Google Apps Script (Web App). Clique para ver/alterar o link do script."
              >
                <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Table className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <span className="font-bold text-emerald-900 text-[11px] flex items-center gap-1">
                    Planilha Google
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    Apps Script Web App
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-1 pl-1 border-l border-emerald-300/80">
                <button
                  onClick={syncNow}
                  disabled={isSyncing}
                  title={
                    lastSyncTime
                      ? `Última sincronização: ${lastSyncTime.toLocaleTimeString('pt-BR')}. Clique para recarregar.`
                      : 'Sincronizar dados da Planilha Google'
                  }
                  className="p-1 hover:bg-emerald-100 text-emerald-700 rounded transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-700' : ''}`} />
                </button>
              </div>
            </div>

            <button
              onClick={onOpenNovaCarga}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#1264A6] hover:bg-[#0E548E] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Carga / O.C.</span>
              <span className="sm:hidden">Nova Carga</span>
            </button>

            <button
              onClick={onOpenSettings}
              title="Configurações, Google Sheets e Backup"
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shrink-0 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Submenu */}
      <div className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1264A6] shadow-2xs border border-blue-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1264A6]' : 'text-slate-400'}`} />
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
