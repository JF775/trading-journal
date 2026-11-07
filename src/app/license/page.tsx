'use client';

import React, { useState } from 'react';
import {
  Crown,
  ShieldCheck,
  Check,
  X,
  BadgeCheck,
  Sparkles,
  Lock,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BrokerName } from '@/lib/types';
import GlassSelect from '@/components/GlassSelect';

export default function LicensePage() {
  const { lang, t, license, refreshData, user, canTest, effectiveRole, packageDetails } = useApp();

  const [licenseKeyInput, setLicenseKeyInput] = useState<string>('');
  const [affiliateBrokerInput, setAffiliateBrokerInput] = useState<BrokerName>('Exness');
  const [affiliateAccountInput, setAffiliateAccountInput] = useState<string>('');
  const [isActivatingLicense, setIsActivatingLicense] = useState<boolean>(false);
  const [isVerifyingAffiliate, setIsVerifyingAffiliate] = useState<boolean>(false);

  const handleActivateLicense = async () => {
    if (!licenseKeyInput.trim()) {
      alert(lang === 'id' ? 'Masukkan kode lisensi' : 'Enter license key');
      return;
    }
    setIsActivatingLicense(true);
    try {
      const res = await fetch('/api/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({ action: 'activate', key: licenseKeyInput.trim(), userId: user?.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setLicenseKeyInput('');
        await refreshData(true);
      } else {
        alert(data.error || data.message || 'Gagal mengaktifkan lisensi');
      }
    } catch (err: any) {
      alert(err.message || 'Koneksi error');
    } finally {
      setIsActivatingLicense(false);
    }
  };

  const handleVerifyAffiliate = async () => {
    if (!affiliateAccountInput.trim()) {
      alert(lang === 'id' ? 'Masukkan nomor login akun MT5' : 'Enter MT5 account number');
      return;
    }
    setIsVerifyingAffiliate(true);
    try {
      const res = await fetch('/api/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({
          action: 'verify_affiliate',
          broker: affiliateBrokerInput,
          account_number: affiliateAccountInput.trim(),
          userId: user?.id
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setAffiliateAccountInput('');
        await refreshData(true);
      } else {
        alert(data.error || data.message || 'Verifikasi affiliate gagal');
      }
    } catch (err: any) {
      alert(err.message || 'Koneksi error');
    } finally {
      setIsVerifyingAffiliate(false);
    }
  };

  const handleResetLicense = async () => {
    if (!confirm(lang === 'id' ? 'Reset lisensi ke paket Starter (FREE)?' : 'Reset license to Starter (FREE)?')) return;
    try {
      const res = await fetch('/api/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({ action: 'reset', userId: user?.id })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        await refreshData(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER PANEL */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span>{t('licenseTitle')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t('licenseSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">{t('currentTier')}:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
            license?.tier === 'pro'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
              : license?.tier === 'affiliate'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-white/[0.08] text-slate-300 border border-white/[0.1]'
          }`}>
            {license?.tier ? license.tier.toUpperCase() : 'FREE'}
          </span>
        </div>
      </div>

      {/* ACTIVE LICENSE STATUS OVERVIEW CARD */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {license?.owner_name || 'Trader'} &bull; {license?.tier === 'pro' ? 'VIP PRO Member' : license?.tier === 'affiliate' ? `Partner ${license.affiliate_broker}` : 'Starter Free Trader'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {license?.expires_at ? `${lang === 'id' ? 'Masa Aktif' : 'Expires'}: ${license.expires_at}` : (lang === 'id' ? 'Status: Aktif' : 'Status: Active')}
                {license?.license_key ? ` &bull; ${lang === 'id' ? 'Kunci' : 'Key'}: ${license.license_key}` : ''}
              </p>
            </div>
          </div>

          {canTest && (
            <button
              onClick={handleResetLicense}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('resetLicenseBtn')} (Admin)</span>
            </button>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">{t('maxAccounts')}</div>
            <div className="text-sm font-bold text-white">
              {license?.features?.max_mt5_accounts === 999 
                ? t('unlimited') 
                : `${license?.features?.max_mt5_accounts || 0} ${lang === 'id' ? 'Akun' : 'Accounts'}`}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">{t('syncInterval')}</div>
            <div className="text-sm font-bold text-white">
              {license?.features?.sync_interval_minutes 
                ? `${license.features.sync_interval_minutes} ${t('minutes')}` 
                : 'Manual Only'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">{t('brokerSupport')}</div>
            <div className="text-sm font-bold text-white">
              {license?.features?.allowed_brokers === 'all' 
                ? t('allBrokers') 
                : (license?.features?.allowed_brokers && (license.features.allowed_brokers as any).length > 0)
                ? 'Exness, HFM, Valetax'
                : t('noneManualOnly')}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">{lang === 'id' ? 'Status Auto-Sync' : 'Auto-Sync Status'}</div>
            <div className={`text-sm font-bold flex items-center gap-1.5 ${license?.features?.auto_sync_enabled ? 'text-emerald-400' : 'text-slate-400'}`}>
              <span className={`w-2 h-2 rounded-full ${license?.features?.auto_sync_enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              <span>{license?.features?.auto_sync_enabled ? (lang === 'id' ? 'Aktif' : 'Active') : (lang === 'id' ? 'Terkunci' : 'Locked')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-TIER PRICING & CLAIM CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* TIER 1: STARTER FREE */}
        <div className={`glass-panel p-6 flex flex-col justify-between border ${
          license?.tier === 'free' ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-white/[0.08]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{lang === 'id' ? 'Paket Gratis' : 'Free Tier'}</span>
              {license?.tier === 'free' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Aktif
                </span>
              )}
            </div>
            <h4 className="text-xl font-black text-white">{t('tierFree')}</h4>
            <div className="mt-2 text-2xl font-black text-white">
              {lang === 'id' ? 'Rp 0' : '$0'} <span className="text-xs font-normal text-slate-400">{lang === 'id' ? '/ selamanya' : '/ forever'}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Cocok untuk trader yang mencatat riwayat transaksi manual dengan grafik analitik lengkap.
            </p>

            <div className="space-y-2.5 mt-5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pencatatan trade manual tanpa batas</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dasbor analitik & kalkulasi drawdown</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Kalkulator ukuran lot & Trading Plan</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <X className="w-4 h-4 text-rose-500 shrink-0" />
                <span>MT5 Auto-Sync (Terkunci)</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/[0.08]">
            <button
              onClick={handleResetLicense}
              disabled={license?.tier === 'free'}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 disabled:opacity-40 transition"
            >
              {license?.tier === 'free' ? 'Paket Aktif Saat Ini' : 'Gunakan Paket FREE'}
            </button>
          </div>
        </div>

        {/* TIER 2: PARTNER AFFILIATE */}
        <div className={`glass-panel p-6 flex flex-col justify-between border relative overflow-hidden ${
          license?.tier === 'affiliate' ? 'border-emerald-500/50 ring-2 ring-emerald-500/30' : 'border-white/[0.08]'
        }`}>
          <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30">
            Rekomendasi
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Broker Mitra</span>
              {license?.tier === 'affiliate' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Aktif
                </span>
              )}
            </div>
            <h4 className="text-xl font-black text-white">{t('tierAffiliate')}</h4>
            <div className="mt-2 text-2xl font-black text-emerald-400">
              GRATIS <span className="text-xs font-normal text-slate-400">/ via Link Partner</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Dapatkan auto-sync MT5 otomatis tanpa biaya seumur hidup dengan mendaftarkan nomor akun di bawah partner resmi.
            </p>

            <div className="space-y-2.5 mt-5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Semua fitur Starter FREE</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>MT5 Auto-Sync s/d 3 Akun Broker</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mendukung Exness, HFM, dan Valetax</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Frekuensi Auto-Sync 60 Menit</span>
              </div>
            </div>
          </div>

          {/* Affiliate Verification Form */}
          <div className="pt-5 mt-5 border-t border-white/[0.08] space-y-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400">Pilih Broker Mitra</label>
              <GlassSelect
                value={affiliateBrokerInput}
                onChange={val => setAffiliateBrokerInput(val as BrokerName)}
                options={[
                  { value: 'Exness', label: 'Exness', badge: 'Cent & Std' },
                  { value: 'HFM', label: 'HFM (HF Markets)', badge: 'Cent/Micro' },
                  { value: 'Valetax', label: 'Valetax', badge: 'Global' }
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400">Nomor Login MT5</label>
              <input
                type="text"
                placeholder="Contoh: 20993412"
                value={affiliateAccountInput}
                onChange={e => setAffiliateAccountInput(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleVerifyAffiliate}
              disabled={isVerifyingAffiliate}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>{isVerifyingAffiliate ? 'Memverifikasi...' : t('verifyAffiliateBtn')}</span>
            </button>
          </div>
        </div>

        {/* TIER 3: VIP PRO */}
        <div className={`glass-panel p-6 flex flex-col justify-between border relative overflow-hidden ${
          license?.tier === 'pro' ? 'border-amber-500/50 ring-2 ring-amber-500/30' : 'border-white/[0.08]'
        }`}>
          <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold shadow-md shadow-amber-500/20">
            VIP PRO
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Akses Tanpa Batas</span>
              {license?.tier === 'pro' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Aktif
                </span>
              )}
            </div>
            <h4 className="text-xl font-black text-white">{t('tierPro')}</h4>
            <div className="mt-2 text-2xl font-black text-amber-300">
              Rp 99.000 <span className="text-xs font-normal text-slate-400">/ bulan atau Lisensi VIP</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Konektivitas MT5 tingkat lanjut untuk EA Scalper & akun multi-broker dengan sinkronisasi cepat 15 menit.
            </p>

            <div className="space-y-2.5 mt-5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Semua fitur Partner Affiliate</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>MT5 Auto-Sync UNLIMITED Akun</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Semua Broker MT5 (Exness, HFM, Valetax, IC Markets, FTMO, dll)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Frekuensi Cepat (15 Menit) & Sync All</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Prioritas Cloud Remote Bridge & Export</span>
              </div>
            </div>
          </div>

          {/* PRO Key Activation Form */}
          <div className="pt-5 mt-5 border-t border-white/[0.08] space-y-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400">Kode Lisensi PRO</label>
              <input
                type="text"
                placeholder="PTRACK-PRO-2026-VIP"
                value={licenseKeyInput}
                onChange={e => setLicenseKeyInput(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white uppercase font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleActivateLicense}
              disabled={isActivatingLicense}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Crown className="w-4 h-4" />
              <span>{isActivatingLicense ? 'Memvalidasi...' : t('activateBtn')}</span>
            </button>
          </div>
        </div>

      </div>

      {/* QUICK DEMO SIMULATION BAR (ONLY VISIBLE TO ADMIN / DEVELOPER) */}
      {canTest && (
        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong>Pintasan Uji Coba Developer:</strong> Simulasi lisensi ini hanya dapat diakses oleh Administrator/Developer sistem.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setAffiliateBrokerInput('Exness');
                setAffiliateAccountInput('20993412');
                fetch('/api/license', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
                  body: JSON.stringify({ action: 'verify_affiliate', broker: 'Exness', account_number: '20993412', userId: user?.id })
                }).then(r => r.json()).then(d => { alert(d.message); refreshData(true); });
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold transition text-[11px]"
            >
              Simulasi Partner Exness
            </button>

            <button
              onClick={() => {
                setLicenseKeyInput('PTRACK-PRO-2026-VIP');
                fetch('/api/license', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
                  body: JSON.stringify({ action: 'activate', key: 'PTRACK-PRO-2026-VIP', userId: user?.id })
                }).then(r => r.json()).then(d => { alert(d.message); refreshData(true); });
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold transition text-[11px]"
            >
              Simulasi PRO VIP
            </button>

            <button
              onClick={handleResetLicense}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white font-semibold transition text-[11px]"
            >
              Reset FREE
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
