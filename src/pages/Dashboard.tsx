import React from 'react';
import { Layout } from '../components/Layout.tsx';

interface DashboardPageProps {
  stats: {
    totalVolume: number;
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    expiredInvoices: number;
    activeScrapers: number;
    successRate: number;
  };
  recentActivities: Array<{
    id: string;
    merchantName: string;
    orderId: string;
    totalAmount: number;
    status: 'PAID' | 'PENDING' | 'EXPIRED';
    createdAt: string;
  }>;
  currentUser: any;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export function DashboardPage({ stats, recentActivities, currentUser }: DashboardPageProps) {
  // Calculations for percentage breakdown bar
  const total = stats.totalInvoices || 1; // Prevent division by zero
  const paidPercent = Math.round((stats.paidInvoices / total) * 100);
  const pendingPercent = Math.round((stats.pendingInvoices / total) * 100);
  const expiredPercent = Math.round((stats.expiredInvoices / total) * 100);

  return (
    <Layout activePath="/dashboard" user={currentUser}>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-50">
              Dashboard Overview
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Welcome back, <span className="font-semibold text-slate-700 dark:text-zinc-200">{currentUser.name}</span>. Here is your transaction summary.
            </p>
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 text-xs font-semibold text-sky-700 dark:text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            Role: {currentUser.role.replace('_', ' ')}
          </div>
        </div>

        {/* 1. METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          
          {/* Total Revenue card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Volume (PAID)</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-50 font-mono tracking-tight">
                {formatRupiah(stats.totalVolume)}
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 inline-flex items-center gap-0.5">
                Successful Payments Volume
              </span>
            </div>
          </div>

          {/* Success Rate Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Success Rate</span>
              <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-50 font-mono tracking-tight">
                {stats.successRate}%
              </div>
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 mt-1 inline-flex items-center gap-0.5">
                {stats.paidInvoices} / {stats.totalInvoices} Invoices paid
              </span>
            </div>
          </div>

          {/* Active Scrapers / Listeners */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Scrapers</span>
              <span className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-50 font-mono tracking-tight">
                {stats.activeScrapers}
              </div>
              <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 mt-1 inline-flex items-center gap-0.5">
                Running GoBiz bot listeners
              </span>
            </div>
          </div>

          {/* Pending Invoices */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Charges</span>
              <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-50 font-mono tracking-tight">
                {stats.pendingInvoices}
              </div>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1 inline-flex items-center gap-0.5">
                Awaiting client payments
              </span>
            </div>
          </div>

        </div>

        {/* 2. SUMMARY ANALYSIS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Status Breakdown Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm lg:col-span-1 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50 mb-1">
                Transaction Status Ratio
              </h2>
              <p className="text-[10.5px] text-slate-500 dark:text-zinc-400">
                Percentage comparison of invoices generated on the network.
              </p>

              {/* Progress stack bar */}
              <div className="h-6 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden flex mt-8">
                <div style={{ width: `${paidPercent}%` }} className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-bold text-white" title={`Paid: ${paidPercent}%`}>
                  {paidPercent > 12 && `${paidPercent}%`}
                </div>
                <div style={{ width: `${pendingPercent}%` }} className="bg-amber-500 h-full flex items-center justify-center text-[10px] font-bold text-white" title={`Pending: ${pendingPercent}%`}>
                  {pendingPercent > 12 && `${pendingPercent}%`}
                </div>
                <div style={{ width: `${expiredPercent}%` }} className="bg-rose-500 h-full flex items-center justify-center text-[10px] font-bold text-white" title={`Expired: ${expiredPercent}%`}>
                  {expiredPercent > 12 && `${expiredPercent}%`}
                </div>
              </div>
            </div>

            {/* Legends list */}
            <div className="mt-8 space-y-2 border-t border-slate-100 dark:border-zinc-800/60 pt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                  <span className="w-3 h-3 rounded bg-emerald-500"></span>
                  PAID (Paid Invoices)
                </span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{stats.paidInvoices}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                  <span className="w-3 h-3 rounded bg-amber-500"></span>
                  PENDING (Awaiting Transfer)
                </span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{stats.pendingInvoices}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                  <span className="w-3 h-3 rounded bg-rose-500"></span>
                  EXPIRED (Timeouts)
                </span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{stats.expiredInvoices}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50">
                  Recent POS Activity
                </h2>
                <p className="text-[10.5px] text-slate-500 dark:text-zinc-400">
                  Real-time list of the last 5 invoices generated by POS endpoints.
                </p>
              </div>
              <a href="/transactions" className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline">
                View All Transactions {"->"}
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 font-bold">
                    <th className="py-2.5">Invoice ID</th>
                    <th className="py-2.5">Merchant</th>
                    <th className="py-2.5">Order ID</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {recentActivities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No transactions registered yet.
                      </td>
                    </tr>
                  ) : (
                    recentActivities.map(act => (
                      <tr key={act.id} className="text-slate-700 dark:text-zinc-300 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3 font-mono font-bold text-slate-900 dark:text-zinc-100">
                          {act.id.slice(0, 14)}...
                        </td>
                        <td className="py-3">{act.merchantName}</td>
                        <td className="py-3 font-mono">{act.orderId}</td>
                        <td className="py-3 font-semibold font-mono">
                          {formatRupiah(act.totalAmount)}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            act.status === 'PAID' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                              : act.status === 'PENDING'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                          }`}>
                            {act.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}
