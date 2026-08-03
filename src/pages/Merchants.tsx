import React from 'react';
import { Layout } from '../components/Layout.tsx';

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
}

export function MerchantsPage({ merchants, currentUser }: MerchantsPageProps) {
  return (
    <Layout activePath="/merchants" user={currentUser}>
      
      {/* ========================================================================= */}
      {/* 1. HEADER SECTION */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
            Multi-Merchant Manager
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage your GoBiz accounts, track session health, and connect dynamic QRIS feeds.
          </p>
        </div>
        <button 
          id="btn-add-merchant"
          className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 w-full sm:w-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add QRIS Merchant
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. MERCHANTS GRID */}
      {/* ========================================================================= */}
      {merchants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-lg mx-auto text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">No Merchants Connected</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 max-w-xs">
            Start by connecting a GoBiz merchant account to begin intercepting dynamic transactions.
          </p>
          <button 
            id="btn-add-merchant-empty"
            className="mt-5 inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Connect First Merchant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {merchants.map((merchant) => {
            const isSynced = merchant.status === 'ACTIVE';
            const isSyncing = merchant.status === 'NEEDS_OTP';
            
            return (
              <div 
                key={merchant.id}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition-all group"
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
                      GoBiz
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
      )}

      {/* ========================================================================= */}
      {/* 3. SHEETS & DRAWER PANELS */}
      {/* ========================================================================= */}

      {/* A. ZOOM QRIS CODE SHEET */}
      <div id="sheet-zoom" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        
        {/* Sheet Panel */}
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-md h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto my-3 md:hidden"></div>

          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <div>
              <h3 id="zoom-title" className="font-bold text-xl text-slate-900 dark:text-zinc-50">QRIS Merchant Code</h3>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" aria-label="Close panel">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-6 flex-grow overflow-y-auto flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950/30">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-md w-full max-w-[320px] aspect-square flex items-center justify-center">
              <img id="zoom-image" src="" alt="Zoomed QRIS Code" className="max-h-full max-w-full object-contain" />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-4 text-center">Scan this static code using any dynamic QRIS compatible e-wallet/bank.</p>
          </div>
        </div>
      </div>

      {/* B. EDIT MERCHANT DETAILS SHEET */}
      <div id="sheet-edit-merchant" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-md h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto my-3 md:hidden"></div>

          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-zinc-50">Edit Merchant Details</h3>
              <p className="text-xs text-slate-500 mt-1">Modify registered data and static QRIS parameters.</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" aria-label="Close panel">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form id="edit-merchant-form" action="" method="POST" className="flex flex-col flex-grow overflow-hidden" encType="multipart/form-data">
            <div className="p-6 flex-grow overflow-y-auto space-y-4">
              {/* Merchant Title */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-merchant-name" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Merchant / Store Title
                </label>
                <input 
                  type="text" 
                  id="edit-merchant-name" 
                  name="name" 
                  required 
                  placeholder="e.g. Warung Kopi Mojokerto"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
                />
              </div>

              {/* GoBiz Registered Phone */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-merchant-phone" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  GoBiz Registered Phone (WhatsApp OTP Target)
                </label>
                <input 
                  type="tel" 
                  id="edit-merchant-phone" 
                  name="phoneNumber" 
                  required 
                  placeholder="e.g. 081234567890"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
                />
              </div>

              {/* File dropzone for QRIS Image */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Upload New Static QRIS QR Image (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors relative cursor-pointer group">
                  <input 
                    type="file" 
                    name="qrisImage" 
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    id="edit-qris-file-input"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-slate-400 dark:text-zinc-500 group-hover:text-sky-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-xs text-slate-600 dark:text-zinc-300 font-medium">Click to upload new QR or drag here</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500" id="edit-file-name-preview">Leave empty to keep existing image</span>
                  </div>
                </div>
              </div>

              {/* File dropzone for Merchant Logo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Upload Merchant Logo (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors relative cursor-pointer group">
                  <input 
                    type="file" 
                    name="logoImage" 
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    id="edit-logo-file-input"
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <svg className="w-6 h-6 text-slate-400 dark:text-zinc-500 group-hover:text-sky-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-xs text-slate-600 dark:text-zinc-300 font-medium">Click to upload logo image</span>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500" id="edit-logo-name-preview">PNG or JPG up to 2MB</span>
                  </div>
                </div>
              </div>

              {/* Raw Static QRIS Payload */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-merchant-qris-payload" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Raw Static QRIS Payload (Optional - Autodetected)
                </label>
                <textarea 
                  id="edit-merchant-qris-payload" 
                  name="qrisPayload" 
                  rows={2}
                  placeholder="Optional. Automatically extracted if you upload a new image."
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all font-mono text-[11px] resize-none"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/30 flex gap-3">
              <button 
                type="button" 
                className="flex-grow h-10 inline-flex items-center justify-center border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold px-4 rounded-lg transition-colors sheet-close-trigger cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-grow h-10 inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 rounded-lg transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* C. CONNECT QRIS MERCHANT (ADD) SHEET */}
      <div id="sheet-add-merchant" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-md h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto my-3 md:hidden"></div>

          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-zinc-50">Connect QRIS Merchant</h3>
              <p className="text-xs text-slate-500 mt-1">Add a new GoBiz account to synchronize mutations.</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" aria-label="Close panel">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form action="/api/v1/merchants" method="POST" className="flex flex-col flex-grow overflow-hidden" encType="multipart/form-data">
            <div className="p-6 flex-grow overflow-y-auto space-y-4">
              {/* Merchant Title */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="merchant-name" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Merchant / Store Title
                </label>
                <input 
                  type="text" 
                  id="merchant-name" 
                  name="name" 
                  required 
                  placeholder="e.g. Toko Cabang Surabaya"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
                />
              </div>

              {/* GoBiz Registered Phone */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="merchant-phone" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  GoBiz Registered Phone (WhatsApp OTP Target)
                </label>
                <input 
                  type="tel" 
                  id="merchant-phone" 
                  name="phoneNumber" 
                  required 
                  placeholder="e.g. 081234567890"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
                />
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">Must include the active WhatsApp account number for OTP delivery.</span>
              </div>

              {/* File dropzone for QRIS Image */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Upload Static QRIS QR Image
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors relative cursor-pointer group">
                  <input 
                    type="file" 
                    name="qrisImage" 
                    accept="image/*"
                    required 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    id="qris-file-input"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-slate-400 dark:text-zinc-500 group-hover:text-sky-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-xs text-slate-600 dark:text-zinc-300 font-medium">Click to upload or drag image here</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500" id="file-name-preview">PNG, JPG or SVG up to 5MB</span>
                  </div>
                </div>
              </div>

              {/* File dropzone for Merchant Logo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Upload Merchant Logo (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors relative cursor-pointer group">
                  <input 
                    type="file" 
                    name="logoImage" 
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    id="logo-file-input"
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <svg className="w-6 h-6 text-slate-400 dark:text-zinc-500 group-hover:text-sky-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-xs text-slate-600 dark:text-zinc-300 font-medium">Click to upload logo image</span>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500" id="logo-name-preview">PNG or JPG up to 2MB</span>
                  </div>
                </div>
              </div>

              {/* Raw Static QRIS Payload */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="merchant-qris-payload" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Raw Static QRIS Payload (Optional)
                </label>
                <textarea 
                  id="merchant-qris-payload" 
                  name="qrisPayload" 
                  rows={2}
                  placeholder="Optional. Decoded automatically from QR image if left empty."
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all font-mono text-[11px] resize-none"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/30 flex gap-3">
              <button 
                type="button" 
                className="flex-grow h-10 inline-flex items-center justify-center border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold px-4 rounded-lg transition-colors sheet-close-trigger cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-grow h-10 inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 rounded-lg transition-colors cursor-pointer"
              >
                Proceed to Auth
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* D. OTP AUTHENTICATION SHEET */}
      <div id="sheet-otp" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-md h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto my-3 md:hidden"></div>

          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-zinc-50">GoBiz Verification</h3>
              <p className="text-xs text-slate-500 mt-1">Authenticate session using WhatsApp OTP challenge.</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" aria-label="Close panel">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-6 flex-grow overflow-y-auto space-y-6">
            {/* STEP 1: Phone Trigger */}
            <div id="otp-step-1" className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                We will trigger an OTP session by opening a headless browser on GoBiz portal for your registered phone number.
              </p>
              <div className="flex flex-col gap-1 w-full bg-slate-50 dark:bg-zinc-950/40 p-4 border border-slate-100 dark:border-zinc-800 rounded-xl text-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">TARGET PHONE NUMBER</span>
                <span id="otp-phone-display" className="text-lg font-bold text-slate-800 dark:text-zinc-100 font-mono tracking-wide">0812••••3456</span>
              </div>
              <button 
                id="btn-trigger-otp"
                className="w-full h-11 inline-flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 hover:bg-slate-800 font-semibold text-sm rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
              >
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.176 5.252-.003 11.7-.003c3.128 0 6.07 1.218 8.284 3.432 2.214 2.214 3.43 5.158 3.429 8.277-.005 6.524-5.253 11.703-11.701 11.703-2.005 0-3.974-.512-5.714-1.488L0 24zm6.26-4.577c1.642.975 3.256 1.489 4.904 1.49 5.347 0 9.697-4.237 9.7-9.448.002-2.525-.99-4.901-2.795-6.697C16.32 2.972 13.93 1.98 11.4 1.981 6.05 1.982 1.7 6.22 1.698 11.43c0 1.716.467 3.39 1.353 4.887l-.995 3.635 3.824-.986-.163-.086z"/></svg>
                Send WhatsApp OTP
              </button>
            </div>

            {/* STEP 2: Submit OTP (Initially Hidden) */}
            <div id="otp-step-2" className="space-y-5 hidden">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 rounded-lg p-4 flex gap-3">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="text-xs text-slate-700 dark:text-zinc-300">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-400">OTP Sent successfully!</p>
                  <p className="mt-0.5">Please check WhatsApp message containing the GoBiz verification code.</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="otp-code" className="text-xs font-semibold text-slate-700 dark:text-zinc-300 text-center">
                  ENTER VERIFICATION CODE
                </label>
                <input 
                  type="text" 
                  id="otp-code" 
                  maxLength={6} 
                  required 
                  placeholder="000 000"
                  className="w-full text-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-2xl font-bold tracking-[0.4em] text-slate-900 dark:text-zinc-50 placeholder-slate-300 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all font-mono"
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400">
                <span>Code expires in:</span>
                <span id="otp-timer" className="font-bold text-red-600 dark:text-red-400 font-mono">60s</span>
              </div>

              <button 
                id="btn-verify-otp"
                className="w-full h-11 inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 cursor-pointer"
              >
                Verify & Complete Auth
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* E. CONFIRM DISCONNECT SHEET */}
      <div id="sheet-confirm-disconnect" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-md h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto my-3 md:hidden"></div>

          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-zinc-50">Disconnect Merchant</h3>
              <p className="text-xs text-slate-500 mt-1">Suspend payment listener integration.</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" aria-label="Close panel">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-6 flex-grow overflow-y-auto space-y-4">
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to disconnect <span id="disconnect-merchant-name-display" className="font-bold text-slate-800 dark:text-zinc-200"></span>? This will stop transaction synchronization and clear cookie sessions.
            </p>
          </div>

          <div className="p-6 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/30 flex gap-3">
            <button 
              type="button" 
              className="flex-grow h-10 inline-flex items-center justify-center border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold px-4 rounded-lg transition-colors sheet-close-trigger cursor-pointer"
            >
              Cancel
            </button>
            <button 
              id="btn-confirm-disconnect-submit"
              type="button"
              className="flex-grow h-10 inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold px-4 rounded-lg transition-colors cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* F. CONFIRM DELETE MERCHANT SHEET */}
      <div id="sheet-confirm-delete" className="fixed inset-0 z-50 flex md:items-stretch items-end md:justify-end justify-center opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm sheet-close-trigger cursor-pointer"></div>
        
        <div className="relative bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 md:border-l md:border-t-0 shadow-2xl z-10 w-full md:max-w-md h-auto md:h-full max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-t-none flex flex-col transform transition-transform duration-300 ease-out translate-y-full md:translate-y-0 md:translate-x-full sheet-panel">
          
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto my-3 md:hidden"></div>

          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl text-red-600 dark:text-red-400">Delete Merchant</h3>
              <p className="text-xs text-slate-500 mt-1">This action is highly destructive and irreversible.</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 sheet-close-trigger p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" aria-label="Close panel">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-6 flex-grow overflow-y-auto space-y-6">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/60 rounded-xl p-4 flex gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div className="text-xs text-red-800 dark:text-red-400 leading-relaxed">
                <p className="font-bold">Permanently Delete Store?</p>
                <p className="mt-1">This will permanently delete <span id="delete-merchant-name-warning" className="font-bold"></span>, including all associated transaction history, invoices, mutations, and disconnect the sync bot forever. This action cannot be undone!</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm-delete-merchant-text" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Please type <span id="delete-merchant-target-match" className="font-bold font-mono text-red-600 dark:text-red-400"></span> to confirm
                </label>
                <input 
                  type="text" 
                  id="confirm-delete-merchant-text" 
                  placeholder="Type match text here" 
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-transparent outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/30 flex gap-3">
            <button 
              type="button" 
              className="flex-grow h-10 inline-flex items-center justify-center border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold px-4 rounded-lg transition-colors sheet-close-trigger cursor-pointer"
            >
              Cancel
            </button>
            <button 
              id="btn-confirm-delete-submit"
              type="button"
              disabled
              className="flex-grow h-10 inline-flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 disabled:cursor-not-allowed text-white text-xs font-bold px-4 rounded-lg transition-all cursor-pointer"
            >
              Permanently Delete
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CLIENT INTERACTIVITY SCRIPT */}
      {/* ========================================================================= */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
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

            // Bind all close triggers
            document.querySelectorAll('.sheet-close-trigger').forEach(el => {
              el.addEventListener('click', function(e) {
                const sheet = e.target.closest('[role="dialog"]');
                if (sheet) closeSheet(sheet.id);
              });
            });

            // --- A. Zoom QRIS Dialog ---
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

            // --- B. Add Merchant Modal ---
            const addBtn = document.getElementById('btn-add-merchant');
            const addBtnEmpty = document.getElementById('btn-add-merchant-empty');
            const addFile = document.getElementById('qris-file-input');
            const namePreview = document.getElementById('file-name-preview');

            if (addBtn) addBtn.addEventListener('click', () => openSheet('sheet-add-merchant'));
            if (addBtnEmpty) addBtnEmpty.addEventListener('click', () => openSheet('sheet-add-merchant'));
            
            if (addFile && namePreview) {
              addFile.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                  namePreview.textContent = this.files[0].name + " (" + (this.files[0].size / 1024 / 1024).toFixed(2) + "MB)";
                  namePreview.className = "text-[10px] text-sky-600 dark:text-sky-400 font-semibold";
                }
              });
            }

            // Logo File Preview
            const logoFile = document.getElementById('logo-file-input');
            const logoNamePreview = document.getElementById('logo-name-preview');
            if (logoFile && logoNamePreview) {
              logoFile.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                  logoNamePreview.textContent = this.files[0].name + " (" + (this.files[0].size / 1024 / 1024).toFixed(2) + "MB)";
                  logoNamePreview.className = "text-[10px] text-sky-600 dark:text-sky-400 font-semibold";
                }
              });
            }

            // --- C. Settings Dropdown toggle ---
            document.querySelectorAll('.btn-dropdown-trigger').forEach(btn => {
              btn.addEventListener('click', function(e) {
                e.stopPropagation();
                // Close all other dropdowns
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                  if (menu !== this.nextElementSibling) menu.classList.add('hidden');
                });
                
                const menu = this.nextElementSibling;
                if (menu) {
                  menu.classList.toggle('hidden');
                  const expanded = !menu.classList.contains('hidden');
                  this.setAttribute('aria-expanded', expanded.toString());
                }
              });
            });

            // Close dropdowns on document click
            document.addEventListener('click', function() {
              document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
              document.querySelectorAll('.btn-dropdown-trigger').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
            });

            // --- D. OTP Authentication Step & Timer Logic ---
            let currentMerchantId = null;
            let timerInterval = null;

            document.querySelectorAll('.btn-auth-otp').forEach(btn => {
              btn.addEventListener('click', function() {
                currentMerchantId = this.getAttribute('data-id');
                const phone = this.getAttribute('data-phone');
                
                // Set displays
                const phoneDisplay = document.getElementById('otp-phone-display');
                if (phoneDisplay) {
                  // Mask phone
                  phoneDisplay.textContent = phone.replace(/^(\d{4})\d+(\d{4})$/, '$1••••$2');
                }

                // Reset modal steps
                document.getElementById('otp-step-1').classList.remove('hidden');
                document.getElementById('otp-step-2').classList.add('hidden');
                if (timerInterval) clearInterval(timerInterval);

                openSheet('sheet-otp');
              });
            });

            // Send OTP button trigger (Step 1 -> Step 2)
            const triggerOtpBtn = document.getElementById('btn-trigger-otp');
            if (triggerOtpBtn) {
              triggerOtpBtn.addEventListener('click', function() {
                this.disabled = true;
                this.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sending OTP...';

                // Call REST API under the hood
                fetch('/api/v1/merchants/' + currentMerchantId + '/otp/request', { method: 'POST' })
                  .then(res => res.json())
                  .then(data => {
                    this.disabled = false;
                    this.innerHTML = 'Send WhatsApp OTP';
                    
                    if (data.success) {
                      // Switch step
                      document.getElementById('otp-step-1').classList.add('hidden');
                      document.getElementById('otp-step-2').classList.remove('hidden');
                      
                      // Start 60s countdown timer
                      startOTPTimer();
                    } else {
                      alert('Failed to trigger OTP: ' + (data.error || 'Unknown error'));
                    }
                  })
                  .catch(err => {
                    this.disabled = false;
                    this.innerHTML = 'Send WhatsApp OTP';
                    alert('Network error trigger OTP');
                  });
              });
            }

            // Verify OTP Button
            const verifyOtpBtn = document.getElementById('btn-verify-otp');
            if (verifyOtpBtn) {
              verifyOtpBtn.addEventListener('click', function() {
                const otpInput = document.getElementById('otp-code');
                if (!otpInput || otpInput.value.length < 4) {
                  alert('Please enter a valid OTP code.');
                  return;
                }

                this.disabled = true;
                this.innerHTML = 'Verifying...';

                fetch('/api/v1/merchants/' + currentMerchantId + '/otp/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ otp: otpInput.value })
                })
                  .then(res => res.json())
                  .then(data => {
                    this.disabled = false;
                    this.innerHTML = 'Verify & Complete Auth';

                    if (data.success) {
                      closeSheet('sheet-otp');
                      alert('Account authenticated successfully! Listener worker is now active.');
                      window.location.reload();
                    } else {
                      alert('Verification failed: ' + (data.error || 'Invalid code'));
                    }
                  })
                  .catch(err => {
                    this.disabled = false;
                    this.innerHTML = 'Verify & Complete Auth';
                    alert('Network error verifying OTP');
                  });
              });
            }

            function startOTPTimer() {
              let seconds = 60;
              const timerDisplay = document.getElementById('otp-timer');
              if (timerInterval) clearInterval(timerInterval);

              timerInterval = setInterval(() => {
                seconds--;
                if (timerDisplay) timerDisplay.textContent = seconds + 's';
                
                if (seconds <= 0) {
                  clearInterval(timerInterval);
                  // Resend fallback
                  if (timerDisplay) timerDisplay.textContent = 'Expired';
                }
              }, 1000);
            }

            // --- E. Pause Worker trigger ---
            document.querySelectorAll('.btn-pause-worker').forEach(btn => {
              btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const isActive = this.getAttribute('data-active') === 'true';
                
                this.disabled = true;
                
                fetch('/api/v1/merchants/' + id + '/toggle', { method: 'POST' })
                  .then(res => res.json())
                  .then(data => {
                    this.disabled = false;
                    if (data.success) {
                      window.location.reload();
                    }
                  })
                  .catch(() => {
                    this.disabled = false;
                  });
              });
            });

            // --- F. Disconnect Merchant trigger ---
            let targetDisconnectId = null;
            document.querySelectorAll('.btn-disconnect-merchant').forEach(btn => {
              btn.addEventListener('click', function(e) {
                e.stopPropagation();
                targetDisconnectId = this.getAttribute('data-id');
                const name = this.getAttribute('data-name');
                const display = document.getElementById('disconnect-merchant-name-display');
                if (display) display.textContent = name;
                openSheet('sheet-confirm-disconnect');
              });
            });

            const btnConfirmDisconnectSubmit = document.getElementById('btn-confirm-disconnect-submit');
            if (btnConfirmDisconnectSubmit) {
              btnConfirmDisconnectSubmit.addEventListener('click', function() {
                if (!targetDisconnectId) return;
                this.disabled = true;
                this.textContent = 'Disconnecting...';
                fetch('/api/v1/merchants/' + targetDisconnectId + '/disconnect', { method: 'POST' })
                  .then(res => res.json())
                  .then(data => {
                    this.disabled = false;
                    this.textContent = 'Disconnect';
                    if (data.success) {
                      closeSheet('sheet-confirm-disconnect');
                      window.location.reload();
                    } else {
                      alert('Disconnect failed: ' + (data.error || 'Unknown error'));
                    }
                  })
                  .catch(() => {
                    this.disabled = false;
                    this.textContent = 'Disconnect';
                    alert('Network error disconnecting merchant');
                  });
              });
            }

            // --- G. Delete Merchant trigger ---
            let targetDeleteId = null;
            let targetDeleteName = '';
            const confirmDeleteMerchantText = document.getElementById('confirm-delete-merchant-text');
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
                if (confirmDeleteMerchantText) confirmDeleteMerchantText.value = '';
                if (btnConfirmDeleteSubmit) {
                  btnConfirmDeleteSubmit.disabled = true;
                  btnConfirmDeleteSubmit.textContent = 'Permanently Delete';
                }
                
                openSheet('sheet-confirm-delete');
              });
            });

            if (confirmDeleteMerchantText && btnConfirmDeleteSubmit) {
              confirmDeleteMerchantText.addEventListener('input', function() {
                btnConfirmDeleteSubmit.disabled = (this.value !== 'DELETE ' + targetDeleteName);
              });
            }

            if (btnConfirmDeleteSubmit) {
              btnConfirmDeleteSubmit.addEventListener('click', function() {
                if (!targetDeleteId) return;
                this.disabled = true;
                this.textContent = 'Deleting...';
                fetch('/api/v1/merchants/' + targetDeleteId, { method: 'DELETE' })
                  .then(res => res.json())
                  .then(data => {
                    this.disabled = false;
                    this.textContent = 'Permanently Delete';
                    if (data.success) {
                      closeSheet('sheet-confirm-delete');
                      window.location.reload();
                    } else {
                      alert('Delete failed: ' + (data.error || 'Unknown error'));
                    }
                  })
                  .catch(() => {
                    this.disabled = false;
                    this.textContent = 'Permanently Delete';
                    alert('Network error deleting merchant');
                  });
              });
            }

            // --- B2. Edit Merchant Modal ---
            const editFiles = document.getElementById('edit-qris-file-input');
            const editNamePreview = document.getElementById('edit-file-name-preview');

            if (editFiles && editNamePreview) {
              editFiles.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                  editNamePreview.textContent = this.files[0].name + " (" + (this.files[0].size / 1024 / 1024).toFixed(2) + "MB)";
                  editNamePreview.className = "text-[10px] text-sky-600 dark:text-sky-400 font-semibold";
                }
              });
            }

            // Edit Logo File Preview
            const editLogoFile = document.getElementById('edit-logo-file-input');
            const editLogoNamePreview = document.getElementById('edit-logo-name-preview');
            if (editLogoFile && editLogoNamePreview) {
              editLogoFile.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                  editLogoNamePreview.textContent = this.files[0].name + " (" + (this.files[0].size / 1024 / 1024).toFixed(2) + "MB)";
                  editLogoNamePreview.className = "text-[10px] text-sky-600 dark:text-sky-400 font-semibold";
                }
              });
            }

            document.querySelectorAll('.btn-edit-merchant').forEach(btn => {
              btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                const name = this.getAttribute('data-name');
                const phone = this.getAttribute('data-phone');
                const payload = this.getAttribute('data-payload') || '';

                const form = document.getElementById('edit-merchant-form');
                const editName = document.getElementById('edit-merchant-name');
                const editPhone = document.getElementById('edit-merchant-phone');
                const editPayload = document.getElementById('edit-merchant-qris-payload');

                if (form) form.action = '/api/v1/merchants/' + id + '/edit';
                if (editName) editName.value = name;
                if (editPhone) editPhone.value = phone;
                if (editPayload) editPayload.value = payload;
                if (editNamePreview) {
                  editNamePreview.textContent = "Leave empty to keep existing image";
                  editNamePreview.className = "text-[10px] text-slate-400 dark:text-zinc-500";
                }
                if (editLogoNamePreview) {
                  editLogoNamePreview.textContent = "Leave empty to keep existing logo";
                  editLogoNamePreview.className = "text-[10px] text-slate-400 dark:text-zinc-500";
                }

                openSheet('sheet-edit-merchant');
              });
            });

          })();
        `
      }} />

    </Layout>
  );
}
