'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Clock,
  CheckCheck,
  Search,
  Filter,
  Check,
  Calendar,
  Sparkles,
  ArrowUpDown,
  FileEdit,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Trade } from '@/lib/types';

export default function TradeReviewPage() {
  const {
    lang,
    t,
    formatMoney,
    trades,
    analytics,
    setShowReviewModal,
    setActiveReviewTrade
  } = useApp();

  const [activeTab, setActiveTab] = useState<'unreviewed' | 'reviewed' | 'all'>('unreviewed');
  const [searchQuery, setSearchQuery] = useState('');
  const [psychologyFilter, setPsychologyFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Explicit partition of trades based on is_reviewed boolean
  const unreviewedTrades = useMemo(() => {
    return trades.filter(tr => !tr.is_reviewed);
  }, [trades]);

  const reviewedTrades = useMemo(() => {
    return trades.filter(tr => !!tr.is_reviewed);
  }, [trades]);

  // Compute active list based on selected tab
  const activeTabList = useMemo(() => {
    if (activeTab === 'unreviewed') return unreviewedTrades;
    if (activeTab === 'reviewed') return reviewedTrades;
    return trades;
  }, [activeTab, unreviewedTrades, reviewedTrades, trades]);

  // Apply search & psychology state filters
  const filteredTrades = useMemo(() => {
    return activeTabList.filter(tr => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        tr.symbol.toLowerCase().includes(q) ||
        String(tr.ticket || tr.id).includes(q) ||
        (tr.strategy && tr.strategy.toLowerCase().includes(q)) ||
        (tr.notes && tr.notes.toLowerCase().includes(q));

      const matchesPsych = psychologyFilter === 'ALL' || tr.psychology_state === psychologyFilter;
      return matchesSearch && matchesPsych;
    });
  }, [activeTabList, searchQuery, psychologyFilter]);

  // Reset pagination when tab or filters change
  const totalPages = Math.ceil(filteredTrades.length / pageSize) || 1;
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTrades.slice(start, start + pageSize);
  }, [filteredTrades, currentPage, pageSize]);

  // Calculate dynamic mental state distribution
  const mentalStats = useMemo(() => {
    const total = trades.length || 1;
    const counts = {
      Disciplined: trades.filter(t => (t.psychology_state || 'Disciplined') === 'Disciplined').length,
      FOMO: trades.filter(t => t.psychology_state === 'FOMO').length,
      Revenge: trades.filter(t => t.psychology_state === 'Revenge').length,
      Hesitant: trades.filter(t => t.psychology_state === 'Hesitant').length,
      Greed: trades.filter(t => t.psychology_state === 'Greed').length
    };
    return {
      disciplinedPct: Math.round((counts.Disciplined / total) * 100),
      fomoPct: Math.round((counts.FOMO / total) * 100),
      revengePct: Math.round((counts.Revenge / total) * 100),
      hesitantPct: Math.round((counts.Hesitant / total) * 100),
      greedPct: Math.round((counts.Greed / total) * 100),
      counts
    };
  }, [trades]);

  // Calculate dynamic mistakes ranking
  const topMistakesList = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of trades) {
      if (t.mistake_tag && t.mistake_tag !== 'None') {
        counts[t.mistake_tag] = (counts[t.mistake_tag] || 0) + 1;
      }
    }
    const sorted = Object.entries(counts)
      .map(([mistake, count]) => ({ mistake, count }))
      .sort((a, b) => b.count - a.count);
    return sorted.slice(0, 3);
  }, [trades]);

  const handleOpenReview = (trade: Trade) => {
    setActiveReviewTrade(trade);
    setShowReviewModal(true);
  };

  const handleTabChange = (tab: 'unreviewed' | 'reviewed' | 'all') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const disciplineRate = analytics?.discipline_rate !== undefined
    ? analytics.discipline_rate
    : trades.length > 0
    ? Math.round((trades.filter(t => t.rule_followed).length / trades.length) * 100)
    : 100;

  return (
    <div className="space-y-6">

      {/* HEADER BAR */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-400" />
            <span>{t('tabReview')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'id'
              ? 'Evaluasi kepatuhan aturan trading, kondisi mental psikologi, serta tagging kesalahan eksekusi setiap posisi.'
              : 'Evaluate trading rule compliance, mental psychological state, and execution mistake tags for every trade.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'id' ? 'Tingkat Disiplin:' : 'Discipline Rate:'} {disciplineRate.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* 3 HIGH-IMPACT PSYCHOLOGY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* CARD 1: RULE COMPLIANCE (EMERALD GLASS) */}
        <div className="glass-panel glass-emerald p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-emerald-300 font-bold mb-2">
              <span>{t('ruleCompliance')}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white glow-emerald">
              {disciplineRate.toFixed(0)}%
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {lang === 'id'
                ? 'Persentase posisi yang mematuhi batas Stop Loss dan checklist entri tanpa intervensi emosional.'
                : 'Percentage of executions strictly adhering to stop loss limits and entry checklist without emotional bias.'}
            </p>
          </div>

          <div className="pt-3 mt-4 border-t border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
            <span>{lang === 'id' ? 'Standar Eksekusi:' : 'Execution Standard:'}</span>
            <strong className="text-white">
              {disciplineRate >= 80
                ? (lang === 'id' ? 'Disiplin Tinggi' : 'High Discipline')
                : (lang === 'id' ? 'Perlu Ditingkatkan' : 'Needs Work')}
            </strong>
          </div>
        </div>

        {/* CARD 2: PSYCHOLOGY BREAKDOWN (DYNAMIC METER) */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
              <span>{lang === 'id' ? 'Distribusi Kondisi Mental' : 'Mental State Distribution'}</span>
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-3">
              {lang === 'id' ? 'Emosi Saat Transaksi' : 'Trade Emotions'}
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{t('psychologyDisciplined')}</span>
                </span>
                <span className="font-mono font-bold text-emerald-400">{mentalStats.disciplinedPct}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>{t('psychologyFOMO')}</span>
                </span>
                <span className="font-mono font-bold text-rose-400">{mentalStats.fomoPct}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>{t('psychologyHesitant')}</span>
                </span>
                <span className="font-mono font-bold text-amber-400">{mentalStats.hesitantPct}%</span>
              </div>
              {mentalStats.revengePct > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>{t('psychologyRevenge')}</span>
                  </span>
                  <span className="font-mono font-bold text-red-400">{mentalStats.revengePct}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-white/[0.08] text-xs text-slate-400">
            {lang === 'id' ? 'Hindari entry saat pasar sedang over-extended.' : 'Avoid entries when market is over-extended.'}
          </div>
        </div>

        {/* CARD 3: TOP MISTAKES RANKING (ROSE GLASS ACCENT) */}
        <div className="glass-panel glass-rose p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-rose-300 font-bold mb-2">
              <span>{t('mistakeCategory')}</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-3">
              {lang === 'id' ? 'Kesalahan Paling Sering Terjadi' : 'Most Frequent Mistakes'}
            </h4>

            <div className="space-y-2 text-xs">
              {topMistakesList.length > 0 ? (
                topMistakesList.map((m, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-slate-300 truncate max-w-[190px]">{m.mistake}</span>
                    <span className="font-mono font-bold text-rose-300">{m.count}x</span>
                  </div>
                ))
              ) : (
                <div className="py-2 flex items-center gap-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{lang === 'id' ? 'Eksekusi Bersih! Belum ada tag kesalahan tercatat.' : 'Clean Execution! No mistake tags recorded.'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-rose-500/20 text-xs text-rose-300">
            {lang === 'id' ? 'Target: Kurangi tag kesalahan hingga 0 kali per minggu.' : 'Target: Reduce mistake tags to zero per week.'}
          </div>
        </div>

      </div>

      {/* INTERACTIVE TRADES REVIEW SECTION WITH TABS */}
      <div className="glass-panel p-6 space-y-5">
        
        {/* TABS & SEARCH / FILTER HEADER */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          
          {/* TAB BUTTONS */}
          <div className="flex items-center p-1 rounded-2xl bg-[#070b16] border border-white/[0.08]">
            {/* TAB 1: UNREVIEWED */}
            <button
              onClick={() => handleTabChange('unreviewed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'unreviewed'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Perlu Direview' : 'Needs Review'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                unreviewedTrades.length > 0
                  ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                  : 'bg-white/[0.06] text-slate-400'
              }`}>
                {unreviewedTrades.length}
              </span>
            </button>

            {/* TAB 2: REVIEWED (DONE) */}
            <button
              onClick={() => handleTabChange('reviewed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'reviewed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Selesai Direview (Done)' : 'Reviewed (Done)'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {reviewedTrades.length}
              </span>
            </button>

            {/* TAB 3: ALL TRADES */}
            <button
              onClick={() => handleTabChange('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-white/[0.1] text-white border border-white/[0.15]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Semua Transaksi' : 'All Trades'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/[0.06] text-slate-400">
                {trades.length}
              </span>
            </button>
          </div>

          {/* SEARCH & PSYCHOLOGY FILTER */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={lang === 'id' ? 'Cari tiket, simbol, EA...' : 'Search ticket, symbol...'}
                className="w-full bg-[#070b16] border border-white/[0.08] rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Psychology State Filter */}
            <select
              value={psychologyFilter}
              onChange={e => {
                setPsychologyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#070b16] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="ALL">{lang === 'id' ? 'Semua Psikologi' : 'All Psychology'}</option>
              <option value="Disciplined">{t('psychologyDisciplined')}</option>
              <option value="FOMO">{t('psychologyFOMO')}</option>
              <option value="Revenge">{t('psychologyRevenge')}</option>
              <option value="Hesitant">{t('psychologyHesitant')}</option>
              <option value="Greed">{t('psychologyGreed')}</option>
            </select>
          </div>

        </div>

        {/* CONTENT AREA: EMPTY STATE OR TABLE */}
        {activeTab === 'unreviewed' && unreviewedTrades.length === 0 ? (
          /* CELEBRATORY EMPTY STATE FOR UNREVIEWED TRADES */
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 rounded-2xl bg-white/[0.02] border border-emerald-500/20">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 glow-emerald animate-bounce duration-1000">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h4 className="text-base font-bold text-white mb-1">
                {lang === 'id' ? 'Semua Transaksi Selesai Direview! 🎉' : 'All Trades Reviewed! 🎉'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === 'id'
                  ? 'Bagus sekali! Tidak ada transaksi pending yang menunggu review psikologi dan evaluasi eksekusi.'
                  : 'Great job! There are no pending trades waiting for psychological review and execution notes.'}
              </p>
            </div>
            <button
              onClick={() => handleTabChange('reviewed')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-2 active:scale-95"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{lang === 'id' ? `Lihat Riwayat Review Selesai (${reviewedTrades.length})` : `View Completed Reviews (${reviewedTrades.length})`}</span>
            </button>
          </div>
        ) : filteredTrades.length === 0 ? (
          /* NO MATCHING FILTER RESULTS */
          <div className="p-8 text-center text-slate-400 text-xs">
            <p>{lang === 'id' ? 'Tidak ada transaksi yang cocok dengan kriteria filter.' : 'No trades match the current filter criteria.'}</p>
            {(searchQuery || psychologyFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPsychologyFilter('ALL');
                }}
                className="mt-3 text-emerald-400 hover:underline font-semibold"
              >
                {lang === 'id' ? 'Reset Filter' : 'Reset Filter'}
              </button>
            )}
          </div>
        ) : (
          /* TABLE */
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3">Ticket / Waktu</th>
                    <th className="pb-3 px-3">Simbol & EA</th>
                    <th className="pb-3 px-3 text-center">Tipe / Lot</th>
                    <th className="pb-3 px-3 text-right">Net P/L</th>
                    <th className="pb-3 px-3 text-center">{lang === 'id' ? 'Status Review' : 'Review Status'}</th>
                    <th className="pb-3 px-3">{lang === 'id' ? 'Kondisi Mental' : 'Psychology'}</th>
                    <th className="pb-3 px-3">{lang === 'id' ? 'Tag Kesalahan' : 'Mistake Tag'}</th>
                    <th className="pb-3 px-3 text-center">{t('action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {paginatedTrades.map(tr => {
                    const isProfit = tr.profit >= 0;
                    const isReviewed = Boolean(tr.is_reviewed);

                    return (
                      <tr key={tr.id} className="hover:bg-white/[0.02] transition">
                        
                        {/* Ticket & Time */}
                        <td className="py-3 px-3">
                          <div className="font-mono text-white font-bold text-xs">#{tr.ticket || tr.id}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {tr.close_time ? new Date(tr.close_time).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '-'}
                          </div>
                        </td>

                        {/* Symbol & Strategy */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{tr.symbol}</span>
                            {tr.symbol.toUpperCase().includes('XAU') && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                Gold
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]" title={tr.strategy}>
                            {tr.strategy || 'Manual Trade'}
                          </div>
                        </td>

                        {/* Order Type & Lots */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tr.order_type === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {tr.order_type}
                          </span>
                          <div className="font-mono text-[10px] text-slate-300 mt-0.5">
                            {tr.lots.toFixed(2)} Lots
                          </div>
                        </td>

                        {/* Net P/L */}
                        <td className={`py-3 px-3 text-right font-mono font-bold text-xs ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <div>{isProfit ? '+' : ''}{formatMoney(tr.profit)}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            Comm: {formatMoney(tr.commission || 0)}
                          </div>
                        </td>

                        {/* Review Status Badge */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isReviewed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>{lang === 'id' ? '✓ Selesai' : '✓ Done'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                              <span>{lang === 'id' ? '⏳ Perlu Review' : '⏳ Pending'}</span>
                            </span>
                          )}
                        </td>

                        {/* Psychology & Rule Followed */}
                        <td className="py-3 px-3">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white/[0.04] border border-white/[0.06] text-slate-200">
                            <span>{tr.psychology_state || 'Disciplined'}</span>
                          </div>
                          <div className="text-[10px] mt-0.5 flex items-center gap-1 text-slate-400">
                            {tr.rule_followed ? (
                              <span className="text-emerald-400 flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> {lang === 'id' ? 'Sesuai SL' : 'Rules OK'}
                              </span>
                            ) : (
                              <span className="text-rose-400 flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> {lang === 'id' ? 'Langgar SL' : 'Violated'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Mistake Tag */}
                        <td className="py-3 px-3">
                          {tr.mistake_tag && tr.mistake_tag !== 'None' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              {tr.mistake_tag}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-normal bg-white/[0.03] text-slate-500 border border-white/[0.06]">
                              None
                            </span>
                          )}
                        </td>

                        {/* Action Button */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isReviewed ? (
                            <button
                              onClick={() => handleOpenReview(tr)}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] hover:border-emerald-500/40 transition flex items-center justify-center gap-1.5 mx-auto"
                            >
                              <FileEdit className="w-3 h-3 text-emerald-400" />
                              <span>{lang === 'id' ? 'Edit Review' : 'Edit Review'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenReview(tr)}
                              className="px-3.5 py-1.5 rounded-xl text-[11px] font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 mx-auto active:scale-95"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{lang === 'id' ? 'Review Sekarang' : 'Review Now'}</span>
                            </button>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-slate-400">
                <div>
                  {lang === 'id'
                    ? `Menampilkan ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, filteredTrades.length)} dari ${filteredTrades.length} transaksi`
                    : `Showing ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, filteredTrades.length)} of ${filteredTrades.length} trades`}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.06] transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono font-bold text-white px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.06] transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
