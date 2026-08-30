import React from 'react';
import { Layout } from '../components/Layout.tsx';

import { MerchantContext } from '../middleware/auth.ts';
import { SystemSettingsConfig } from '../services/settings.ts';

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
  activeMerchant?: MerchantContext | null;
  accessibleMerchants?: MerchantContext[];
  systemSettings?: SystemSettingsConfig;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export function DashboardPage({ stats, recentActivities, currentUser, activeMerchant, accessibleMerchants, systemSettings }: DashboardPageProps) {
  const total = stats.totalInvoices || 1;
  const paidPercent = Math.round((stats.paidInvoices / total) * 100);
  const pendingPercent = Math.round((stats.pendingInvoices / total) * 100);
  const expiredPercent = Math.round((stats.expiredInvoices / total) * 100);

  return (
    <Layout activePath="/dashboard" user={currentUser} activeMerchant={activeMerchant} accessibleMerchants={accessibleMerchants} systemSettings={systemSettings}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              Dashboard Overview
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Welcome back, <span className="font-medium text-slate-700 dark:text-zinc-200">{currentUser.name}</span>.
              {activeMerchant ? (
                <span> Showing real-time payment feed for <strong className="text-sky-600 dark:text-sky-400">{activeMerchant.name}</strong>.</span>
              ) : (
                <span> Real-time platform payment analytics and gateway feed.</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {activeMerchant && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 shadow-sm">
                <span className={`w-1.5 h-1.5 rounded-full ${activeMerchant.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : activeMerchant.status === 'NEEDS_OTP' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                Store: <span className="font-semibold">{activeMerchant.name}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {currentUser.role.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* 1. METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Total Revenue card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total Volume (PAID)</span>
              <span className="p-1 rounded bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-50 font-mono tracking-tight">
                {formatRupiah(stats.totalVolume)}
              </div>
              <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 mt-1.5 block">
                Successful Payments Volume
              </span>
            </div>
          </div>

          {/* Success Rate Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Success Rate</span>
              <span className="p-1 rounded bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-50 font-mono tracking-tight">
                {stats.successRate}%
              </div>
              <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 mt-1.5 block">
                {stats.paidInvoices} of {stats.totalInvoices} Invoices paid
              </span>
            </div>
          </div>

          {/* Active Scrapers */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider">Active Listeners</span>
              <span className="p-1 rounded bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-50 font-mono tracking-tight">
                {stats.activeScrapers}
              </div>
              <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 mt-1.5 block">
                Running background listeners
              </span>
            </div>
          </div>

          {/* Pending Invoices */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider">Pending Charges</span>
              <span className="p-1 rounded bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-50 font-mono tracking-tight">
                {stats.pendingInvoices}
              </div>
              <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 mt-1.5 block">
                Awaiting client payments
              </span>
            </div>
          </div>

        </div>

        {/* 2. SUMMARY ANALYSIS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Status Ratio Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-1">
                Transaction Status Ratio
              </h2>
              <p className="text-[10.5px] text-slate-400 dark:text-zinc-500">
                Percentage comparison of invoices generated on the network.
              </p>

              {/* Progress stack bar */}
              <div className="h-4 w-full rounded bg-slate-100 dark:bg-zinc-800 overflow-hidden flex mt-8">
                <div style={{ width: `${paidPercent}%` }} className="bg-emerald-500 h-full" title={`Paid: ${paidPercent}%`}></div>
                <div style={{ width: `${pendingPercent}%` }} className="bg-amber-500 h-full" title={`Pending: ${pendingPercent}%`}></div>
                <div style={{ width: `${expiredPercent}%` }} className="bg-slate-450 dark:bg-zinc-700 h-full" title={`Expired: ${expiredPercent}%`}></div>
              </div>
            </div>

            {/* Legends list */}
            <div className="mt-8 space-y-3 border-t border-slate-100 dark:border-zinc-800/60 pt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                  PAID (Paid Invoices)
                </span>
                <span className="font-bold text-slate-805 dark:text-zinc-200 font-mono">{stats.paidInvoices} ({paidPercent}%)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                  PENDING (Awaiting Transfer)
                </span>
                <span className="font-bold text-slate-805 dark:text-zinc-200 font-mono">{stats.pendingInvoices} ({pendingPercent}%)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 dark:bg-zinc-700"></span>
                  EXPIRED (Timeouts)
                </span>
                <span className="font-bold text-slate-805 dark:text-zinc-200 font-mono">{stats.expiredInvoices} ({expiredPercent}%)</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-xs font-bold text-slate-850 dark:text-zinc-200 uppercase tracking-wider">
                  Recent POS Activity
                </h2>
                <p className="text-[10.5px] text-slate-400 dark:text-zinc-500 mt-0.5">
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
                  <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    <th className="py-2">Invoice ID</th>
                    <th className="py-2">Merchant</th>
                    <th className="py-2">Order ID</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2 text-right">Status</th>
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
                      <tr key={act.id} className="text-slate-600 dark:text-zinc-405 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3.5 font-mono font-medium text-slate-900 dark:text-zinc-100">
                          {act.id}
                        </td>
                        <td className="py-3.5 font-medium">{act.merchantName}</td>
                        <td className="py-3.5 font-mono">{act.orderId}</td>
                        <td className="py-3.5 font-bold font-mono text-slate-900 dark:text-zinc-100">
                          {formatRupiah(act.totalAmount)}
                        </td>
                        <td className="py-3.5 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase border ${
                            act.status === 'PAID' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40' 
                              : act.status === 'PENDING'
                              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40'
                              : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-100 dark:border-zinc-700'
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
