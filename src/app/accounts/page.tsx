'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Server,
  RefreshCw,
  Plus,
  Trash2,
  Building2,
  Lock,
  Crown,
  BadgeCheck,
  Sparkles,
  X,
  ArrowUpRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SyncAllResult } from '@/lib/types';

export default function BrokerAccountsPage() {
  const {
    lang,
    t,
    formatMoney,
    accounts,
    license,
    refreshData,
    autoSyncEnabled,
    setAutoSyncEnabled,
    autoSyncInterval,
    setAutoSyncInterval,
    isAutoSyncing,
    triggerManualSyncAll,
    setShowAddAccountModal,
    user,
    canTest,
    effectiveRole,
    packageDetails
  } = useApp();

  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [syncAllResult, setSyncAllResult] = useState<SyncAllResult | null>(null);

  const handleSyncSingleAccount = async (id: string) => {
    setSyncingAccountId(id);
    try {
      const res = await fetch(`/api/accounts/${id}/sync`, {
        method: 'POST',
        headers: { 'x-user-id': user?.id || '' }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || (lang === 'id' ? 'Akun berhasil disinkronkan!' : 'Account synced!'));
        await refreshData(true);
      } else {
        alert(data.error || 'Gagal menyinkronkan akun');
      }
    } catch (err: any) {
      alert(err.message || 'Koneksi error');
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleSyncAllAccounts = async (force = false) => {
    setIsSyncingAll(true);
    setSyncAllResult(null);
    try {
      const res = await fetch('/api/accounts/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({ force, userId: user?.id })
      });
      const data: SyncAllResult = await res.json();
      setSyncAllResult(data);
      if (res.ok && data.success) {
        await refreshData(true);
      } else {
        alert(data.message || (data as any).error || 'Sinkronisasi gagal');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menyinkronkan akun');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm(lang === 'id' ? 'Putus koneksi dan hapus akun broker ini?' : 'Disconnect and remove this broker account?')) return;
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || '' }
      });
      if (res.ok) await refreshData(true);
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER BAR & BATCH ACTIONS */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <span>{t('connectedAccounts')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t('accountsModalDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => handleSyncAllAccounts(false)}
            disabled={isSyncingAll}
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-slate-200 hover:text-white flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            <span>{isSyncingAll ? (lang === 'id' ? 'Menyinkronkan...' : 'Syncing All...') : t('syncAllAccountsBtn')}</span>
          </button>

          <button
            onClick={() => setShowAddAccountModal(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('connectAccountBtn')}</span>
          </button>
        </div>
      </div>

      {/* AUTO-SYNC REALTIME STATUS PANEL */}
      {!packageDetails.autoSyncEnabled ? (
        <div className="glass-panel p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-amber-500/25 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">MT5 Auto-Sync Terkunci (Starter)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-500/20 text-slate-400 border border-slate-500/30">
                  Manual Import Only
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Fitur Auto-Sync otomatis background hanya aktif untuk Paket Partner Affiliate (Gratis) atau VIP PRO.
              </p>
            </div>
          </div>

          <Link
            href="/license"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 flex items-center gap-2 transition"
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Klaim Partner / Upgrade PRO</span>
          </Link>
        </div>
      ) : (
        <div className="glass-panel glass-emerald p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              {isAutoSyncing ? (
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{t('liveSyncTitle')}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  autoSyncEnabled 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse' 
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {autoSyncEnabled ? (lang === 'id' ? `Aktif (${autoSyncInterval} Detik)` : `Live (${autoSyncInterval}s)`) : (lang === 'id' ? 'Nonaktif' : 'Disabled')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('liveSyncDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            <div className="flex items-center gap-1 bg-[#090d18] border border-white/[0.1] rounded-xl p-1 text-xs">
              <span className="text-[11px] text-slate-400 px-2 font-medium">Interval:</span>
              {[5, 10, 15, 30, 60].map(sec => (
                <button
                  key={sec}
                  onClick={() => {
                    setAutoSyncInterval(sec);
                    if (!autoSyncEnabled) setAutoSyncEnabled(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    autoSyncEnabled && autoSyncInterval === sec
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            <button
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                autoSyncEnabled
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {autoSyncEnabled ? t('pauseSync') : t('resumeSync')}
            </button>
          </div>
        </div>
      )}

      {/* LICENSE ACCESS STATUS CALLOUT */}
      {license?.tier === 'free' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-amber-300">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              {lang === 'id'
                ? 'Paket Anda saat ini adalah Starter (FREE). Fitur Auto-Sync MT5 dinonaktifkan. Hubungkan akun broker partner (Exness/HFM/Valetax) untuk klaim Paket Affiliate gratis, atau masukkan lisensi PRO VIP.'
                : 'Current plan: Starter (FREE). MT5 Auto-Sync is locked. Claim a free Partner plan with Exness/HFM/Valetax or activate PRO VIP.'}
            </span>
          </div>
          <Link
            href="/license"
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold shrink-0 transition flex items-center gap-1.5"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'id' ? 'Buka Lisensi' : 'View Licenses'}</span>
          </Link>
        </div>
      )}

      {license?.tier === 'affiliate' && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2.5">
            <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {lang === 'id'
                ? `Paket Partner (Affiliate) Aktif: Terverifikasi di bawah ${license.affiliate_broker} #${license.affiliate_account || ''}. Auto-Sync aktif untuk broker Exness, HFM, Valetax (Maksimal 3 akun, interval 60m).`
                : `Partner Plan Active: Verified under ${license.affiliate_broker} #${license.affiliate_account || ''}. Auto-Sync active for Exness, HFM, Valetax (Max 3 accounts, 60m cooldown).`}
            </span>
          </div>
          <Link
            href="/license"
            className="text-[11px] text-emerald-300 hover:text-white underline font-semibold shrink-0"
          >
            {lang === 'id' ? 'Detail Lisensi' : 'License Details'}
          </Link>
        </div>
      )}

      {license?.tier === 'pro' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {lang === 'id'
                ? `Paket VIP (PRO) Aktif: MT5 Auto-Sync tanpa batas akun & semua broker didukung. Frekuensi cepat (15 menit) & prioritas Remote Bridge.`
                : `VIP (PRO) Plan Active: Unlimited MT5 accounts across all brokers. 15m fast interval & priority remote bridge.`}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            PRO UNLIMITED
          </span>
        </div>
      )}

      {/* SYNC ALL BATCH ALERT */}
      {syncAllResult && (
        <div className={`p-4 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
          syncAllResult.success
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div>
            <div className="font-bold mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{syncAllResult.message}</span>
            </div>
            {syncAllResult.details && syncAllResult.details.length > 0 && (
              <div className="space-y-0.5 mt-2 text-[11px] opacity-90">
                {syncAllResult.details.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono font-bold">#{d.login} ({d.broker}):</span>
                    <span>{d.status === 'synced' ? `+${d.new_trades} deals baru` : d.error || d.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setSyncAllResult(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* BROKER ACCOUNTS GRID */}
      {accounts.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold">{t('noAccountsYet')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map(acc => {
            const isSyncing = syncingAccountId === acc.id;
            const brokerBadgeStyles: Record<string, string> = {
              Exness: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
              HFM: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
              Valetax: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
              Other: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
            };
            const badgeStyle = brokerBadgeStyles[acc.broker] || brokerBadgeStyles.Other;

            return (
              <div
                key={acc.id}
                className="glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-white/[0.15] transition"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${badgeStyle}`}>
                      {acc.broker}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      #{acc.login}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-0.5 truncate">{acc.name}</h4>
                  <div className="text-[11px] text-slate-400 font-mono mb-4">{acc.server}</div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Saldo</div>
                      <div className="text-sm font-bold text-white font-mono">{formatMoney(acc.balance)}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Ekuitas</div>
                      <div className="text-sm font-bold text-emerald-400 font-mono">{formatMoney(acc.equity)}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSyncSingleAccount(acc.id)}
                    disabled={isSyncing}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? t('statusSyncing') : t('syncNow')}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    title="Putus Koneksi"
                    className="p-2 rounded-xl text-xs font-semibold bg-white/[0.04] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/[0.06] transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
