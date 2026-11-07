'use client';

import React, { useState } from 'react';
import {
  Calculator,
  ShieldCheck,
  Target,
  ArrowRight,
  Plus,
  Coins,
  DollarSign
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LotCalculationResult } from '@/lib/types';
import GlassSelect from '@/components/GlassSelect';

export default function RiskCalculatorPage() {
  const { lang, t, formatMoney, accounts, setShowAddModal } = useApp();

  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0) || 100000;

  const [calcForm, setCalcForm] = useState({
    balance: totalBalance,
    risk_pct: 1.5,
    stop_loss_pips: 30,
    symbol: 'XAUUSD'
  });

  const [calcResult, setCalcResult] = useState<LotCalculationResult>({
    balance: totalBalance,
    risk_pct: 1.5,
    stop_loss_pips: 30,
    symbol: 'XAUUSD',
    pip_value: 10,
    risk_amount: (totalBalance * 1.5) / 100,
    recommended_lot: Number(((totalBalance * 1.5 / 100) / (30 * 10)).toFixed(2)) || 5.0
  });

  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const handleRunCalculation = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/calculator/lot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calcForm)
      });
      const data = await res.json();
      if (res.ok) {
        setCalcResult(data);
      }
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER BAR */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <span>{t('tabRiskCalculator')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {lang === 'id' ? 'Hitung ukuran lot secara matematis berdasarkan toleransi risiko % akun dan jarak Stop Loss agar modal terproteksi sempurna dari risiko margin call.' : 'Calculate exact mathematical lot sizing based on account risk percentage and stop-loss distance to safeguard equity from margin calls.'}
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-2">
          <span>{t('availableBalance')}</span>
          <span className="font-mono text-white">{formatMoney(totalBalance)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CALCULATOR INPUT FORM */}
        <div className="lg:col-span-6 glass-panel p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>{t('calcParams')}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{t('preciseFormula')}</span>
          </div>

          <div className="space-y-4">
            
            {/* Balance Input */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                <label>{t('tradingBalance')}</label>
                <button
                  type="button"
                  onClick={() => setCalcForm({ ...calcForm, balance: totalBalance })}
                  className="text-emerald-400 hover:text-emerald-300 text-[11px]"
                >
                  Gunakan Total Saldo MT5
                </button>
              </div>
              <input
                type="number"
                value={calcForm.balance}
                onChange={e => setCalcForm({ ...calcForm, balance: Number(e.target.value) })}
                className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Risk % Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Toleransi Risiko (% dari Saldo)
              </label>
              <div className="flex items-center gap-2 mb-2">
                {[0.5, 1.0, 1.5, 2.0, 3.0].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setCalcForm({ ...calcForm, risk_pct: pct })}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                      calcForm.risk_pct === pct
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                step="0.1"
                value={calcForm.risk_pct}
                onChange={e => setCalcForm({ ...calcForm, risk_pct: Number(e.target.value) })}
                className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Stop Loss & Symbol */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('stopLossPips')}
                </label>
                <input
                  type="number"
                  value={calcForm.stop_loss_pips}
                  onChange={e => setCalcForm({ ...calcForm, stop_loss_pips: Number(e.target.value) })}
                  className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('instrumentSymbol')}
                </label>
                <GlassSelect
                  value={calcForm.symbol}
                  onChange={val => setCalcForm({ ...calcForm, symbol: val })}
                  options={[
                    { value: 'XAUUSD', label: 'XAUUSD (Gold)', badge: 'Emas' },
                    { value: 'EURUSD', label: 'EURUSD (Forex Mayor)', badge: 'FX' },
                    { value: 'GBPUSD', label: 'GBPUSD (Forex Mayor)', badge: 'FX' },
                    { value: 'USDJPY', label: 'USDJPY (Cross JPY)', badge: 'FX' },
                    { value: 'BTCUSD', label: 'BTCUSD (Crypto)', badge: 'Crypto' }
                  ]}
                />
              </div>
            </div>

            <button
              onClick={handleRunCalculation}
              disabled={isCalculating}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {isCalculating ? 'Menghitung...' : 'Hitung Ukuran Lot Ideal'}
            </button>

          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-IMPACT CALCULATION RESULT (EMERALD GLASS) */}
        <div className="lg:col-span-6 glass-panel glass-emerald p-6 flex flex-col justify-between space-y-6">
          
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Hasil Rekomendasi</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                100% Risk Safe
              </span>
            </div>

            <div className="text-center py-4">
              <div className="text-xs text-emerald-300 font-semibold mb-1">Ukuran Posisi yang Disarankan:</div>
              <div className="text-5xl font-black text-white glow-emerald tracking-tight font-mono">
                {calcResult.recommended_lot.toFixed(2)}
              </div>
              <div className="text-sm font-bold text-emerald-300 mt-1 uppercase tracking-wider">
                Lots ({calcResult.symbol})
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Maksimal Risiko Uang</div>
                <div className="text-sm font-bold text-rose-400 font-mono">
                  {formatMoney(calcResult.risk_amount)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Nilai Per Pip (1 Lot)</div>
                <div className="text-sm font-bold text-white font-mono">
                  ${calcResult.pip_value} / pip
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-500/20">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Terapkan ke Catatan Trade Baru</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
