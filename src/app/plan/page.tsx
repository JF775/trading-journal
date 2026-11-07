'use client';

import React, { useState } from 'react';
import {
  ClipboardList,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Save,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { TradingPlan } from '@/lib/types';

export default function TradingPlanPage() {
  const { lang, t, tradingPlan, setTradingPlan, refreshData } = useApp();

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [newSetupInput, setNewSetupInput] = useState<string>('');
  const [newChecklistInput, setNewChecklistInput] = useState<string>('');

  const currentPlan: TradingPlan = tradingPlan || {
    id: 'default_plan',
    title: 'Cent & EA Discipline Master Plan',
    max_daily_loss: 500,
    max_risk_per_trade_pct: 1.5,
    max_open_trades: 5,
    allowed_sessions: ['London', 'New York'],
    setups: [
      'Cent Grid EA Martingale',
      'London Session Breakout',
      'XAUUSD Liquidity Sweep',
      'Trend Pullback (EMA 50/200)',
      'Order Block Reversal'
    ],
    entry_checklist: [
      { item: 'Trend alignment on H1 & H4 timeframe', required: true },
      { item: 'Key support/resistance or order block confirmed', required: true },
      { item: 'Risk-to-Reward ratio minimum 1:2', required: true },
      { item: 'No high-impact news within 30 minutes', required: true },
      { item: 'Lot size strictly calculated within 1.5% risk limit', required: true }
    ]
  };

  const handleSavePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/trading-plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPlan)
      });
      if (res.ok) {
        alert(lang === 'id' ? 'Trading Plan berhasil disimpan!' : 'Trading Plan saved!');
        await refreshData(true);
      }
    } catch (err) {
      console.error('Failed to save trading plan:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSetup = () => {
    if (!newSetupInput.trim()) return;
    if (currentPlan.setups.includes(newSetupInput.trim())) return;
    setTradingPlan({
      ...currentPlan,
      setups: [...currentPlan.setups, newSetupInput.trim()]
    });
    setNewSetupInput('');
  };

  const handleRemoveSetup = (setup: string) => {
    setTradingPlan({
      ...currentPlan,
      setups: currentPlan.setups.filter(s => s !== setup)
    });
  };

  const handleAddChecklist = () => {
    if (!newChecklistInput.trim()) return;
    setTradingPlan({
      ...currentPlan,
      entry_checklist: [...currentPlan.entry_checklist, { item: newChecklistInput.trim(), required: true }]
    });
    setNewChecklistInput('');
  };

  const handleRemoveChecklist = (idx: number) => {
    setTradingPlan({
      ...currentPlan,
      entry_checklist: currentPlan.entry_checklist.filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="space-y-6">

      {/* HEADER BAR */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            <span>{t('tabTradingPlan')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t('planDesc')}
          </p>
        </div>

        <button
          onClick={() => handleSavePlan()}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 active:scale-95 disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? t('savingPlan') : t('savePlanBtn')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: RISK LIMITS */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t('riskLimitsTitle')}</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {t('mandatoryRule')}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('maxDailyLossLabel')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={currentPlan.max_daily_loss}
                    onChange={e => setTradingPlan({ ...currentPlan, max_daily_loss: Number(e.target.value) })}
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">USC / $</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Jika floating loss atau realisasi hari ini mencapai angka ini, stop trading otomatis.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('maxRiskPerTradeLabel')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={currentPlan.max_risk_per_trade_pct}
                    onChange={e => setTradingPlan({ ...currentPlan, max_risk_per_trade_pct: Number(e.target.value) })}
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">%</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Standar profesional: 1.0% s/d 2.0% dari saldo ekuitas akun.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Batas Maksimal Posisi Terbuka (Max Open Trades)
                </label>
                <input
                  type="number"
                  value={currentPlan.max_open_trades}
                  onChange={e => setTradingPlan({ ...currentPlan, max_open_trades: Number(e.target.value) })}
                  className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('allowedSessionsLabel')}
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Asian', 'London', 'New York'].map(ses => {
                    const active = (currentPlan.allowed_sessions || []).includes(ses);
                    return (
                      <button
                        key={ses}
                        type="button"
                        onClick={() => {
                          const current = currentPlan.allowed_sessions || [];
                          const updated = active ? current.filter(s => s !== ses) : [...current, ses];
                          setTradingPlan({ ...currentPlan, allowed_sessions: updated });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          active
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-white/[0.03] border-white/[0.08] text-slate-400'
                        }`}
                      >
                        {ses} Session
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SETUPS & ENTRY CHECKLIST */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* VERIFIED SETUPS CATALOG */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Katalog Setup & Strategi Terverifikasi</span>
              </h3>
              <span className="text-xs text-slate-400">
                {currentPlan.setups.length} Setup
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {currentPlan.setups.map(setup => (
                <div
                  key={setup}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-white flex items-center gap-2 group hover:border-emerald-500/40 transition"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{setup}</span>
                  <button
                    onClick={() => handleRemoveSetup(setup)}
                    className="text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Tambah setup baru (misal: Asian Session Range Breakout)..."
                value={newSetupInput}
                onChange={e => setNewSetupInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddSetup(); }}
                className="flex-1 bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleAddSetup}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-emerald-500/20 text-emerald-300 border border-white/[0.1] hover:border-emerald-500/30 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* PRE-TRADE ENTRY CHECKLIST */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Checklist Konfirmasi Entry (Sebelum Buka Posisi)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {currentPlan.entry_checklist.length} Poin
              </span>
            </div>

            <div className="space-y-2.5">
              {currentPlan.entry_checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 flex items-center justify-between text-xs transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 font-medium">{item.item}</span>
                  </div>

                  <button
                    onClick={() => handleRemoveChecklist(idx)}
                    className="text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Tambah poin konfirmasi baru..."
                value={newChecklistInput}
                onChange={e => setNewChecklistInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddChecklist(); }}
                className="flex-1 bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleAddChecklist}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-emerald-500/20 text-emerald-300 border border-white/[0.1] hover:border-emerald-500/30 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
