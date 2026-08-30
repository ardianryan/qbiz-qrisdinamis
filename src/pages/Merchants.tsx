import React from 'react';
import { Layout } from '../components/Layout.tsx';
import { MerchantContext } from '../middleware/auth.ts';

interface Merchant {
  id: string;
  name: string;
  phoneNumber: string;
  qrisImageUrl: string;
  qrisPayload?: string;
  logoUrl?: string | null;
  status: 'ACTIVE' | 'NEEDS_OTP' | 'DISCONNECTED';
  todayTransactions: number;
  lastSync: string;
}

interface MerchantsPageProps {
  merchants: Merchant[];
  currentUser?: any;
  activeMerchant?: MerchantContext | null;
  accessibleMerchants?: MerchantContext[];
}

export function MerchantsPage({ merchants, currentUser, activeMerchant, accessibleMerchants }: MerchantsPageProps) {
  return (
    <Layout activePath="/merchants" user={currentUser} activeMerchant={activeMerchant} accessibleMerchants={accessibleMerchants}>
      
      {/* ========================================================================= */}
      {/* 1. HEADER SECTION */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
            Multi-Merchant Manager
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage your QRIS Food Merchant stores, track live session health, and configure multi-channel alerts.
          </p>
        </div>
        <button 
          id="btn-add-merchant"
          className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 w-full sm:w-auto shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add QRIS Merchant
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & FILTER TOOLBAR */}
      {/* ========================================================================= */}
      {merchants.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 mb-6 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input 
              type="text" 
              id="merchant-filter-search" 
              placeholder="Search store name or phone..." 
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select id="merchant-filter-status" className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-zinc-200 outline-none cursor-pointer">
              <option value="ALL">All Status</option>
              <option value="ACTIVE">🟢 Active Listener</option>
              <option value="NEEDS_OTP">🟡 Needs OTP</option>
              <option value="DISCONNECTED">🔴 Disconnected</option>
            </select>
          </div>
        </div>
      )}

      {/* Empty Search Result */}
      <div id="merchant-empty-search" className="hidden flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-center shadow-sm mb-6">
        <span className="text-2xl mb-2">🔍</span>
        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No matching merchant stores found</p>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Try refining your search keyword or clearing the status filter.</p>
      </div>

      {/* ========================================================================= */}
      {/* 3. MERCHANTS GRID */}
      {/* ========================================================================= */}
      {merchants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-lg mx-auto text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">No Merchants Connected</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 max-w-xs">
            Start by connecting a QRIS merchant store to begin intercepting dynamic transactions and sending multi-channel alerts.
          </p>
          <button 
            id="btn-add-merchant-empty"
            className="mt-5 inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Connect First Merchant
          </button>
        </div>
      ) : (
        <div id="merchants-grid-container" className="space-y-6">
          <div id="merchants-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {merchants.map((merchant) => {
              const isSynced = merchant.status === 'ACTIVE';
              const isSyncing = merchant.status === 'NEEDS_OTP';
              
              return (
                <div 
                  key={merchant.id}
                  className="merchant-card bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition-all group"
                  data-name={merchant.name.toLowerCase()}
                  data-phone={merchant.phoneNumber}
                  data-status={merchant.status}
                >
                {/* Top Row: Info & Provider */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-zinc-50 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-2">
                      {merchant.logoUrl && (
                        <img src={merchant.logoUrl} alt="" className="w-6 h-6 rounded object-contain bg-slate-50 border border-slate-100 shadow-sm" />
                      )}
                      {merchant.name}
                    </h3>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300 px-2 py-0.5 rounded">
                      QRIS Store
                    </span>
                  </div>

                  {/* Status Pill */}
                  <div className="flex items-center gap-2 mb-4">
                    {isSynced ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        Active Listener
                      </span>
                    ) : isSyncing ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        OTP Syncing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-400 border border-red-200 dark:border-red-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        Session Dead
                      </span>
                    )}
                  </div>

                  {/* Image Preview Area */}
                  <div className="relative aspect-square w-full bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-lg overflow-hidden mb-4 flex items-center justify-center group/img">
                    <img 
                      src={merchant.qrisImageUrl} 
                      alt={`QRIS static QR code for ${merchant.name}`}
                      className="w-4/5 h-4/5 object-contain transition-transform duration-300 group-hover/img:scale-105"
                      loading="lazy"
                    />
                    <button 
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity focus:opacity-100 btn-zoom-qris outline-none"
                      data-img={merchant.qrisImageUrl}
                      data-name={merchant.name}
                      aria-label={`Zoom QRIS image for ${merchant.name}`}
                    >
                      <span className="bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-zinc-100 text-xs font-semibold px-3 py-1.5 rounded-md shadow flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        Click to Zoom
                      </span>
                    </button>
                  </div>

                  {/* Details List */}
                  <dl className="space-y-2 text-xs border-t border-slate-100 dark:border-zinc-800/60 pt-4 mb-5">
                    <div className="flex justify-between">
                      <dt className="text-slate-500 dark:text-zinc-400">WhatsApp Phone</dt>
                      <dd className="font-mono font-medium text-slate-800 dark:text-zinc-200">
                        {merchant.phoneNumber.replace(/^(\d{4})\d+(\d{4})$/, '$1••••$2')}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500 dark:text-zinc-400">Today's Tx</dt>
                      <dd className="font-semibold text-sky-600 dark:text-sky-400">{merchant.todayTransactions} paid</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500 dark:text-zinc-400">Last Sync</dt>
                      <dd className="text-slate-700 dark:text-zinc-300 font-mono">{merchant.lastSync}</dd>
                    </div>
                  </dl>
                </div>

                {/* Action Group */}
                <div className="flex gap-2">
                  <button 
                    className="flex-grow h-9 btn-auth-otp inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 hover:bg-slate-800 text-xs font-semibold px-3 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-sky-500"
                    data-id={merchant.id}
                    data-phone={merchant.phoneNumber}
                  >
                    Auth OTP
                  </button>

                  {/* Notification Channels Button (v1.1.0) */}
                  <button
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors btn-notif-merchant"
                    data-id={merchant.id}
                    data-name={merchant.name}
                    title="Notification Alerts (Telegram, Discord, WhatsApp GOWA)"
                    aria-label="Notification Alerts"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </button>
                  
                  {/* Pause Worker button with active visual indicator */}
                  <button 
                    className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all btn-pause-worker hover:bg-slate-50 dark:hover:bg-zinc-800 ${
                      isSynced 
                        ? 'border-slate-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400' 
                        : 'border-slate-200 dark:border-zinc-800 text-slate-400'
                    }`}
                    title={isSynced ? "Pause Listening Worker" : "Resume Listening Worker"}
                    data-id={merchant.id}
                    data-active={isSynced ? "true" : "false"}
                    aria-label={isSynced ? "Pause Listening Worker" : "Resume Listening Worker"}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      {isSynced ? (
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      ) : (
                        <path d="M8 5v14l11-7z"/>
                      )}
                    </svg>
                  </button>

                  {/* Settings / Actions Dropdown Trigger */}
                  <div className="relative">
                    <button 
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors btn-dropdown-trigger"
                      data-id={merchant.id}
                      aria-label="Settings"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                    {/* Settings Dropdown menu */}
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 hidden dropdown-menu z-10">
                      <button 
                        className="w-full text-left block px-4 py-2 text-xs text-sky-600 dark:text-sky-400 font-semibold hover:bg-sky-50 dark:hover:bg-sky-950/40 btn-notif-merchant border-b border-slate-100 dark:border-zinc-800/60"
                        data-id={merchant.id}
                        data-name={merchant.name}
                      >
                        🔔 Notification Alerts
                      </button>
                      <a href={`/developer?merchant=${merchant.id}`} className="block px-4 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800/60">
                        Webhook Settings
                      </a>
                      <button 
                        className="w-full text-left block px-4 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 btn-edit-merchant border-b border-slate-100 dark:border-zinc-800/60"
                        data-id={merchant.id}
                        data-name={merchant.name}
                        data-phone={merchant.phoneNumber}
                        data-payload={merchant.qrisPayload}
                      >
                        Edit Merchant Details
                      </button>
                      <button 
                        className="w-full text-left block px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 btn-disconnect-merchant border-b border-slate-100 dark:border-zinc-800/60"
                        data-id={merchant.id}
                        data-name={merchant.name}
                      >
                        Disconnect Account
                      </button>
                      <button 
                        className="w-full text-left block px-4 py-2 text-xs text-red-700 dark:text-red-500 hover:bg-red-100/40 hover:dark:bg-red-950/60 btn-delete-merchant font-semibold"
                        data-id={merchant.id}
                        data-name={merchant.name}
                      >
                        Delete Merchant
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Bar */}
          <div id="merchants-pagination-bar" className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-500 dark:text-zinc-400 shadow-sm">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select id="merchants-page-size" className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-2 py-1 text-xs text-slate-800 dark:text-zinc-200 outline-none cursor-pointer">
                <option value="6">6</option>
                <option value="12">12</option>
                <option value="24">24</option>
              </select>
              <span>stores per page</span>
            </div>
            <div className="flex items-center gap-3">
              <span id="merchants-pagination-info" className="text-xs">Showing 1 to {Math.min(6, merchants.length)} of {merchants.length} stores</span>
              <div className="inline-flex items-center gap-1">
                <button id="merchants-btn-prev" className="px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs transition-colors">Prev</button>
                <div id="merchants-page-numbers" className="inline-flex items-center gap-1"></div>
                <button id="merchants-btn-next" className="px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs transition-colors">Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SHEETS & DRAWER PANELS */}
      {/* ========================================================================= */}

      {/* A. ZOOM QRIS CODE SHEET */}
      <div id="sheet-zoom" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-md h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto my-3 md:hidden"></div>
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <h3 id="zoom-title" className="font-bold text-xl text-slate-900 dark:text-zinc-50">QRIS Merchant Code</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" aria-label="Close panel">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6 flex-grow flex items-center justify-center overflow-y-auto">
            <img id="zoom-image" src="" alt="QRIS Zoom" className="w-full max-w-xs object-contain border border-slate-100 dark:border-zinc-800 rounded-xl shadow-lg p-2 bg-white" />
          </div>
        </div>
      </div>

      {/* B. MULTI-CHANNEL STORE NOTIFICATIONS SHEET (v1.1.0) */}
      <div id="sheet-notifications" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-xl h-auto md:h-full max-h-[90vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </span>
                <h3 className="font-bold text-xl text-slate-900 dark:text-zinc-50">Notification Channels</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Configure real-time payment alerts for <span id="notif-modal-merchant-name" className="font-bold text-slate-800 dark:text-zinc-200"></span></p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Loading Indicator inside modal */}
          <div id="notif-loading" className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-500 mt-3 font-medium">Loading channel settings...</span>
          </div>

          {/* Body Content */}
          <div id="notif-content" className="p-6 flex-grow overflow-y-auto space-y-6 hidden">
            
            {/* Inline Alert / Feedback Box */}
            <div id="notif-feedback-box" className="hidden p-3.5 rounded-xl text-xs flex items-start gap-2.5">
              <div id="notif-feedback-icon" className="shrink-0 mt-0.5"></div>
              <div id="notif-feedback-text" className="font-medium"></div>
            </div>

            {/* Channel Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-xl gap-1">
              <button 
                id="tab-btn-telegram" 
                type="button" 
                className="flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-sm notif-tab-btn" 
                data-tab="tab-panel-telegram"
              >
                <span>✈️</span> Telegram
              </button>
              <button 
                id="tab-btn-discord" 
                type="button" 
                className="flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 notif-tab-btn" 
                data-tab="tab-panel-discord"
              >
                <span>💬</span> Discord
              </button>
              <button 
                id="tab-btn-whatsapp" 
                type="button" 
                className="flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 notif-tab-btn" 
                data-tab="tab-panel-whatsapp"
              >
                <span>📱</span> WhatsApp
              </button>
            </div>

            {/* TAB 1: TELEGRAM BOT */}
            <div id="tab-panel-telegram" className="space-y-4 notif-tab-panel">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 block">Telegram Bot Alerts</span>
                  <span className="text-[11px] text-slate-500">Deliver payment notifications to private or group chat</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="notif-tg-enabled" className="sr-only peer" />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="notif-tg-token" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Bot Token</label>
                  <input 
                    type="password" 
                    id="notif-tg-token" 
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Get a bot token by creating a bot via <code className="bg-slate-200 dark:bg-zinc-800 px-1 py-0.5 rounded">@BotFather</code> on Telegram.</span>
                </div>

                <div>
                  <label htmlFor="notif-tg-chatid" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Target Chat ID / Group ID</label>
                  <input 
                    type="text" 
                    id="notif-tg-chatid" 
                    placeholder="-1001234567890 or @channelusername"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Your personal user ID or supergroup ID (starts with <code className="bg-slate-200 dark:bg-zinc-800 px-1 py-0.5 rounded">-100</code>).</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="notif-tg-template" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Custom Message Template (HTML)</label>
                    <span className="text-[10px] text-slate-400">Click variable to insert:</span>
                  </div>
                  
                  {/* Variable Chips */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {['{merchant_name}', '{order_id}', '{amount_formatted}', '{customer_name}', '{paid_at}'].map(chip => (
                      <button 
                        key={chip} 
                        type="button" 
                        className="text-[10px] font-mono bg-slate-100 hover:bg-sky-100 dark:bg-zinc-800 dark:hover:bg-sky-950 text-slate-700 dark:text-zinc-300 hover:text-sky-700 dark:hover:text-sky-400 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 transition-colors btn-insert-chip"
                        data-target="notif-tg-template"
                        data-chip={chip}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <textarea 
                    id="notif-tg-template" 
                    rows={4}
                    placeholder="Leave empty to use clean default HTML template"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-xs font-mono text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button 
                    type="button" 
                    id="btn-test-telegram" 
                    className="w-full py-2 px-3 rounded-lg border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 bg-sky-50/50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-950/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    Send Telegram Test Message
                  </button>
                </div>
              </div>
            </div>

            {/* TAB 2: DISCORD WEBHOOK */}
            <div id="tab-panel-discord" className="space-y-4 notif-tab-panel hidden">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 block">Discord Webhook Alerts</span>
                  <span className="text-[11px] text-slate-500">Send rich embed cards to your Discord channel</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="notif-dc-enabled" className="sr-only peer" />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="notif-dc-url" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Discord Webhook URL</label>
                  <input 
                    type="url" 
                    id="notif-dc-url" 
                    placeholder="https://discord.com/api/webhooks/123456789/abcdef..."
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">In Discord: Channel Settings &gt; Integrations &gt; Webhooks &gt; New Webhook.</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="notif-dc-template" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Custom Alert Content (Markdown)</label>
                    <span className="text-[10px] text-slate-400">Click variable:</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {['{merchant_name}', '{order_id}', '{amount_formatted}', '{customer_name}', '{paid_at}'].map(chip => (
                      <button 
                        key={chip} 
                        type="button" 
                        className="text-[10px] font-mono bg-slate-100 hover:bg-sky-100 dark:bg-zinc-800 dark:hover:bg-sky-950 text-slate-700 dark:text-zinc-300 hover:text-sky-700 dark:hover:text-sky-400 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 transition-colors btn-insert-chip"
                        data-target="notif-dc-template"
                        data-chip={chip}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <textarea 
                    id="notif-dc-template" 
                    rows={3}
                    placeholder="Leave empty to use standard rich embed card"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-xs font-mono text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button 
                    type="button" 
                    id="btn-test-discord" 
                    className="w-full py-2 px-3 rounded-lg border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 bg-sky-50/50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-950/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    Send Discord Test Webhook
                  </button>
                </div>
              </div>
            </div>

            {/* TAB 3: WHATSAPP GOWA (Aldinokemal) */}
            <div id="tab-panel-whatsapp" className="space-y-4 notif-tab-panel hidden">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 block">WhatsApp Alerts (GOWA)</span>
                  <span className="text-[11px] text-slate-500">Integrate with Go WhatsApp Multi-Device HTTP API (Aldinokemal)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="notif-wa-enabled" className="sr-only peer" />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="notif-wa-url" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">GOWA API Base URL</label>
                    <input 
                      type="url" 
                      id="notif-wa-url" 
                      placeholder="http://127.0.0.1:3000"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="notif-wa-recipient" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Target Phone / Group JID</label>
                    <input 
                      type="text" 
                      id="notif-wa-recipient" 
                      placeholder="628123456789 or 120363xxx@g.us"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="notif-wa-authtype" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Auth Scheme</label>
                    <select 
                      id="notif-wa-authtype" 
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="NONE">No Authentication</option>
                      <option value="BEARER">Bearer Token</option>
                      <option value="BASIC">Basic Auth (user:pass)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="notif-wa-authkey" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Auth Key / Token (Optional)</label>
                    <input 
                      type="password" 
                      id="notif-wa-authkey" 
                      placeholder="Enter API token or credentials"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="notif-wa-template" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Custom WhatsApp Template</label>
                    <span className="text-[10px] text-slate-400">Click variable:</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {['{merchant_name}', '{order_id}', '{amount_formatted}', '{customer_name}', '{paid_at}'].map(chip => (
                      <button 
                        key={chip} 
                        type="button" 
                        className="text-[10px] font-mono bg-slate-100 hover:bg-sky-100 dark:bg-zinc-800 dark:hover:bg-sky-950 text-slate-700 dark:text-zinc-300 hover:text-sky-700 dark:hover:text-sky-400 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 transition-colors btn-insert-chip"
                        data-target="notif-wa-template"
                        data-chip={chip}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <textarea 
                    id="notif-wa-template" 
                    rows={4}
                    placeholder="Leave empty to use clean default WhatsApp message"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-xs font-mono text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button 
                    type="button" 
                    id="btn-test-whatsapp" 
                    className="w-full py-2 px-3 rounded-lg border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 bg-sky-50/50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-950/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    Send WhatsApp Test Message
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/30 flex gap-3">
            <button 
              type="button" 
              className="flex-grow h-10 inline-flex items-center justify-center border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold px-4 rounded-lg transition-colors sheet-close-trigger"
            >
              Cancel
            </button>
            <button 
              id="btn-save-notifications" 
              type="button" 
              className="flex-grow h-10 inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 rounded-lg transition-all shadow-sm"
            >
              Save Notification Settings
            </button>
          </div>
        </div>
      </div>

      {/* C. EDIT MERCHANT DETAILS SHEET */}
      <div id="sheet-edit-merchant" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-lg h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto my-3 md:hidden"></div>
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <h3 className="font-bold text-xl text-slate-900 dark:text-zinc-50">Edit Merchant Details</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" aria-label="Close panel">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <form id="edit-merchant-form" method="POST" action="" encType="multipart/form-data" className="flex-grow flex flex-col justify-between overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label htmlFor="edit-merchant-name" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Store / Merchant Name</label>
                <input type="text" id="edit-merchant-name" name="name" required className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              <div>
                <label htmlFor="edit-merchant-phone" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Registered Phone</label>
                <input type="tel" id="edit-merchant-phone" name="phone_number" required className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              <div>
                <label htmlFor="edit-merchant-qris-payload" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Static QRIS Payload</label>
                <textarea id="edit-merchant-qris-payload" name="qris_payload" rows={3} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-xs font-mono text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none"></textarea>
              </div>
              <div>
                <label htmlFor="edit-qris-file-input" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Replace QRIS Image</label>
                <input type="file" id="edit-qris-file-input" name="qris_image" accept="image/*" className="w-full text-xs text-slate-500" />
                <span id="edit-file-name-preview" className="text-[10px] text-slate-400 mt-1 block">Leave empty to keep existing image</span>
              </div>
              <div>
                <label htmlFor="edit-logo-file-input" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Replace Brand Logo</label>
                <input type="file" id="edit-logo-file-input" name="logo_image" accept="image/*" className="w-full text-xs text-slate-500" />
                <span id="edit-logo-name-preview" className="text-[10px] text-slate-400 mt-1 block">Leave empty to keep existing logo</span>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/30 flex gap-3">
              <button type="button" className="flex-grow h-10 inline-flex items-center justify-center border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold rounded-lg sheet-close-trigger">Cancel</button>
              <button type="submit" className="flex-grow h-10 inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm">Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      {/* D. ADD MERCHANT SHEET */}
      <div id="sheet-add-merchant" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-lg h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto my-3 md:hidden"></div>
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <h3 className="font-bold text-xl text-slate-900 dark:text-zinc-50">Connect QRIS Merchant</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" aria-label="Close panel">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <form method="POST" action="/api/v1/merchants" encType="multipart/form-data" className="flex-grow flex flex-col justify-between overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label htmlFor="add-merchant-name" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Store / Merchant Name</label>
                <input type="text" id="add-merchant-name" name="name" required placeholder="e.g. Resto Cabang Surabaya" className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              <div>
                <label htmlFor="add-merchant-phone" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Registered WhatsApp Phone</label>
                <input type="tel" id="add-merchant-phone" name="phone_number" required placeholder="08123456789" className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              <div>
                <label htmlFor="add-qris-file-input" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Upload Static QRIS Image</label>
                <input type="file" id="add-qris-file-input" name="qris_image" required accept="image/*" className="w-full text-xs text-slate-500" />
              </div>
              <div>
                <label htmlFor="add-logo-file-input" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Upload Store Logo (Optional)</label>
                <input type="file" id="add-logo-file-input" name="logo_image" accept="image/*" className="w-full text-xs text-slate-500" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/30 flex gap-3">
              <button type="button" className="flex-grow h-10 inline-flex items-center justify-center border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold rounded-lg sheet-close-trigger">Cancel</button>
              <button type="submit" className="flex-grow h-10 inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm">Save & Connect</button>
            </div>
          </form>
        </div>
      </div>

      {/* E. OTP DIALOG SHEET */}
      <div id="sheet-otp" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-md h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto my-3 md:hidden"></div>
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <h3 className="font-bold text-xl text-slate-900 dark:text-zinc-50">Two-Factor OTP Sync</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" aria-label="Close panel">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6 flex-grow space-y-4">
            <p className="text-xs text-slate-500">Enter the 4-digit verification code sent to your registered WhatsApp.</p>
            <div className="flex gap-2 justify-center py-4">
              <input type="text" id="otp-input-code" maxLength={4} placeholder="1234" className="w-36 text-center text-2xl font-bold tracking-widest bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg py-2 text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-sky-500 outline-none" />
            </div>
            <button id="btn-submit-otp" className="w-full h-10 inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm">Verify OTP</button>
          </div>
        </div>
      </div>

      {/* F. DISCONNECT SHEET */}
      <div id="sheet-confirm-disconnect" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-md h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <h3 className="font-bold text-xl text-slate-900 dark:text-zinc-50">Disconnect Account</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6 flex-grow space-y-4">
            <p className="text-xs text-slate-500">Are you sure you want to disconnect this store account session?</p>
          </div>
          <div className="p-6 border-t border-slate-100 dark:border-zinc-800/60 flex gap-3">
            <button className="flex-grow h-10 border rounded-lg text-xs font-semibold sheet-close-trigger">Cancel</button>
            <button id="btn-confirm-disconnect-submit" className="flex-grow h-10 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold">Disconnect</button>
          </div>
        </div>
      </div>

      {/* G. DELETE SHEET */}
      <div id="sheet-confirm-delete" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-md h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <h3 className="font-bold text-xl text-slate-900 dark:text-zinc-50">Permanently Delete Store</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6 flex-grow space-y-4">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/60 rounded-xl p-4 text-xs text-red-800 dark:text-red-400 leading-relaxed">
              <p className="font-bold">Permanently Delete Store?</p>
              <p className="mt-1">This will permanently delete <span id="delete-merchant-name-warning" className="font-bold"></span> and all associated transaction history.</p>
            </div>
            <div>
              <label htmlFor="confirm-delete-merchant-text" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Please type <span id="delete-merchant-target-match" className="font-bold font-mono text-red-600 dark:text-red-400"></span> to confirm
              </label>
              <input type="text" id="confirm-delete-merchant-text" className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 mt-1 font-mono focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 dark:border-zinc-800/60 flex gap-3">
            <button className="flex-grow h-10 border rounded-lg text-xs font-semibold sheet-close-trigger">Cancel</button>
            <button id="btn-confirm-delete-submit" disabled className="flex-grow h-10 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold">Permanently Delete</button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CLIENT INTERACTION SCRIPT */}
      {/* ========================================================================= */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Sheets Helpers
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

            document.querySelectorAll('.sheet-close-trigger').forEach(el => {
              el.addEventListener('click', function(e) {
                const sheet = e.target.closest('[role="dialog"]');
                if (sheet) closeSheet(sheet.id);
              });
            });

            // Dropdowns
            document.querySelectorAll('.btn-dropdown-trigger').forEach(btn => {
              btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const menu = this.nextElementSibling;
                document.querySelectorAll('.dropdown-menu').forEach(m => {
                  if (m !== menu) m.classList.add('hidden');
                });
                if (menu) menu.classList.toggle('hidden');
              });
            });
            document.addEventListener('click', () => {
              document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
            });

            // Zoom
            document.querySelectorAll('.btn-zoom-qris').forEach(btn => {
              btn.addEventListener('click', function() {
                const imgUrl = this.getAttribute('data-img');
                const name = this.getAttribute('data-name');
                const zoomImg = document.getElementById('zoom-image');
                const zoomTitle = document.getElementById('zoom-title');
                if (zoomImg) zoomImg.src = imgUrl;
                if (zoomTitle) zoomTitle.textContent = "QRIS Code: " + name;
                openSheet('sheet-zoom');
              });
            });

            // Add Merchant
            const addBtn = document.getElementById('btn-add-merchant');
            const addBtnEmpty = document.getElementById('btn-add-merchant-empty');
            if (addBtn) addBtn.addEventListener('click', () => openSheet('sheet-add-merchant'));
            if (addBtnEmpty) addBtnEmpty.addEventListener('click', () => openSheet('sheet-add-merchant'));

            // Auth OTP
            let currentOtpMerchantId = null;
            document.querySelectorAll('.btn-auth-otp').forEach(btn => {
              btn.addEventListener('click', async function() {
                currentOtpMerchantId = this.getAttribute('data-id');
                const phone = this.getAttribute('data-phone');
                this.textContent = 'Sending OTP...';
                try {
                  const res = await fetch('/api/v1/merchants/' + currentOtpMerchantId + '/otp', { method: 'POST' });
                  const data = await res.json();
                  this.textContent = 'Auth OTP';
                  if (data.success) {
                    openSheet('sheet-otp');
                    window.showToast({ type: 'info', title: 'OTP Sent', message: 'Verification code sent to ' + phone });
                  } else {
                    window.showToast({ type: 'error', title: 'OTP Trigger Failed', message: data.error || 'Failed to trigger OTP.' });
                  }
                } catch(e) {
                  this.textContent = 'Auth OTP';
                  window.showToast({ type: 'error', title: 'Network Error', message: 'Network error sending OTP.' });
                }
              });
            });

            const btnSubmitOtp = document.getElementById('btn-submit-otp');
            if (btnSubmitOtp) {
              btnSubmitOtp.addEventListener('click', async function() {
                const code = document.getElementById('otp-input-code')?.value;
                if (!code || code.length !== 4) {
                  window.showToast({ type: 'warning', title: 'Invalid OTP', message: 'Please enter a valid 4-digit OTP code.' });
                  return;
                }
                this.textContent = 'Verifying...';
                try {
                  const res = await fetch('/api/v1/merchants/' + currentOtpMerchantId + '/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ otp: code })
                  });
                  const data = await res.json();
                  this.textContent = 'Verify OTP';
                  if (data.success) {
                    closeSheet('sheet-otp');
                    window.showToast({ type: 'success', title: 'Authenticated', message: 'Store successfully authenticated and listener started!' });
                    setTimeout(() => window.location.reload(), 1000);
                  } else {
                    window.showToast({ type: 'error', title: 'Verification Failed', message: data.error || 'OTP verification failed.' });
                  }
                } catch(e) {
                  this.textContent = 'Verify OTP';
                  window.showToast({ type: 'error', title: 'Network Error', message: 'Network error verifying OTP.' });
                }
              });
            }

            // Pause Worker
            document.querySelectorAll('.btn-pause-worker').forEach(btn => {
              btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                const isActive = this.getAttribute('data-active') === 'true';
                const endpoint = isActive ? '/api/v1/merchants/' + id + '/stop' : '/api/v1/merchants/' + id + '/start';
                try {
                  const res = await fetch(endpoint, { method: 'POST' });
                  const data = await res.json();
                  if (data.success) {
                    window.showToast({ type: 'success', title: 'Worker Updated', message: isActive ? 'Worker listener paused.' : 'Worker listener resumed.' });
                    setTimeout(() => window.location.reload(), 800);
                  } else {
                    window.showToast({ type: 'error', title: 'Action Failed', message: data.error || 'Operation failed' });
                  }
                } catch(e) {
                  window.showToast({ type: 'error', title: 'Network Error', message: 'Network error communicating with worker.' });
                }
              });
            });

            // Disconnect & Delete
            let targetDisconnectId = null;
            document.querySelectorAll('.btn-disconnect-merchant').forEach(btn => {
              btn.addEventListener('click', function(e) {
                e.stopPropagation();
                targetDisconnectId = this.getAttribute('data-id');
                openSheet('sheet-confirm-disconnect');
              });
            });
            const btnConfirmDisconnectSubmit = document.getElementById('btn-confirm-disconnect-submit');
            if (btnConfirmDisconnectSubmit) {
              btnConfirmDisconnectSubmit.addEventListener('click', async function() {
                if (!targetDisconnectId) return;
                try {
                  const res = await fetch('/api/v1/merchants/' + targetDisconnectId + '/disconnect', { method: 'POST' });
                  const data = await res.json();
                  if (data.success) {
                    closeSheet('sheet-confirm-disconnect');
                    window.showToast({ type: 'success', title: 'Disconnected', message: 'Merchant session disconnected successfully.' });
                    setTimeout(() => window.location.reload(), 1000);
                  } else {
                    window.showToast({ type: 'error', title: 'Disconnect Failed', message: data.error || 'Disconnect failed' });
                  }
                } catch(e) { 
                  window.showToast({ type: 'error', title: 'Network Error', message: 'Network error disconnecting account.' });
                }
              });
            }

            let targetDeleteId = null;
            let targetDeleteName = '';
            const confirmDeleteText = document.getElementById('confirm-delete-merchant-text');
            const btnConfirmDeleteSubmit = document.getElementById('btn-confirm-delete-submit');

            document.querySelectorAll('.btn-delete-merchant').forEach(btn => {
              btn.addEventListener('click', function(e) {
                e.stopPropagation();
                targetDeleteId = this.getAttribute('data-id');
                targetDeleteName = this.getAttribute('data-name');
                const warningDisplay = document.getElementById('delete-merchant-name-warning');
                const matchDisplay = document.getElementById('delete-merchant-target-match');
                if (warningDisplay) warningDisplay.textContent = '"' + targetDeleteName + '"';
                if (matchDisplay) matchDisplay.textContent = 'DELETE ' + targetDeleteName;
                if (confirmDeleteText) confirmDeleteText.value = '';
                if (btnConfirmDeleteSubmit) btnConfirmDeleteSubmit.disabled = true;
                openSheet('sheet-confirm-delete');
              });
            });
            if (confirmDeleteText && btnConfirmDeleteSubmit) {
              confirmDeleteText.addEventListener('input', function() {
                btnConfirmDeleteSubmit.disabled = (this.value !== 'DELETE ' + targetDeleteName);
              });
            }
            if (btnConfirmDeleteSubmit) {
              btnConfirmDeleteSubmit.addEventListener('click', async function() {
                if (!targetDeleteId) return;
                try {
                  const res = await fetch('/api/v1/merchants/' + targetDeleteId, { method: 'DELETE' });
                  const data = await res.json();
                  if (data.success) {
                    closeSheet('sheet-confirm-delete');
                    window.showToast({ type: 'success', title: 'Merchant Deleted', message: 'Merchant store deleted successfully.' });
                    setTimeout(() => window.location.reload(), 1000);
                  } else {
                    window.showToast({ type: 'error', title: 'Delete Failed', message: data.error || 'Delete failed' });
                  }
                } catch(e) { 
                  window.showToast({ type: 'error', title: 'Network Error', message: 'Network error deleting merchant.' });
                }
              });
            }

            // Edit Merchant
            document.querySelectorAll('.btn-edit-merchant').forEach(btn => {
              btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                const name = this.getAttribute('data-name');
                const phone = this.getAttribute('data-phone');
                const payload = this.getAttribute('data-payload') || '';
                const form = document.getElementById('edit-merchant-form');
                if (form) form.action = '/api/v1/merchants/' + id + '/edit';
                const editName = document.getElementById('edit-merchant-name');
                const editPhone = document.getElementById('edit-merchant-phone');
                const editPayload = document.getElementById('edit-merchant-qris-payload');
                if (editName) editName.value = name;
                if (editPhone) editPhone.value = phone;
                if (editPayload) editPayload.value = payload;
                openSheet('sheet-edit-merchant');
              });
            });

            // =========================================================================
            // MULTI-CHANNEL STORE NOTIFICATIONS LOGIC (v1.1.0)
            // =========================================================================
            let currentNotifMerchantId = null;
            let currentNotifMerchantName = '';

            // Feedback helper
            function showNotifFeedback(type, text) {
              const box = document.getElementById('notif-feedback-box');
              const icon = document.getElementById('notif-feedback-icon');
              const msg = document.getElementById('notif-feedback-text');
              if (!box || !icon || !msg) return;

              box.className = 'p-3.5 rounded-xl text-xs flex items-start gap-2.5 ' + (
                type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/60'
              );
              icon.innerHTML = type === 'success' 
                ? '<svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>'
                : '<svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>';
              msg.textContent = text;
              box.classList.remove('hidden');
            }

            function hideNotifFeedback() {
              const box = document.getElementById('notif-feedback-box');
              if (box) box.classList.add('hidden');
            }

            // Notification Modal Open
            document.querySelectorAll('.btn-notif-merchant').forEach(btn => {
              btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                currentNotifMerchantId = this.getAttribute('data-id');
                currentNotifMerchantName = this.getAttribute('data-name');
                
                const titleName = document.getElementById('notif-modal-merchant-name');
                if (titleName) titleName.textContent = currentNotifMerchantName;

                const loadingEl = document.getElementById('notif-loading');
                const contentEl = document.getElementById('notif-content');
                if (loadingEl) loadingEl.classList.remove('hidden');
                if (contentEl) contentEl.classList.add('hidden');
                hideNotifFeedback();

                openSheet('sheet-notifications');

                try {
                  const res = await fetch('/api/v1/merchants/' + currentNotifMerchantId + '/notifications');
                  const json = await res.json();
                  const data = json.config || {};

                  // Populate Telegram
                  document.getElementById('notif-tg-enabled').checked = !!data.telegramEnabled;
                  document.getElementById('notif-tg-token').value = data.telegramBotToken || '';
                  document.getElementById('notif-tg-chatid').value = data.telegramChatId || '';
                  document.getElementById('notif-tg-template').value = data.telegramTemplate || '';

                  // Populate Discord
                  document.getElementById('notif-dc-enabled').checked = !!data.discordEnabled;
                  document.getElementById('notif-dc-url').value = data.discordWebhookUrl || '';
                  document.getElementById('notif-dc-template').value = data.discordTemplate || '';

                  // Populate WhatsApp GOWA
                  document.getElementById('notif-wa-enabled').checked = !!data.whatsappEnabled;
                  document.getElementById('notif-wa-url').value = data.whatsappApiUrl || '';
                  document.getElementById('notif-wa-authtype').value = data.whatsappAuthType || 'NONE';
                  document.getElementById('notif-wa-authkey').value = data.whatsappAuthKey || '';
                  document.getElementById('notif-wa-recipient').value = data.whatsappRecipient || '';
                  document.getElementById('notif-wa-template').value = data.whatsappTemplate || '';

                  if (loadingEl) loadingEl.classList.add('hidden');
                  if (contentEl) contentEl.classList.remove('hidden');
                } catch(e) {
                  if (loadingEl) loadingEl.classList.add('hidden');
                  if (contentEl) contentEl.classList.remove('hidden');
                  showNotifFeedback('error', 'Failed to load notifications from server.');
                }
              });
            });

            // Tab Switching inside Notifications Modal
            document.querySelectorAll('.notif-tab-btn').forEach(tabBtn => {
              tabBtn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-tab');
                document.querySelectorAll('.notif-tab-btn').forEach(btn => {
                  btn.className = 'flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 notif-tab-btn';
                });
                this.className = 'flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-sm notif-tab-btn';
                
                document.querySelectorAll('.notif-tab-panel').forEach(panel => {
                  if (panel.id === targetId) panel.classList.remove('hidden');
                  else panel.classList.add('hidden');
                });
              });
            });

            // Variable Chip Insertion
            document.querySelectorAll('.btn-insert-chip').forEach(chipBtn => {
              chipBtn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const chip = this.getAttribute('data-chip');
                const textarea = document.getElementById(targetId);
                if (textarea && chip) {
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const val = textarea.value;
                  textarea.value = val.substring(0, start) + chip + val.substring(end);
                  textarea.focus();
                  textarea.selectionStart = textarea.selectionEnd = start + chip.length;
                }
              });
            });

            // Test Handlers
            async function triggerChannelTest(channel, payload, btn) {
              const originalHtml = btn.innerHTML;
              btn.disabled = true;
              btn.innerHTML = '<div class="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div> Sending test...';
              hideNotifFeedback();

              try {
                const res = await fetch('/api/v1/merchants/' + currentNotifMerchantId + '/notifications/test', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ channel, merchantName: currentNotifMerchantName, config: payload })
                });
                const json = await res.json();
                btn.disabled = false;
                btn.innerHTML = originalHtml;

                if (json.success) {
                  showNotifFeedback('success', json.message || 'Test message sent successfully!');
                } else {
                  showNotifFeedback('error', json.error || json.message || 'Test message delivery failed.');
                }
              } catch(e) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
                showNotifFeedback('error', 'Network error triggering notification test.');
              }
            }

            document.getElementById('btn-test-telegram')?.addEventListener('click', function() {
              triggerChannelTest('telegram', {
                botToken: document.getElementById('notif-tg-token')?.value,
                chatId: document.getElementById('notif-tg-chatid')?.value,
                template: document.getElementById('notif-tg-template')?.value,
              }, this);
            });

            document.getElementById('btn-test-discord')?.addEventListener('click', function() {
              triggerChannelTest('discord', {
                webhookUrl: document.getElementById('notif-dc-url')?.value,
                template: document.getElementById('notif-dc-template')?.value,
              }, this);
            });

            document.getElementById('btn-test-whatsapp')?.addEventListener('click', function() {
              triggerChannelTest('whatsapp', {
                apiUrl: document.getElementById('notif-wa-url')?.value,
                authType: document.getElementById('notif-wa-authtype')?.value,
                authKey: document.getElementById('notif-wa-authkey')?.value,
                recipient: document.getElementById('notif-wa-recipient')?.value,
                template: document.getElementById('notif-wa-template')?.value,
              }, this);
            });

            // Save Notification Settings
            document.getElementById('btn-save-notifications')?.addEventListener('click', async function() {
              this.disabled = true;
              this.textContent = 'Saving settings...';
              hideNotifFeedback();

              const payload = {
                telegramEnabled: document.getElementById('notif-tg-enabled')?.checked,
                telegramBotToken: document.getElementById('notif-tg-token')?.value,
                telegramChatId: document.getElementById('notif-tg-chatid')?.value,
                telegramTemplate: document.getElementById('notif-tg-template')?.value,

                discordEnabled: document.getElementById('notif-dc-enabled')?.checked,
                discordWebhookUrl: document.getElementById('notif-dc-url')?.value,
                discordTemplate: document.getElementById('notif-dc-template')?.value,

                whatsappEnabled: document.getElementById('notif-wa-enabled')?.checked,
                whatsappApiUrl: document.getElementById('notif-wa-url')?.value,
                whatsappAuthType: document.getElementById('notif-wa-authtype')?.value,
                whatsappAuthKey: document.getElementById('notif-wa-authkey')?.value,
                whatsappRecipient: document.getElementById('notif-wa-recipient')?.value,
                whatsappTemplate: document.getElementById('notif-wa-template')?.value,
              };

              try {
                const res = await fetch('/api/v1/merchants/' + currentNotifMerchantId + '/notifications', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                const json = await res.json();
                this.disabled = false;
                this.textContent = 'Save Notification Settings';

                if (json.success) {
                  showNotifFeedback('success', 'Notification settings saved successfully!');
                  setTimeout(() => closeSheet('sheet-notifications'), 1200);
                } else {
                  showNotifFeedback('error', json.error || 'Failed to save settings.');
                }
              } catch(e) {
                this.disabled = false;
                this.textContent = 'Save Notification Settings';
                showNotifFeedback('error', 'Network error saving notification settings.');
              }
            });

            // =========================================================================
            // STORE CARDS SEARCH & PAGINATION CONTROLLER
            // =========================================================================
            const merchantSearchInput = document.getElementById('merchant-filter-search');
            const merchantStatusSelect = document.getElementById('merchant-filter-status');
            const merchantEmptySearch = document.getElementById('merchant-empty-search');
            const merchantPageSizeSelect = document.getElementById('merchants-page-size');
            const merchantPaginationInfo = document.getElementById('merchants-pagination-info');
            const merchantBtnPrev = document.getElementById('merchants-btn-prev');
            const merchantBtnNext = document.getElementById('merchants-btn-next');
            const merchantPageNumbers = document.getElementById('merchants-page-numbers');

            let mCurrentPage = 1;
            let mPageSize = 6;
            let mFilteredCards = [];

            function updateMerchantPagination() {
              const total = mFilteredCards.length;
              const totalPages = Math.max(1, Math.ceil(total / mPageSize));
              if (mCurrentPage > totalPages) mCurrentPage = totalPages;
              if (mCurrentPage < 1) mCurrentPage = 1;

              const startIdx = (mCurrentPage - 1) * mPageSize;
              const endIdx = Math.min(startIdx + mPageSize, total);

              mFilteredCards.forEach((card, index) => {
                if (index >= startIdx && index < endIdx) {
                  card.classList.remove('hidden');
                } else {
                  card.classList.add('hidden');
                }
              });

              if (merchantPaginationInfo) {
                if (total === 0) {
                  merchantPaginationInfo.textContent = 'Showing 0 stores';
                } else {
                  merchantPaginationInfo.textContent = 'Showing ' + (startIdx + 1) + ' to ' + endIdx + ' of ' + total + ' stores';
                }
              }

              if (merchantBtnPrev) merchantBtnPrev.disabled = mCurrentPage <= 1;
              if (merchantBtnNext) merchantBtnNext.disabled = mCurrentPage >= totalPages;

              if (merchantPageNumbers) {
                merchantPageNumbers.innerHTML = '';
                for (let p = 1; p <= totalPages; p++) {
                  const pBtn = document.createElement('button');
                  pBtn.className = 'px-2.5 py-1 rounded text-xs font-semibold transition-colors ' + 
                    (p === mCurrentPage ? 'bg-sky-600 text-white' : 'border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800');
                  pBtn.textContent = p;
                  pBtn.addEventListener('click', () => {
                    mCurrentPage = p;
                    updateMerchantPagination();
                  });
                  merchantPageNumbers.appendChild(pBtn);
                }
              }
            }

            function filterMerchantCards() {
              const query = (merchantSearchInput ? merchantSearchInput.value : '').toLowerCase().trim();
              const status = merchantStatusSelect ? merchantStatusSelect.value : 'ALL';
              const allCards = Array.from(document.querySelectorAll('.merchant-card'));

              allCards.forEach(c => c.classList.add('hidden'));
              mFilteredCards = [];

              allCards.forEach(card => {
                const name = card.getAttribute('data-name') || '';
                const phone = card.getAttribute('data-phone') || '';
                const cardStatus = card.getAttribute('data-status') || '';

                const matchesQuery = name.includes(query) || phone.includes(query);
                const matchesStatus = status === 'ALL' || cardStatus === status;

                if (matchesQuery && matchesStatus) {
                  mFilteredCards.push(card);
                }
              });

              if (mFilteredCards.length === 0 && allCards.length > 0) {
                if (merchantEmptySearch) merchantEmptySearch.classList.remove('hidden');
              } else {
                if (merchantEmptySearch) merchantEmptySearch.classList.add('hidden');
              }

              mCurrentPage = 1;
              updateMerchantPagination();
            }

            if (merchantSearchInput) merchantSearchInput.addEventListener('input', filterMerchantCards);
            if (merchantStatusSelect) merchantStatusSelect.addEventListener('change', filterMerchantCards);
            if (merchantPageSizeSelect) {
              merchantPageSizeSelect.addEventListener('change', function() {
                mPageSize = parseInt(this.value, 10) || 6;
                mCurrentPage = 1;
                updateMerchantPagination();
              });
            }
            if (merchantBtnPrev) {
              merchantBtnPrev.addEventListener('click', function() {
                if (mCurrentPage > 1) {
                  mCurrentPage--;
                  updateMerchantPagination();
                }
              });
            }
            if (merchantBtnNext) {
              merchantBtnNext.addEventListener('click', function() {
                mCurrentPage++;
                updateMerchantPagination();
              });
            }

            filterMerchantCards();

          })();
        `
      }} />

    </Layout>
  );
}
