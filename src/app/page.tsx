'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Target,
  BarChart3,
  Bot,
  Plus,
  Server,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function DashboardOverviewPage() {
  const {
    lang,
    t,
    isCentMode,
    formatMoney,
    analytics,
    accounts,
    trades,
    selectedAccountId,
    setShowAddModal,
    setShowImportModal
  } = useApp();

  const [chartTimeframe, setChartTimeframe] = useState<'today' | '7d' | '30d' | 'all'>('all');

  const currentAccount = selectedAccountId !== 'all' ? accounts.find(a => a.id === selectedAccountId) : (accounts.length === 1 ? accounts[0] : null);
  const totalBalance = currentAccount ? currentAccount.balance : accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  const totalEquity = currentAccount ? currentAccount.equity : accounts.reduce((acc, a) => acc + (a.equity || 0), 0);
  const floatingPnL = currentAccount ? currentAccount.floating_pnl : accounts.reduce((acc, a) => acc + (a.floating_pnl || 0), 0);

  const netProfit = analytics?.net_profit || 0;
  const isNetProfitPositive = netProfit >= 0;

  // Filter equity curve points
  const equityPoints = (analytics?.equity_curve || []).slice(
    chartTimeframe === 'today' ? -5 :
    chartTimeframe === '7d' ? -15 :
    chartTimeframe === '30d' ? -30 : 0
  );

  return (
    <div className="space-y-6">

      {/* TOP 4 HIGH-IMPACT GLASS METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: TOTAL BALANCE & EQUITY (EMERALD GLASS ACCENT) */}
        <div className="glass-panel glass-emerald p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <span>{isCentMode ? t('totalCentBalance') : t('totalUsdBalance')}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 truncate max-w-[120px]">
              {currentAccount ? currentAccount.name : `${accounts.length} MT5`}
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl lg:text-3xl font-black text-white tracking-tight glow-emerald">
              {formatMoney(totalBalance)}
            </div>
            <div className="text-xs text-emerald-400/90 mt-1 flex items-center gap-1.5 font-medium">
              <span>{t('equityLabel')}: {formatMoney(totalEquity)}</span>
              {floatingPnL !== 0 && (
                <span className={floatingPnL >= 0 ? 'text-emerald-300 font-mono font-bold' : 'text-rose-400 font-mono font-bold'}>
                  ({floatingPnL >= 0 ? '+' : ''}{formatMoney(floatingPnL)})
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-500/15 flex items-center justify-between text-[11px] text-slate-400">
            <span>{isCentMode ? t('centMode') : t('usdMode')}</span>
            <Link href="/accounts" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5">
              <span>{t('manageMt5')}</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* CARD 2: NET REALIZED P/L (DYNAMIC GREEN OR RED GLASS) */}
        <div className={`glass-panel p-5 flex flex-col justify-between relative overflow-hidden ${
          isNetProfitPositive ? 'glass-emerald' : 'glass-rose'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1">
            <span>{t('netProfit')}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isNetProfitPositive 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {analytics?.total_trades || 0} {t('trades')}
            </span>
          </div>

          <div className="my-2">
            <div className={`text-2xl lg:text-3xl font-black tracking-tight ${
              isNetProfitPositive ? 'text-emerald-400 glow-emerald' : 'text-rose-400 glow-rose'
            }`}>
              {isNetProfitPositive ? '+' : ''}{formatMoney(netProfit)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Win: <strong className="text-emerald-400 font-mono">{formatMoney(analytics?.gross_profit || 0)}</strong></span>
              <span>&bull;</span>
              <span>Loss: <strong className="text-rose-400 font-mono">{formatMoney(analytics?.gross_loss || 0)}</strong></span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
            <span>Expectancy: <strong className="text-white font-mono">{analytics?.expectancy || 0}</strong></span>
            <Link href="/journal" className="text-slate-300 hover:text-white font-semibold flex items-center gap-0.5">
              <span>Journal</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* CARD 3: WIN RATE & PROFIT FACTOR */}
        <div className="glass-panel p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
            <span>{t('winRatio')}</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              PF: {analytics?.profit_factor ? analytics.profit_factor.toFixed(2) : '0.00'}
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl lg:text-3xl font-black text-white tracking-tight glow-emerald flex items-center gap-2">
              <span>{analytics?.win_rate ? analytics.win_rate.toFixed(1) : '0.0'}%</span>
            </div>
            {/* Visual Win/Loss bar */}
            <div className="w-full h-2 rounded-full bg-rose-500/30 overflow-hidden flex mt-2.5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500" 
                style={{ width: `${Math.min(100, Math.max(0, analytics?.win_rate || 50))}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{analytics?.winning_trades || 0} {t('win')}</span>
            <span className="text-rose-400 font-semibold">{analytics?.losing_trades || 0} {t('loss')}</span>
          </div>
        </div>

        {/* CARD 4: DRAWDOWN & RISK DISCIPLINE (ROSE GLASS ACCENT) */}
        <div className="glass-panel glass-rose p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-rose-300 font-medium mb-1">
            <span>{t('maxDrawdown')}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Risk Guard
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl lg:text-3xl font-black text-rose-400 tracking-tight glow-rose">
              -{formatMoney(analytics?.max_drawdown || 0)}
            </div>
            <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
              <span>{t('disciplineRate')}:</span>
              <span className="text-emerald-400 font-bold">{analytics?.discipline_rate ? `${analytics.discipline_rate.toFixed(0)}%` : '100%'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-rose-500/15 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t('peakDecline')}: {analytics?.max_drawdown_pct ? `${analytics.max_drawdown_pct.toFixed(1)}%` : '0%'}</span>
            <Link href="/plan" className="text-rose-300 hover:text-white font-semibold flex items-center gap-0.5">
              <span>{t('planRules')}</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>

      {/* CUMULATIVE EQUITY CURVE GRAPHIC (SMOOTH GREEN GLASS VISUALIZATION) */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>{t('equityCurve')}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('equityCurveSub')}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#090e1b] border border-white/[0.08] rounded-xl p-1 text-xs">
            {(['today', '7d', '30d', 'all'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                className={`px-3 py-1 rounded-lg font-semibold uppercase text-[10px] transition ${
                  chartTimeframe === tf
                    ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/25 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Curve Graphic */}
        {equityPoints.length > 1 ? (
          <div className="w-full h-64 relative pt-4">
            {(() => {
              const values = equityPoints.map(p => p.cumulative);
              const minVal = Math.min(...values);
              const maxVal = Math.max(...values);
              const range = maxVal - minVal || 1;
              const height = 220;
              const width = 1000;

              const points = equityPoints.map((p, i) => {
                const x = (i / (equityPoints.length - 1)) * width;
                const y = height - ((p.cumulative - minVal) / range) * (height - 30) - 15;
                return `${x},${y}`;
              }).join(' ');

              const areaPoints = `0,${height} ${points} ${width},${height}`;

              return (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="emeraldCurveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Subtle Gridlines */}
                  <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                  <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                  <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />

                  {/* Gradient Area Fill */}
                  <polygon points={areaPoints} fill="url(#emeraldCurveGrad)" />

                  {/* Glowing Stroke Line */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                    filter="drop-shadow(0 0 8px rgba(16,185,129,0.5))"
                  />
                </svg>
              );
            })()}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
            {t('notEnoughTradeData')}
          </div>
        )}
      </div>

      {/* STRATEGY PERFORMANCE & ROBO ADVISOR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT: STRATEGY BREAKDOWN TABLE */}
        <div className="lg:col-span-8 glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>{t('strategyBreakdown')}</span>
            </h3>
            <span className="text-xs text-slate-400">
              {analytics?.strategy_performance?.length || 0} {t('activeSetups')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wider">
                  <th className="pb-2.5 font-semibold">{t('strategyBot')}</th>
                  <th className="pb-2.5 font-semibold text-center">{t('trades')}</th>
                  <th className="pb-2.5 font-semibold text-right">{t('winRate')}</th>
                  <th className="pb-2.5 font-semibold text-right">{t('profitFactor')}</th>
                  <th className="pb-2.5 font-semibold text-right">{t('netProfit')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {(analytics?.strategy_performance || []).map((s, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 font-semibold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>{s.name}</span>
                    </td>
                    <td className="py-3 text-center text-slate-300 font-mono">{s.trades_count}</td>
                    <td className="py-3 text-right font-mono text-emerald-400 font-semibold">{s.win_rate.toFixed(1)}%</td>
                    <td className="py-3 text-right font-mono text-slate-200">{s.profit_factor.toFixed(2)}</td>
                    <td className={`py-3 text-right font-mono font-bold ${s.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.net_profit >= 0 ? '+' : ''}{formatMoney(s.net_profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: SMART QUICK ACTION CARD (EMERALD & ROSE DUAL THEME) */}
        <div className="lg:col-span-4 glass-panel p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">{t('smartTerminal')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.05] text-slate-300">
                {t('quickActions')}
              </span>
            </div>
            <h4 className="text-base font-black text-white">{t('executionDiscipline')}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('executionDisciplineDesc')}
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t('newTradeBtn')}</span>
            </button>

            <Link
              href="/risk"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] transition flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4 text-emerald-400" />
              <span>{t('lotCalculatorBtn')}</span>
            </Link>

            <Link
              href="/accounts"
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <Server className="w-3.5 h-3.5" />
              <span>{t('manageMt5Investor')}</span>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
