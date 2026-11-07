'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  RotateCcw,
  Plus,
  FileSpreadsheet,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Coins,
  TrendingUp,
  TrendingDown,
  Percent,
  Clock,
  Layers
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Trade } from '@/lib/types';

export default function TradeJournalPage() {
  const {
    lang,
    t,
    isCentMode,
    formatMoney,
    trades,
    refreshData,
    setShowAddModal,
    setShowImportModal,
    setShowReviewModal,
    setActiveReviewTrade
  } = useApp();

  // Filter states
  const [searchSymbol, setSearchSymbol] = useState<string>('');
  const [filterType, setFilterType] = useState<string>(''); // '' | 'BUY' | 'SELL'
  const [filterOutcome, setFilterOutcome] = useState<string>(''); // '' | 'PROFIT' | 'LOSS'
  const [filterStrategy, setFilterStrategy] = useState<string>('');

  const filteredTrades = useMemo(() => {
    return trades.filter(tr => {
      if (searchSymbol && !tr.symbol.toLowerCase().includes(searchSymbol.toLowerCase())) return false;
      if (filterType && tr.order_type !== filterType) return false;
      if (filterOutcome === 'PROFIT' && tr.profit < 0) return false;
      if (filterOutcome === 'LOSS' && tr.profit >= 0) return false;
      if (filterStrategy && !tr.strategy.toLowerCase().includes(filterStrategy.toLowerCase())) return false;
      return true;
    });
  }, [trades, searchSymbol, filterType, filterOutcome, filterStrategy]);

  // Summary Metrics of filtered data
  const summary = useMemo(() => {
    const totalCount = filteredTrades.length;
    const totalLots = filteredTrades.reduce((acc, tr) => acc + (tr.lots || 0), 0);
    const totalPnl = filteredTrades.reduce((acc, tr) => acc + (tr.profit || 0), 0);
    const wins = filteredTrades.filter(tr => tr.profit >= 0);
    const losses = filteredTrades.filter(tr => tr.profit < 0);
    const winRate = totalCount > 0 ? (wins.length / totalCount) * 100 : 0;
    return {
      totalCount,
      totalLots,
      totalPnl,
      winCount: wins.length,
      lossCount: losses.length,
      winRate
    };
  }, [filteredTrades]);

  const handleDeleteTrade = async (id: number) => {
    if (!confirm(lang === 'id' ? 'Hapus catatan trade ini?' : 'Delete this trade entry?')) return;
    try {
      const res = await fetch(`/api/trades/${id}`, { method: 'DELETE' });
      if (res.ok) await refreshData(true);
    } catch (err) {
      console.error('Failed to delete trade:', err);
    }
  };

  const handleOpenReview = (trade: Trade) => {
    setActiveReviewTrade(trade);
    setShowReviewModal(true);
  };

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

  const hasActiveFilters = Boolean(searchSymbol || filterType || filterOutcome || filterStrategy);

  return (
    <div className="space-y-6">

      {/* HEADER BAR & CONTROLS */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>{t('tabJournal')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('journalDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            <span>{t('importBtn')}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newTradeBtn')}</span>
          </button>
        </div>
      </div>

      {/* ADVANCED FILTER CONTROLS (CUSTOM GLASS PILLS, ZERO OS DROPDOWNS) */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          
          {/* Search by Symbol */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('filterSymbol') || 'Cari Simbol (e.g. XAUUSD)...'}
              value={searchSymbol}
              onChange={e => setSearchSymbol(e.target.value)}
              className="w-full bg-[#080d1b] border border-white/[0.1] rounded-xl pl-9 pr-8 py-2 text-xs text-white uppercase placeholder:normal-case placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition"
            />
            {searchSymbol && (
              <button
                onClick={() => setSearchSymbol('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-white/[0.1] transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Strategy Filter */}
          <div className="relative min-w-[170px]">
            <input
              type="text"
              placeholder={t('filterStrategy') || 'Filter Strategi...'}
              value={filterStrategy}
              onChange={e => setFilterStrategy(e.target.value)}
              className="w-full bg-[#080d1b] border border-white/[0.1] rounded-xl pl-3 pr-8 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition"
            />
            {filterStrategy && (
              <button
                onClick={() => setFilterStrategy('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-white/[0.1] transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Reset All Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchSymbol('');
                setFilterType('');
                setFilterOutcome('');
                setFilterStrategy('');
              }}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 flex items-center gap-1.5 transition text-xs font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('resetFilters')}</span>
            </button>
          )}

          <div className="ml-auto text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <span>{t('showing')}</span>
            <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
              {filteredTrades.length}
            </span>
            <span>{t('ofTrades')} {trades.length} {t('tradesLabel')}</span>
          </div>
        </div>

        {/* SECOND ROW: CUSTOM SEGMENTED PILLS (ORDER TYPE & OUTCOME) */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-white/[0.04] text-xs">
          
          {/* Order Type Segmented Control */}
          <div className="flex items-center gap-1 bg-[#080d1b] border border-white/[0.08] rounded-xl p-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold px-2">{t('type')}:</span>
            <button
              type="button"
              onClick={() => setFilterType('')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterType === ''
                  ? 'bg-white/[0.12] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {t('allLabel')}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('BUY')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                filterType === 'BUY'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-white/[0.04]'
              }`}
            >
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              <span>BUY</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('SELL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                filterType === 'SELL'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/20'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-white/[0.04]'
              }`}
            >
              <ArrowDownRight className="w-3 h-3 text-rose-400" />
              <span>SELL</span>
            </button>
          </div>

          {/* Outcome Segmented Control */}
          <div className="flex items-center gap-1 bg-[#080d1b] border border-white/[0.08] rounded-xl p-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold px-2">{t('outcomeLabel')}:</span>
            <button
              type="button"
              onClick={() => setFilterOutcome('')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterOutcome === ''
                  ? 'bg-white/[0.12] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterOutcome('PROFIT')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterOutcome === 'PROFIT'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-white/[0.04]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{t('win')} ({trades.filter(t => t.profit >= 0).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterOutcome('LOSS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterOutcome === 'LOSS'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/20'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-white/[0.04]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>{t('loss')} ({trades.filter(t => t.profit < 0).length})</span>
            </button>
          </div>

        </div>
      </div>

      {/* TRADES TABLE (GREEN & RED GLASS THEMED WITH FROSTED STICKY HEADER & SUMMARY DOCK) */}
      <div className="glass-panel overflow-hidden border border-white/[0.08] shadow-2xl">
        <div className="overflow-x-auto max-h-[680px]">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* STICKY FROSTED HEADER */}
            <thead className="sticky top-0 z-20 backdrop-blur-xl bg-[#080d1b]/95 border-b border-white/[0.08]">
              <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">{t('ticket')}</th>
                <th className="py-3.5 px-4">{t('closeTime')}</th>
                <th className="py-3.5 px-4">{t('symbol')}</th>
                <th className="py-3.5 px-4 text-center">{t('type')}</th>
                <th className="py-3.5 px-4 text-right">{t('lots')}</th>
                <th className="py-3.5 px-4 text-right">{t('openPrice')}</th>
                <th className="py-3.5 px-4 text-right">{t('closePrice')}</th>
                <th className="py-3.5 px-4 text-right">{t('pnl')}</th>
                <th className="py-3.5 px-4">{t('strategy')}</th>
                <th className="py-3.5 px-4 text-center">{t('discipline')}</th>
                <th className="py-3.5 px-4 text-center">{t('action')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BookOpen className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium">{t('noTradesMatch')}</p>
                      {hasActiveFilters && (
                        <button
                          onClick={() => {
                            setSearchSymbol('');
                            setFilterType('');
                            setFilterOutcome('');
                            setFilterStrategy('');
                          }}
                          className="text-xs text-emerald-400 hover:underline mt-1"
                        >
                          {t('resetAllFilters')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTrades.map(tr => {
                  const isProfit = tr.profit >= 0;
                  return (
                    <tr 
                      key={tr.id} 
                      className="hover:bg-white/[0.025] transition-colors group"
                    >
                      
                      {/* Ticket */}
                      <td className="py-3 px-4 font-mono font-bold text-[11px] text-emerald-400/90 whitespace-nowrap">
                        <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          #{tr.ticket || tr.id}
                        </span>
                      </td>

                      {/* Close & Open Time */}
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap text-[11px] font-mono">
                        <div className="text-white font-semibold">
                          {tr.close_time ? tr.close_time.replace('T', ' ').substring(0, 19) : '-'}
                        </div>
                        {tr.open_time && (
                          <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{t('openTimeLabel')} {tr.open_time.replace('T', ' ').substring(11, 19)}</span>
                            {tr.session && (
                              <span className="px-1.5 py-0.2 rounded bg-white/[0.05] text-[9px] text-slate-400 font-mono">
                                {tr.session}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Symbol */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderSymbolBadge(tr.symbol)}
                      </td>

                      {/* Order Type Pill (Glowing Green for BUY, Glowing Red for SELL) */}
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

                      {/* Lots */}
                      <td className="py-3 px-4 text-right font-mono text-slate-200 font-bold tabular-nums">
                        {tr.lots.toFixed(2)}
                      </td>

                      {/* Open Price */}
                      <td className="py-3 px-4 text-right font-mono text-slate-300 tabular-nums">
                        {typeof tr.open_price === 'number' ? tr.open_price.toFixed(tr.open_price > 100 ? 3 : 5) : tr.open_price}
                      </td>

                      {/* Close Price */}
                      <td className="py-3 px-4 text-right font-mono text-slate-300 font-medium tabular-nums">
                        {typeof tr.close_price === 'number' ? tr.close_price.toFixed(tr.close_price > 100 ? 3 : 5) : tr.close_price}
                      </td>

                      {/* Net PnL (Glowing Emerald or Rose + Points Delta) */}
                      <td className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap tabular-nums ${
                        isProfit ? 'text-emerald-400 glow-emerald' : 'text-rose-400 glow-rose'
                      }`}>
                        <div className="text-sm font-black tracking-tight">
                          {isProfit ? '+' : ''}{formatMoney(tr.profit)}
                        </div>
                        {tr.open_price && tr.close_price && tr.open_price !== tr.close_price && (
                          <div className="text-[10px] font-medium text-slate-400 flex items-center justify-end gap-1 mt-0.5">
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

                      {/* Strategy */}
                      <td className="py-3 px-4 text-slate-300 max-w-[140px] truncate" title={tr.strategy}>
                        <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300 font-medium inline-block truncate max-w-full">
                          {tr.strategy || 'Discretionary'}
                        </span>
                      </td>

                      {/* Discipline Compliance */}
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

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleOpenReview(tr)}
                            title={tr.is_reviewed ? (lang === 'id' ? 'Review Selesai (Klik untuk edit)' : 'Reviewed (Click to edit)') : (lang === 'id' ? 'Perlu Direview' : 'Needs Review')}
                            className={`p-1.5 rounded-lg border transition ${
                              tr.is_reviewed
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-white/[0.04] hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border-white/[0.06]'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrade(tr.id)}
                            title="Hapus Catatan"
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/[0.06] transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE SUMMARY DOCK (LIVE FILTERED STATS) */}
        {filteredTrades.length > 0 && (
          <div className="bg-[#070c18]/95 backdrop-blur-xl border-t border-white/[0.08] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
            
            {/* Left: Counts and Volume */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">{t('totalTrades')}:</span>
                <span className="text-white font-mono font-bold">{summary.totalCount}</span>
              </div>

              <div className="h-3.5 w-px bg-white/[0.1]" />

              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-slate-400">{t('totalVolume')}:</span>
                <span className="text-white font-mono font-bold">{summary.totalLots.toFixed(2)} Lots</span>
              </div>
            </div>

            {/* Middle: Win Rate Breakdown */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{t('winRate')}:</span>
              <span className="text-emerald-400 font-mono font-bold">
                {summary.winRate.toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                ({summary.winCount} {t('winsCount')} • {summary.lossCount} {t('lossesCount')})
              </span>
            </div>

            {/* Right: Net P/L of Filtered Set */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Net P/L Filtered:</span>
              <span className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg border ${
                summary.totalPnl >= 0
                  ? 'text-emerald-400 glow-emerald bg-emerald-500/10 border-emerald-500/30'
                  : 'text-rose-400 glow-rose bg-rose-500/10 border-rose-500/30'
              }`}>
                {summary.totalPnl >= 0 ? '+' : ''}{formatMoney(summary.totalPnl)}
              </span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
