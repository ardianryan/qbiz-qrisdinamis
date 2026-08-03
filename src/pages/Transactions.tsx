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
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
          Live Transaction Monitor
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Real-time tracking of dynamic QRIS invoice charges, bank mutations, and webhook dispatches.
        </p>
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
                  Rp {tx.baseAmount.toLocaleString()}<span className="text-sky-600 dark:text-sky-400 font-bold">.{tx.uniqueCode.toString().padStart(3, '0')}</span>
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
                    Rp {tx.baseAmount.toLocaleString()}<span className="text-sky-600 dark:text-sky-400 font-bold">.{tx.uniqueCode.toString().padStart(3, '0')}</span>
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

              // Filter row elements
              document.querySelectorAll('.tx-row, .tx-card').forEach(el => {
                const rowMerchant = el.getAttribute('data-merchant');
                const rowStatus = el.getAttribute('data-status');
                const rowSearch = el.getAttribute('data-search-term').toLowerCase();

                const matchesMerchant = merchant === 'ALL' || merchant === rowMerchant;
                const matchesStatus = status === 'ALL' || status === rowStatus;
                const matchesSearch = query === '' || rowSearch.includes(query);

                if (matchesMerchant && matchesStatus && matchesSearch) {
                  el.style.display = '';
                  visibleCount++;
                } else {
                  el.style.display = 'none';
                }
              });

              // Empty state visibility
              if (visibleCount === 0) {
                if (emptyState) emptyState.style.setProperty('display', 'flex', 'important');
                if (desktopTable) desktopTable.style.display = 'none';
              } else {
                if (emptyState) emptyState.style.setProperty('display', 'none', 'important');
                if (desktopTable) desktopTable.style.display = '';
              }
            }

            if (searchInput) searchInput.addEventListener('input', applyFilters);
            if (merchantSelect) merchantSelect.addEventListener('change', applyFilters);
            if (statusSelect) statusSelect.addEventListener('change', applyFilters);

            // --- B. Auto-Refresh Polling Script (Every 3000ms) ---
            setInterval(function() {
              fetch('/api/v1/transactions')
                .then(res => res.json())
                .then(data => {
                  if (data && data.transactions) {
                    updateTransactionViews(data.transactions);
                  }
                })
                .catch(err => console.error('[Polling] Fetch error:', err));
            }, 3000);

            // Re-render HTML nodes inside body without full page reload
            function updateTransactionViews(txs) {
              const tbody = document.getElementById('desktop-tx-tbody');
              const mobileList = document.getElementById('mobile-tx-list');
              if (!tbody || !mobileList) return;

              // Keep tracking active indices of filters to re-apply after refresh
              let tbodyHtml = '';
              let mobileHtml = '';

              txs.forEach(tx => {
                const formattedBaseAmount = Number(tx.baseAmount).toLocaleString();
                const padUniqueCode = tx.uniqueCode.toString().padStart(3, '0');

                // Status Badge Color Class Mapping
                let badgeClass = 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700';
                if (tx.status === 'PAID') badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800';
                if (tx.status === 'PENDING') badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-300 dark:border-amber-800';
                if (tx.status === 'EXPIRED') badgeClass = 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-400 border border-red-300 dark:border-red-800';

                // Webhook status class mapping
                let webStatusClass = 'bg-slate-50 text-slate-400 border border-slate-200/50 dark:bg-zinc-800 dark:text-zinc-500';
                if (tx.webhookStatus === '200 OK') webStatusClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50';
                if (tx.webhookStatus.includes('ERROR')) webStatusClass = 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/50';
                if (tx.webhookStatus === 'RETRYING') webStatusClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50';

                // Desktop Row HTML
                tbodyHtml += \`
                  <tr class="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors tx-row"
                      data-merchant="\${tx.merchantId}"
                      data-status="\${tx.status}"
                      data-search-term="\${tx.id} \${tx.orderId} \${tx.totalAmount}">
                    <td class="py-3 px-4 font-mono text-[10.5px] text-slate-500 dark:text-zinc-400">\${tx.timestamp}</td>
                    <td class="py-3 px-4 font-semibold text-slate-900 dark:text-zinc-100">\${tx.merchantName}</td>
                    <td class="py-3 px-4">
                      <div class="flex flex-col">
                        <span class="font-semibold text-slate-800 dark:text-zinc-200 font-mono text-[11px]">\${tx.orderId}</span>
                        <span class="text-[10px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5">Inv: \${tx.id}</span>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-right font-mono font-medium text-slate-500">Rp \${formattedBaseAmount}</td>
                    <td class="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-zinc-100">
                      Rp \${formattedBaseAmount}<span class="text-sky-600 dark:text-sky-400 font-bold">.\${padUniqueCode}</span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold leading-normal \${badgeClass}">
                        \${tx.status}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-center font-semibold">
                      <span class="inline-flex px-1.5 py-0.5 rounded text-[9.5px] font-semibold leading-normal \${webStatusClass}">
                        \${tx.webhookStatus}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      \${tx.status === 'PAID' ? \`
                        <button class="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors btn-resend-webhook"
                                data-id="\${tx.id}"
                                title="Resend webhook callback payload">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17.75" /></svg>
                        </button>
                      \` : ''}
                    </td>
                  </tr>
                \`;

                // Mobile Card HTML
                let mobWebStatusColor = 'text-slate-400';
                if (tx.webhookStatus === '200 OK') mobWebStatusColor = 'text-emerald-600 dark:text-emerald-400';
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
                          Rp \${formattedBaseAmount}<span class="text-sky-600 dark:text-sky-400 font-bold">.\${padUniqueCode}</span>
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
                      \` : ''}
                    </div>
                  </div>
                \`;
              });

              tbody.innerHTML = tbodyHtml;
              mobileList.innerHTML = mobileHtml;

              // Re-bind click event on resend webhook button triggers
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
            }

            // Initial bind
            bindResendButtons();

          })();
        `
      }} />

    </Layout>
  );
}
