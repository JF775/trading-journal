'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import {
  Activity,
  User as UserIcon,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BrokerName } from '@/lib/types';
import GlassSelect from '@/components/GlassSelect';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [broker, setBroker] = useState<BrokerName>('Exness');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      setErrorMsg(decodeURIComponent(err));
    }

    const initGsi = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      const clientId = '321836199993-qejo20qav2qu1l6oh9o26909p5gqdk5b.apps.googleusercontent.com';
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (!response?.credential) return;
            setIsGoogleLoading(true);
            try {
              const res = await loginWithGoogle({ credential: response.credential });
              if (res.success) {
                window.location.href = '/';
              } else {
                setErrorMsg(res.error || 'Gagal daftar via Google.');
              }
            } catch (err: any) {
              setErrorMsg(err.message || 'Gagal daftar via Google.');
            } finally {
              setIsGoogleLoading(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const container = document.getElementById('google-native-btn-container-reg');
        if (container) {
          container.innerHTML = '';
          google.accounts.id.renderButton(container, {
            theme: 'filled_black',
            size: 'large',
            text: 'signup_with',
            shape: 'rectangular',
            width: 380,
            logo_alignment: 'left',
          });
        }
      } catch (e) {
        console.warn('GSI init error:', e);
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          initGsi();
          clearInterval(timer);
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [loginWithGoogle]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(score, 4);
  }, [password]);

  const strengthLabels = ['Sangat Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !email || !password) {
      setErrorMsg('Mohon lengkapi seluruh formulir registrasi.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Anda harus menyetujui Syarat & Ketentuan untuk melanjutkan.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register(name, email, password, broker);
      if (res.success) {
        router.push('/');
      } else {
        setErrorMsg(res.error || 'Gagal mendaftar akun.');
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

      {/* Back to Landing Page Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/landing"
          className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
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
          Buat Akun Jurnal Trading
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          Daftar gratis dalam 30 detik. Tanpa kartu kredit, langsung sinkronkan akun MT5 Anda.
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

          {/* 1. OFFICIAL GOOGLE SIGN-UP BUTTON */}
          <div className="w-full flex flex-col items-center justify-center min-h-[44px]">
            {isGoogleLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Memverifikasi akun Google...</span>
              </div>
            ) : (
              <div id="google-native-btn-container-reg" className="w-full flex justify-center"></div>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-[#090e1c] px-3 text-slate-500">atau dengan email</span>
            </div>
          </div>

          {/* 2. REGISTRATION FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Anda"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#080d1b] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alamat Email
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

            {/* Preferred Broker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Broker Utama
              </label>
              <GlassSelect
                value={broker}
                onChange={val => setBroker(val as BrokerName)}
                options={[
                  { value: 'Exness', label: 'Exness', badge: 'Cent', icon: <Building2 className="w-3.5 h-3.5 text-amber-400" /> },
                  { value: 'HFM', label: 'HFM', badge: 'Micro', icon: <Building2 className="w-3.5 h-3.5 text-red-400" /> },
                  { value: 'Valetax', label: 'Valetax Global', badge: 'Global', icon: <Building2 className="w-3.5 h-3.5 text-blue-400" /> }
                ]}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimal 6 karakter"
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

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-colors ${
                          i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-white/[0.08]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 text-right">
                    Kekuatan Sandi: <span className="font-semibold text-white">{strengthLabels[passwordStrength - 1] || 'Sangat Lemah'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ulangi kata sandi"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#080d1b] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Agree Terms Checkbox */}
            <div className="flex items-start">
              <input
                id="agree_terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#080d1b] border-white/[0.2] text-emerald-500 focus:ring-emerald-500 mt-0.5"
              />
              <label htmlFor="agree_terms" className="ml-2 text-[11px] text-slate-400 cursor-pointer leading-tight">
                Saya menyetujui <span className="text-white hover:underline">Syarat & Ketentuan</span> serta <span className="text-white hover:underline">Kebijakan Privasi</span> JFZLA Journal.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Mendaftarkan Akun...' : 'Daftar Akun Gratis Sekarang'}</span>
              <ArrowRight className="w-3.5 h-3.5 font-bold" />
            </button>

          </form>

        </div>

        {/* Bottom Link to Login */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Sudah memiliki akun?{' '}
          <Link href="/login" className="font-bold text-emerald-400 hover:underline">
            Masuk di Sini &rarr;
          </Link>
        </p>

      </div>

      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

    </div>
  );
}
