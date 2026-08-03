import React from 'react';
import { Layout } from '../components/Layout.tsx';

interface Merchant {
  id: string;
  name: string;
  phoneNumber: string;
  qrisImageUrl: string;
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
                    <h3 className="font-bold text-lg text-slate-900 dark:text-zinc-50 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
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
                      <a href={`/developer?merchant=${merchant.id}`} className="block px-4 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800">
                        Webhook Settings
                      </a>
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
      {/* 3. MODALS & DIALOGS */}
      {/* ========================================================================= */}

      {/* A. ZOOM QRIS DIALOG */}
      <div id="modal-zoom" className="fixed inset-0 z-50 flex items-center justify-center hidden" role="dialog" aria-modal="true" aria-labelledby="zoom-title">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm modal-close-trigger"></div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl relative z-10 transition-all duration-300 scale-95 opacity-0 modal-content">
          <div className="flex items-center justify-between mb-4">
            <h3 id="zoom-title" className="font-bold text-lg text-slate-900 dark:text-zinc-50">QRIS Merchant Code</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 modal-close-trigger" aria-label="Close dialog">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-lg p-6 flex items-center justify-center aspect-square">
            <img id="zoom-image" src="" alt="Zoomed QRIS Code" className="max-h-full max-w-full object-contain" />
          </div>
        </div>
      </div>

      {/* B. ADD MERCHANT DIALOG */}
      <div id="modal-add-merchant" className="fixed inset-0 z-50 flex items-center justify-center hidden" role="dialog" aria-modal="true" aria-labelledby="add-merchant-title">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm modal-close-trigger"></div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl relative z-10 transition-all duration-300 scale-95 opacity-0 modal-content">
          <div className="flex items-center justify-between mb-5">
            <h3 id="add-merchant-title" className="font-bold text-xl text-slate-900 dark:text-zinc-50">Connect QRIS Merchant</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 modal-close-trigger" aria-label="Close dialog">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form action="/api/v1/merchants" method="POST" className="space-y-4" encType="multipart/form-data">
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
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
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
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
              />
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">Must include the active WhatsApp account number for OTP delivery.</span>
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

            {/* Raw Static QRIS Payload */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="merchant-qris-payload" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Raw Static QRIS Payload (Text EMVCo String)
              </label>
              <textarea 
                id="merchant-qris-payload" 
                name="qrisPayload" 
                rows={2}
                placeholder="e.g. 00020101021138590014ID.CO.QRIS.WWW0215ID1020084534433..."
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all font-mono text-[11px] resize-none"
              ></textarea>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">Used for generating dynamic QRIS with unique amounts for payment gateway integrations.</span>
            </div>

            {/* Submit button */}
            <div className="pt-3">
              <button 
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500"
              >
                Proceed to Verification
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* C. OTP AUTHENTICATION DIALOG */}
      <div id="modal-otp" className="fixed inset-0 z-50 flex items-center justify-center hidden" role="dialog" aria-modal="true" aria-labelledby="otp-title">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm modal-close-trigger"></div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl relative z-10 transition-all duration-300 scale-95 opacity-0 modal-content">
          <div className="flex items-center justify-between mb-5">
            <h3 id="otp-title" className="font-bold text-xl text-slate-900 dark:text-zinc-50">GoBiz WhatsApp OTP Verification</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 modal-close-trigger" aria-label="Close dialog">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* STEP 1: Phone Trigger */}
          <div id="otp-step-1" className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              We will trigger an OTP session by opening a headless browser on GoBiz portal for your registered phone number.
            </p>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">TARGET PHONE NUMBER</span>
              <span id="otp-phone-display" className="text-base font-bold text-slate-800 dark:text-zinc-100 font-mono">0812••••3456</span>
            </div>
            <button 
              id="btn-trigger-otp"
              className="w-full bg-slate-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 hover:bg-slate-800 font-semibold text-sm py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 flex items-center justify-center gap-2"
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
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500"
            >
              Verify & Complete Auth
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
            // Helper functions to open and close modals
            function openModal(modalId) {
              const modal = document.getElementById(modalId);
              if (!modal) return;
              modal.classList.remove('hidden');
              setTimeout(() => {
                const content = modal.querySelector('.modal-content');
                if (content) {
                  content.classList.remove('scale-95', 'opacity-0');
                  content.classList.add('scale-100', 'opacity-100');
                }
              }, 10);
            }

            function closeModal(modalId) {
              const modal = document.getElementById(modalId);
              if (!modal) return;
              const content = modal.querySelector('.modal-content');
              if (content) {
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
              }
              setTimeout(() => {
                modal.classList.add('hidden');
              }, 300);
            }

            // Bind all close triggers
            document.querySelectorAll('.modal-close-trigger').forEach(el => {
              el.addEventListener('click', function(e) {
                const modal = e.target.closest('[role="dialog"]');
                if (modal) closeModal(modal.id);
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
                openModal('modal-zoom');
              });
            });

            // --- B. Add Merchant Modal ---
            const addBtn = document.getElementById('btn-add-merchant');
            const addBtnEmpty = document.getElementById('btn-add-merchant-empty');
            const addFile = document.getElementById('qris-file-input');
            const namePreview = document.getElementById('file-name-preview');

            if (addBtn) addBtn.addEventListener('click', () => openModal('modal-add-merchant'));
            if (addBtnEmpty) addBtnEmpty.addEventListener('click', () => openModal('modal-add-merchant'));
            
            if (addFile && namePreview) {
              addFile.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                  namePreview.textContent = this.files[0].name + " (" + (this.files[0].size / 1024 / 1024).toFixed(2) + "MB)";
                  namePreview.className = "text-[10px] text-sky-600 dark:text-sky-400 font-semibold";
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
                  phoneDisplay.textContent = phone.replace(/^(\\d{4})\\d+(\\d{4})$/, '$1••••$2');
                }

                // Reset modal steps
                document.getElementById('otp-step-1').classList.remove('hidden');
                document.getElementById('otp-step-2').classList.add('hidden');
                if (timerInterval) clearInterval(timerInterval);

                openModal('modal-otp');
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
                      closeModal('modal-otp');
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
            document.querySelectorAll('.btn-disconnect-merchant').forEach(btn => {
              btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const name = this.getAttribute('data-name');
                if (confirm('Are you sure you want to disconnect "' + name + '"? This will stop transaction synchronization and clear cookie sessions.')) {
                  this.disabled = true;
                  fetch('/api/v1/merchants/' + id + '/disconnect', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                      this.disabled = false;
                      if (data.success) {
                        window.location.reload();
                      } else {
                        alert('Disconnect failed: ' + (data.error || 'Unknown error'));
                      }
                    })
                    .catch(() => {
                      this.disabled = false;
                      alert('Network error disconnecting merchant');
                    });
                }
              });
            });

            // --- G. Delete Merchant trigger ---
            document.querySelectorAll('.btn-delete-merchant').forEach(btn => {
              btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const name = this.getAttribute('data-name');
                if (confirm('Are you sure you want to permanently delete "' + name + '"? WARNING: This will delete all of its transaction history, invoices, mutations, and disconnect it forever.')) {
                  if (confirm('Double Confirm: Are you absolutely sure you want to delete "' + name + '"? This action CANNOT be undone.')) {
                    this.disabled = true;
                    fetch('/api/v1/merchants/' + id, { method: 'DELETE' })
                      .then(res => res.json())
                      .then(data => {
                        this.disabled = false;
                        if (data.success) {
                          window.location.reload();
                        } else {
                          alert('Delete failed: ' + (data.error || 'Unknown error'));
                        }
                      })
                      .catch(() => {
                        this.disabled = false;
                        alert('Network error deleting merchant');
                      });
                  }
                }
              });
            });

          })();
        `
      }} />

    </Layout>
  );
}
