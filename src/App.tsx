/**
 * BANDITRADES — Master Application Shell
 * TRADE SMART. MOVE WITH PRECISION.
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar, NavTab } from './components/layout/Sidebar.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { MainDashboard } from './components/dashboard/MainDashboard.tsx';
import { TradeJournal } from './components/journal/TradeJournal.tsx';
import { TradeGradingView } from './components/grading/TradeGradingView.tsx';
import { AnalyticsView } from './components/analytics/AnalyticsView.tsx';
import { ConsistencyView } from './components/consistency/ConsistencyView.tsx';
import { StrategiesView } from './components/strategies/StrategiesView.tsx';
import { AccountsView } from './components/accounts/AccountsView.tsx';
import { MarketIntelligenceView } from './components/market/MarketIntelligenceView.tsx';
import { BanditAiView } from './components/ai/BanditAiView.tsx';
import { ReportsView } from './components/reports/ReportsView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';
import { TradeModal } from './components/journal/TradeModal.tsx';
import { CsvImportExportModal } from './components/csv/CsvImportExportModal.tsx';
import { Trade, TradingStrategy } from './types/index.ts';
import { api } from './services/api.ts';

function BanditAppContent() {
  const { user, loading: authLoading, refreshAccounts } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals & Active Trades
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [selectedTradeForDetail, setSelectedTradeForDetail] = useState<Trade | null>(null);

  // Strategies list for Trade Modal dropdown
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);

  useEffect(() => {
    const fetchStrats = async () => {
      try {
        const s = await api.getStrategies();
        setStrategies(s);
      } catch (err) {
        console.error('Failed to load strategies for modal:', err);
      }
    };
    fetchStrats();
  }, []);

  const handleOpenNewTrade = (tradeToEdit?: Trade) => {
    setEditingTrade(tradeToEdit || null);
    setTradeModalOpen(true);
  };

  const handleSaveTrade = async (tradeData: Partial<Trade>) => {
    if (editingTrade) {
      await api.updateTrade(editingTrade.id, tradeData);
    } else {
      await api.createTrade(tradeData);
    }
    await refreshAccounts();
    setTradeModalOpen(false);
    setEditingTrade(null);
  };

  const handleSelectTradeFromAnywhere = (trade: Trade) => {
    setSelectedTradeForDetail(trade);
    setActiveTab('journal');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#0B0D10] text-slate-900 dark:text-[#F4F6F8]">
      {/* 10-View Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar Navigation conforming to the Top Bar Contract */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenTradeModal={() => handleOpenNewTrade()}
          onOpenCsvModal={() => setCsvModalOpen(true)}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/50 dark:bg-[#0B0D10]">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <MainDashboard
                onOpenTradeModal={() => handleOpenNewTrade()}
                onNavigateTab={tab => setActiveTab(tab)}
                onSelectTrade={handleSelectTradeFromAnywhere}
              />
            )}

            {activeTab === 'journal' && (
              <TradeJournal
                onOpenTradeModal={handleOpenNewTrade}
                onOpenCsvModal={() => setCsvModalOpen(true)}
                selectedTradeFromDash={selectedTradeForDetail}
              />
            )}

            {activeTab === 'analytics' && <AnalyticsView />}

            {activeTab === 'grading' && (
              <TradeGradingView onSelectTrade={handleSelectTradeFromAnywhere} />
            )}

            {activeTab === 'consistency' && <ConsistencyView />}

            {activeTab === 'strategies' && <StrategiesView />}

            {activeTab === 'accounts' && <AccountsView />}

            {activeTab === 'market' && <MarketIntelligenceView />}

            {activeTab === 'ai' && (
              <BanditAiView onSelectTradeId={id => console.log('Selected trade:', id)} />
            )}

            {activeTab === 'reports' && <ReportsView />}

            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Global Trade Modal */}
      <TradeModal
        isOpen={tradeModalOpen}
        onClose={() => {
          setTradeModalOpen(false);
          setEditingTrade(null);
        }}
        onSave={handleSaveTrade}
        editTrade={editingTrade}
        strategies={strategies}
      />

      {/* Global CSV Import Modal */}
      <CsvImportExportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={() => {
          refreshAccounts();
          setActiveTab('journal');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BanditAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
