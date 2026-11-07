'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Globe,
  Loader2,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function GoogleAuthModal({ isOpen, onClose, onSuccess }: GoogleAuthModalProps) {
  const { lang, loginWithGoogle } = useApp();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setErrorMsg(lang === 'id' ? 'Masukkan alamat email Google / Gmail yang valid.' : 'Please enter a valid Google email.');
      return;
    }

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanName = nameInput.trim() || cleanEmail.split('@')[0];

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await loginWithGoogle({
        email: cleanEmail,
        name: cleanName,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`
      });

      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
        window.location.href = '/';
      } else {
        setErrorMsg(res.error || 'Gagal masuk dengan akun Google.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
      setLoading(false);
    }
  };

  const handleLaunchOfficialOAuth = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Outer Card with Google Dark Theme Styling */}
      <div className="relative w-full max-w-[480px] rounded-[28px] bg-[#1f1f20] border border-[#3c4043] shadow-2xl p-7 sm:p-9 text-[#e3e3e3] overflow-hidden font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-5 top-5 text-[#9aa0a6] hover:text-white p-1.5 rounded-full hover:bg-white/[0.08] transition"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header Logo */}
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="text-sm font-medium text-[#c4c7c5]">
            {lang === 'id' ? 'Login dengan Akun Google' : 'Sign in with Google Account'}
          </span>
        </div>

        {/* Title & App Destination */}
        <div className="mb-6">
          <h2 className="text-2xl font-normal text-[#e3e3e3] tracking-tight">
            {lang === 'id' ? 'Pilih atau Masukkan Email' : 'Choose or Enter Email'}
          </h2>
          <p className="text-sm text-[#c4c7c5] mt-1.5">
            {lang === 'id' ? 'Masuk ke ' : 'Continue to '}
            <span className="text-white font-medium">JFZLA CentTrade Journal</span>
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Option: Official Google OAuth Redirect */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleLaunchOfficialOAuth}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#282a2c] hover:bg-[#323639] border border-[#3c4043] text-white flex items-center justify-between transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-[#8ab4f8]" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white group-hover:text-[#8ab4f8] transition">
                  {lang === 'id' ? 'Buka Layar Pilih Akun Google Resmi' : 'Open Official Google Account Chooser'}
                </div>
                <div className="text-[11px] text-[#9aa0a6]">
                  accounts.google.com (Pilih akun tersimpan Anda)
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[#9aa0a6] group-hover:text-[#8ab4f8] transition shrink-0" />
          </button>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#3c4043]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-[#1f1f20] px-3 text-[#9aa0a6]">
                {lang === 'id' ? 'Atau Masukkan Email Google Anda' : 'Or Enter Your Google Email'}
              </span>
            </div>
          </div>

          {/* Direct Custom Email Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">
                {lang === 'id' ? 'Alamat Email Google / Gmail Anda:' : 'Your Google / Gmail Address:'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#80868b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="contoh: nama.anda@gmail.com"
                  autoFocus
                  required
                  className="w-full bg-[#131314] border border-[#5f6368] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-[#80868b] focus:outline-none focus:border-[#8ab4f8] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">
                {lang === 'id' ? 'Nama Tampilan (Opsional):' : 'Display Name (Optional):'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#80868b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  className="w-full bg-[#131314] border border-[#5f6368] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-[#80868b] focus:outline-none focus:border-[#8ab4f8] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#131314] font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{loading ? (lang === 'id' ? 'Memverifikasi...' : 'Verifying...') : (lang === 'id' ? 'Masuk dengan Email Ini' : 'Sign In with this Email')}</span>
            </button>
          </form>
        </div>

        {/* Security & Cloud Badge */}
        <div className="mt-6 pt-4 border-t border-[#3c4043]/60 flex items-center justify-between text-[11px] text-[#9aa0a6]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>PostgreSQL Neon Cloud Auth</span>
          </div>

          <span className="text-[10px] text-slate-500 font-mono">OAuth 2.0 / OpenID</span>
        </div>

        {/* Footer Matching Google Account Chooser */}
        <div className="mt-6 flex items-center justify-between text-[12px] text-[#9aa0a6]">
          <div className="flex items-center gap-1.5 hover:text-white cursor-pointer transition">
            <Globe className="w-3.5 h-3.5" />
            <span>Indonesia</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer transition">Bantuan</span>
            <span className="hover:text-white cursor-pointer transition">Privasi</span>
            <span className="hover:text-white cursor-pointer transition">Persyaratan</span>
          </div>
        </div>

      </div>
    </div>
  );
}
