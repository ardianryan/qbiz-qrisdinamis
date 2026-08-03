import React from 'react';
import { Layout } from '../components/Layout.tsx';

interface Merchant {
  id: string;
  name: string;
}

interface Transaction {
  id: string; // Invoice ID
  merchantId: string;
  merchantName: string;
  orderId: string;
  baseAmount: number;
  uniqueCode: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'EXPIRED' | 'UNMATCHED';
  webhookStatus: '200 OK' | '500 ERROR' | 'RETRYING' | 'N/A';
  timestamp: string;
}

interface TransactionsPageProps {
  merchants: Merchant[];
  transactions: Transaction[];
  currentUser?: any;
}

export function TransactionsPage({ merchants, transactions, currentUser }: TransactionsPageProps) {
  return (
    <Layout activePath="/transactions" user={currentUser}>
      
      {/* ========================================================================= */}
      {/* 1. HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
            Live Transaction Monitor
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Real-time tracking of dynamic QRIS invoice charges, bank mutations, and webhook dispatches.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {currentUser?.role === 'SUPER_ADMIN' && (
            <button 
              id="btn-clear-all-transactions"
              className="w-full sm:w-auto h-10 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm px-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Clear All Transactions
            </button>
          )}
          <button 
            id="btn-create-invoice"
            className="w-full sm:w-auto h-10 inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm px-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Create QRIS Payment
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER TOOLBAR */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-grow flex flex-col gap-1">
            <label htmlFor="filter-search" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Search Invoice / Order ID
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input 
                type="text" 
                id="filter-search" 
                placeholder="Search order ID, invoice, or amount..."
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Merchant Dropdown */}
          <div className="w-full md:w-56 flex flex-col gap-1">
            <label htmlFor="filter-merchant" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Merchant Account
            </label>
            <select 
              id="filter-merchant"
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all cursor-pointer"
            >
              <option value="ALL">All Merchants</option>
              {merchants.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="w-full md:w-48 flex flex-col gap-1">
            <label htmlFor="filter-status" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Payment Status
            </label>
            <select 
              id="filter-status"
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="UNMATCHED">UNMATCHED</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DATA TABLES & MOBILE CARDS LIST */}
      {/* ========================================================================= */}

      {/* Empty State Banner (Initially Hidden unless no data) */}
      <div id="tx-empty-state" className="hidden flex-col items-center justify-center py-16 px-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-lg mx-auto text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">No Invoices Found</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 max-w-xs">
          Try adjusting search queries or connecting more merchant accounts.
        </p>
      </div>

      {/* A. MOBILE VIEW: STACKED CARD LIST (block sm:hidden) */}
      <div 
        id="mobile-tx-list" 
        className="block sm:hidden space-y-4"
        aria-live="polite"
      >
        {transactions.map(tx => (
          <div 
            key={tx.id} 
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col gap-3 tx-card"
            data-merchant={tx.merchantId}
            data-status={tx.status}
            data-search-term={`${tx.id} ${tx.orderId} ${tx.totalAmount}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">{tx.timestamp}</span>
                <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100 mt-0.5">{tx.merchantName}</span>
              </div>
              {/* Payment status badge */}
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                tx.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' :
                tx.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-300 dark:border-amber-800' :
                tx.status === 'EXPIRED' ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-400 border border-red-300 dark:border-red-800' :
                'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
              }`}>
                {tx.status}
              </span>
            </div>

            <div className="border-t border-slate-100 dark:border-zinc-800/60 pt-2.5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Order & Invoice ID</span>
                <span className="font-mono text-xs text-slate-800 dark:text-zinc-200 mt-0.5">{tx.orderId} <span className="text-slate-400">/</span> {tx.id}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Total Amount</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  {(() => {
                    const thousandsPart = Math.floor(tx.totalAmount / 1000).toLocaleString('id-ID');
                    const unitsPart = (tx.totalAmount % 1000).toString().padStart(3, '0');
                    return (
                      <>
                        Rp {thousandsPart}<span className="text-sky-600 dark:text-sky-400 font-bold">.{unitsPart}</span>
                      </>
                    );
                  })()}
                </span>
              </div>
            </div>

            {/* Webhook & Actions */}
            <div className="border-t border-slate-100 dark:border-zinc-800/60 pt-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Webhook:</span>
                <span className={`text-[10px] font-semibold ${
                  tx.webhookStatus === '200 OK' ? 'text-emerald-600 dark:text-emerald-400' :
                  tx.webhookStatus.includes('ERROR') ? 'text-red-600 dark:text-red-400' :
                  tx.webhookStatus === 'RETRYING' ? 'text-amber-600 dark:text-amber-400' :
                  'text-slate-400'
                }`}>{tx.webhookStatus}</span>
              </div>
              {tx.status === 'PAID' && (
                <button 
                  className="p-1 rounded bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 text-sky-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-zinc-700/60 focus-visible:ring-2 focus-visible:ring-sky-500 btn-resend-webhook"
                  data-id={tx.id}
                  title="Resend webhook success payload"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17.75" /></svg>
                </button>
              )}
              {tx.status === 'PENDING' && (
                <div className="flex gap-1.5">
                  <a 
                    href={`/pay/${tx.id}`}
                    target="_blank"
                    className="p-1 rounded bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 text-sky-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-zinc-700/60 focus-visible:ring-2 focus-visible:ring-sky-500"
                    title="Open payment page"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                  <button 
                    className="p-1 rounded bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700/60 focus-visible:ring-2 focus-visible:ring-sky-500 btn-copy-payment-link"
                    data-id={tx.id}
                    title="Copy payment link"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* B. DESKTOP VIEW: HIGH-DENSITY TABLE (hidden sm:block) */}
      <div 
        id="desktop-tx-table-container"
        className="hidden sm:block bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-800/40 border-b border-slate-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Target Merchant</th>
                <th className="py-3.5 px-4">Order & Invoice ID</th>
                <th className="py-3.5 px-4 text-right">Base Amount</th>
                <th className="py-3.5 px-4 text-right">Total Payable</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Webhook</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody 
              id="desktop-tx-tbody"
              className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs text-slate-700 dark:text-zinc-300"
              aria-live="polite"
            >
              {transactions.map(tx => (
                <tr 
                  key={tx.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors tx-row"
                  data-merchant={tx.merchantId}
                  data-status={tx.status}
                  data-search-term={`${tx.id} ${tx.orderId} ${tx.totalAmount}`}
                >
                  <td className="py-3 px-4 font-mono text-[10.5px] text-slate-500 dark:text-zinc-400">{tx.timestamp}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-zinc-100">{tx.merchantName}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono text-[11px]">{tx.orderId}</span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5">Inv: {tx.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-500">Rp {tx.baseAmount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-zinc-100">
                    {(() => {
                      const thousandsPart = Math.floor(tx.totalAmount / 1000).toLocaleString('id-ID');
                      const unitsPart = (tx.totalAmount % 1000).toString().padStart(3, '0');
                      return (
                        <>
                          Rp {thousandsPart}<span className="text-sky-600 dark:text-sky-400 font-bold">.{unitsPart}</span>
                        </>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold leading-normal ${
                      tx.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' :
                      tx.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-300 dark:border-amber-800' :
                      tx.status === 'EXPIRED' ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-400 border border-red-300 dark:border-red-800' :
                      'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9.5px] font-semibold leading-normal ${
                      tx.webhookStatus === '200 OK' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50' :
                      tx.webhookStatus.includes('ERROR') ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/50' :
                      tx.webhookStatus === 'RETRYING' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50' :
                      'bg-slate-50 text-slate-400 border border-slate-200/50 dark:bg-zinc-800 dark:text-zinc-500'
                    }`}>
                      {tx.webhookStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {tx.status === 'PAID' && (
                      <button 
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors btn-resend-webhook focus-visible:ring-2 focus-visible:ring-sky-500"
                        data-id={tx.id}
                        title="Resend webhook callback payload"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17.75" /></svg>
                      </button>
                    )}
                    {tx.status === 'PENDING' && (
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <a 
                          href={`/pay/${tx.id}`}
                          target="_blank"
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500"
                          title="Open payment page"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                        <button 
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors btn-copy-payment-link focus-visible:ring-2 focus-visible:ring-sky-500"
                          data-id={tx.id}
                          title="Copy payment link"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. AUTO-REFRESH & DOM FILTERING SCRIPT */}
      {/* ========================================================================= */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            function init() {
              const searchInput = document.getElementById('filter-search');
              const merchantSelect = document.getElementById('filter-merchant');
              const statusSelect = document.getElementById('filter-status');
              const emptyState = document.getElementById('tx-empty-state');
              const desktopTable = document.getElementById('desktop-tx-table-container');

              // --- A. Local Filtering Logic ---
              function applyFilters() {
                const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
                const merchant = merchantSelect ? merchantSelect.value : 'ALL';
                const status = statusSelect ? statusSelect.value : 'ALL';

                let visibleCount = 0;
                document.querySelectorAll('.tx-row, .tx-card').forEach(row => {
                  const term = (row.getAttribute('data-search-term') || '').toLowerCase();
                  const rowMerchant = row.getAttribute('data-merchant');
                  const rowStatus = row.getAttribute('data-status');

                  const matchesSearch = term.includes(query);
                  const matchesMerchant = merchant === 'ALL' || rowMerchant === merchant;
                  const matchesStatus = status === 'ALL' || rowStatus === status;

                  if (matchesSearch && matchesMerchant && matchesStatus) {
                    row.classList.remove('hidden');
                    visibleCount++;
                  } else {
                    row.classList.add('hidden');
                  }
                });

                if (visibleCount === 0) {
                  if (emptyState) emptyState.classList.remove('hidden');
                  if (desktopTable) desktopTable.classList.add('hidden');
                } else {
                  if (emptyState) emptyState.classList.add('hidden');
                  if (desktopTable) desktopTable.classList.remove('hidden');
                }
              }

              if (searchInput) searchInput.addEventListener('input', applyFilters);
              if (merchantSelect) merchantSelect.addEventListener('change', applyFilters);
              if (statusSelect) statusSelect.addEventListener('change', applyFilters);

              // --- B. Auto-Refresh Logic (SSE/Polling simulation) ---
              // Poll for new transactions or status changes every 8 seconds
              function fetchTransactions() {
                fetch('/api/v1/transactions/data')
                  .then(res => res.json())
                  .then(data => {
                    if (data.success && data.transactions) {
                      updateTableDOM(data.transactions);
                    }
                  })
                  .catch(() => {});
              }

              const refreshInterval = setInterval(fetchTransactions, 8000);

              function updateTableDOM(transactions) {
                const tbody = document.getElementById('desktop-tx-tbody');
                const mobileList = document.getElementById('mobile-tx-list');
                if (!tbody || !mobileList) return;

                let tbodyHtml = '';
                let mobileHtml = '';

                transactions.forEach(tx => {
                  let statusClass = 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300';
                  if (tx.status === 'PAID') statusClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50';
                  if (tx.status === 'EXPIRED') statusClass = 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50';
                  if (tx.status === 'PENDING') statusClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50';

                  const badgeClass = statusClass;
                  const totalVal = Number(tx.totalAmount);
                  const thousandsVal = Math.floor(totalVal / 1000).toLocaleString('id-ID');
                  const unitsVal = String(totalVal % 1000).padStart(3, '0');

                  tbodyHtml += \`
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors border-b border-slate-100 dark:border-zinc-800/60 tx-row"
                        data-merchant="\${tx.merchantId}"
                        data-status="\${tx.status}"
                        data-search-term="\${tx.id} \${tx.orderId} \${tx.totalAmount}">
                      <td class="px-4 py-3.5 text-xs text-slate-500 dark:text-zinc-400 font-mono">\${tx.timestamp}</td>
                      <td class="px-4 py-3.5 text-sm font-semibold text-slate-800 dark:text-zinc-200">\${tx.merchantName}</td>
                      <td class="px-4 py-3.5 text-xs text-slate-600 dark:text-zinc-300 font-mono">\${tx.orderId}</td>
                      <td class="px-4 py-3.5 text-xs text-slate-600 dark:text-zinc-300 font-mono text-sky-600 dark:text-sky-400 font-semibold">\${tx.id}</td>
                      <td class="px-4 py-3.5 text-sm text-right text-slate-800 dark:text-zinc-200 font-mono">
                        Rp \${thousandsVal}<span class="text-sky-600 dark:text-sky-400 font-bold">.\${unitsVal}</span>
                      </td>
                      <td class="px-4 py-3.5 text-xs text-center">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold \${badgeClass}">
                          \${tx.status}
                        </span>
                      </td>
                      <td class="px-4 py-3.5 text-xs text-center font-mono text-slate-500 dark:text-zinc-400">
                        \${tx.webhookStatus}
                      </td>
                      <td class="px-4 py-3.5 text-xs text-center">
                        \${tx.status === 'PAID' ? \`
                          <button class="p-1 rounded bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 text-sky-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-zinc-700/60 focus-visible:ring-2 focus-visible:ring-sky-500 btn-resend-webhook"
                                  data-id="\${tx.id}"
                                  title="Resend webhook success payload">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17.75" /></svg>
                          </button>
                        \` : tx.status === 'PENDING' ? \`
                          <div class="inline-flex items-center justify-center gap-1.5">
                            <a href="/pay/\${tx.id}" target="_blank"
                               class="inline-flex items-center justify-center p-1 rounded bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 text-sky-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-zinc-700/60 focus-visible:ring-2 focus-visible:ring-sky-500"
                               title="Open payment page">
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                            <button class="inline-flex items-center justify-center p-1 rounded bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 text-slate-500 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-zinc-700/60 transition-colors btn-copy-payment-link focus-visible:ring-2 focus-visible:ring-sky-500"
                                    data-id="\${tx.id}"
                                    title="Copy payment link">
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                          </div>
                        \` : '-'}
                      </td>
                    </tr>
                  \`;

                  let mobWebStatusColor = 'text-slate-500';
                  if (tx.webhookStatus.includes('200')) mobWebStatusColor = 'text-emerald-600 dark:text-emerald-400';
                  if (tx.webhookStatus.includes('ERROR')) mobWebStatusColor = 'text-red-600 dark:text-red-400';
                  if (tx.webhookStatus === 'RETRYING') mobWebStatusColor = 'text-amber-600 dark:text-amber-400';

                  mobileHtml += \`
                    <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col gap-3 tx-card"
                         data-merchant="\${tx.merchantId}"
                         data-status="\${tx.status}"
                         data-search-term="\${tx.id} \${tx.orderId} \${tx.totalAmount}">
                      <div class="flex justify-between items-start">
                        <div class="flex flex-col">
                          <span class="text-[10px] font-mono text-slate-400 dark:text-zinc-500">\${tx.timestamp}</span>
                          <span class="font-semibold text-xs text-slate-900 dark:text-zinc-100 mt-0.5">\${tx.merchantName}</span>
                        </div>
                        <span class="px-2 py-0.5 rounded text-[10px] font-semibold \${badgeClass}">
                          \${tx.status}
                        </span>
                      </div>

                      <div class="border-t border-slate-100 dark:border-zinc-800/60 pt-2.5 flex items-center justify-between">
                        <div class="flex flex-col">
                          <span class="text-[10px] text-slate-400 dark:text-zinc-500">Order & Invoice ID</span>
                          <span class="font-mono text-xs text-slate-800 dark:text-zinc-200 mt-0.5">\${tx.orderId} <span class="text-slate-400">/</span> \${tx.id}</span>
                        </div>
                        <div class="text-right">
                          <span class="text-[10px] text-slate-400 dark:text-zinc-500 block">Total Amount</span>
                          <span class="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                            Rp \${thousandsVal}<span class="text-sky-600 dark:text-sky-400 font-bold">.\${unitsVal}</span>
                          </span>
                        </div>
                      </div>

                      <div class="border-t border-slate-100 dark:border-zinc-800/60 pt-2.5 flex items-center justify-between text-xs">
                        <div class="flex items-center gap-1.5">
                          <span class="text-[10px] text-slate-400 dark:text-zinc-500">Webhook:</span>
                          <span class="text-[10px] font-semibold \${mobWebStatusColor}">\${tx.webhookStatus}</span>
                        </div>
                        \${tx.status === 'PAID' ? \`
                          <button class="p-1 rounded bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 text-sky-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-zinc-700/60 focus-visible:ring-2 focus-visible:ring-sky-500 btn-resend-webhook"
                                  data-id="\${tx.id}"
                                  title="Resend webhook success payload">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17.75" /></svg>
                          </button>
                        \` : tx.status === 'PENDING' ? \`
                          <div class="flex gap-1.5">
                            <a href="/pay/\${tx.id}" target="_blank"
                               class="p-1 rounded bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 text-sky-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-zinc-700/60 focus-visible:ring-2 focus-visible:ring-sky-500"
                               title="Open payment page">
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                            <button class="p-1 rounded bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700/60 focus-visible:ring-2 focus-visible:ring-sky-500 btn-copy-payment-link"
                                    data-id="\${tx.id}"
                                    title="Copy payment link">
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                          </div>
                        \` : ''}
                      </div>
                    </div>
                  \`;
                });

                tbody.innerHTML = tbodyHtml;
                mobileList.innerHTML = mobileHtml;

                // Re-bind click events
                bindResendButtons();

                // Re-apply search filters on newly generated DOM elements
                applyFilters();
              }

              function bindResendButtons() {
                document.querySelectorAll('.btn-resend-webhook').forEach(btn => {
                  btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const txId = this.getAttribute('data-id');
                    this.disabled = true;
                    
                    fetch('/api/v1/transactions/' + txId + '/resend-webhook', { method: 'POST' })
                      .then(res => res.json())
                      .then(data => {
                        this.disabled = false;
                        if (data.success) {
                          alert('Webhook dispatch triggered successfully for Invoice: ' + txId);
                        } else {
                          alert('Failed to resend webhook: ' + (data.error || 'Unknown error'));
                        }
                      })
                      .catch(() => {
                        this.disabled = false;
                        alert('Network error triggering webhook dispatch');
                      });
                  });
                });

                document.querySelectorAll('.btn-copy-payment-link').forEach(btn => {
                  btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const txId = this.getAttribute('data-id');
                    const paymentUrl = window.location.origin + '/pay/' + txId;
                    
                    navigator.clipboard.writeText(paymentUrl)
                      .then(() => {
                        const originalHtml = this.innerHTML;
                        this.innerHTML = \`<svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>\`;
                        setTimeout(() => {
                          this.innerHTML = originalHtml;
                        }, 2000);
                      })
                      .catch(() => {
                        alert('Failed to copy link. Please copy manually: ' + paymentUrl);
                      });
                  });
                });
              }

              // --- Sheets Helpers ---
              function openSheet(id) {
                const sheet = document.getElementById(id);
                if (sheet) {
                  sheet.classList.remove('pointer-events-none', 'opacity-0');
                  sheet.classList.add('pointer-events-auto', 'opacity-100');
                  
                  const panel = sheet.querySelector('.sheet-panel');
                  if (panel) {
                    panel.classList.remove('translate-y-full', 'md:translate-x-full');
                    panel.classList.add('translate-x-0', 'translate-y-0');
                  }
                }
              }

              function closeSheet(id) {
                const sheet = document.getElementById(id);
                if (sheet) {
                  sheet.classList.remove('pointer-events-auto', 'opacity-100');
                  sheet.classList.add('pointer-events-none', 'opacity-0');
                  
                  const panel = sheet.querySelector('.sheet-panel');
                  if (panel) {
                    panel.classList.remove('translate-x-0', 'translate-y-0');
                    panel.classList.add('translate-y-full', 'md:translate-x-full');
                  }
                }
              }

              // Close sheet on backdrop click and cancel buttons
              document.querySelectorAll('.sheet-close-trigger').forEach(trigger => {
                trigger.addEventListener('click', function() {
                  const sheet = this.closest('[role="dialog"]');
                  if (sheet) closeSheet(sheet.id);
                });
              });

              // --- 3B. CLEAR ALL TRANSACTIONS (SUPER_ADMIN ONLY) ---
              const btnClearAll = document.getElementById('btn-clear-all-transactions');
              const confirmClearText = document.getElementById('confirm-clear-text');
              const btnConfirmClearSubmit = document.getElementById('btn-confirm-clear-submit');

              if (btnClearAll) {
                btnClearAll.addEventListener('click', function() {
                  if (confirmClearText) confirmClearText.value = '';
                  if (btnConfirmClearSubmit) {
                    btnConfirmClearSubmit.disabled = true;
                    btnConfirmClearSubmit.textContent = 'Permanently Clear All';
                  }
                  openSheet('sheet-clear-transactions');
                });
              }

              if (confirmClearText && btnConfirmClearSubmit) {
                confirmClearText.addEventListener('input', function() {
                  btnConfirmClearSubmit.disabled = (this.value !== 'DELETE ALL');
                });
              }

              if (btnConfirmClearSubmit) {
                btnConfirmClearSubmit.addEventListener('click', function() {
                  this.disabled = true;
                  this.textContent = 'Clearing...';
                  fetch('/api/v1/transactions/clear-all', { method: 'DELETE' })
                    .then(res => res.json())
                    .then(data => {
                      this.disabled = false;
                      this.textContent = 'Permanently Clear All';
                      if (data.success) {
                        closeSheet('sheet-clear-transactions');
                        window.location.reload();
                      } else {
                        alert('Clear failed: ' + (data.error || 'Unknown error'));
                      }
                    })
                    .catch(() => {
                      this.disabled = false;
                      this.textContent = 'Permanently Clear All';
                      alert('Network error clearing transactions');
                    });
                });
              }

              // --- 3. CREATE INVOICE MODAL FLOW ---
              const btnCreateInvoice = document.getElementById('btn-create-invoice');
              const step1 = document.getElementById('invoice-form-step-1');
              const step2 = document.getElementById('invoice-form-step-2');
              const btnSubmitInvoice = document.getElementById('btn-submit-invoice');
              const invoiceAmount = document.getElementById('invoice-amount');
              const invoiceOrderId = document.getElementById('invoice-order-id');
              const invoiceMerchantId = document.getElementById('invoice-merchant-id');
              const generatedCheckoutUrl = document.getElementById('generated-checkout-url');
              const btnCopyCheckoutUrl = document.getElementById('btn-copy-checkout-url');
              const linkOpenCheckout = document.getElementById('link-open-checkout');

              function openInvoiceModal() {
                // Populate default random order ID
                if (invoiceOrderId) {
                  invoiceOrderId.value = 'QBIZ-POS-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
                }
                if (invoiceAmount) invoiceAmount.value = '';
                
                step1.classList.remove('hidden');
                step2.classList.add('hidden');

                openSheet('sheet-invoice');
              }

              if (btnCreateInvoice) {
                btnCreateInvoice.addEventListener('click', openInvoiceModal);
              }

              // Submit / Generate Invoice
              if (btnSubmitInvoice) {
                btnSubmitInvoice.addEventListener('click', function() {
                  const merchantId = invoiceMerchantId.value;
                  const amount = Number(invoiceAmount.value);
                  const orderId = invoiceOrderId.value;

                  if (!amount || amount <= 0) {
                    alert('Please enter a valid billing amount');
                    return;
                  }
                  if (!orderId) {
                    alert('Please enter an Order ID reference');
                    return;
                  }

                  this.disabled = true;
                  this.innerHTML = 'Generating...';

                  fetch('/api/v1/invoices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      merchant_id: merchantId,
                      amount: amount,
                      order_id: orderId
                    })
                  })
                    .then(res => res.json())
                    .then(data => {
                      this.disabled = false;
                      this.innerHTML = 'Generate Checkout Link';

                      if (data.success && data.invoice) {
                        generatedCheckoutUrl.value = data.invoice.checkout_url;
                        linkOpenCheckout.href = data.invoice.checkout_url;

                        step1.classList.add('hidden');
                        step2.classList.remove('hidden');
                      } else {
                        alert('Failed to generate invoice: ' + (data.error || 'Unknown error'));
                      }
                    })
                    .catch(err => {
                      this.disabled = false;
                      this.innerHTML = 'Generate Checkout Link';
                      alert('Network error generating invoice');
                    });
                });
              }

              // Copy Link button
              if (btnCopyCheckoutUrl) {
                btnCopyCheckoutUrl.addEventListener('click', function() {
                  generatedCheckoutUrl.select();
                  navigator.clipboard.writeText(generatedCheckoutUrl.value);
                  const originalText = this.innerHTML;
                  this.innerHTML = 'Copied!';
                  setTimeout(() => {
                    this.innerHTML = originalText;
                  }, 2000);
                });
              }

              // Initial bind
              bindResendButtons();
            }

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', init);
            } else {
              init();
            }
          })();
        `
      }} />

      {/* ========================================================================= */}
      {/* 4. MODALS & SHEETS */}
      {/* ========================================================================= */}

      {/* A. CREATE PAYMENT INVOICE SHEET (SHADCN SHEET COMPONENT STYLE) */}
      <div id="sheet-invoice" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        
        {/* Sheet Content Panel */}
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-md h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          
          {/* Mobile indicator line */}
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto my-3 md:hidden"></div>

          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-zinc-50">Create QRIS Payment</h3>
              <p className="text-xs text-slate-500 mt-1">Generate a new dynamic QRIS payment request.</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" aria-label="Close panel">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Body Scrollable */}
          <div className="p-6 flex-grow overflow-y-auto space-y-5">
            {/* Form */}
            <div id="invoice-form-step-1" className="space-y-4">
              {/* Merchant Select */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="invoice-merchant-id" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Select Target Merchant
                </label>
                <select 
                  id="invoice-merchant-id"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-zinc-50 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all cursor-pointer"
                >
                  {merchants.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Base Amount */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="invoice-amount" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Billing Amount (Rupiah)
                </label>
                <input 
                  type="number" 
                  id="invoice-amount" 
                  required 
                  placeholder="e.g. 50000"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
                />
              </div>

              {/* Order ID */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="invoice-order-id" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Order / Reference ID
                </label>
                <input 
                  type="text" 
                  id="invoice-order-id" 
                  required 
                  placeholder="e.g. ORDER-100234"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
                />
              </div>

              {/* Submit button */}
              <div className="pt-3">
                <button 
                  id="btn-submit-invoice"
                  type="button"
                  className="w-full h-10 inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 active:scale-[0.98] cursor-pointer"
                >
                  Generate Checkout Link
                </button>
              </div>
            </div>

            {/* Result Output (Initially Hidden) */}
            <div id="invoice-form-step-2" className="space-y-5 hidden">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 rounded-lg p-4 flex gap-3">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="text-xs text-slate-700 dark:text-zinc-300">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-400">Invoice Generated successfully!</p>
                  <p className="mt-0.5">The dynamic QRIS and checkout gateway links have been generated.</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="generated-checkout-url" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Generated Checkout Gateway URL
                </label>
                <input 
                  type="text" 
                  id="generated-checkout-url" 
                  readOnly
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 dark:text-zinc-400 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  id="btn-copy-checkout-url"
                  className="flex-grow h-10 inline-flex items-center justify-center border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold px-3 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
                >
                  Copy Link
                </button>
                <a 
                  id="link-open-checkout"
                  href="#"
                  target="_blank"
                  className="flex-grow h-10 inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold px-3 rounded-lg transition-colors text-center cursor-pointer"
                >
                  Open Checkout Page
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* B. CONFIRM CLEAR ALL TRANSACTIONS SHEET (SHADCN SHEET COMPONENT STYLE) */}
      <div id="sheet-clear-transactions" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        
        {/* Sheet Content Panel */}
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-md h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          
          {/* Mobile indicator line */}
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto my-3 md:hidden"></div>

          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl text-red-600 dark:text-red-400">Clear Transaction History</h3>
              <p className="text-xs text-slate-500 mt-1">This action is highly destructive and irreversible.</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" aria-label="Close panel">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex-grow overflow-y-auto space-y-6">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/60 rounded-xl p-4 flex gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div className="text-xs text-red-800 dark:text-red-400 leading-relaxed">
                <p className="font-bold">Are you absolutely sure?</p>
                <p className="mt-1">Permanently clearing all transactions will wipe out all invoices, bank mutations, status logs, and developer callback dispatches. External systems will no longer be able to verify past invoice references.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm-clear-text" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Please type <span className="font-bold font-mono text-red-600 dark:text-red-400">DELETE ALL</span> to confirm
                </label>
                <input 
                  type="text" 
                  id="confirm-clear-text" 
                  placeholder="Type DELETE ALL here" 
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-transparent outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="p-6 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/30 flex gap-3">
            <button 
              type="button"
              className="flex-grow h-10 inline-flex items-center justify-center border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold px-4 rounded-lg transition-colors sheet-close-trigger cursor-pointer"
            >
              Cancel
            </button>
            <button 
              id="btn-confirm-clear-submit"
              type="button"
              disabled
              className="flex-grow h-10 inline-flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 disabled:cursor-not-allowed text-white text-xs font-bold px-4 rounded-lg transition-all cursor-pointer"
            >
              Permanently Clear All
            </button>
          </div>
        </div>
      </div>

    </Layout>
  );
}
