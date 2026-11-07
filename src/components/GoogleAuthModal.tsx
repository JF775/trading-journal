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
  Plus
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SavedGoogleAccount {
  name: string;
  email: string;
  avatarBg?: string;
  avatarLetter: string;
  avatarType?: 'letter' | 'image';
  avatarUrl?: string;
}

export default function GoogleAuthModal({ isOpen, onClose, onSuccess }: GoogleAuthModalProps) {
  const { lang, loginWithGoogle } = useApp();

  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherEmail, setOtherEmail] = useState('');
  const [otherName, setOtherName] = useState('');

  // The user's Google accounts as shown in their Google Account Chooser
  const googleAccounts: SavedGoogleAccount[] = [
    {
      name: 'Jhonata Fernanda',
      email: 'jonata.f12345@gmail.com',
      avatarBg: 'bg-[#2b303c]',
      avatarLetter: 'J'
    },
    {
      name: 'PARAMORE',
      email: 'jonatagaming46@gmail.com',
      avatarBg: 'bg-[#1e232d]',
      avatarLetter: 'P'
    },
    {
      name: 'reagan gabriel',
      email: 'reagangabriel46@gmail.com',
      avatarBg: 'bg-[#c2185b]', // Official magenta color as in Google Account Chooser screenshot
      avatarLetter: 'r'
    }
  ];

  if (!isOpen) return null;

  const handleSelectAccount = async (account: { name: string; email: string }) => {
    setSelectedEmail(account.email);
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await loginWithGoogle({
        email: account.email.trim().toLowerCase(),
        name: account.name.trim(),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(account.name)}`
      });

      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
        // Soft refresh or direct to home
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

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherEmail || !otherEmail.includes('@')) {
      setErrorMsg(lang === 'id' ? 'Masukkan alamat email Google yang valid.' : 'Please enter a valid Google email.');
      return;
    }
    const cleanEmail = otherEmail.trim().toLowerCase();
    const cleanName = otherName.trim() || cleanEmail.split('@')[0];
    handleSelectAccount({ name: cleanName, email: cleanEmail });
  };

  const handleLaunchOfficialOAuth = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Outer Card with Google Dark Theme Styling */}
      <div className="relative w-full max-w-[500px] rounded-[28px] bg-[#1f1f20] border border-[#3c4043] shadow-2xl p-8 sm:p-10 text-[#e3e3e3] overflow-hidden font-sans">
        
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
            {lang === 'id' ? 'Login dengan Google' : 'Sign in with Google'}
          </span>
        </div>

        {/* Title & App Destination */}
        <div className="mb-6">
          <h2 className="text-2xl font-normal text-[#e3e3e3] tracking-tight">
            {lang === 'id' ? 'Pilih akun' : 'Choose an account'}
          </h2>
          <p className="text-sm text-[#c4c7c5] mt-1.5">
            {lang === 'id' ? 'Lanjutkan ke ' : 'to continue to '}
            <span className="text-white font-medium">JFZLA CentTrade</span>
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Accounts List (Google Account Chooser Layout) */}
        <div className="border-t border-[#3c4043] divide-y divide-[#3c4043]">
          {googleAccounts.map((account) => {
            const isSelected = selectedEmail === account.email && loading;
            return (
              <button
                key={account.email}
                type="button"
                onClick={() => handleSelectAccount(account)}
                disabled={loading}
                className="w-full text-left py-3.5 px-3 -mx-3 rounded-lg hover:bg-[#282a2c] flex items-center justify-between transition group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Account Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full ${account.avatarBg} text-white font-medium text-sm flex items-center justify-center shrink-0 shadow-sm border border-white/[0.1]`}
                  >
                    {account.avatarLetter}
                  </div>
                  {/* Account Name & Email */}
                  <div className="min-w-0 truncate">
                    <div className="text-[14px] font-medium text-[#e3e3e3] group-hover:text-white truncate">
                      {account.name}
                    </div>
                    <div className="text-[12px] text-[#c4c7c5] truncate font-normal">
                      {account.email}
                    </div>
                  </div>
                </div>

                {isSelected ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0 ml-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-transparent group-hover:text-[#9aa0a6] shrink-0 ml-2 transition" />
                )}
              </button>
            );
          })}

          {/* Option: Gunakan Akun Lain */}
          {!showOtherInput ? (
            <button
              type="button"
              onClick={() => setShowOtherInput(true)}
              disabled={loading}
              className="w-full text-left py-3.5 px-3 -mx-3 rounded-lg hover:bg-[#282a2c] flex items-center gap-3.5 transition group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-transparent border border-[#5f6368] text-[#c4c7c5] flex items-center justify-center shrink-0 group-hover:border-[#8ab4f8] group-hover:text-[#8ab4f8] transition">
                <User className="w-4 h-4" />
              </div>
              <span className="text-[14px] font-medium text-[#e3e3e3] group-hover:text-white transition">
                {lang === 'id' ? 'Gunakan akun lain' : 'Use another account'}
              </span>
            </button>
          ) : (
            <div className="py-4">
              <form onSubmit={handleCustomSubmit} className="space-y-3">
                <div className="text-xs font-medium text-[#c4c7c5] mb-1">
                  {lang === 'id' ? 'Masukkan Akun Google Lain:' : 'Enter Other Google Account:'}
                </div>
                <input
                  type="email"
                  value={otherEmail}
                  onChange={(e) => setOtherEmail(e.target.value)}
                  placeholder="email.anda@gmail.com"
                  autoFocus
                  required
                  className="w-full bg-[#131314] border border-[#5f6368] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#80868b] focus:outline-none focus:border-[#8ab4f8] transition"
                />
                <input
                  type="text"
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                  placeholder="Nama Lengkap (Opsional)"
                  className="w-full bg-[#131314] border border-[#5f6368] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#80868b] focus:outline-none focus:border-[#8ab4f8] transition"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#8ab4f8] text-[#131314] font-semibold text-xs hover:bg-[#aecbfa] transition flex items-center justify-center gap-1.5"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{lang === 'id' ? 'Lanjutkan Masuk' : 'Continue Sign In'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOtherInput(false)}
                    className="py-2 px-3 rounded-xl bg-white/[0.06] text-[#c4c7c5] hover:text-white text-xs transition"
                  >
                    {lang === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Info & Official Google OAuth Cloud Link */}
        <div className="mt-6 pt-4 border-t border-[#3c4043]/60 flex items-center justify-between text-[11px] text-[#9aa0a6]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Role Default: Starter</span>
          </div>

          <button
            type="button"
            onClick={handleLaunchOfficialOAuth}
            className="text-[#8ab4f8] hover:text-[#aecbfa] hover:underline flex items-center gap-1 transition"
            title="Buka accounts.google.com melalui browser"
          >
            <span>accounts.google.com</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Footer Matching Google Account Chooser */}
        <div className="mt-8 flex items-center justify-between text-[12px] text-[#9aa0a6]">
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
