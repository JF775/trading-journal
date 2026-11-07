'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Trade,
  AnalyticsSummary,
  Language,
  BrokerAccount,
  TradingPlan,
  UserLicense,
  BrokerName,
  User,
  UserRole,
  RolePackageDetails,
  getRolePackageDetails
} from '@/lib/types';
import { t as translate } from '@/lib/i18n';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  isCentMode: boolean;
  setIsCentMode: (val: boolean) => void;
  formatMoney: (amount: number) => string;
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  analytics: AnalyticsSummary | null;
  trades: Trade[];
  accounts: BrokerAccount[];
  license: UserLicense | null;
  tradingPlan: TradingPlan | null;
  setTradingPlan: React.Dispatch<React.SetStateAction<TradingPlan | null>>;
  loading: boolean;
  refreshData: (silent?: boolean) => Promise<void>;

  // Auto-Sync Features
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (val: boolean) => void;
  autoSyncInterval: number; // in seconds (e.g. 5, 10, 15, 30, 60)
  setAutoSyncInterval: (seconds: number) => void;
  isAutoSyncing: boolean;
  lastSyncTime: Date | null;
  triggerManualSyncAll: () => Promise<void>;
  
  // Modals
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  showImportModal: boolean;
  setShowImportModal: (show: boolean) => void;
  showReviewModal: boolean;
  setShowReviewModal: (show: boolean) => void;
  showAddAccountModal: boolean;
  setShowAddAccountModal: (show: boolean) => void;
  activeReviewTrade: Trade | null;
  setActiveReviewTrade: (trade: Trade | null) => void;

  // Authentication & RBAC
  user: User | null;
  authLoading: boolean;
  previewRole: UserRole | null;
  setPreviewRole: (role: UserRole | null) => void;
  effectiveRole: UserRole;
  packageDetails: RolePackageDetails;
  canTest: boolean;

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, broker?: BrokerName) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (customData?: { email?: string; name?: string; avatar?: string; credential?: string }) => Promise<{ success: boolean; error?: string; unconfigured?: boolean }>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('id');
  const [isCentMode, setIsCentMode] = useState<boolean>(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<BrokerAccount[]>([]);
  const [license, setLicense] = useState<UserLicense | null>(null);
  const [tradingPlan, setTradingPlan] = useState<TradingPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Auto-Sync MT5 background states
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(10); // default 10 seconds
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const isSyncingRef = useRef<boolean>(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState<boolean>(false);
  const [activeReviewTrade, setActiveReviewTrade] = useState<Trade | null>(null);

  // User Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Role Previewer (Admin-only capability to test Client Starter, Client Affiliate, and VIP PRO views)
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);

  // RBAC Computations
  const effectiveRole: UserRole = (user?.role === 'admin' && previewRole) 
    ? previewRole 
    : ((user?.role as UserRole) || 'client_starter');
  const packageDetails: RolePackageDetails = getRolePackageDetails(effectiveRole);
  // Strict rule: only real admin can test when not in preview role
  const canTest: boolean = user?.role === 'admin' && previewRole === null;

  // Initialize user from localStorage or API on client mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('jfzla_user') : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (isMounted) setUser(parsed);
        } else {
          // Check session with /api/auth/me
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data?.user && isMounted) {
              setUser(data.user);
              localStorage.setItem('jfzla_user', JSON.stringify(data.user));
            }
          }
        }
      } catch (e) {
        console.warn('Init auth check error:', e);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        setPreviewRole(null);
        localStorage.setItem('jfzla_user', JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, error: data.error || 'Login gagal.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi error.' };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, broker?: BrokerName) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, preferred_broker: broker })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        setPreviewRole(null);
        localStorage.setItem('jfzla_user', JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, error: data.error || 'Registrasi gagal.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi error.' };
    }
  }, []);

  const loginWithGoogle = useCallback(async (customData?: { email?: string; name?: string; avatar?: string; credential?: string }) => {
    try {
      if (customData?.credential || customData?.email) {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customData)
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          setUser(data.user);
          setPreviewRole(null);
          localStorage.setItem('jfzla_user', JSON.stringify(data.user));
          return { success: true };
        }
        return { success: false, error: data.error || 'Gagal masuk lewat Google.' };
      }

      // Check if GOOGLE_CLIENT_ID is active
      const configRes = await fetch('/api/auth/google/config').then(r => r.json()).catch(() => ({ configured: false }));
      if (configRes.configured) {
        window.location.href = '/api/auth/google';
        return { success: true };
      }

      return { success: false, unconfigured: true, error: 'Google OAuth belum dikonfigurasi.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi error.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setUser(null);
    setPreviewRole(null);
    setAnalytics(null);
    setTrades([]);
    setAccounts([]);
    setTradingPlan(null);
    setLicense(null);
    localStorage.removeItem('jfzla_user');
  }, []);

  const t = useCallback((key: string): string => {
    return translate(key as any, lang);
  }, [lang]);

  const formatMoney = useCallback((amount: number): string => {
    if (isNaN(amount) || amount === null || amount === undefined) return isCentMode ? '0 USC' : '$0.00';
    if (isCentMode) {
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.round(amount));
      return `${formatted} USC`;
    }
    const inUsd = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(inUsd);
  }, [isCentMode]);

  const refreshData = useCallback(async (silent = false) => {
    if (!user?.id) {
      setAnalytics(null);
      setTrades([]);
      setAccounts([]);
      setTradingPlan(null);
      setLicense(null);
      if (!silent) setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      const ts = Date.now();
      const accParam = selectedAccountId !== 'all' ? `&account_id=${selectedAccountId}` : '';
      const userParam = `&userId=${encodeURIComponent(user.id)}`;
      const headers: Record<string, string> = {
        'x-user-id': user.id
      };

      const [resAnalytics, resTrades, resAccounts, resPlan, resLicense] = await Promise.all([
        fetch(`/api/analytics?_t=${ts}${accParam}${userParam}`, { headers, cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch(`/api/trades?_t=${ts}&limit=500${accParam}${userParam}`, { headers, cache: 'no-store' }).then(r => r.json()).catch(() => []),
        fetch(`/api/accounts?_t=${ts}${userParam}`, { headers, cache: 'no-store' }).then(r => r.json()).catch(() => []),
        fetch(`/api/trading-plan?_t=${ts}${userParam}`, { headers, cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch(`/api/license?_t=${ts}${userParam}`, { headers, cache: 'no-store' }).then(r => r.json()).catch(() => null)
      ]);

      if (resAnalytics && !resAnalytics.error) setAnalytics(resAnalytics);
      if (Array.isArray(resTrades)) setTrades(resTrades);
      if (Array.isArray(resAccounts)) setAccounts(resAccounts);
      if (resPlan && resPlan.title) setTradingPlan(resPlan);
      if (resLicense && resLicense.tier) setLicense(resLicense);
    } catch (err) {
      console.error('Failed to load app data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedAccountId, user?.id]);

  useEffect(() => {
    refreshData();
  }, [refreshData, user?.id]);

  const triggerManualSyncAll = useCallback(async () => {
    if (isSyncingRef.current || !user?.id) return;
    if (!packageDetails.autoSyncEnabled) {
      alert(lang === 'id' ? 'Auto-Sync MT5 dinonaktifkan pada paket Starter Gratis. Hubungkan broker partner atau aktifkan lisensi PRO.' : 'Auto-Sync MT5 is disabled on Starter Free. Upgrade to Affiliate or PRO.');
      return;
    }

    isSyncingRef.current = true;
    setIsAutoSyncing(true);
    try {
      const res = await fetch('/api/accounts/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ force: true, userId: user.id })
      });
      if (res.ok) {
        setLastSyncTime(new Date());
        await refreshData(true);
      }
    } catch (e) {
      console.warn('Manual sync all trigger failed:', e);
    } finally {
      setIsAutoSyncing(false);
      isSyncingRef.current = false;
    }
  }, [refreshData, user?.id, packageDetails.autoSyncEnabled, lang]);

  // Periodic Auto-Sync Background Loop
  useEffect(() => {
    // Starter clients do NOT have background auto-sync enabled
    if (!packageDetails.autoSyncEnabled || !autoSyncEnabled || autoSyncInterval <= 0 || !user?.id) return;

    const intervalMs = Math.max(autoSyncInterval, 3) * 1000;

    const runAutoSync = async () => {
      if (isSyncingRef.current || !user?.id) return;
      isSyncingRef.current = true;
      setIsAutoSyncing(true);
      try {
        const res = await fetch('/api/accounts/sync-all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id
          },
          body: JSON.stringify({ force: false, userId: user.id })
        });
        if (res.ok) {
          setLastSyncTime(new Date());
          await refreshData(true);
        }
      } catch (err) {
        console.warn('Auto-sync periodic tick error:', err);
      } finally {
        setIsAutoSyncing(false);
        isSyncingRef.current = false;
      }
    };

    const timer = setInterval(runAutoSync, intervalMs);
    return () => clearInterval(timer);
  }, [autoSyncEnabled, autoSyncInterval, refreshData, user?.id, packageDetails.autoSyncEnabled]);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        isCentMode,
        setIsCentMode,
        formatMoney,
        selectedAccountId,
        setSelectedAccountId,
        analytics,
        trades,
        accounts,
        license,
        tradingPlan,
        setTradingPlan,
        loading,
        refreshData,
        autoSyncEnabled,
        setAutoSyncEnabled,
        autoSyncInterval,
        setAutoSyncInterval,
        isAutoSyncing,
        lastSyncTime,
        triggerManualSyncAll,
        showAddModal,
        setShowAddModal,
        showImportModal,
        setShowImportModal,
        showReviewModal,
        setShowReviewModal,
        showAddAccountModal,
        setShowAddAccountModal,
        activeReviewTrade,
        setActiveReviewTrade,
        user,
        authLoading,
        previewRole,
        setPreviewRole,
        effectiveRole,
        packageDetails,
        canTest,
        login,
        register,
        loginWithGoogle,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
