'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  BookOpen,
  Calendar as CalendarIcon,
  ShieldCheck,
  ClipboardList,
  Calculator,
  Server,
  Crown,
  Plus,
  FileSpreadsheet,
  Zap,
  Globe,
  Coins,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Building2,
  Check,
  Lock,
  Sparkles,
  RefreshCw,
  ChevronDown,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BrokerName, BROKER_PRESETS } from '@/lib/types';
import GlassSelect from '@/components/GlassSelect';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    lang,
    setLang,
    t,
    isCentMode,
    setIsCentMode,
    formatMoney,
    selectedAccountId,
    setSelectedAccountId,
    accounts,
    trades,
    license,
    refreshData,
    autoSyncEnabled,
    setAutoSyncEnabled,
    autoSyncInterval,
    setAutoSyncInterval,
    isAutoSyncing,
    triggerManualSyncAll,
    showAddModal,
    setShowAddModal,
    showImportModal,
    setShowImportModal,
    showAddAccountModal,
    setShowAddAccountModal,
    showReviewModal,
    setShowReviewModal,
    activeReviewTrade,
    setActiveReviewTrade,
    user,
    authLoading,
    previewRole,
    setPreviewRole,
    effectiveRole,
    packageDetails,
    canTest,
    logout
  } = useApp();

  // Modal local forms
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    order_type: 'BUY' as 'BUY' | 'SELL',
    lots: 0.01,
    open_price: 0,
    close_price: 0,
    profit: 0,
    strategy: 'Cent EA Grid',
    session: 'London',
    ticket: '',
  });

  const [reviewForm, setReviewForm] = useState({
    rule_followed: true,
    psychology_state: 'Disciplined',
    mistake_tag: 'None',
    mae: '',
    mfe: '',
    notes: '',
  });

  // Keep reviewForm in sync with activeReviewTrade
  useEffect(() => {
    if (activeReviewTrade) {
      setReviewForm({
        rule_followed: activeReviewTrade.rule_followed !== undefined ? activeReviewTrade.rule_followed : true,
        psychology_state: activeReviewTrade.psychology_state || 'Disciplined',
        mistake_tag: activeReviewTrade.mistake_tag || 'None',
        mae: activeReviewTrade.mae !== undefined ? String(activeReviewTrade.mae) : '',
        mfe: activeReviewTrade.mfe !== undefined ? String(activeReviewTrade.mfe) : '',
        notes: activeReviewTrade.notes || '',
      });
    }
  }, [activeReviewTrade]);

  const [newAccountForm, setNewAccountForm] = useState({
    name: '',
    broker: 'Exness' as BrokerName,
    server: 'Exness-MT5Real9',
    login: '',
    investor_password: '',
    account_type: 'cent' as 'cent' | 'standard',
    leverage: 2000,
    balance: 100000
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [isManualServer, setIsManualServer] = useState<boolean>(false);

  // Custom Glass Dropdown states
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const intervalMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close custom dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (intervalMenuRef.current && !intervalMenuRef.current.contains(event.target as Node)) {
        setShowIntervalMenu(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live TradingView Market Quotes State
  const [tickerQuotes, setTickerQuotes] = useState<Record<string, {
    symbol: string;
    formatted_price: string;
    change: number;
    price: number;
    source: string;
  }>>({
    'XAU/USD': { symbol: 'XAU/USD', formatted_price: '4,070.59', change: -0.43, price: 4070.59, source: 'TradingView (OANDA)' },
    'EUR/USD': { symbol: 'EUR/USD', formatted_price: '1.1137', change: -0.73, price: 1.1137, source: 'TradingView (FX)' },
    'GBP/USD': { symbol: 'GBP/USD', formatted_price: '1.3347', change: -0.75, price: 1.3347, source: 'TradingView (FX)' },
    'BTC/USD': { symbol: 'BTC/USD', formatted_price: '76,008', change: 0.21, price: 76008, source: 'TradingView (Binance)' },
  });
  const [tickerTickStates, setTickerTickStates] = useState<Record<string, 'up' | 'down' | null>>({});

  useEffect(() => {
    let isMounted = true;
    const fetchLiveTicker = async () => {
      try {
        const res = await fetch(`/api/market/ticker?_t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && typeof data === 'object') {
            setTickerQuotes(prev => {
              const newTicks: Record<string, 'up' | 'down' | null> = {};
              ['XAU/USD', 'EUR/USD', 'GBP/USD', 'BTC/USD'].forEach(sym => {
                if (prev[sym] && data[sym]) {
                  if (data[sym].price > prev[sym].price) newTicks[sym] = 'up';
                  else if (data[sym].price < prev[sym].price) newTicks[sym] = 'down';
                }
              });
              if (Object.keys(newTicks).length > 0) {
                setTickerTickStates(newTicks);
                setTimeout(() => setTickerTickStates({}), 1000);
              }
              return data;
            });
          }
        }
      } catch (e) {
        // quiet fallback
      }
    };

    fetchLiveTicker();
    const interval = setInterval(fetchLiveTicker, 4000); // 4 seconds live TradingView poll
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrade)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewTrade({
          symbol: '',
          order_type: 'BUY',
          lots: 0.01,
          open_price: 0,
          close_price: 0,
          profit: 0,
          strategy: 'Cent EA Grid',
          session: 'London',
          ticket: '',
        });
        await refreshData(true);
      }
    } catch (err) {
      console.error('Error creating trade:', err);
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewTrade) return;
    try {
      const res = await fetch(`/api/trades/${activeReviewTrade.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_followed: reviewForm.rule_followed,
          psychology_state: reviewForm.psychology_state,
          mistake_tag: reviewForm.mistake_tag,
          mae: reviewForm.mae ? Number(reviewForm.mae) : undefined,
          mfe: reviewForm.mfe ? Number(reviewForm.mfe) : undefined,
          notes: reviewForm.notes
        })
      });
      if (res.ok) {
        setShowReviewModal(false);
        setActiveReviewTrade(null);
        await refreshData(true);
      }
    } catch (err) {
      console.error('Error updating trade review:', err);
    }
  };

  const handleUploadStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setImportStatus(lang === 'id' ? 'Memproses statement...' : 'Parsing statement...');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch('/api/import/statement', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setImportStatus(data.message || (lang === 'id' ? 'Berhasil diimpor!' : 'Import success!'));
        setTimeout(() => {
          setShowImportModal(false);
          setSelectedFile(null);
          setImportStatus('');
        }, 1200);
        await refreshData(true);
      } else {
        setImportStatus(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setImportStatus(`Error: ${err.message}`);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pass = newAccountForm.investor_password;
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          ...newAccountForm,
          user_id: user?.id,
          role: effectiveRole
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowAddAccountModal(false);
        setNewAccountForm({
          name: '',
          broker: 'Exness',
          server: 'Exness-MT5Real9',
          login: '',
          investor_password: '',
          account_type: 'cent',
          leverage: 2000,
          balance: 100000
        });

        if (data?.id && pass && pass.trim().length > 0) {
          try {
            await fetch(`/api/accounts/${data.id}/sync`, { method: 'POST' });
            setSelectedAccountId(data.id);
          } catch (syncErr) {
            console.warn('Auto-sync error after account creation:', syncErr);
          }
        }
        await refreshData(true);
      } else {
        alert(data.error || 'Gagal menambahkan akun broker.');
      }
    } catch (err: any) {
      console.error('Error adding account:', err);
      alert(err.message || 'Koneksi error');
    }
  };

  const navItems = [
    { href: '/', label: t('tabOverview'), icon: Activity, badge: null },
    { href: '/journal', label: t('tabJournal'), icon: BookOpen, badge: trades.length },
    { href: '/calendar', label: t('tabCalendar'), icon: CalendarIcon, badge: null },
    { href: '/review', label: t('tabReview'), icon: ShieldCheck, badge: 'AI' },
    { href: '/plan', label: t('tabTradingPlan'), icon: ClipboardList, badge: 'Plan' },
    { href: '/risk', label: t('tabRiskCalculator'), icon: Calculator, badge: 'Lot' },
    { href: '/accounts', label: t('tabAccounts'), icon: Server, badge: accounts.length },
    { href: '/license', label: t('tabLicense'), icon: Crown, badge: license?.tier ? license.tier.toUpperCase() : 'FREE' }
  ];

  // If on public pages (landing, login, register), render clean full-page container
  const isPublicAuthPage = pathname === '/landing' || pathname === '/login' || pathname === '/register';

  // Route Protection: Unauthenticated visitors must not access terminal routes
  useEffect(() => {
    if (!authLoading && !user && !isPublicAuthPage) {
      router.replace('/login');
    }
  }, [authLoading, user, isPublicAuthPage, router]);

  if (isPublicAuthPage) {
    return (
      <div className="h-screen h-[100dvh] bg-[#05080f] text-slate-100 flex flex-col overflow-y-auto selection:bg-emerald-500 selection:text-white">
        {children}
      </div>
    );
  }

  // Splash screen while checking auth or redirecting
  if (authLoading || !user) {
    return (
      <div className="h-screen h-[100dvh] w-screen bg-[#05080f] flex flex-col items-center justify-center gap-4 text-slate-300">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-2xl shadow-emerald-500/20 flex items-center justify-center animate-pulse">
          <div className="w-full h-full bg-[#070b14] rounded-[15px] flex items-center justify-center">
            <Zap className="w-7 h-7 text-emerald-400 fill-emerald-400/20" />
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-semibold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-4 py-1.5 rounded-full">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{lang === 'id' ? 'Memverifikasi Akses Akun...' : 'Verifying Account Access...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] bg-[#05080f] text-slate-100 flex flex-col overflow-hidden selection:bg-emerald-500 selection:text-white">
      
      {/* DEVELOPER / ADMIN TEST & PREVIEW STRIP (ONLY FOR ADMIN) */}
      {user?.role === 'admin' && (
        <div className="w-full shrink-0 bg-gradient-to-r from-purple-950/90 via-[#0e0a1a] to-slate-950 border-b border-purple-500/30 text-xs py-1.5 px-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-2 font-mono text-[11px] overflow-x-auto">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              DEV SANDBOX
            </span>
            <span className="text-slate-400 hidden sm:inline">&bull; Role Previewer:</span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewRole(null)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${previewRole === null ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-white bg-white/[0.04]'}`}
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => setPreviewRole('client_pro')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${previewRole === 'client_pro' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white bg-white/[0.04]'}`}
              >
                👑 VIP PRO
              </button>
              <button
                type="button"
                onClick={() => setPreviewRole('client_affiliate')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${previewRole === 'client_affiliate' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white bg-white/[0.04]'}`}
              >
                🤝 Affiliate
              </button>
              <button
                type="button"
                onClick={() => setPreviewRole('client_starter')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${previewRole === 'client_starter' ? 'bg-slate-300 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white bg-white/[0.04]'}`}
              >
                🌱 Starter
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => triggerManualSyncAll()}
              title="Simulasi deal MT5 real-time masuk"
              className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 transition flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-purple-300" />
              <span>Simulasi Deal MT5</span>
            </button>
            {previewRole && (
              <span className="text-[10px] text-amber-400 font-mono hidden md:inline">
                [Mode Preview: {previewRole}]
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* 1. TOP LIVE MARKET & TICKER STRIP (Green-and-Red Glass Styling) */}
      <header className="w-full shrink-0 bg-[#060913]/95 backdrop-blur-xl border-b border-white/[0.06] text-xs py-2 px-4 flex items-center justify-between z-50">
        
        {/* Left: Market Status Pulse */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-semibold text-[11px] shadow-sm shadow-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{t('marketActive')}</span>
          </div>

          <Link 
            href="/accounts"
            className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-medium transition"
          >
            {accounts.length} {lang === 'id' ? 'MT5 Terhubung' : 'MT5 Connected'}
          </Link>
        </div>

        {/* Center: Live Quotes from TradingView with Green (Bullish) and Red (Bearish) glowing numbers */}
        <div className="hidden lg:flex items-center gap-5 overflow-hidden text-[11px] font-medium px-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] text-slate-400 font-semibold tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400/90 font-mono text-[9px] uppercase tracking-wider">TradingView Live</span>
          </div>

          {['XAU/USD', 'EUR/USD', 'GBP/USD', 'BTC/USD'].map(sym => {
            const quote = tickerQuotes[sym];
            if (!quote) return null;
            const isBull = quote.change >= 0;
            const tick = tickerTickStates[sym];
            return (
              <div
                key={sym}
                className={`flex items-center gap-1.5 font-mono transition-all duration-300 ${
                  tick === 'up' ? 'text-emerald-300 scale-105' : tick === 'down' ? 'text-rose-300 scale-105' : ''
                }`}
                title={`Live feed: ${quote.source || 'TradingView'}`}
              >
                <span className="text-slate-400 font-sans font-semibold text-[10px]">{sym}</span>
                <span className="text-white font-bold">{quote.formatted_price}</span>
                <span className={`font-bold flex items-center text-[10px] ${
                  isBull ? 'text-emerald-400 glow-emerald' : 'text-rose-400 glow-rose'
                }`}>
                  {isBull ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {isBull ? '+' : ''}{quote.change.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-2.5">
          
          {/* Auto-Sync MT5 Control (Gated by Package Details) */}
          {!packageDetails.autoSyncEnabled ? (
            <div
              className="flex items-center gap-1.5 bg-[#090d18] border border-white/[0.08] rounded-full px-2.5 py-1 text-[11px] text-slate-400 shrink-0 cursor-not-allowed"
              title="Auto-Sync MT5 dinonaktifkan pada paket Starter Gratis. Hubungkan akun broker partner atau upgrade ke PRO VIP."
            >
              <Lock className="w-3 h-3 text-slate-500" />
              <span className="font-semibold text-slate-400 font-mono text-[11px]">Sync: Manual</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#090d18] border border-white/[0.08] rounded-full px-2.5 py-1 text-[11px] shrink-0">
              <button
                onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                title={autoSyncEnabled ? `Auto-Sync MT5 Aktif (Tiap ${autoSyncInterval}s) - Klik untuk jeda` : 'Auto-Sync Dijeda - Klik untuk aktifkan'}
                className="flex items-center gap-1.5 font-semibold transition hover:opacity-80"
              >
                {isAutoSyncing ? (
                  <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                ) : (
                  <span className={`w-2 h-2 rounded-full ${autoSyncEnabled ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-slate-500'}`} />
                )}
                <span className={autoSyncEnabled ? 'text-emerald-300 font-mono text-[11px]' : 'text-slate-400 text-[11px]'}>
                  {autoSyncEnabled ? (isAutoSyncing ? 'Syncing...' : `Live ${autoSyncInterval}s`) : 'Sync OFF'}
                </span>
              </button>

              {autoSyncEnabled && (
                <div className="relative" ref={intervalMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowIntervalMenu(!showIntervalMenu)}
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-white pl-2 pr-1 py-0.5 rounded-full hover:bg-white/[0.06] transition border-l border-white/[0.12]"
                    title="Pilih Interval Sync"
                  >
                    <span className="font-semibold text-emerald-400">{autoSyncInterval}s</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${showIntervalMenu ? 'rotate-180 text-emerald-400' : ''}`} />
                  </button>

                  {showIntervalMenu && (
                    <div className="absolute right-0 top-full mt-2 w-40 rounded-2xl bg-[#080d1b]/95 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-black/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-white/[0.06] mb-1">
                        Interval Auto-Sync
                      </div>
                      {[5, 10, 15, 30, 60].map(sec => {
                        const isSelected = autoSyncInterval === sec;
                        return (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => {
                              setAutoSyncInterval(sec);
                              setShowIntervalMenu(false);
                            }}
                            className={`w-full px-3 py-1.5 flex items-center justify-between text-left text-xs font-mono transition ${
                              isSelected
                                ? 'bg-emerald-500/15 text-emerald-300 font-bold'
                                : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-600'}`} />
                              {sec} Detik
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Account Filter Custom Glass Dropdown */}
          {accounts.length > 0 && (
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="bg-[#090d18] hover:bg-[#0d1424] border border-white/[0.1] hover:border-emerald-500/40 rounded-full pl-3 pr-2.5 py-1 text-[11px] text-slate-200 flex items-center gap-2 transition"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[130px] truncate font-medium">
                  {selectedAccountId === 'all'
                    ? t('allAccounts')
                    : accounts.find(a => a.id === selectedAccountId)?.name || t('allAccounts')}
                </span>
                {selectedAccountId !== 'all' && (
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold hidden md:inline">
                    {isCentMode
                      ? `${Math.round(accounts.find(a => a.id === selectedAccountId)?.balance || 0).toLocaleString()} USC`
                      : `$${(((accounts.find(a => a.id === selectedAccountId)?.balance || 0))/100).toFixed(2)}`}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${showAccountMenu ? 'rotate-180 text-emerald-400' : ''}`} />
              </button>

              {showAccountMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#080d1b]/95 backdrop-blur-xl border border-white/[0.12] shadow-2xl shadow-black/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-white/[0.06] mb-1 flex items-center justify-between">
                    <span>{t('filterByAccount')}</span>
                    <span className="text-slate-500 font-mono">{accounts.length} Akun</span>
                  </div>
                  
                  {/* All Accounts Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountId('all');
                      setShowAccountMenu(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left text-xs transition mb-1 ${
                      selectedAccountId === 'all'
                        ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                        : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('allAccounts')}</span>
                    </div>
                    {selectedAccountId === 'all' && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>

                  <div className="border-t border-white/[0.06] my-1" />

                  {/* Account List */}
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {accounts.map(acc => {
                      const isSelected = selectedAccountId === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            setSelectedAccountId(acc.id);
                            setShowAccountMenu(false);
                          }}
                          className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left text-xs transition ${
                            isSelected
                              ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                              : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-white font-medium truncate flex items-center gap-1.5">
                              <span>{acc.name}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 font-mono">
                                {acc.broker}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {isCentMode 
                                ? `${Math.round(acc.balance || 0).toLocaleString()} USC` 
                                : `$${((acc.balance || 0)/100).toFixed(2)}`}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cent / USD Toggle */}
          <div className="flex items-center bg-[#090d18] border border-white/[0.08] rounded-full p-0.5">
            <button
              onClick={() => setIsCentMode(true)}
              className={`px-3 py-1 rounded-full flex items-center gap-1 text-[11px] font-semibold transition-all ${
                isCentMode 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3 h-3 text-emerald-400" />
              <span>USC</span>
            </button>
            <button
              onClick={() => setIsCentMode(false)}
              className={`px-3 py-1 rounded-full flex items-center gap-1 text-[11px] font-semibold transition-all ${
                !isCentMode 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3 h-3 text-emerald-400" />
              <span>USD</span>
            </button>
          </div>

          {/* Language Switch */}
          <button
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className="px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.04] text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 transition"
            title="Switch Language"
          >
            <Globe className="w-3 h-3 text-emerald-400" />
            <span>{lang.toUpperCase()}</span>
          </button>

          {/* License Tier / Role Badge Pill */}
          <Link
            href="/license"
            className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase flex items-center gap-1.5 transition shadow-sm ${packageDetails.badgeColor}`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{packageDetails.roleBadge}</span>
          </Link>

          {/* Quick Landing Page Link */}
          <Link
            href="/landing"
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-[11px] font-semibold text-slate-300 hover:text-white transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('viewLandingPage')}</span>
          </Link>

          {/* User Profile / Auth Widget */}
          {user ? (
            <div className="relative pl-1 border-l border-white/[0.08]" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-white/[0.05] transition"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-emerald-500/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] flex items-center justify-center">
                    <div className="w-full h-full bg-[#0a0f1c] rounded-full flex items-center justify-center text-[11px] font-black text-emerald-400">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                )}
                <span className="hidden md:inline text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180 text-emerald-400' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#080d1b]/95 backdrop-blur-xl border border-white/[0.12] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                    <div className="font-bold text-white text-xs truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {user.role ? user.role.toUpperCase() : 'TRADER'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {user.provider === 'google' ? 'Google Auth' : 'Email Auth'}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/landing"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('viewLandingPage')}</span>
                  </Link>

                  <Link
                    href="/accounts"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white transition"
                  >
                    <Server className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('tabAccounts')}</span>
                  </Link>

                  <div className="border-t border-white/[0.06] my-1" />

                  <button
                    type="button"
                    onClick={async () => {
                      setShowUserMenu(false);
                      await logout();
                    }}
                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2 text-xs text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('logoutLabel')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
              <Link
                href="/login"
                className="px-3 py-1 rounded-full text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                {t('loginLabel')}
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm shadow-emerald-500/20 transition hover:brightness-110"
              >
                {t('registerLabel')}
              </Link>
            </div>
          )}

        </div>

      </header>

      {/* 2. BODY LAYOUT: GLASS SIDEBAR + MAIN CONTENT (INDEPENDENT SCROLL) */}
      <div className="flex-1 flex w-full overflow-hidden min-h-0">
        
        {/* SIDEBAR NAVIGATION DOCK (FIXED ON LEFT, INDEPENDENT SCROLL IF OVERFLOW) */}
        <aside className="hidden lg:flex w-64 flex-col justify-between p-5 glass-sidebar shrink-0 h-full overflow-y-auto">
          <div className="space-y-6">
            
            {/* Brand Logo Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/25 flex items-center justify-center">
                <div className="w-full h-full bg-[#070b14] rounded-[15px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-white">JFZLA<span className="text-emerald-400">Journal</span></span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 uppercase">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Smart Glass Trade Analytics</p>
              </div>
            </div>

            {/* Profile Welcome Capsule */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account Health</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Disciplined Trader</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 font-medium">
                <span>{accounts.length} MT5 Accounts Active</span>
              </div>
            </div>

            {/* Main Nav Links (Separate Pages with Next.js Link) */}
            <nav className="space-y-1.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                      active
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-white border border-emerald-500/35 shadow-lg shadow-emerald-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.badge !== null && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          active ? 'bg-emerald-500/25 text-emerald-200' : 'bg-white/[0.06] text-slate-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {active && (
                        <span className="w-1 h-4 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>

          </div>

          {/* Quick Actions at bottom of sidebar */}
          <div className="space-y-2 pt-4 border-t border-white/[0.06]">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t('newTradeBtn')}</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] transition flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('importBtn')}</span>
            </button>
          </div>
        </aside>

        {/* MAIN PAGE VIEW CONTAINER (INDEPENDENT CONTENT SCROLL) */}
        <main className="flex-1 h-full overflow-y-auto p-4 lg:p-7 max-w-[1600px] w-full mx-auto space-y-6">
          
          {/* Mobile Horizontal Navigation Tabs */}
          <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {navItems.map(tab => {
              const Icon = tab.icon;
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition shrink-0 ${
                    active
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>

          {/* PAGE CONTENT */}
          {children}

        </main>
      </div>

      {/* 3. FROSTED GLASS GLOBAL MODALS */}

      {/* ADD TRADE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-modal max-w-lg w-full p-6 rounded-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>{t('newTradeBtn')}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrade} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('symbol')}</label>
                  <input
                    type="text"
                    required
                    value={newTrade.symbol}
                    onChange={e => setNewTrade({ ...newTrade, symbol: e.target.value.toUpperCase() })}
                    placeholder="XAUUSD"
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white uppercase focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('type')}</label>
                  <div className="flex gap-1.5 bg-[#080d1b] p-1 rounded-xl border border-white/[0.1]">
                    <button
                      type="button"
                      onClick={() => setNewTrade({ ...newTrade, order_type: 'BUY' })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                        newTrade.order_type === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                      <span>BUY</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTrade({ ...newTrade, order_type: 'SELL' })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                        newTrade.order_type === 'SELL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                      <span>SELL</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('lots')}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newTrade.lots}
                    onChange={e => setNewTrade({ ...newTrade, lots: Number(e.target.value) })}
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('openPrice')}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newTrade.open_price}
                    onChange={e => setNewTrade({ ...newTrade, open_price: Number(e.target.value) })}
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('closePrice')}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newTrade.close_price}
                    onChange={e => setNewTrade({ ...newTrade, close_price: Number(e.target.value) })}
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('pnl')} ({isCentMode ? 'USC' : 'USD'})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newTrade.profit}
                    onChange={e => setNewTrade({ ...newTrade, profit: Number(e.target.value) })}
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Setup / Strategi</label>
                  <input
                    type="text"
                    value={newTrade.strategy}
                    onChange={e => setNewTrade({ ...newTrade, strategy: e.target.value })}
                    placeholder="Cent Grid EA Martingale"
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/25 transition active:scale-95"
                >
                  {t('saveTrade')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT STATEMENT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-modal max-w-md w-full p-6 rounded-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>{t('importModalTitle')}</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {t('importModalDesc')}
            </p>

            <form onSubmit={handleUploadStatement} className="space-y-4">
              <div className="border-2 border-dashed border-white/[0.15] hover:border-emerald-500/40 rounded-2xl p-6 text-center cursor-pointer transition">
                <input
                  type="file"
                  accept=".htm,.html,.csv"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30"
                />
              </div>

              {importStatus && (
                <div className="text-xs text-center font-semibold text-emerald-400 py-1">
                  {importStatus}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/25 transition active:scale-95 disabled:opacity-50"
                >
                  {t('uploadAndParse')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONNECT MT5 BROKER ACCOUNT MODAL */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-modal max-w-lg w-full p-6 rounded-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>{t('accountsModalTitle')}</span>
              </h3>
              <button onClick={() => setShowAddAccountModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* RBAC Account Limit Notice */}
            {effectiveRole === 'client_starter' && accounts.length >= 1 && (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-2 mb-4">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Batas Paket Starter Tercapai (Maks 1 Akun MT5)</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Paket Starter Gratis mengizinkan maksimal 1 akun MT5. Untuk menghubungkan akun ke-2 dan ke-3 secara gratis, hubungkan akun broker mitra (Exness, HFM, Valetax) untuk klaim Paket Affiliate, atau upgrade ke VIP PRO.
                </p>
                <Link
                  href="/license"
                  onClick={() => setShowAddAccountModal(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:underline"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Buka Menu Lisensi & Upgrade &rarr;</span>
                </Link>
              </div>
            )}

            {effectiveRole === 'client_affiliate' && accounts.length >= 3 && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-2 mb-4">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Batas Akun Partner Tercapai (Maks 3 Akun MT5)</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Paket Partner Affiliate mengizinkan hingga 3 akun MT5. Beralih ke VIP PRO untuk menghubungkan akun tanpa batas di seluruh broker.
                </p>
                <Link
                  href="/license"
                  onClick={() => setShowAddAccountModal(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:underline"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Upgrade ke VIP PRO &rarr;</span>
                </Link>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('accountNickname')}</label>
                <input
                  type="text"
                  required
                  placeholder="Exness Real Cent EA"
                  value={newAccountForm.name}
                  onChange={e => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                  className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('selectBroker')}</label>
                  <GlassSelect
                    value={newAccountForm.broker}
                    onChange={val => {
                      const b = val as BrokerName;
                      setNewAccountForm({
                        ...newAccountForm,
                        broker: b,
                        server: BROKER_PRESETS[b]?.[0] || 'Custom-Live'
                      });
                      setIsManualServer(false);
                    }}
                    options={
                      effectiveRole === 'client_affiliate'
                        ? [
                            { value: 'Exness', label: 'Exness', badge: 'Partner' },
                            { value: 'HFM', label: 'HFM (HF Markets)', badge: 'Partner' },
                            { value: 'Valetax', label: 'Valetax', badge: 'Partner' }
                          ]
                        : [
                            { value: 'Exness', label: 'Exness', badge: 'Cent & Std' },
                            { value: 'HFM', label: 'HFM (HF Markets)', badge: 'Cent/Micro' },
                            { value: 'Valetax', label: 'Valetax', badge: 'Global' },
                            { value: 'Other', label: 'Other Broker', badge: 'Custom' }
                          ]
                    }
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('serverName')}</label>
                  {isManualServer ? (
                    <input
                      type="text"
                      required
                      placeholder="Exness-MT5Real9"
                      value={newAccountForm.server}
                      onChange={e => setNewAccountForm({ ...newAccountForm, server: e.target.value })}
                      className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  ) : (
                    <GlassSelect
                      value={newAccountForm.server}
                      onChange={val => setNewAccountForm({ ...newAccountForm, server: val })}
                      options={(BROKER_PRESETS[newAccountForm.broker] || []).map(srv => ({
                        value: srv,
                        label: srv
                      }))}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('accountLogin')}</label>
                  <input
                    type="text"
                    required
                    placeholder="20993412"
                    value={newAccountForm.login}
                    onChange={e => setNewAccountForm({ ...newAccountForm, login: e.target.value })}
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('investorPassword')}</label>
                  <input
                    type="password"
                    placeholder="Password Investor MT5"
                    value={newAccountForm.investor_password}
                    onChange={e => setNewAccountForm({ ...newAccountForm, investor_password: e.target.value })}
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed">
                {t('investorPasswordNotice')}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={(effectiveRole === 'client_starter' && accounts.length >= 1) || (effectiveRole === 'client_affiliate' && accounts.length >= 3)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/25 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('connectAccountBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW TRADE MODAL */}
      {showReviewModal && activeReviewTrade && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-modal max-w-lg w-full p-6 rounded-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t('reviewModalTitle')} #{activeReviewTrade.ticket || activeReviewTrade.id}</span>
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">{activeReviewTrade.symbol}</span> &bull;{' '}
                  <span className={activeReviewTrade.order_type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                    {activeReviewTrade.order_type} {activeReviewTrade.lots} Lots
                  </span>
                </div>
                <div className={`font-mono font-bold ${activeReviewTrade.profit >= 0 ? 'text-emerald-400 glow-emerald' : 'text-rose-400 glow-rose'}`}>
                  {activeReviewTrade.profit >= 0 ? '+' : ''}{formatMoney(activeReviewTrade.profit)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('followedRulesPrompt')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rule_followed: true })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      reviewForm.rule_followed
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/[0.03] border-white/[0.08] text-slate-400'
                    }`}
                  >
                    {t('cleanExecution')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rule_followed: false })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      !reviewForm.rule_followed
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : 'bg-white/[0.03] border-white/[0.08] text-slate-400'
                    }`}
                  >
                    {t('ruleViolated')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('psychologyState')}</label>
                  <GlassSelect
                    value={reviewForm.psychology_state}
                    onChange={val => setReviewForm({ ...reviewForm, psychology_state: val })}
                    options={[
                      { value: 'Disciplined', label: t('psychologyDisciplined') },
                      { value: 'FOMO', label: t('psychologyFOMO') },
                      { value: 'Revenge', label: t('psychologyRevenge') },
                      { value: 'Hesitant', label: t('psychologyHesitant') },
                      { value: 'Greed', label: t('psychologyGreed') }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('mistakeCategory')}</label>
                  <GlassSelect
                    value={reviewForm.mistake_tag}
                    onChange={val => setReviewForm({ ...reviewForm, mistake_tag: val })}
                    options={[
                      { value: 'None', label: t('mistakeNone') },
                      { value: 'Chased Price', label: t('mistakeChased') },
                      { value: 'Moved SL', label: t('mistakeMovedSL') },
                      { value: 'Early Exit', label: t('mistakeEarlyExit') },
                      { value: 'Overleveraged', label: t('mistakeOverleveraged') },
                      { value: 'Traded News', label: t('mistakeNews') }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('tradeNotes')}</label>
                <textarea
                  rows={3}
                  value={reviewForm.notes}
                  onChange={e => setReviewForm({ ...reviewForm, notes: e.target.value })}
                  placeholder="Catatan psikologi atau evaluasi eksekusi..."
                  className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/25 transition active:scale-95"
                >
                  {t('saveReview')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
