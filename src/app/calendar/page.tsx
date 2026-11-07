'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Clock
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function CalendarPage() {
  const { lang, t, formatMoney, analytics, trades } = useApp();

  const [calMonthOffset, setCalMonthOffset] = useState<number>(0);
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  // Auto-select latest trade day if none selected
  useEffect(() => {
    if (!selectedDayStr && analytics?.daily_summaries && analytics.daily_summaries.length > 0) {
      const latestDay = analytics.daily_summaries[analytics.daily_summaries.length - 1].date;
      setSelectedDayStr(latestDay);
    }
  }, [analytics, selectedDayStr]);

  // Current active date in calendar view
  const activeDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + calMonthOffset);
    return d;
  }, [calMonthOffset]);

  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();

  const monthName = activeDate.toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', {
    month: 'long',
    year: 'numeric'
  });

  // Calculate day cells for the month
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon...
    // Convert so Monday is 0:
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Map summaries by date string 'YYYY-MM-DD'
    const summaryMap = new Map<string, { net_profit: number; trades_count: number; win_count: number; loss_count: number }>();
    (analytics?.daily_summaries || []).forEach(s => {
      summaryMap.set(s.date, s);
    });

    const cells = [];
    // Padding days from prev month
    for (let i = 0; i < adjustedFirstDay; i++) {
      cells.push({ day: null, dateStr: '', data: null });
    }

    // Days of this month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const data = summaryMap.get(dateStr) || null;
      cells.push({ day: d, dateStr, data });
    }

    return cells;
  }, [year, month, analytics]);

  // Helper for symbol styling badges
  const renderSymbolBadge = (symbol: string) => {
    const sym = symbol.toUpperCase();
    let badgeColor = 'bg-white/[0.04] text-slate-200 border-white/[0.1]';
    if (sym.includes('XAU') || sym.includes('GOLD')) {
      badgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-sm shadow-amber-500/10';
    } else if (sym.includes('BTC') || sym.includes('ETH')) {
      badgeColor = 'bg-purple-500/15 text-purple-300 border-purple-500/30 shadow-sm shadow-purple-500/10';
    } else if (sym.includes('USD') || sym.includes('EUR') || sym.includes('GBP') || sym.includes('JPY')) {
      badgeColor = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25 shadow-sm shadow-cyan-500/10';
    }

    return (
      <span className={`px-2 py-0.5 rounded-lg border font-mono font-black text-[11px] tracking-tight ${badgeColor}`}>
        {symbol}
      </span>
    );
  };

  // Trades on selected day
  const tradesOnSelectedDay = useMemo(() => {
    if (!selectedDayStr) return [];
    return trades.filter(tr => tr.close_time && tr.close_time.startsWith(selectedDayStr));
  }, [trades, selectedDayStr]);

  // Day summary metrics
  const daySummary = useMemo(() => {
    const totalCount = tradesOnSelectedDay.length;
    const totalLots = tradesOnSelectedDay.reduce((acc, tr) => acc + (tr.lots || 0), 0);
    const totalPnl = tradesOnSelectedDay.reduce((acc, tr) => acc + (tr.profit || 0), 0);
    const wins = tradesOnSelectedDay.filter(tr => tr.profit >= 0);
    return {
      totalCount,
      totalLots,
      totalPnl,
      winCount: wins.length,
      lossCount: totalCount - wins.length,
      winRate: totalCount > 0 ? (wins.length / totalCount) * 100 : 0
    };
  }, [tradesOnSelectedDay]);

  return (
    <div className="space-y-6">

      {/* HEADER & MONTH CONTROLS */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            <span>{t('tabCalendar')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('calendarDesc')}
          </p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-2 bg-[#090e1b] border border-white/[0.08] rounded-2xl p-1.5 shrink-0">
          <button
            onClick={() => setCalMonthOffset(calMonthOffset - 1)}
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-bold text-white px-3 min-w-[130px] text-center capitalize">
            {monthName}
          </span>

          <button
            onClick={() => setCalMonthOffset(calMonthOffset + 1)}
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {calMonthOffset !== 0 && (
            <button
              onClick={() => setCalMonthOffset(0)}
              className="p-1.5 rounded-xl hover:bg-white/[0.08] text-emerald-400 transition ml-1"
              title="Kembali ke Bulan Ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* CALENDAR HEATMAP GRID (GREEN & RED DUAL GLASS CELL DESIGN) */}
      <div className="glass-panel p-6 space-y-4">
        
        {/* Day Header row */}
        <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {lang === 'id' ? (
            <>
              <div>Sen</div>
              <div>Sel</div>
              <div>Rab</div>
              <div>Kam</div>
              <div>Jum</div>
              <div className="text-slate-500">Sab</div>
              <div className="text-slate-500">Min</div>
            </>
          ) : (
            <>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div className="text-slate-500">Sat</div>
              <div className="text-slate-500">Sun</div>
            </>
          )}
        </div>

        {/* Day Cells Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((c, i) => {
            if (!c.day) {
              return (
                <div
                  key={`pad-${i}`}
                  className="h-20 sm:h-24 rounded-2xl bg-white/[0.01] border border-white/[0.02] opacity-30"
                />
              );
            }

            const data = c.data;
            const hasTrades = data && data.trades_count > 0;
            const isProfit = data && data.net_profit >= 0;
            const isSelected = selectedDayStr === c.dateStr;

            return (
              <div
                key={c.dateStr}
                onClick={() => setSelectedDayStr(isSelected ? null : c.dateStr)}
                className={`h-20 sm:h-24 p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'ring-2 ring-emerald-400 border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : hasTrades
                    ? isProfit
                      ? 'glass-emerald hover:scale-[1.02]'
                      : 'glass-rose hover:scale-[1.02]'
                    : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                }`}
              >
                {/* Cell Header: Day number + Trades Count Badge */}
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold ${hasTrades ? 'text-white' : 'text-slate-500'}`}>
                    {c.day}
                  </span>
                  {hasTrades && (
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                      isProfit ? 'bg-emerald-500/25 text-emerald-200' : 'bg-rose-500/25 text-rose-200'
                    }`}>
                      {data.trades_count}t
                    </span>
                  )}
                </div>

                {/* Cell Body: Net P/L */}
                {hasTrades ? (
                  <div className="text-right">
                    <div className={`text-xs sm:text-sm font-black font-mono tracking-tight ${
                      isProfit ? 'text-emerald-400 glow-emerald' : 'text-rose-400 glow-rose'
                    }`}>
                      {isProfit ? '+' : ''}{formatMoney(data.net_profit)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold hidden sm:block">
                      {data.win_count}W &bull; {data.loss_count}L
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-600 text-right">-</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED DAY DETAIL DRAWER */}
      {selectedDayStr && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              <span>{t('tradesOnDate')} <strong className="text-emerald-300 font-mono">{selectedDayStr}</strong></span>
            </h3>
            <button
              onClick={() => setSelectedDayStr(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              {t('closeLabel')}
            </button>
          </div>

          {tradesOnSelectedDay.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              {t('noTradesOnDate')}
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
              <div className="overflow-x-auto max-h-[460px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 backdrop-blur-xl bg-[#080d1b]/95 border-b border-white/[0.08]">
                    <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Ticket</th>
                      <th className="py-3.5 px-4">Waktu</th>
                      <th className="py-3.5 px-4">Symbol</th>
                      <th className="py-3.5 px-4 text-center">Tipe</th>
                      <th className="py-3.5 px-4 text-right">Lots</th>
                      <th className="py-3.5 px-4 text-right">Open &rarr; Close</th>
                      <th className="py-3.5 px-4 text-right font-bold text-white">Net P/L</th>
                      <th className="py-3.5 px-4 text-center">Disiplin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {tradesOnSelectedDay.map(tr => {
                      const isProfit = tr.profit >= 0;
                      return (
                        <tr key={tr.id} className="hover:bg-white/[0.025] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[11px] text-emerald-400/90 whitespace-nowrap">
                            <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              #{tr.ticket || tr.id}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                            <div className="text-white font-medium">
                              {tr.close_time ? tr.close_time.replace('T', ' ').substring(11, 19) : '-'}
                            </div>
                            {tr.session && (
                              <div className="text-[10px] text-slate-500 font-sans">
                                {tr.session}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {renderSymbolBadge(tr.symbol)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              tr.order_type === 'BUY'
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/20'
                                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-sm shadow-rose-500/20'
                            }`}>
                              {tr.order_type === 'BUY' ? (
                                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3 text-rose-400" />
                              )}
                              <span>{tr.order_type}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-200 font-bold tabular-nums">
                            {tr.lots.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300 text-[11px] whitespace-nowrap tabular-nums">
                            {typeof tr.open_price === 'number' ? tr.open_price.toFixed(tr.open_price > 100 ? 3 : 5) : tr.open_price} &rarr; {typeof tr.close_price === 'number' ? tr.close_price.toFixed(tr.close_price > 100 ? 3 : 5) : tr.close_price}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap tabular-nums ${
                            isProfit ? 'text-emerald-400 glow-emerald' : 'text-rose-400 glow-rose'
                          }`}>
                            <div className="text-sm font-black">
                              {isProfit ? '+' : ''}{formatMoney(tr.profit)}
                            </div>
                            {tr.open_price && tr.close_price && tr.open_price !== tr.close_price && (
                              <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                                {tr.order_type === 'SELL' ? (
                                  (tr.open_price - tr.close_price) >= 0 ? (
                                    <span className="text-emerald-400/80">+{ (tr.open_price - tr.close_price).toFixed(2) } pts</span>
                                  ) : (
                                    <span className="text-rose-400/80">{ (tr.open_price - tr.close_price).toFixed(2) } pts</span>
                                  )
                                ) : (
                                  (tr.close_price - tr.open_price) >= 0 ? (
                                    <span className="text-emerald-400/80">+{ (tr.close_price - tr.open_price).toFixed(2) } pts</span>
                                  ) : (
                                    <span className="text-rose-400/80">{ (tr.close_price - tr.open_price).toFixed(2) } pts</span>
                                  )
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {tr.rule_followed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full" title="Aturan Terpenuhi">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span className="text-[10px]">{t('disciplinedLabel')}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-full" title="Aturan Dilanggar">
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                <span className="text-[10px]">{t('violatedLabel')}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Day Summary Dock */}
              <div className="bg-[#070c18]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-400">{t('totalTrades')}:</span>
                    <span className="text-white font-mono font-bold">{daySummary.totalCount} Trade</span>
                  </div>
                  <div className="h-3 w-px bg-white/[0.1]" />
                  <div>
                    <span className="text-slate-400">{t('totalVolume')}:</span>
                    <span className="text-white font-mono font-bold ml-1">{daySummary.totalLots.toFixed(2)} Lots</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{t('dayNetPnl')}</span>
                  <span className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg border ${
                    daySummary.totalPnl >= 0
                      ? 'text-emerald-400 glow-emerald bg-emerald-500/10 border-emerald-500/30'
                      : 'text-rose-400 glow-rose bg-rose-500/10 border-rose-500/30'
                  }`}>
                    {daySummary.totalPnl >= 0 ? '+' : ''}{formatMoney(daySummary.totalPnl)}
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
