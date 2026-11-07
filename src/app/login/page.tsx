'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  Crown,
  Server,
  ShieldCheck,
  UserCheck,
  User
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import GoogleAuthModal from '@/components/GoogleAuthModal';

export default function LoginPage() {
  const router = useRouter();
  const { lang, setLang, t, login, loginWithGoogle } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showRoleTester, setShowRoleTester] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    const googleSetup = params.get('google_setup');
    if (err) {
      setErrorMsg(decodeURIComponent(err));
    } else if (googleSetup) {
      setErrorMsg('Google OAuth memerlukan pendaftaran redirect URI di Google Cloud Console. Anda dapat memilih akun Google langsung di bawah.');
      setShowGoogleModal(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Mohon isi alamat email dan password Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        router.push('/');
      } else {
        setErrorMsg(res.error || 'Email atau password salah.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    window.location.href = '/api/auth/google';
  };

  const handleQuickLogin = async (quickEmail: string, quickPass = 'password123') => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await login(quickEmail, quickPass);
      if (res.success) {
        router.push('/');
      } else {
        setErrorMsg(res.error || 'Login gagal.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05080f] text-[#f8fafc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Landing Page & Language Switcher */}
      <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between">
        <Link
          href="/landing"
          className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{lang === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}</span>
        </Link>

        <button
          onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
          className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-bold transition flex items-center gap-1.5"
        >
          <span className="text-emerald-400 font-mono">🌐</span>
          <span>{lang.toUpperCase()}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        
        {/* Brand Icon */}
        <Link href="/landing" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 border border-emerald-400/40 group-hover:scale-105 transition">
            <Activity className="w-6 h-6 text-slate-950 font-black" />
          </div>
          <span className="font-black text-2xl text-white tracking-tight">JFZLA</span>
        </Link>

        <h2 className="text-2xl font-black text-white tracking-tight">
          {t('loginTitle')}
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          {t('loginSubtitle')}
        </p>

      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel p-6 sm:p-8 border border-white/[0.1] shadow-2xl">
          
          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. DIRECT GOOGLE LOGIN BUTTON */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.15] text-white font-bold text-xs transition flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isGoogleLoading ? (lang === 'id' ? 'Menghubungkan...' : 'Connecting...') : t('loginWithGoogle')}</span>
            </button>

            <div className="flex items-center justify-between px-1 text-[11px]">
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="text-slate-400 hover:text-emerald-400 transition underline underline-offset-2 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium">{lang === 'id' ? 'Buka Pemilih Akun Google Instan' : 'Open Google Account Picker'}</span>
              </button>
              <span className="text-[10px] text-slate-500 font-mono">Google OAuth 2.0</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-[#090e1c] px-3 text-slate-500">{t('orWithEmail')}</span>
            </div>
          </div>

          {/* 2. EMAIL & PASSWORD LOGIN FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('emailLabel')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#080d1b] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {t('passwordLabel')}
                </label>
                <button
                  type="button"
                  onClick={() => alert('Fitur reset password: Silakan hubungi admin atau gunakan login Google.')}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  {t('forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#080d1b] border border-white/[0.1] rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#080d1b] border-white/[0.2] text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="remember_me" className="ml-2 text-xs text-slate-400 cursor-pointer">
                {t('rememberMe')}
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? (lang === 'id' ? 'Memverifikasi...' : 'Verifying...') : t('submitLogin')}</span>
              <ArrowRight className="w-3.5 h-3.5 font-bold" />
            </button>

          </form>

          {/* Quick RBAC Role Selector / Developer Evaluation Accordion */}
          <div className="mt-5 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setShowRoleTester(!showRoleTester)}
              className="w-full text-xs font-semibold text-slate-400 hover:text-emerald-300 transition flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>🧪 Uji Coba Cepat Role RBAC (Evaluasi)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400/80">
                {showRoleTester ? 'Tutup ▲' : 'Buka ▼'}
              </span>
            </button>

            {showRoleTester && (
              <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                <div className="text-[11px] text-slate-400 leading-tight">
                  Pilih salah satu role di bawah untuk login instan dengan akun dan batasan paket yang terisolasi:
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  {/* 1. Admin */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@jfzla.com')}
                    className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-left transition flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-purple-400" />
                        Admin / Dev
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200">
                        Full Access
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px]">admin@jfzla.com</span>
                  </button>

                  {/* 2. PRO VIP */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('pro@jfzla.com')}
                    className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        Client PRO
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200">
                        Unlimited
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px]">pro@jfzla.com</span>
                  </button>

                  {/* 3. Affiliate */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('affiliate@jfzla.com')}
                    className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                        Affiliate
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200">
                        Max 3 MT5
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px]">affiliate@jfzla.com</span>
                  </button>

                  {/* 4. Starter Free */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('starter@jfzla.com')}
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-left transition flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300 flex items-center gap-1">
                        <Server className="w-3 h-3 text-slate-400" />
                        Starter Free
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400">
                        Maks 1 MT5
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px]">starter@jfzla.com</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Link to Register */}
        <p className="mt-6 text-center text-xs text-slate-400">
          {t('dontHaveAccount')}{' '}
          <Link href="/register" className="font-bold text-emerald-400 hover:underline">
            {t('registerHere')}
          </Link>
        </p>

      </div>

      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={() => router.push('/')}
      />

    </div>
  );
}
