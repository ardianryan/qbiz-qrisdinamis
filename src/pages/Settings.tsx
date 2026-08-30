import React from 'react';
import { Layout } from '../components/Layout.tsx';
import { MerchantContext } from '../middleware/auth.ts';
import { SystemSettingsConfig } from '../services/settings.ts';

interface SettingsPageProps {
  currentUser: any;
  activeMerchant?: MerchantContext | null;
  accessibleMerchants?: MerchantContext[];
  settings: SystemSettingsConfig;
}

export function SettingsPage({ currentUser, activeMerchant, accessibleMerchants, settings }: SettingsPageProps) {
  return (
    <Layout activePath="/settings" user={currentUser} activeMerchant={activeMerchant} accessibleMerchants={accessibleMerchants} systemSettings={settings}>
      <div className="max-w-6xl mx-auto space-y-6 animate-view-enter">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                Admin System Settings
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Enterprise control center for dynamic branding, international PWA, payment policies, scraper fleet, and security.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-save-settings"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 active:scale-95 text-white transition-all shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Save All Settings
            </button>
          </div>
        </div>

        {/* 7 Settings Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 gap-1.5 overflow-x-auto pb-px scrollbar-none">
          <button data-tab="branding" className="settings-tab-btn px-3.5 py-2.5 text-xs font-bold border-b-2 border-sky-600 text-sky-600 dark:text-sky-400 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
            Branding & Visuals
          </button>
          <button data-tab="pwa" className="settings-tab-btn px-3.5 py-2.5 text-xs font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            PWA & Mobile App
          </button>
          <button data-tab="payment" className="settings-tab-btn px-3.5 py-2.5 text-xs font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Payment & QRIS
          </button>
          <button data-tab="scraper" className="settings-tab-btn px-3.5 py-2.5 text-xs font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Scraper & Fleet
          </button>
          <button data-tab="security" className="settings-tab-btn px-3.5 py-2.5 text-xs font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Security & Controls
          </button>
          <button data-tab="notifications" className="settings-tab-btn px-3.5 py-2.5 text-xs font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Notification Fallbacks
          </button>
          <button data-tab="maintenance" className="settings-tab-btn px-3.5 py-2.5 text-xs font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            Backup & Health
          </button>
        </div>

        {/* Hidden inputs to store generated icon data URLs */}
        <input type="hidden" id="setting-app-logo-url" defaultValue={settings.appLogoUrl} />
        <input type="hidden" id="setting-app-favicon-url" defaultValue={settings.appFaviconUrl} />
        <input type="hidden" id="setting-apple-touch-icon-url" defaultValue={settings.appleTouchIconUrl} />
        <input type="hidden" id="setting-pwa-icon-192-url" defaultValue={settings.pwaIcon192Url} />
        <input type="hidden" id="setting-pwa-icon-512-url" defaultValue={settings.pwaIcon512Url} />

        {/* ========================================================================= */}
        {/* TAB 1: BRANDING & 1-CLICK SMART LOGO CONVERTER */}
        {/* ========================================================================= */}
        <div id="section-branding" className="settings-section space-y-6">
          
          {/* Smart 1-Click Multi-Format Logo Uploader & Auto-Converter Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  Smart 1-Click Logo & Multi-Format Icon Converter
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Upload 1 master logo. The system automatically converts and optimizes all formats (Favicon 32x32, Apple Touch Icon 180x180, PWA 192x192, and PWA 512x512 maskable).
                </p>
              </div>
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900 px-2.5 py-1 rounded-lg shrink-0">
                Auto-Conversion Engine Active
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Drag & Drop Upload Zone */}
              <div className="lg:col-span-5 space-y-3">
                <div
                  id="logo-drop-zone"
                  className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-sky-500 dark:hover:border-sky-400 bg-slate-50/50 dark:bg-zinc-800/40 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[190px] group"
                >
                  <input type="file" id="logo-file-input" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" />
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Click to upload or drag & drop logo
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Supports PNG, SVG, JPG, WebP (Square recommended, min 512x512)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>Direct URL fallback:</span>
                  <button id="btn-toggle-manual-url" className="text-sky-600 dark:text-sky-400 hover:underline font-medium cursor-pointer">
                    Enter image URLs manually
                  </button>
                </div>
              </div>

              {/* Live Multi-Device Previews */}
              <div className="lg:col-span-7 bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 space-y-4">
                <div className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Live Multi-Device Conversion Previews</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Instant Auto-Synced
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* 1. Browser Tab & Favicon Preview */}
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Browser Tab (32px)</span>
                    <div className="bg-slate-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg flex items-center gap-2 border border-slate-200 dark:border-zinc-700">
                      <img id="preview-favicon-img" src={settings.appFaviconUrl || settings.appLogoUrl || "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>"} alt="" className="w-4 h-4 object-contain rounded-xs shrink-0" />
                      <span id="preview-tab-title" className="text-[10px] font-medium text-slate-700 dark:text-zinc-200 truncate">{settings.appName}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-2 block">Favicon standard icon</span>
                  </div>

                  {/* 2. Apple iOS Icon Preview */}
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-between text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">iOS Icon (180px)</span>
                    <div className="w-12 h-12 rounded-[14px] bg-white dark:bg-zinc-900 p-1 border border-slate-200 dark:border-zinc-700 shadow-md flex items-center justify-center my-1 overflow-hidden">
                      <img id="preview-apple-img" src={settings.appleTouchIconUrl || settings.appLogoUrl || "/static/logo.png"} alt="" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-[9px] text-slate-400 block truncate max-w-full">Apple Touch Icon</span>
                  </div>

                  {/* 3. Android / PWA 512px Maskable Preview */}
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-between text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">PWA Maskable (512px)</span>
                    <div className="w-12 h-12 rounded-full bg-sky-600/10 dark:bg-sky-950 p-1.5 border border-sky-300 dark:border-sky-800 shadow-sm flex items-center justify-center my-1 overflow-hidden">
                      <img id="preview-pwa-img" src={settings.pwaIcon512Url || settings.appLogoUrl || "/static/logo.png"} alt="" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-[9px] text-slate-400 block truncate max-w-full">PWA High-Res App</span>
                  </div>

                </div>
              </div>
            </div>

            {/* Manual URL Input Accordion (Hidden by default) */}
            <div id="manual-url-inputs" className="hidden pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Logo URL</label>
                  <input type="text" id="manual-logo-url" defaultValue={settings.appLogoUrl} placeholder="https://domain.com/logo.png" className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Favicon URL</label>
                  <input type="text" id="manual-favicon-url" defaultValue={settings.appFaviconUrl} placeholder="https://domain.com/favicon.ico" className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100" />
                </div>
              </div>
            </div>
          </div>

          {/* Core Platform Identity Metadata Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              Platform Identity & Colors
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* App Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Application / Website Name
                </label>
                <input
                  type="text"
                  id="setting-app-name"
                  defaultValue={settings.appName}
                  placeholder="e.g. QBiz Gateway"
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Displayed on sidebar, PWA app icon title, and top headers.</span>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Platform Tagline & Subtitle
                </label>
                <input
                  type="text"
                  id="setting-app-tagline"
                  defaultValue={settings.appTagline}
                  placeholder="e.g. Dynamic QRIS Payment Gateway"
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Used on login pages, invoices, and meta descriptions.</span>
              </div>

              {/* Theme Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Primary Theme Color (Hex)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="setting-theme-color-picker"
                    defaultValue={settings.themeColor || '#0284c7'}
                    className="w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-700 p-0.5 cursor-pointer shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    id="setting-theme-color"
                    defaultValue={settings.themeColor || '#0284c7'}
                    placeholder="#0284c7"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">PWA address bar and theme accent color.</span>
              </div>

              {/* Footer / Copyright */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Footer / Copyright Notice
                </label>
                <input
                  type="text"
                  id="setting-footer-text"
                  defaultValue={settings.footerText}
                  placeholder="© 2026 QBiz Gateway. All rights reserved."
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Legal copyright text displayed across portal footers.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 2: PWA & MOBILE APP */}
        {/* ========================================================================= */}
        <div id="section-pwa" className="settings-section space-y-6 hidden">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              Progressive Web App (PWA) & Offline Policies
            </h2>

            <div className="space-y-4">
              {/* PWA Enabled Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">Enable PWA & Service Worker</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    Serves <code className="font-mono text-sky-600 dark:text-sky-400">/manifest.webmanifest</code> and registers offline caching service worker.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="setting-pwa-enabled" defaultChecked={settings.pwaEnabled} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {/* Install Banner Prompt Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">Smart In-App Install Prompt Banner</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    Shows an attractive native install banner at the bottom of the screen for mobile & desktop visitors.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="setting-pwa-install-prompt" defaultChecked={settings.pwaInstallPrompt} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {/* Prompt Delay */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Install Prompt Display Delay (Seconds)
                  </label>
                  <input
                    type="number"
                    id="setting-pwa-prompt-delay"
                    defaultValue={settings.pwaPromptDelaySeconds || 3}
                    min="0"
                    max="60"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Delay before popping up the installation recommendation banner.</span>
                </div>

                <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    W3C International PWA Standards
                  </span>
                  <span className="text-[10px] text-sky-700/80 dark:text-sky-300/80 mt-1">
                    Compliant with Google Lighthouse, Apple iOS Web Clip, and Android APK installation criteria.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 3: PAYMENT & QRIS POLICIES */}
        {/* ========================================================================= */}
        <div id="section-payment" className="settings-section space-y-6 hidden">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              Payment, Unique Code & QRIS Policies
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Expiry Duration */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Default Invoice Expiry Duration (Minutes)
                </label>
                <input
                  type="number"
                  id="setting-invoice-expiry"
                  defaultValue={settings.invoiceExpiryMinutes}
                  min="1"
                  max="1440"
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default lifetime for dynamic QRIS invoices (default: 15 min).</span>
              </div>

              {/* Unique Code Range */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Unique Code Suffix Range (Min - Max)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    id="setting-unique-code-min"
                    defaultValue={settings.uniqueCodeMin || 1}
                    placeholder="Min (1)"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100"
                  />
                  <input
                    type="number"
                    id="setting-unique-code-max"
                    defaultValue={settings.uniqueCodeMax || 999}
                    placeholder="Max (999)"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Suffix range added to distinguish concurrent transactions.</span>
              </div>

              {/* Transaction Limits */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Transaction Amount Limits (IDR)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    id="setting-min-amount"
                    defaultValue={settings.minAmount || 1000}
                    placeholder="Min Amount"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100"
                  />
                  <input
                    type="number"
                    id="setting-max-amount"
                    defaultValue={settings.maxAmount || 50000000}
                    placeholder="Max Amount"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Allowable charge amount range per invoice.</span>
              </div>

              {/* Webhook Retries & Backoff */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Webhook Retry Limit & Delay (Seconds)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    id="setting-webhook-retry-limit"
                    defaultValue={settings.defaultWebhookRetryLimit}
                    min="1"
                    max="10"
                    placeholder="Retries (3)"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100"
                  />
                  <input
                    type="number"
                    id="setting-webhook-delay"
                    defaultValue={settings.webhookRetryDelaySeconds || 5}
                    min="1"
                    max="60"
                    placeholder="Delay (5s)"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Maximum retry attempts when client callback fails.</span>
              </div>
            </div>

            {/* Static QRIS Fallback */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Global Fallback Static QRIS String
              </label>
              <textarea
                id="setting-default-static-qris"
                defaultValue={settings.defaultStaticQris}
                rows={2}
                placeholder="00020101021138590014ID.CO.QRIS.WWW0215ID10200845344330303UMI..."
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Fallback EMVCo static QRIS string used when a merchant hasn't configured custom QRIS.</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 4: SCRAPER & FLEET POLICIES */}
        {/* ========================================================================= */}
        <div id="section-scraper" className="settings-section space-y-6 hidden">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              Puppeteer Scraper Fleet & Interceptor Settings
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Background Mutation Polling Frequency (Seconds)
                  </label>
                  <select
                    id="setting-scraper-interval"
                    defaultValue={String(settings.scraperIntervalSeconds || 30)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="15">15 Seconds (Ultra Low-Latency)</option>
                    <option value="30">30 Seconds (Recommended Balanced)</option>
                    <option value="60">60 Seconds (Low Resource)</option>
                    <option value="120">120 Seconds (Battery/Server Saver)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Interval for headless interceptor to check incoming QRIS payments.</span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Puppeteer Headless Engine
                  </span>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 mt-1">
                    Multi-worker listeners automatically bind to isolated Chrome session contexts with automatic cookie recovery.
                  </span>
                </div>
              </div>

              {/* Scraper Auto-Restart Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">Auto-Restart Scrapers on Crash/Disconnect</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    Automatically re-spawns listener workers if the underlying browser session disconnects.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="setting-scraper-auto-restart" defaultChecked={settings.scraperAutoRestart} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {/* Scraper OTP Alert Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">Emergency Admin Alert on NEEDS_OTP</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    Sends high-priority notification to Super Admin channel when any store session expires and requires OTP.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="setting-scraper-alert-otp" defaultChecked={settings.scraperAlertOnNeedsOtp} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 5: SECURITY & ACCESS CONTROLS */}
        {/* ========================================================================= */}
        <div id="section-security" className="settings-section space-y-6 hidden">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              Security, Session & Access Controls
            </h2>

            <div className="space-y-4">
              {/* Maintenance Mode Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-red-900 dark:text-red-300 block">Emergency System Maintenance Mode</span>
                  <span className="text-[11px] text-red-700/80 dark:text-red-400 block">
                    When enabled, temporarily pauses new invoice creation with a 503 Maintenance response.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="setting-maintenance-mode" defaultChecked={settings.maintenanceMode} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Maintenance Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Custom Maintenance Downtime Message
                </label>
                <input
                  type="text"
                  id="setting-maintenance-message"
                  defaultValue={settings.maintenanceMessage}
                  placeholder="System is currently undergoing scheduled maintenance. Please try again later."
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Session Timeout */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    User Session Timeout (Hours)
                  </label>
                  <input
                    type="number"
                    id="setting-session-timeout"
                    defaultValue={settings.sessionTimeoutHours}
                    min="1"
                    max="720"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Cookie lifetime before re-authentication is required.</span>
                </div>

                {/* API Rate Limit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    API Rate Limit per Minute
                  </label>
                  <input
                    type="number"
                    id="setting-rate-limit"
                    defaultValue={settings.rateLimitPerMinute || 60}
                    min="10"
                    max="1000"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Rate limit ceiling per IP address per minute.</span>
                </div>
              </div>

              {/* Allow Demo Login Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">Allow Demo Credentials Login</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    Permits testing logins using demo accounts in sandbox mode.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="setting-allow-demo-login" defaultChecked={settings.allowDemoLogin} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 6: NOTIFICATION FALLBACKS & ALERTS */}
        {/* ========================================================================= */}
        <div id="section-notifications" className="settings-section space-y-6 hidden">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              Default Fallback Notification Templates
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Used when a merchant has not specified a custom template for Telegram, Discord, or WhatsApp.
              Supported variables: <code className="text-sky-600 dark:text-sky-400 font-mono">{"{{store_name}}"}</code>, <code className="text-sky-600 dark:text-sky-400 font-mono">{"{{order_id}}"}</code>, <code className="text-sky-600 dark:text-sky-400 font-mono">{"{{amount}}"}</code>, <code className="text-sky-600 dark:text-sky-400 font-mono">{"{{date}}"}</code>, <code className="text-sky-600 dark:text-sky-400 font-mono">{"{{invoice_id}}"}</code>.
            </p>

            <div className="space-y-4">
              {/* Telegram Template */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  Default Telegram Template (HTML supported)
                </label>
                <textarea
                  id="setting-telegram-template"
                  defaultValue={settings.defaultTelegramTemplate}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* WhatsApp Template */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Default WhatsApp Template (GOWA format)
                </label>
                <textarea
                  id="setting-whatsapp-template"
                  defaultValue={settings.defaultWhatsappTemplate}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Discord Template */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Default Discord Template (Markdown)
                </label>
                <textarea
                  id="setting-discord-template"
                  defaultValue={settings.defaultDiscordTemplate}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Super Admin Alert Webhook */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Super Admin Alert Webhook URL (Emergency System Broadcasts)
                </label>
                <input
                  type="text"
                  id="setting-admin-alert-webhook"
                  defaultValue={settings.adminAlertWebhook}
                  placeholder="https://discord.com/api/webhooks/... or Telegram Bot webhook"
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-zinc-100"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Receives critical platform events: listener disconnections, DB latency spikes, and system errors.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 7: MAINTENANCE, BACKUP & SYSTEM HEALTH */}
        {/* ========================================================================= */}
        <div id="section-maintenance" className="settings-section space-y-6 hidden">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              Backup, Configuration Export & System Health
            </h2>

            {/* Diagnostics Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Runtime Engine</span>
                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-0.5 block">Deno v2.x</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Database ORM</span>
                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-0.5 block">Drizzle PG</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PWA Engine</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">W3C Ready</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Settings Cache</span>
                <span className="text-sm font-bold text-sky-600 dark:text-sky-400 mt-0.5 block">In-Memory 0ms</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Cache Flush */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">Flush Cache Memory</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5">Clears system settings in-memory cache and forces instant DB reload.</span>
                </div>
                <button
                  id="btn-flush-cache"
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer self-start"
                >
                  Flush Cache
                </button>
              </div>

              {/* Export Backup JSON */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">Export Settings Backup</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5">Download current platform configuration as a backup JSON file.</span>
                </div>
                <button
                  id="btn-export-backup"
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition-colors cursor-pointer self-start flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Export JSON Backup
                </button>
              </div>

              {/* Import Backup JSON */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">Import / Restore Backup</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5">Restore platform settings from an exported configuration file.</span>
                </div>
                <input type="file" id="import-backup-file" accept=".json,application/json" className="hidden" />
                <button
                  id="btn-import-backup"
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer self-start flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Import JSON
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Embedded Client Controller Script for 1-Click Converter, Canvas Processing, and 7 Tabs */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // 1. Tab Navigation Controller
            const tabButtons = document.querySelectorAll('.settings-tab-btn');
            const sections = document.querySelectorAll('.settings-section');

            tabButtons.forEach(btn => {
              btn.addEventListener('click', function() {
                const target = this.getAttribute('data-tab');

                tabButtons.forEach(b => {
                  b.classList.remove('border-sky-600', 'text-sky-600', 'dark:text-sky-400', 'font-bold');
                  b.classList.add('border-transparent', 'text-slate-500', 'dark:text-zinc-400', 'font-medium');
                });

                this.classList.add('border-sky-600', 'text-sky-600', 'dark:text-sky-400', 'font-bold');
                this.classList.remove('border-transparent', 'text-slate-500', 'dark:text-zinc-400', 'font-medium');

                sections.forEach(s => {
                  if (s.id === 'section-' + target) {
                    s.classList.remove('hidden');
                  } else {
                    s.classList.add('hidden');
                  }
                });
              });
            });

            // 2. Color Picker Syncer
            const colorPicker = document.getElementById('setting-theme-color-picker');
            const colorInput = document.getElementById('setting-theme-color');
            if (colorPicker && colorInput) {
              colorPicker.addEventListener('input', (e) => colorInput.value = e.target.value);
              colorInput.addEventListener('input', (e) => colorPicker.value = e.target.value);
            }

            // 3. Smart 1-Click Logo Converter via HTML5 Canvas
            const dropZone = document.getElementById('logo-drop-zone');
            const fileInput = document.getElementById('logo-file-input');

            if (dropZone && fileInput) {
              dropZone.addEventListener('click', () => fileInput.click());

              dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('border-sky-500', 'bg-sky-50/50');
              });

              dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('border-sky-500', 'bg-sky-50/50');
              });

              dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-sky-500', 'bg-sky-50/50');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  processMasterLogoFile(e.dataTransfer.files[0]);
                }
              });

              fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                  processMasterLogoFile(e.target.files[0]);
                }
              });
            }

            function processMasterLogoFile(file) {
              const reader = new FileReader();
              reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                  // A. Generate Master Logo (Max 512px)
                  const masterDataUrl = resizeImageWithCanvas(img, 512, 512, false);
                  // B. Generate Favicon (32x32)
                  const faviconDataUrl = resizeImageWithCanvas(img, 32, 32, false);
                  // C. Generate Apple Touch Icon (180x180 padded)
                  const appleDataUrl = resizeImageWithCanvas(img, 180, 180, true);
                  // D. Generate PWA 192x192
                  const pwa192DataUrl = resizeImageWithCanvas(img, 192, 192, true);
                  // E. Generate PWA 512x512 maskable
                  const pwa512DataUrl = resizeImageWithCanvas(img, 512, 512, true);

                  // Update hidden inputs
                  const logoIn = document.getElementById('setting-app-logo-url');
                  const favIn = document.getElementById('setting-app-favicon-url');
                  const appleIn = document.getElementById('setting-apple-touch-icon-url');
                  const pwa192In = document.getElementById('setting-pwa-icon-192-url');
                  const pwa512In = document.getElementById('setting-pwa-icon-512-url');

                  if (logoIn) logoIn.value = masterDataUrl;
                  if (favIn) favIn.value = faviconDataUrl;
                  if (appleIn) appleIn.value = appleDataUrl;
                  if (pwa192In) pwa192In.value = pwa192DataUrl;
                  if (pwa512In) pwa512In.value = pwa512DataUrl;

                  // Update Live Previews
                  const prevFav = document.getElementById('preview-favicon-img');
                  const prevApple = document.getElementById('preview-apple-img');
                  const prevPwa = document.getElementById('preview-pwa-img');

                  if (prevFav) prevFav.src = faviconDataUrl;
                  if (prevApple) prevApple.src = appleDataUrl;
                  if (prevPwa) prevPwa.src = pwa512DataUrl;

                  window.showToast({
                    type: 'success',
                    title: 'Logo Converted Successfully',
                    message: 'Generated Favicon (32px), Apple Touch (180px), and PWA icons (192px/512px)!'
                  });
                };
                img.src = event.target.result;
              };
              reader.readAsDataURL(file);
            }

            function resizeImageWithCanvas(img, targetWidth, targetHeight, padSafeZone) {
              const canvas = document.createElement('canvas');
              canvas.width = targetWidth;
              canvas.height = targetHeight;
              const ctx = canvas.getContext('2d');

              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';

              let drawW = targetWidth;
              let drawH = targetHeight;
              let offsetX = 0;
              let offsetY = 0;

              // Safe zone padding for mobile/PWA maskable icons
              if (padSafeZone) {
                const paddingFactor = 0.82;
                drawW = targetWidth * paddingFactor;
                drawH = targetHeight * paddingFactor;
                offsetX = (targetWidth - drawW) / 2;
                offsetY = (targetHeight - drawH) / 2;
              }

              ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
              return canvas.toDataURL('image/png');
            }

            // Toggle manual URL inputs
            const toggleManualBtn = document.getElementById('btn-toggle-manual-url');
            const manualInputs = document.getElementById('manual-url-inputs');
            if (toggleManualBtn && manualInputs) {
              toggleManualBtn.addEventListener('click', () => {
                manualInputs.classList.toggle('hidden');
              });
            }

            // Sync app name to preview tab
            const appNameInput = document.getElementById('setting-app-name');
            const tabTitlePrev = document.getElementById('preview-tab-title');
            if (appNameInput && tabTitlePrev) {
              appNameInput.addEventListener('input', (e) => tabTitlePrev.textContent = e.target.value || 'QBiz Gateway');
            }

            // 4. Save All Settings Action
            const saveBtn = document.getElementById('btn-save-settings');
            if (saveBtn) {
              saveBtn.addEventListener('click', async function() {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving Settings...';

                // Sync manual URL fallbacks if edited
                const manualLogo = document.getElementById('manual-logo-url');
                const manualFav = document.getElementById('manual-favicon-url');
                if (manualLogo && manualLogo.value) document.getElementById('setting-app-logo-url').value = manualLogo.value;
                if (manualFav && manualFav.value) document.getElementById('setting-app-favicon-url').value = manualFav.value;

                const payload = {
                  // Tab 1: Branding
                  appName: document.getElementById('setting-app-name')?.value,
                  appLogoUrl: document.getElementById('setting-app-logo-url')?.value,
                  appFaviconUrl: document.getElementById('setting-app-favicon-url')?.value,
                  appTagline: document.getElementById('setting-app-tagline')?.value,
                  footerText: document.getElementById('setting-footer-text')?.value,
                  themeColor: document.getElementById('setting-theme-color')?.value,
                  appleTouchIconUrl: document.getElementById('setting-apple-touch-icon-url')?.value,

                  // Tab 2: PWA
                  pwaEnabled: document.getElementById('setting-pwa-enabled')?.checked,
                  pwaInstallPrompt: document.getElementById('setting-pwa-install-prompt')?.checked,
                  pwaPromptDelaySeconds: Number(document.getElementById('setting-pwa-prompt-delay')?.value || 3),
                  pwaIcon192Url: document.getElementById('setting-pwa-icon-192-url')?.value,
                  pwaIcon512Url: document.getElementById('setting-pwa-icon-512-url')?.value,

                  // Tab 3: Payment
                  invoiceExpiryMinutes: Number(document.getElementById('setting-invoice-expiry')?.value || 15),
                  uniqueCodeMin: Number(document.getElementById('setting-unique-code-min')?.value || 1),
                  uniqueCodeMax: Number(document.getElementById('setting-unique-code-max')?.value || 999),
                  minAmount: Number(document.getElementById('setting-min-amount')?.value || 1000),
                  maxAmount: Number(document.getElementById('setting-max-amount')?.value || 50000000),
                  defaultStaticQris: document.getElementById('setting-default-static-qris')?.value,
                  defaultWebhookRetryLimit: Number(document.getElementById('setting-webhook-retry-limit')?.value || 3),
                  webhookRetryDelaySeconds: Number(document.getElementById('setting-webhook-delay')?.value || 5),

                  // Tab 4: Scraper
                  scraperIntervalSeconds: Number(document.getElementById('setting-scraper-interval')?.value || 30),
                  scraperAutoRestart: document.getElementById('setting-scraper-auto-restart')?.checked,
                  scraperAlertOnNeedsOtp: document.getElementById('setting-scraper-alert-otp')?.checked,

                  // Tab 5: Security
                  sessionTimeoutHours: Number(document.getElementById('setting-session-timeout')?.value || 168),
                  maintenanceMode: document.getElementById('setting-maintenance-mode')?.checked,
                  maintenanceMessage: document.getElementById('setting-maintenance-message')?.value,
                  allowDemoLogin: document.getElementById('setting-allow-demo-login')?.checked,
                  rateLimitPerMinute: Number(document.getElementById('setting-rate-limit')?.value || 60),

                  // Tab 6: Notifications
                  defaultTelegramTemplate: document.getElementById('setting-telegram-template')?.value,
                  defaultWhatsappTemplate: document.getElementById('setting-whatsapp-template')?.value,
                  defaultDiscordTemplate: document.getElementById('setting-discord-template')?.value,
                  adminAlertWebhook: document.getElementById('setting-admin-alert-webhook')?.value,
                };

                try {
                  const res = await fetch('/api/v1/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  const json = await res.json();
                  if (json.success) {
                    // Instantly apply dynamic theme color in browser DOM
                    if (payload.themeColor) {
                      document.documentElement.style.setProperty('--brand-primary', payload.themeColor);
                    }
                    window.showToast({
                      type: 'success',
                      title: 'Settings Saved',
                      message: 'Branding and system settings saved successfully! Reloading...'
                    });
                    setTimeout(() => window.location.reload(), 1000);
                  } else {
                    window.showToast({
                      type: 'error',
                      title: 'Failed to Save Settings',
                      message: json.error || 'Server error occurred while saving.'
                    });
                  }
                } catch (e) {
                  window.showToast({
                    type: 'error',
                    title: 'Network Error',
                    message: 'Could not connect to settings server endpoint.'
                  });
                } finally {
                  saveBtn.disabled = false;
                  saveBtn.innerHTML = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Save All Settings';
                }
              });
            }

            // 5. Diagnostics & Backup Actions
            const flushCacheBtn = document.getElementById('btn-flush-cache');
            if (flushCacheBtn) {
              flushCacheBtn.addEventListener('click', async () => {
                try {
                  const res = await fetch('/api/v1/settings/cache-flush', { method: 'POST' });
                  const json = await res.json();
                  if (json.success) {
                    window.showToast({ type: 'success', title: 'Cache Flushed', message: 'In-memory configuration cache cleared.' });
                  }
                } catch (e) {
                  window.showToast({ type: 'error', title: 'Error', message: 'Failed to flush cache.' });
                }
              });
            }

            const exportBtn = document.getElementById('btn-export-backup');
            if (exportBtn) {
              exportBtn.addEventListener('click', async () => {
                try {
                  const res = await fetch('/api/v1/settings');
                  const json = await res.json();
                  if (json.success) {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json.settings, null, 2));
                    const dlAnchor = document.createElement('a');
                    dlAnchor.setAttribute("href", dataStr);
                    dlAnchor.setAttribute("download", "qbiz-system-settings-" + Date.now() + ".json");
                    document.body.appendChild(dlAnchor);
                    dlAnchor.click();
                    dlAnchor.remove();
                    window.showToast({ type: 'success', title: 'Backup Exported', message: 'Configuration JSON downloaded.' });
                  }
                } catch (e) {
                  window.showToast({ type: 'error', title: 'Export Failed', message: 'Failed to export backup.' });
                }
              });
            }

            const importBtn = document.getElementById('btn-import-backup');
            const importFile = document.getElementById('import-backup-file');
            if (importBtn && importFile) {
              importBtn.addEventListener('click', () => importFile.click());
              importFile.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                  const reader = new FileReader();
                  reader.onload = async (evt) => {
                    try {
                      const parsed = JSON.parse(evt.target.result);
                      const res = await fetch('/api/v1/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(parsed)
                      });
                      const json = await res.json();
                      if (json.success) {
                        window.showToast({ type: 'success', title: 'Settings Restored', message: 'Imported settings applied successfully!' });
                        setTimeout(() => window.location.reload(), 1000);
                      } else {
                        window.showToast({ type: 'error', title: 'Import Failed', message: json.error || 'Invalid configuration payload.' });
                      }
                    } catch (err) {
                      window.showToast({ type: 'error', title: 'JSON Parse Error', message: 'The uploaded file is not valid JSON.' });
                    }
                  };
                  reader.readAsText(e.target.files[0]);
                }
              });
            }

          })();
        `
      }} />
    </Layout>
  );
}
