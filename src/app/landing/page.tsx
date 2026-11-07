'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Activity,
  Server,
  BookOpen,
  Calendar as CalendarIcon,
  Crown,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronRight,
  Coins,
  DollarSign,
  BarChart3,
  Bot,
  Layers,
  Sparkles,
  HelpCircle,
  ExternalLink,
  PlusCircle,
  Clock,
  Award,
  Globe,
  Star
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { t as i18nT } from '@/lib/i18n';
import GoogleAuthModal from '@/components/GoogleAuthModal';

export default function LandingPage() {
  const router = useRouter();
  const { lang = 'id', setLang, t: appT, loginWithGoogle, user } = useApp();
  // Safe bulletproof fallback: guaranteed defined in all render/hydration cycles
  const t = (k: string) => (typeof appT === 'function' ? appT(k) : i18nT(k as any, lang));

  const [activeTab, setActiveTab] = useState<'sync' | 'cent' | 'calendar' | 'psychology' | 'risk'>('sync');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = '/api/auth/google';
  };

  const faqs = [
    {
      q: 'Apakah aman memasukkan Investor Password MT5 saya ke JFZLA Journal?',
      a: '100% Sangat Aman! Investor Password pada MetaTrader 5 (MT5) memiliki hak akses Read-Only (Hanya Baca). Sistem JFZLA sama sekali tidak memiliki otorisasi ataupun kemampuan teknis untuk membuka posisi, menutup order, mengubah lot, ataupun melakukan penarikan (withdrawal) dana. Dana dan akun trading Anda tetap sepenuhnya berada dalam kendali penuh Anda di broker.'
    },
    {
      q: 'Bagaimana cara kerja fitur Auto-Sync tanpa perlu instal EA tambahan?',
      a: 'Kami mengoperasikan cloud bridge engine berkecepatan tinggi yang menghubungkan terminal server broker (Exness, HFM, Valetax, XM, dll.) secara langsung. Cukup masukkan nomor akun (Login), Investor Password, dan pilih nama Server. Data transaksi, saldo, equity, dan floating PnL akan otomatis tersinkronisasi tiap beberapa detik secara real-time.'
    },
    {
      q: 'Mengapa JFZLA Journal sangat cocok untuk akun Cent (USC)?',
      a: 'Sebagian besar platform jurnal trading internasional hanya mengenali USD standar dan menjadi kacau saat membaca akun cent (misal saldo 10,000,000 USC dianggap $10,000,000 USD). JFZLA Journal dilengkapi Smart Multiplier: Anda bisa beralih visual antara USC dan USD riil dalam 1-klik, kalkulator lot cent akurat, dan perhitungan drawdown yang presisi untuk EA Grid / Martingale.'
    },
    {
      q: 'Apakah saya bisa login langsung menggunakan Akun Google?',
      a: 'Tentu saja! Kami menyediakan tombol "Lanjutkan dengan Google" untuk login maupun pembuatan akun instan dengan 1-klik tanpa perlu mengingat password tambahan. Profil Anda akan otomatis terverifikasi secara aman.'
    },
    {
      q: 'Bagaimana cara mendapatkan paket Partner (Affiliate) secara GRATIS 100%?',
      a: 'Cukup daftarkan atau tautkan akun trading Anda di bawah partner broker resmi kami (Exness, HFM, atau Valetax). Setelah diverifikasi, Anda berhak menikmati fitur MT5 Auto-Sync dan review AI secara gratis selamanya tanpa biaya langganan bulanan!'
    }
  ];

  return (
    <div className="min-h-screen bg-[#05080f] text-[#f8fafc] flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="w-full bg-gradient-to-r from-emerald-600/20 via-teal-500/20 to-emerald-600/20 border-b border-emerald-500/20 text-center py-2 px-4 text-xs font-medium text-emerald-300 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>{lang === 'id' ? 'Update Terbaru v2.4: Dukungan Live Price TradingView & Sinkronisasi MT5 Tiap 5 Detik Aktif!' : 'Latest Update v2.4: Live TradingView Quotes & 5-Second MT5 Auto-Sync Active!'}</span>
        <Link href="/register" className="underline font-bold text-white hover:text-emerald-300 ml-1">
          {lang === 'id' ? 'Coba Sekarang →' : 'Try Now →'}
        </Link>
      </div>

      {/* 2. STICKY GLASS NAVBAR */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[#060913]/90 border-b border-white/[0.08] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link href="/landing" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 border border-emerald-400/40 group-hover:scale-105 transition">
              <Activity className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-white tracking-tight">JFZLA</span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  CENT JOURNAL
                </span>
              </div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Forex & MT5 Algotrader</p>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#fitur" className="hover:text-emerald-400 transition">{t('landingNavFeatures')}</a>
            <a href="#demo" className="hover:text-emerald-400 transition">{t('landingNavDemo')}</a>
            <a href="#broker" className="hover:text-emerald-400 transition">{t('landingNavBrokers')}</a>
            <a href="#pricing" className="hover:text-emerald-400 transition">{t('landingNavPricing')}</a>
            <a href="#faq" className="hover:text-emerald-400 transition">{t('landingNavFaq')}</a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="px-2.5 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
              title="Ganti Bahasa / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* Quick Link to Dashboard / Terminal */}
            <Link
              href={user ? "/" : "/login"}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] transition flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'id' ? 'Buka Terminal' : 'Open Terminal'}</span>
            </Link>

            {user ? (
              <Link
                href="/"
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 transition flex items-center gap-2"
              >
                <span>Halo, {user.name.split(' ')[0]}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  {t('loginLabel')}
                </Link>

                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center gap-1.5"
                >
                  <span>{t('registerLabel')}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 font-bold" />
                </Link>
              </>
            )}

          </div>

        </div>
      </nav>

      {/* 3. HERO SECTION WITH COPYWRITING */}
      <section className="w-full shrink-0 relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
        
        {/* Ambient Glow Orbs */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold mb-6 shadow-sm shadow-emerald-500/10 animate-fade-in">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>{t('landingHeroTag')}</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl leading-[1.15]">
          {t('landingHeroTitle')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">{t('landingHeroTitleHighlight')}</span>.
        </h1>

        {/* Subheadline Copywriting */}
        <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl leading-relaxed">
          {t('landingHeroDesc')}
        </p>

        {/* Hero Action CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 w-full max-w-md">
          
          <Link
            href="/register"
            className="flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>{t('landingStartFree')}</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="flex-1 sm:flex-initial px-5 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.15] text-white font-bold text-sm transition-all flex items-center justify-center gap-2.5 active:scale-95"
          >
            {/* Google Logo SVG */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isGoogleLoading ? (lang === 'id' ? 'Menghubungkan...' : 'Connecting...') : t('landingGoogleBtn')}</span>
          </button>

        </div>

        {/* Micro Proof & Security Notice */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('landingReadOnlyBadge')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>{t('landingSync5s')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>{t('landingNoWdBadge')}</span>
          </div>
        </div>

      </section>

      {/* 4. LIVE MARKET QUOTES TICKER (XAU/USD, EUR/USD, GBP/USD, BTC) */}
      <section className="w-full shrink-0 bg-[#070c18] border-y border-white/[0.06] py-3 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-6 overflow-x-auto text-xs">
          
          <div className="flex items-center gap-2 text-slate-400 shrink-0 uppercase tracking-wider font-bold text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live TradingView Ticker:</span>
          </div>

          <div className="flex items-center gap-8 shrink-0">
            {/* Gold */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300">XAU/USD</span>
              <span className="font-mono text-white font-black">$4,070.59</span>
              <span className="text-rose-400 flex items-center text-[11px] font-bold">
                <ArrowDownRight className="w-3 h-3" /> -0.43%
              </span>
            </div>

            {/* EUR/USD */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-300">EUR/USD</span>
              <span className="font-mono text-white font-black">1.11370</span>
              <span className="text-rose-400 flex items-center text-[11px] font-bold">
                <ArrowDownRight className="w-3 h-3" /> -0.73%
              </span>
            </div>

            {/* GBP/USD */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-300">GBP/USD</span>
              <span className="font-mono text-white font-black">1.33470</span>
              <span className="text-rose-400 flex items-center text-[11px] font-bold">
                <ArrowDownRight className="w-3 h-3" /> -0.75%
              </span>
            </div>

            {/* BTC/USD */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-purple-300">BTC/USD</span>
              <span className="font-mono text-white font-black">$76,008</span>
              <span className="text-emerald-400 flex items-center text-[11px] font-bold">
                <ArrowUpRight className="w-3 h-3" /> +0.21%
              </span>
            </div>
          </div>

          <Link href={user ? "/" : "/login"} className="text-[11px] text-emerald-400 font-bold hover:underline shrink-0 hidden sm:inline">
            Buka Chart &rarr;
          </Link>
        </div>
      </section>

      {/* 5. INTERACTIVE TERMINAL PREVIEW & FEATURE SHOWCASE */}
      <section id="demo" className="w-full shrink-0 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Terminal Jurnal Modern yang Dirancang untuk Trader Serius
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Coba navigasi antar modul unggulan dan lihat bagaimana JFZLA Journal mengubah angka mentah menjadi wawasan keputusan trading yang menguntungkan.
          </p>

          {/* Interactive Feature Tabs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 bg-[#090e1c] p-1.5 rounded-2xl border border-white/[0.08] max-w-2xl mx-auto">
            <button
              onClick={() => setActiveTab('sync')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'sync' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Auto-Sync MT5</span>
            </button>

            <button
              onClick={() => setActiveTab('cent')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'cent' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Smart Cent USC</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'calendar' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Heatmap Kalender</span>
            </button>

            <button
              onClick={() => setActiveTab('psychology')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'psychology' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Psikologi</span>
            </button>
          </div>
        </div>

        {/* Feature Interactive Showcase Card */}
        <div className="glass-panel p-6 sm:p-8 border border-white/[0.1] shadow-2xl relative overflow-hidden">
          
          {activeTab === 'sync' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Sinkronisasi Otomatis Tanpa Ribet
                </span>
                <h3 className="text-2xl font-black text-white">
                  Tiap 5 Detik Menyedot Riwayat Posisi Langsung dari Terminal MT5
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Tidak perlu lagi mengekspor file HTML statement secara manual dari MT5. Cloud Bridge kami terhubung langsung ke broker Anda. Begitu posisi TP/SL tertutup di MT5, jurnal Anda otomatis terupdate detik itu juga.
                </p>
                <div className="space-y-2.5 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Mendukung Exness Cent, HFM, Valetax, XM, FBS, dan broker MT5 lainnya</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Interval sinkronisasi fleksibel: 5s, 10s, 15s, 30s, atau 60s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Hanya memerlukan Investor Password (100% aman tanpa hak akses trade)</span>
                  </div>
                </div>
              </div>

              {/* Visual Simulated Mockup */}
              <div className="rounded-2xl bg-[#080d1b] border border-white/[0.1] p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-white">MT5 Live Sync Bridge: CONNECTED</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">Interval 5s</span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                    <div>
                      <span className="text-amber-300 font-bold">XAUUSD</span> • <span className="text-emerald-400">BUY 0.05 Lot</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Ticket #8491028 • Exness Cent</div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold glow-emerald">+1,450.00 USC</div>
                      <div className="text-[10px] text-slate-500">+$14.50 USD</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                    <div>
                      <span className="text-cyan-300 font-bold">EURUSD</span> • <span className="text-rose-400">SELL 0.10 Lot</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Ticket #8491035 • HFM Micro</div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold glow-emerald">+820.00 USC</div>
                      <div className="text-[10px] text-slate-500">+$8.20 USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cent' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Spesialisasi Akun Cent (USC)
                </span>
                <h3 className="text-2xl font-black text-white">
                  Konversi Cerdas Nilai USC ke USD Riil dalam 1-Klik
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Bagi trader EA Martingale / Grid, saldo akun cent 100,000 USC seringkali membingungkan saat dilaporkan ke investor atau dievaluasi sendiri. JFZLA Journal otomatis mengonversi 100,000 USC = $1,000 USD secara konsisten di seluruh grafik equity dan ringkasan PnL.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#090e1c] border border-white/[0.1] text-center flex-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Tampilan Cent</span>
                    <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">142,500 USC</div>
                  </div>
                  <span className="text-slate-500 font-bold">&harr;</span>
                  <div className="p-3 rounded-xl bg-[#090e1c] border border-white/[0.1] text-center flex-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Tampilan USD Riil</span>
                    <div className="text-sm font-black text-white font-mono mt-0.5">$1,425.00 USD</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#080d1b] border border-white/[0.1] p-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perbandingan Presisi Akun Cent</h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                    <span className="text-slate-300">Lot Eksekusi Cent</span>
                    <span className="font-mono text-white font-bold">0.10 Lot Cent (= 0.001 Standard)</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                    <span className="text-slate-300">Ketahanan Pip EA Grid</span>
                    <span className="font-mono text-emerald-400 font-bold">1,850 Pips Safe Margin</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-300">Toleransi Drawdown Maksimal</span>
                    <span className="font-mono text-amber-300 font-bold">8.4% (Rendah & Aman)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Visual Heatmap Intuitif
                </span>
                <h3 className="text-2xl font-black text-white">
                  Kalender Dual-Atmosphere: Hijau untuk Menang, Merah untuk Belajar
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Lihat performa harian Anda dalam bentuk matriks heatmap trading visual. Klik pada tanggal tertentu untuk langsung membongkar daftar transaksi, lot yang dipakai, waktu eksekusi sesi (Asia/London/NY), dan catatan kedisiplinan.
                </p>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-emerald-500/30 border border-emerald-500/50" />
                    <span>Hari Profit: Diberi pendaran hijau dengan kalkulasi net gain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-rose-500/30 border border-rose-500/50" />
                    <span>Hari Drawdown: Membantu Anda mendeteksi pola revenge trade</span>
                  </div>
                </div>
              </div>

              {/* Heatmap Mini Mockup */}
              <div className="rounded-2xl bg-[#080d1b] border border-white/[0.1] p-5 space-y-3">
                <div className="text-xs font-bold text-slate-400 flex justify-between">
                  <span>Maret 2026</span>
                  <span className="text-emerald-400 font-mono font-bold">Net +28,400 USC (Win Rate 78%)</span>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    <div className="text-[10px] text-slate-400">Sen</div>
                    <div className="font-mono font-bold mt-1">+4,200</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    <div className="text-[10px] text-slate-400">Sel</div>
                    <div className="font-mono font-bold mt-1">+1,850</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
                    <div className="text-[10px] text-slate-400">Rab</div>
                    <div className="font-mono font-bold mt-1">-890</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    <div className="text-[10px] text-slate-400">Kam</div>
                    <div className="font-mono font-bold mt-1">+6,100</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    <div className="text-[10px] text-slate-400">Jum</div>
                    <div className="font-mono font-bold mt-1">+3,400</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'psychology' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  Analisis Disiplin & Psikologi
                </span>
                <h3 className="text-2xl font-black text-white">
                  Identifikasi Kebocoran Profit: MAE, MFE, dan Emosi Trading
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Apakah Anda sering keluar terlalu cepat (takut kehilangan profit) atau menahan floating loss terlalu lama karena harapan semu? Fitur MAE (Maximum Adverse Excursion) membongkar titik terlemah psikologi Anda secara ilmiah.
                </p>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Evaluasi Kepatuhan SOP: Tandai trade yang melanggar aturan manajemen risiko</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Pelacak Emosi: Sabar, FOMO, Balas Dendam, atau Overconfidence</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#080d1b] border border-white/[0.1] p-5 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase">Indikator Kepatuhan Trading</div>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
                    <span className="text-emerald-300 font-semibold">Trade Sesuai SOP</span>
                    <span className="font-mono font-bold text-emerald-400">89.4% Kepatuhan</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex justify-between items-center">
                    <span className="text-rose-300 font-semibold">Trade Langgar SOP (FOMO)</span>
                    <span className="font-mono font-bold text-rose-400">10.6% Terdeteksi</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 6. SUPPORTED BROKERS ECOSYSTEM */}
      <section id="broker" className="w-full shrink-0 py-16 bg-[#060913] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-widest font-mono text-emerald-400 font-bold mb-3 flex items-center justify-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'id' ? 'Ekosistem Broker Terintegrasi' : 'Integrated Broker Ecosystem'}</span>
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
            {lang === 'id' ? 'Mendukung Broker Terpopuler & Seluruh Server MetaTrader 5' : 'Supporting Popular Brokers & All MetaTrader 5 Servers'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto mb-8">
            {lang === 'id' 
              ? 'Tersambung langsung via Cloud Bridge Engine ke server broker Anda tanpa perlu instalasi EA di VPS.'
              : 'Direct connection via high-speed Cloud Bridge Engine to your broker servers without manual EA setup.'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {/* Exness */}
            <div className="glass-panel p-4 text-left border-white/[0.08] hover:border-amber-400/50 transition group">
              <div className="flex items-center justify-between mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold">Standard & Cent</span>
              </div>
              <div className="font-black text-white text-base group-hover:text-amber-400 transition">EXNESS</div>
              <p className="text-[11px] text-slate-400 mt-1">Exness-MT5Real, Real2, Real9</p>
            </div>

            {/* HFM */}
            <div className="glass-panel p-4 text-left border-white/[0.08] hover:border-rose-400/50 transition group">
              <div className="flex items-center justify-between mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 font-bold">Micro & Cent</span>
              </div>
              <div className="font-black text-white text-base group-hover:text-rose-400 transition">HFM (HF MARKETS)</div>
              <p className="text-[11px] text-slate-400 mt-1">HFMarkets-Live, Micro Servers</p>
            </div>

            {/* Valetax */}
            <div className="glass-panel p-4 text-left border-white/[0.08] hover:border-cyan-400/50 transition group">
              <div className="flex items-center justify-between mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold">Cent & Pro</span>
              </div>
              <div className="font-black text-white text-base group-hover:text-cyan-400 transition">VALETAX INTL</div>
              <p className="text-[11px] text-slate-400 mt-1">Valetax-Live, Cent Server</p>
            </div>

            {/* Other MT5 Brokers */}
            <div className="glass-panel p-4 text-left border-white/[0.08] hover:border-emerald-400/50 transition group">
              <div className="flex items-center justify-between mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold">Universal MT5</span>
              </div>
              <div className="font-black text-white text-base group-hover:text-emerald-400 transition">ALL BROKERS</div>
              <p className="text-[11px] text-slate-400 mt-1">XM, FBS, IC Markets, dll.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LIVE STATS */}
      <section className="w-full shrink-0 py-16 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          
          <div className="glass-panel p-6">
            <div className="text-2xl sm:text-4xl font-black text-white font-mono">$2.48M+</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Volume Transaksi Tercatat</div>
          </div>

          <div className="glass-panel p-6">
            <div className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono glow-emerald">185,000+</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Posisi Tersinkron Otomatis</div>
          </div>

          <div className="glass-panel p-6">
            <div className="text-2xl sm:text-4xl font-black text-white font-mono">&lt; 5s</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Kecepatan Auto-Sync MT5</div>
          </div>

          <div className="glass-panel p-6">
            <div className="text-2xl sm:text-4xl font-black text-teal-400 font-mono">1,850+</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Trader Aktif di Indonesia</div>
          </div>

        </div>
      </section>

      {/* 8. PRICING TIERS & AFFILIATE PARTNER PLAN */}
      <section id="pricing" className="w-full shrink-0 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Akses Fleksibel & Transparan
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
            Pilih Paket yang Sesuai dengan Kebutuhan Trading Anda
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Dapatkan paket Partner secara <strong>GRATIS 100%</strong> cukup dengan menautkan akun broker partner Anda, atau pilih VIP PRO untuk fleksibilitas tanpa batas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Tier 1: Free Starter */}
          <div className="glass-panel p-7 flex flex-col justify-between border-white/[0.08]">
            <div>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-lg">Starter</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-400">Gratis</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Untuk trader pemula yang ingin mulai membiasakan diri mencatat jurnal.</p>
              
              <div className="mt-6">
                <span className="text-3xl font-black text-white font-mono">Rp 0</span>
                <span className="text-xs text-slate-400"> / selamanya</span>
              </div>

              <div className="border-t border-white/[0.06] my-6" />

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>1 Akun Trading MT5</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Impor Riwayat Statement HTML</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Kalkulator Risiko Lot Cent</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Kalender Heatmap Bulanan</span>
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="mt-8 w-full py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold text-xs text-center border border-white/[0.1] transition"
            >
              Daftar Gratis
            </Link>
          </div>

          {/* Tier 2: Affiliate Partner Plan (Most Popular) */}
          <div className="glass-panel p-7 flex flex-col justify-between border-emerald-500/40 relative shadow-2xl shadow-emerald-500/10 scale-105 z-10 bg-[#091222]/90">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
              Paling Populer • 100% Gratis
            </div>

            <div>
              <div className="flex justify-between items-center mt-2">
                <h3 className="font-bold text-emerald-300 text-lg flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-emerald-400" />
                  <span>Partner Affiliate</span>
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Hubungkan akun broker Exness, HFM, atau Valetax Anda. Nikmati Auto-Sync MT5 otomatis tanpa biaya!
              </p>
              
              <div className="mt-6">
                <span className="text-3xl font-black text-emerald-400 font-mono glow-emerald">GRATIS</span>
                <span className="text-xs text-slate-400"> (Via Partner Link)</span>
              </div>

              <div className="border-t border-white/[0.08] my-6" />

              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>MT5 Investor Auto-Sync Aktif</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Maksimal 3 Akun Broker Partner</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Interval Auto-Sync 60 Menit</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Audit Kepatuhan & AI Review</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Perhitungan Smart Cent USC</span>
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs text-center shadow-lg shadow-emerald-500/25 transition active:scale-95"
            >
              Klaim Akses Partner Gratis
            </Link>
          </div>

          {/* Tier 3: VIP PRO */}
          <div className="glass-panel p-7 flex flex-col justify-between border-amber-500/30">
            <div>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-amber-300 text-lg flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>VIP PRO</span>
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Unlimited
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Untuk prop trader, manajer dana, dan pengelola puluhan akun EA Grid.</p>
              
              <div className="mt-6">
                <span className="text-3xl font-black text-amber-400 font-mono">Rp 99.000</span>
                <span className="text-xs text-slate-400"> / bulan</span>
              </div>

              <div className="border-t border-white/[0.06] my-6" />

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2 font-semibold text-amber-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Akun MT5 Tanpa Batas (Semua Broker)</span>
                </li>
                <li className="flex items-center gap-2 font-semibold text-amber-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Auto-Sync Cepat Real-Time (5s - 15s)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Prioritas Remote Bridge Server</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Export Riwayat & Laporan Kinerja Lengkap</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Dukungan WhatsApp VIP 24/7</span>
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="mt-8 w-full py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs text-center transition"
            >
              Pilih Paket VIP PRO
            </Link>
          </div>

        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section id="faq" className="w-full shrink-0 py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <HelpCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
          <h2 className="text-3xl font-black text-white tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Transparansi keamanan dan teknis seputar platform jurnal trading JFZLA.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="glass-panel overflow-hidden border-white/[0.08] transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left text-sm font-bold text-white flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/[0.04] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. FINAL HIGH-CONVERTING CTA BANNER */}
      <section className="w-full shrink-0 py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="glass-panel p-8 sm:p-14 text-center relative overflow-hidden border-emerald-500/30 shadow-2xl bg-gradient-to-b from-[#0a1426] to-[#060b16]">
          
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Hentikan Trading Buta. Mulai Ukur Data Anda Hari Ini.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Bergabunglah bersama ribuan trader profesional dan algotrader di Indonesia. Pantau akun Cent dan MT5 Anda secara real-time tanpa ribet.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 transition active:scale-95 flex items-center gap-2"
              >
                <span>Daftar Gratis Sekarang</span>
                <ArrowUpRight className="w-4 h-4 font-bold" />
              </Link>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="px-6 py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.15] text-white font-bold text-sm transition active:scale-95 flex items-center gap-2.5"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Masuk dengan Google</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="w-full shrink-0 mt-auto bg-[#03060c] border-t border-white/[0.06] py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-black text-white text-sm">JFZLA Journal</span>
              <span className="text-[10px] text-slate-500 ml-2">&copy; 2026 JFZLA. All rights reserved.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
            <Link href={user ? "/" : "/login"} className="hover:text-white transition">Dashboard Terminal</Link>
            <Link href="/login" className="hover:text-white transition">Masuk Akun</Link>
            <Link href="/register" className="hover:text-white transition">Registrasi</Link>
            <Link href="/license" className="hover:text-white transition">Lisensi</Link>
          </div>

        </div>

        {/* High-Risk Warning Disclaimer */}
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/[0.04] text-[10px] text-slate-400 leading-relaxed">
          <p>
            <strong>Peringatan Risiko:</strong> Perdagangan valuta asing (Forex), Logam Mulia (Gold/Emas), dan CFD melibatkan risiko kerugian modal yang signifikan karena adanya fasilitas leverage. JFZLA Journal adalah platform analitik dan pencatatan jurnal mandiri, bukan penasihat keuangan ataupun broker pialang. Selalu kelola risiko lot dan gunakan modal yang siap Anda pertaruhkan secara bijak.
          </p>
        </div>
      </footer>

      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={() => router.push('/')}
      />

    </div>
  );
}
