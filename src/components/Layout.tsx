import React from 'react';
import { MerchantContext, UserSession } from '../middleware/auth.ts';
import { SystemSettingsConfig, DEFAULT_SYSTEM_SETTINGS } from '../services/settings.ts';

interface LayoutProps {
  children: React.ReactNode;
  activePath: string;
  user?: UserSession;
  activeMerchant?: MerchantContext | null;
  accessibleMerchants?: MerchantContext[];
  systemSettings?: SystemSettingsConfig;
}

export function Layout({ children, activePath, user, activeMerchant, accessibleMerchants = [], systemSettings }: LayoutProps) {
  const settings = systemSettings || DEFAULT_SYSTEM_SETTINGS;
  const currentUser = user || {
    id: 'usr_demo',
    name: 'Guest User',
    email: 'guest@qbiz.com',
    role: 'MERCHANT' as const,
    merchantId: null
  };

  const currentStore = activeMerchant || (accessibleMerchants.length > 0 ? accessibleMerchants[0] : null);

  // Enforce role-based visibility:
  // - SUPER_ADMIN, ADMIN, REGIONAL_ADMIN can access Merchants, Transactions, Developer Hub.
  // - SUPER_ADMIN can also access System Settings.
  // - MERCHANT, MERCHANT_EMPLOYEE can ONLY access Transactions (Live Transaction Monitor).
  const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN'].includes(currentUser.role);

  const navItems = [];
  navItems.push({ label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' });
  if (isPrivileged) {
    navItems.push({ label: 'Merchants', path: '/merchants', icon: 'Store' });
  }
  navItems.push({ label: 'Transactions', path: '/transactions', icon: 'Receipt' });
  if (currentUser.role !== 'MERCHANT_EMPLOYEE') {
    navItems.push({ label: 'User Directory', path: '/users', icon: 'Users' });
  }
  if (currentUser.role !== 'MERCHANT_EMPLOYEE') {
    navItems.push({ label: 'Developer Hub', path: '/developer', icon: 'Code2' });
  }
  if (currentUser.role === 'SUPER_ADMIN') {
    navItems.push({ label: 'System Settings', path: '/settings', icon: 'Settings' });
  }

  // Helper mapping role to visual human readable format
  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    REGIONAL_ADMIN: 'Regional Admin',
    MERCHANT: 'Merchant Owner',
    MERCHANT_EMPLOYEE: 'Employee'
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      
      {/* WCAG Skip Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-sky-600 text-white px-4 py-2 rounded-md z-50 font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500"
      >
        Skip to Content
      </a>

      {/* ========================================================================= */}
      {/* 1. MOBILE HEADER (Sticky, Top) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 w-full md:hidden h-14 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          {settings.appLogoUrl ? (
            <img src={settings.appLogoUrl} alt={settings.appName} className="w-7 h-7 rounded-lg object-contain bg-white dark:bg-zinc-900 p-0.5 border border-slate-200 dark:border-zinc-700 shadow-sm shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-sky-600 dark:bg-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              {settings.appName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-zinc-50 truncate">{settings.appName}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mobile Active Merchant Switcher Button */}
          {accessibleMerchants.length > 0 && (
            <button
              id="mobile-workspace-trigger"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-200 max-w-[150px] truncate transition-colors cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                currentStore?.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' :
                currentStore?.status === 'NEEDS_OTP' ? 'bg-amber-500' : 'bg-red-500'
              }`}></span>
              <span className="truncate">{currentStore?.name || 'Select Store'}</span>
              <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
          )}

          {/* Theme Toggle Mobile */}
          <button 
            id="mobile-theme-toggle"
            aria-label="Toggle Dark Mode"
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <svg id="sun-icon-mobile" className="w-4 h-4 hidden dark:block text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
            <svg id="moon-icon-mobile" className="w-4 h-4 block dark:hidden text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE "MORE" BOTTOM SHEET (Sliding from bottom) */}
      {/* ========================================================================= */}
      <div id="mobile-drawer" className="fixed inset-0 z-50 md:hidden flex items-end justify-center hidden" role="dialog" aria-modal="true">
        <div id="mobile-drawer-backdrop" className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300 opacity-0"></div>
        <div id="mobile-drawer-body" className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-3xl border-t border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col p-5 pb-8 sheet-spring translate-y-full overflow-y-auto">
          {/* Drag Handle */}
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 shrink-0"></div>

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-sky-600 text-white font-bold text-xs flex items-center justify-center">Q</div>
              <span className="font-bold text-sm text-slate-900 dark:text-zinc-50">Menu & More Options</span>
            </div>
            <button 
              id="mobile-menu-close"
              aria-label="Close menu"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Active Store Widget in Sheet (Clickable) */}
          {currentStore && (
            <button 
              id="mobile-sheet-workspace-trigger"
              className="w-full text-left mb-4 p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 rounded-2xl flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                {currentStore.logoUrl ? (
                  <img src={currentStore.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-zinc-900 p-0.5 border border-slate-200 dark:border-zinc-700 shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {currentStore.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider block">Active Store (Tap to Switch)</span>
                  <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 truncate block mt-0.5">{currentStore.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 shrink-0">
                Switch <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          )}

          {/* Nav Items in Sheet */}
          <div className="space-y-1.5 mb-4">
            {currentUser.role !== 'MERCHANT_EMPLOYEE' && (
              <a
                href="/users"
                className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all ${
                  activePath === '/users' 
                    ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 font-bold border border-sky-200/60 dark:border-sky-900/60' 
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </span>
                  User Directory & Permissions
                </div>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </a>
            )}

            {currentUser.role !== 'MERCHANT_EMPLOYEE' && (
              <a
                href="/developer"
                className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all ${
                  activePath === '/developer' 
                    ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 font-bold border border-sky-200/60 dark:border-sky-900/60' 
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  </span>
                  Developer Hub & Webhooks
                </div>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </a>
            )}

            {currentUser.role === 'SUPER_ADMIN' && (
              <a
                href="/settings"
                className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all ${
                  activePath === '/settings' 
                    ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 font-bold border border-sky-200/60 dark:border-sky-900/60' 
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </span>
                  Admin System Settings
                </div>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </a>
            )}

            {/* PWA Mobile App Install Action */}
            <button
              id="btn-pwa-install-mobile"
              className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200/80 dark:border-sky-900/60 cursor-pointer active:scale-95"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </span>
                Install Mobile App (PWA)
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-sky-600 text-white shadow-xs">INSTALL</span>
            </button>
          </div>

          {/* User Profile & Logout */}
          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400 font-bold text-xs flex items-center justify-center uppercase">
                {currentUser.name.slice(0, 2)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 truncate">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 truncate">{currentUser.email} • {roleLabels[currentUser.role]}</span>
              </div>
            </div>

            <a 
              href="/logout"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout Session
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DESKTOP SIDEBAR (Collapsible) */}
      {/* ========================================================================= */}
      <aside 
        id="desktop-sidebar" 
        className="hidden md:flex flex-col h-screen sticky top-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 transition-all duration-300 z-30 w-64 shrink-0 shadow-sm"
      >
        {/* Top Logo & App Title */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 sidebar-logo-container transition-opacity duration-200 min-w-0">
            {settings.appLogoUrl ? (
              <img src={settings.appLogoUrl} alt={settings.appName} className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-zinc-900 p-0.5 border border-slate-200 dark:border-zinc-700 shrink-0 shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-sky-600 dark:bg-sky-500 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                {settings.appName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="font-bold text-lg tracking-tight sidebar-logo-text text-slate-900 dark:text-zinc-50 truncate">{settings.appName}</span>
          </div>
          
          <button 
            id="sidebar-toggle"
            aria-label="Collapse sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-zinc-50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <svg id="chevron-left" className="w-4 h-4 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Global Merchant Workspace Switcher Widget in Desktop Sidebar */}
        <div className="p-3 border-b border-slate-100 dark:border-zinc-800/80 sidebar-logo-container">
          <div className="relative">
            <button
              id="desktop-workspace-trigger"
              className="w-full flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/60 transition-all text-left group cursor-pointer"
              title="Switch Active Store Workspace"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {currentStore?.logoUrl ? (
                  <img src={currentStore.logoUrl} alt="" className="w-7 h-7 rounded-lg object-contain bg-white dark:bg-zinc-900 p-0.5 border border-slate-200 dark:border-zinc-700 shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-sky-600/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 border border-sky-200 dark:border-sky-900">
                    {currentStore?.name ? currentStore.name.slice(0, 1).toUpperCase() : 'M'}
                  </div>
                )}
                <div className="flex flex-col min-w-0 sidebar-item-text">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider leading-none">Active Store</span>
                  <span className="font-bold text-xs text-slate-800 dark:text-zinc-100 truncate mt-0.5 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {currentStore?.name || 'Select Merchant'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 sidebar-item-text">
                <span className={`w-2 h-2 rounded-full ${
                  currentStore?.status === 'ACTIVE' ? 'bg-emerald-500' :
                  currentStore?.status === 'NEEDS_OTP' ? 'bg-amber-500' : 'bg-red-500'
                }`}></span>
                <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-zinc-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
              </div>
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-grow p-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                  isActive 
                    ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 font-bold border border-sky-200/60 dark:border-sky-900/60' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
                title={item.label}
              >
                <span className="w-4 h-4 flex items-center justify-center shrink-0">
                  {item.icon === 'LayoutDashboard' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 14a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>}
                  {item.icon === 'Store' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                  {item.icon === 'Receipt' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                  {item.icon === 'Users' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                  {item.icon === 'Code2' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                  {item.icon === 'Settings' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                </span>
                <span className="sidebar-item-text transition-opacity duration-200 truncate">
                  {item.label}
                </span>
              </a>
            );
          })}
        </nav>

        {/* Footer User details & Theme Toggle */}
        <div className="border-t border-slate-200 dark:border-zinc-800 p-3 flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-zinc-800/30 rounded-lg sidebar-logo-container transition-opacity duration-200">
            <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400 font-bold text-[11px] flex items-center justify-center shrink-0 uppercase">
              {currentUser.name.slice(0, 2)}
            </div>
            <div className="flex flex-col min-w-0 sidebar-item-text">
              <span className="font-bold text-[11px] text-slate-800 dark:text-zinc-200 truncate leading-none">{currentUser.name}</span>
              <span className="text-[9px] text-slate-400 truncate mt-0.5">{roleLabels[currentUser.role]}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
              id="desktop-theme-toggle"
              aria-label="Toggle Theme"
              className="flex items-center justify-center p-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60 transition-all flex-grow cursor-pointer"
              title="Toggle Theme"
            >
              <svg id="sun-icon-desktop" className="w-4 h-4 hidden dark:block text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              <svg id="moon-icon-desktop" className="w-4 h-4 block dark:hidden text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>

            <button
              id="btn-pwa-install-desktop"
              aria-label="Install PWA"
              className="flex items-center justify-center p-2 rounded-lg text-xs font-medium text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40 transition-all flex-grow cursor-pointer"
              title="Install Application (PWA)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>

            <a 
              href="/logout"
              aria-label="Logout"
              className="flex items-center justify-center p-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all flex-grow"
              title="Logout Session"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </a>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 4. MAIN CONTENT CONTAINER */}
      {/* ========================================================================= */}
      <main 
        id="main-content" 
        className="flex-grow flex flex-col min-w-0 animate-view-enter pb-24 md:pb-0"
        tabIndex={-1}
      >
        <div className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 4B. MOBILE BOTTOM NAVIGATION BAR (Sticky Fixed Bottom Tab Bar) */}
      {/* ========================================================================= */}
      <nav 
        id="mobile-bottom-nav"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-zinc-800 px-3 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb"
      >
        <a 
          href="/dashboard"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all active:scale-90 ${
            activePath === '/dashboard' 
              ? 'text-sky-600 dark:text-sky-400 font-bold' 
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <svg className="w-5 h-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 14a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>
          <span className="text-[10px] leading-none">Dashboard</span>
        </a>

        {isPrivileged && (
          <a 
            href="/merchants"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all active:scale-90 ${
              activePath === '/merchants' 
                ? 'text-sky-600 dark:text-sky-400 font-bold' 
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <svg className="w-5 h-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <span className="text-[10px] leading-none">Stores</span>
          </a>
        )}

        <a 
          href="/transactions"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all active:scale-90 ${
            activePath === '/transactions' 
              ? 'text-sky-600 dark:text-sky-400 font-bold' 
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <svg className="w-5 h-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          <span className="text-[10px] leading-none">Invoices</span>
        </a>

        <button 
          id="mobile-more-trigger"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer active:scale-90 ${
            activePath === '/users' || activePath === '/developer' || activePath === '/settings'
              ? 'text-sky-600 dark:text-sky-400 font-bold' 
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <svg className="w-5 h-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          <span className="text-[10px] leading-none">More</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 5. GLOBAL STORE WORKSPACE SWITCHER MODAL (Bottom Sheet on Mobile) */}
      {/* ========================================================================= */}
      <div id="modal-workspace-switcher" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 opacity-0 pointer-events-none transition-opacity duration-200">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm modal-backdrop-trigger cursor-pointer"></div>
        <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 w-full max-w-md overflow-hidden sheet-spring transform translate-y-4 sm:translate-y-0 sm:scale-95 modal-body flex flex-col max-h-[85vh]">
          {/* Mobile Drag Indicator */}
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto my-2.5 sm:hidden shrink-0"></div>

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-zinc-50">Switch Store Workspace</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Select active merchant store to view analytics & feeds</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 modal-close-trigger p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/50">
            <div className="relative">
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text"
                id="workspace-search-input"
                placeholder="Search merchant name or phone..."
                className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Store List */}
          <div id="workspace-store-list" className="p-3 overflow-y-auto space-y-1.5 flex-grow max-h-72">
            {accessibleMerchants.map(m => {
              const isSelected = currentStore?.id === m.id;
              return (
                <button
                  key={m.id}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all btn-select-workspace group ${
                    isSelected 
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800' 
                      : 'bg-white dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                  data-id={m.id}
                  data-name={m.name}
                  data-phone={m.phoneNumber}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {m.logoUrl ? (
                      <img src={m.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain bg-slate-50 dark:bg-zinc-900 p-0.5 border border-slate-200 dark:border-zinc-700 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-700">
                        {m.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-zinc-50 truncate">{m.name}</span>
                        {isSelected && (
                          <span className="text-[9px] font-bold bg-sky-600 text-white px-1.5 py-0.2 rounded-full">ACTIVE</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">{m.phoneNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      m.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                      m.status === 'NEEDS_OTP' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400' :
                      'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400'
                    }`}>
                      {m.status === 'ACTIVE' ? 'Active' : m.status === 'NEEDS_OTP' ? 'Syncing' : 'Dead'}
                    </span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900 flex items-center justify-between gap-2">
            <a
              href="/merchants"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add / Manage All Stores
            </a>
          </div>
        </div>
      </div>

      {/* Global Shadcn-style Toast Notification Container */}
      <div id="global-toast-container" className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"></div>

      {/* Global Shadcn-style Confirmation Dialog Modal */}
      <div id="global-confirm-dialog" className="fixed inset-0 z-[9998] flex items-center justify-center hidden" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm confirm-backdrop transition-opacity"></div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl relative z-10 transition-all duration-200 scale-95 opacity-0 confirm-card">
          <div className="flex items-start gap-3.5 mb-4">
            <div id="confirm-dialog-icon" className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="font-bold text-base text-slate-900 dark:text-zinc-50">Confirm Action</h3>
              <p id="confirm-dialog-desc" className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">Are you sure you want to proceed?</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button id="confirm-dialog-btn-cancel" className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              Cancel
            </button>
            <button id="confirm-dialog-btn-action" className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-sm cursor-pointer">
              Confirm
            </button>
          </div>
        </div>
      </div>      {/* ========================================================================= */}
      {/* 7. SMART PWA IN-APP INSTALL PROMPT BANNER (International Standard) */}
      {/* ========================================================================= */}
      <div
        id="pwa-install-banner"
        className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 transform transition-all duration-300 translate-y-24 opacity-0 pointer-events-none"
      >
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-sky-200/80 dark:border-sky-900/80 rounded-2xl p-4 shadow-2xl flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-600 p-2 text-white flex items-center justify-center shrink-0 shadow-md">
            {systemSettings?.appLogoUrl ? (
              <img src={systemSettings.appLogoUrl} alt="" className="w-full h-full object-contain" />
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">Install {systemSettings?.appName || 'QBiz Gateway'}</p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">Add to Home Screen for fast offline access</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-pwa-dismiss"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <button
              id="btn-pwa-install-action"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Install
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. IOS SAFARI "ADD TO HOME SCREEN" HELPER MODAL */}
      {/* ========================================================================= */}
      <div id="modal-ios-pwa-guide" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 opacity-0 pointer-events-none transition-opacity duration-200">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm ios-guide-backdrop cursor-pointer"></div>
        <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 w-full max-w-sm overflow-hidden sheet-spring transform translate-y-4 sm:translate-y-0 sm:scale-95 p-5 space-y-4">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto sm:hidden shrink-0"></div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <span className="font-bold text-xs text-slate-900 dark:text-zinc-50">Install on iOS (iPhone / iPad)</span>
            <button className="ios-guide-close text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="space-y-3 text-xs text-slate-600 dark:text-zinc-300">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40">
              <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">1</span>
              <p className="pt-0.5">Tap the <strong>Share</strong> icon (kotak panah ke atas) pada bilah bawah browser Safari.</p>
            </div>
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40">
              <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">2</span>
              <p className="pt-0.5">Gulir ke bawah dan pilih <strong>"Add to Home Screen" (Tambahkan ke Layar Utama)</strong>.</p>
            </div>
          </div>
          <button className="ios-guide-close w-full py-2.5 rounded-xl text-xs font-semibold bg-sky-600 text-white cursor-pointer active:scale-95">
            Mengerti & Tutup
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. CLIENT INTERACTIONS & SPA ROUTER ENGINE SCRIPT */}
      {/* ========================================================================= */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // =========================================================================
            // A. SPA Progress Bar Controller
            // =========================================================================
            function getProgressBar() {
              return document.getElementById('spa-progress-bar');
            }

            function startSpaProgress() {
              const bar = getProgressBar();
              if (!bar) return;
              bar.style.opacity = '1';
              bar.style.width = '30%';
              setTimeout(() => { if (bar.style.opacity === '1') bar.style.width = '70%'; }, 120);
              setTimeout(() => { if (bar.style.opacity === '1') bar.style.width = '90%'; }, 280);
            }

            function finishSpaProgress() {
              const bar = getProgressBar();
              if (!bar) return;
              bar.style.width = '100%';
              setTimeout(() => {
                bar.style.opacity = '0';
                setTimeout(() => { bar.style.width = '0%'; }, 200);
              }, 150);
            }

            // =========================================================================
            // B. Active Navigation Tabs Synchronizer
            // =========================================================================
            function updateActiveNavUI(targetPath) {
              const cleanPath = targetPath.split('?')[0].split('#')[0];

              // 1. Desktop Sidebar Links
              document.querySelectorAll('#desktop-sidebar nav a').forEach(a => {
                const href = a.getAttribute('href');
                const isMatch = href === cleanPath;
                if (isMatch) {
                  a.className = 'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all group bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-200/60 dark:border-sky-900/60';
                } else {
                  a.className = 'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all group text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60';
                }
              });

              // 2. Mobile Bottom Tab Bar
              document.querySelectorAll('#mobile-bottom-nav a, #mobile-bottom-nav button').forEach(el => {
                const href = el.getAttribute('href');
                const isMatch = href ? (href === cleanPath) : (['/users', '/developer', '/settings'].includes(cleanPath));
                if (isMatch) {
                  el.className = 'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all text-sky-600 dark:text-sky-400 font-bold active:scale-90';
                } else {
                  el.className = 'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 active:scale-90';
                }
              });

              // 3. Mobile "More" Drawer Links
              document.querySelectorAll('#mobile-drawer a').forEach(a => {
                const href = a.getAttribute('href');
                if (!href || href === '/logout') return;
                const isMatch = href === cleanPath;
                if (isMatch) {
                  a.className = 'flex items-center justify-between p-3 rounded-xl text-xs transition-all bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 font-bold border border-sky-200/60 dark:border-sky-900/60';
                } else {
                  a.className = 'flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800';
                }
              });
            }

            // =========================================================================
            // C. SPA Router Navigation Engine (Zero Page Reload)
            // =========================================================================
            let isNavigating = false;

            async function spaNavigateTo(url, pushHistory = true) {
              if (isNavigating) return;
              if (url === window.location.pathname + window.location.search) return;

              isNavigating = true;
              startSpaProgress();

              // Close mobile bottom sheet & workspace modal
              closeDrawer();
              closeWorkspaceModal();

              // Instant visual tab switch feedback (0ms)
              updateActiveNavUI(url);

              const mainEl = document.getElementById('main-content');
              if (mainEl) {
                mainEl.style.opacity = '0.35';
                mainEl.style.transform = 'translateY(4px)';
              }

              try {
                const res = await fetch(url, {
                  headers: { 'X-Requested-With': 'SPA-Navigation' }
                });

                // On non-OK response or redirect to external page, fallback to standard reload
                if (!res.ok) {
                  window.location.href = url;
                  return;
                }

                if (res.redirected && res.url !== url) {
                  window.location.href = res.url;
                  return;
                }

                const html = await res.text();
                const parser = new DOMParser();
                const newDoc = parser.parseFromString(html, 'text/html');

                // Update page title & favicon
                if (newDoc.title) document.title = newDoc.title;

                const incomingMain = newDoc.getElementById('main-content');
                if (incomingMain && mainEl) {
                  mainEl.innerHTML = incomingMain.innerHTML;
                  mainEl.classList.remove('animate-view-enter');
                  void mainEl.offsetWidth; // Force layout reflow to replay smooth enter animation
                  mainEl.classList.add('animate-view-enter');

                  // Execute and evaluate newly loaded script blocks
                  const scripts = mainEl.querySelectorAll('script');
                  scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.textContent = oldScript.textContent;
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                  });
                } else {
                  window.location.href = url;
                  return;
                }

                if (pushHistory) {
                  window.history.pushState({ path: url }, '', url);
                }

                window.scrollTo({ top: 0, behavior: 'instant' });

                if (mainEl) {
                  requestAnimationFrame(() => {
                    mainEl.style.opacity = '1';
                    mainEl.style.transform = 'translateY(0)';
                  });
                }

                // Re-bind interactive behaviors and fire page loaded event
                initInteractiveBehaviors();
                window.dispatchEvent(new CustomEvent('spa:navigated', { detail: { url } }));

              } catch (err) {
                console.error('[SPA Navigation Error]', err);
                window.location.href = url;
              } finally {
                finishSpaProgress();
                isNavigating = false;
              }
            }

            window.spaNavigateTo = spaNavigateTo;

            // Global Click Interceptor for SPA Navigation
            document.addEventListener('click', function(e) {
              const tabItem = e.target.closest('#mobile-bottom-nav a, #mobile-bottom-nav button');
              if (tabItem) {
                tabItem.classList.add('tab-spring-tap');
                setTimeout(() => tabItem.classList.remove('tab-spring-tap'), 340);
              }

              const link = e.target.closest('a');
              if (!link) return;

              const href = link.getAttribute('href');
              if (!href) return;

              // Bypass non-SPA links
              if (
                href.startsWith('#') ||
                href.startsWith('javascript:') ||
                href.startsWith('mailto:') ||
                href.startsWith('tel:') ||
                link.hasAttribute('download') ||
                link.getAttribute('target') === '_blank' ||
                href === '/logout' ||
                href.startsWith('/pay/') ||
                href.startsWith('/docs') ||
                href.startsWith('/static/') ||
                href.startsWith('/llms') ||
                link.dataset.noSpa === 'true' ||
                e.ctrlKey || e.metaKey || e.shiftKey || e.altKey
              ) {
                return;
              }

              if (href.startsWith('/') || href.startsWith(window.location.origin)) {
                e.preventDefault();
                const targetUrl = href.startsWith('/') ? href : new URL(href).pathname + new URL(href).search;
                spaNavigateTo(targetUrl, true);
              }
            });

            // Browser Back / Forward History Navigation
            window.addEventListener('popstate', function() {
              spaNavigateTo(window.location.pathname + window.location.search, false);
            });

            // =========================================================================
            // D. Global Interactive UI Components (Modals, Toasts, Theme, Sidebar)
            // =========================================================================
            function toggleTheme() {
              const isDark = document.documentElement.classList.contains('dark');
              if (isDark) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
              } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
              }
            }

            const deskThemeBtn = document.getElementById('desktop-theme-toggle');
            const mobThemeBtn = document.getElementById('mobile-theme-toggle');
            if (deskThemeBtn) deskThemeBtn.onclick = toggleTheme;
            if (mobThemeBtn) mobThemeBtn.onclick = toggleTheme;

            // Desktop Sidebar Collapse
            const sidebar = document.getElementById('desktop-sidebar');
            const sidebarToggle = document.getElementById('sidebar-toggle');
            const chevron = document.getElementById('chevron-left');
            
            let isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
            if (isCollapsed && sidebar) applyCollapse(true);
            
            function applyCollapse(collapsed) {
              if (!sidebar) return;
              if (collapsed) {
                sidebar.className = 'hidden md:flex flex-col h-screen sticky top-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 transition-all duration-300 z-30 w-16 shadow-sm';
                if (chevron) chevron.style.transform = 'rotate(180deg)';
                document.querySelectorAll('.sidebar-logo-text, .sidebar-item-text').forEach(el => el.classList.add('md:hidden'));
                document.querySelectorAll('.sidebar-logo-container').forEach(el => el.classList.add('opacity-0'));
              } else {
                sidebar.className = 'hidden md:flex flex-col h-screen sticky top-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 transition-all duration-300 z-30 w-64 shadow-sm';
                if (chevron) chevron.style.transform = 'rotate(0deg)';
                document.querySelectorAll('.sidebar-logo-text, .sidebar-item-text').forEach(el => el.classList.remove('md:hidden'));
                document.querySelectorAll('.sidebar-logo-container').forEach(el => el.classList.remove('opacity-0'));
              }
            }
            
            if (sidebarToggle) {
              sidebarToggle.onclick = function() {
                isCollapsed = !isCollapsed;
                localStorage.setItem('sidebar-collapsed', isCollapsed ? 'true' : 'false');
                applyCollapse(isCollapsed);
              };
            }

            // Mobile Bottom Sheet Menu ("More")
            const drawer = document.getElementById('mobile-drawer');
            const drawerBackdrop = document.getElementById('mobile-drawer-backdrop');
            const drawerBody = document.getElementById('mobile-drawer-body');
            const moreTriggerBtn = document.getElementById('mobile-more-trigger');
            const menuCloseBtn = document.getElementById('mobile-menu-close');
            const sheetWorkspaceBtn = document.getElementById('mobile-sheet-workspace-trigger');

            function openDrawer() {
              if (!drawer) return;
              drawer.classList.remove('hidden');
              setTimeout(() => {
                if (drawerBackdrop) drawerBackdrop.classList.remove('opacity-0');
                if (drawerBody) drawerBody.classList.remove('translate-y-full');
              }, 10);
            }

            function closeDrawer() {
              if (!drawer) return;
              if (drawerBackdrop) drawerBackdrop.classList.add('opacity-0');
              if (drawerBody) drawerBody.classList.add('translate-y-full');
              setTimeout(() => {
                drawer.classList.add('hidden');
              }, 300);
            }
            window.closeMobileDrawer = closeDrawer;

            if (moreTriggerBtn) moreTriggerBtn.onclick = openDrawer;
            if (menuCloseBtn) menuCloseBtn.onclick = closeDrawer;
            if (drawerBackdrop) drawerBackdrop.onclick = closeDrawer;

            if (sheetWorkspaceBtn) {
              sheetWorkspaceBtn.onclick = function() {
                closeDrawer();
                setTimeout(openWorkspaceModal, 250);
              };
            }

            // Global Workspace Switcher Modal
            const modalSwitcher = document.getElementById('modal-workspace-switcher');
            const searchInput = document.getElementById('workspace-search-input');

            function openWorkspaceModal() {
              if (!modalSwitcher) return;
              modalSwitcher.classList.remove('opacity-0', 'pointer-events-none');
              const body = modalSwitcher.querySelector('.modal-body');
              if (body) {
                body.classList.remove('scale-95', 'translate-y-4');
                body.classList.add('translate-y-0');
              }
              if (searchInput) {
                searchInput.value = '';
                setTimeout(() => searchInput.focus(), 100);
              }
            }

            function closeWorkspaceModal() {
              if (!modalSwitcher) return;
              modalSwitcher.classList.add('opacity-0', 'pointer-events-none');
              const body = modalSwitcher.querySelector('.modal-body');
              if (body) {
                body.classList.add('scale-95', 'translate-y-4');
                body.classList.remove('translate-y-0');
              }
            }
            window.closeWorkspaceModal = closeWorkspaceModal;

            function initInteractiveBehaviors() {
              document.querySelectorAll('#desktop-workspace-trigger, #mobile-workspace-trigger, .trigger-workspace-modal, #dashboard-btn-switch-store').forEach(el => {
                el.onclick = openWorkspaceModal;
              });

              document.querySelectorAll('.modal-close-trigger, .modal-backdrop-trigger').forEach(btn => {
                btn.onclick = closeWorkspaceModal;
              });

              if (searchInput) {
                searchInput.oninput = function(e) {
                  const q = e.target.value.toLowerCase();
                  document.querySelectorAll('.btn-select-workspace').forEach(card => {
                    const name = (card.getAttribute('data-name') || '').toLowerCase();
                    const phone = (card.getAttribute('data-phone') || '').toLowerCase();
                    if (name.includes(q) || phone.includes(q)) {
                      card.style.display = 'flex';
                    } else {
                      card.style.display = 'none';
                    }
                  });
                };
              }

              document.querySelectorAll('.btn-select-workspace').forEach(btn => {
                btn.onclick = async function() {
                  const merchantId = this.getAttribute('data-id');
                  if (!merchantId) return;
                  try {
                    const res = await fetch('/api/v1/workspaces/switch', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ merchantId })
                    });
                    const json = await res.json();
                    if (json.success) {
                      // Instantly refresh current view via SPA router
                      closeWorkspaceModal();
                      window.location.reload();
                    } else {
                      window.showToast({ type: 'error', title: 'Workspace Switch Failed', message: json.error || 'Failed to switch workspace.' });
                    }
                  } catch (e) {
                    window.showToast({ type: 'error', title: 'Network Error', message: 'Network error switching workspace.' });
                  }
                };
              });
            }

            window.initAppInteractiveBehaviors = initInteractiveBehaviors;
            initInteractiveBehaviors();

            // =========================================================================
            // E. Modern Toast Notification System
            // =========================================================================
            window.showToast = function(opts) {
              const container = document.getElementById('global-toast-container');
              if (!container) return;
              
              const type = typeof opts === 'string' ? 'info' : (opts.type || 'info');
              const title = typeof opts === 'string' ? 'Notification' : (opts.title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notification'));
              const message = typeof opts === 'string' ? opts : (opts.message || '');
              const duration = opts.duration || 4000;

              const toast = document.createElement('div');
              toast.className = 'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transform transition-all duration-300 translate-y-2 opacity-0 ' +
                (type === 'success' ? 'bg-white/95 dark:bg-zinc-900/95 border-emerald-200 dark:border-emerald-900/80 text-emerald-950 dark:text-emerald-50' :
                 type === 'error' ? 'bg-white/95 dark:bg-zinc-900/95 border-red-200 dark:border-red-900/80 text-red-950 dark:text-red-50' :
                 type === 'warning' ? 'bg-white/95 dark:bg-zinc-900/95 border-amber-200 dark:border-amber-900/80 text-amber-950 dark:text-amber-50' :
                 'bg-white/95 dark:bg-zinc-900/95 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-50');

              const iconSvg = type === 'success' ? '<svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' :
                type === 'error' ? '<svg class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' :
                type === 'warning' ? '<svg class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>' :
                '<svg class="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';

              toast.innerHTML = iconSvg +
                '<div class="flex-1 min-w-0">' +
                  '<p class="text-xs font-bold leading-none">' + title + '</p>' +
                  '<p class="text-xs text-slate-600 dark:text-zinc-400 mt-1.5 leading-normal break-words">' + message + '</p>' +
                '</div>' +
                '<button class="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors shrink-0 -mr-1 -mt-1 p-1 cursor-pointer">' +
                  '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>' +
                '</button>';

              const closeBtn = toast.querySelector('button');
              const dismiss = () => {
                toast.classList.add('opacity-0', 'translate-y-2');
                setTimeout(() => toast.remove(), 300);
              };
              if (closeBtn) closeBtn.onclick = dismiss;
              setTimeout(dismiss, duration);

              container.appendChild(toast);
              requestAnimationFrame(() => {
                toast.classList.remove('opacity-0', 'translate-y-2');
              });
            };

            // =========================================================================
            // F. Modern Confirmation Dialog
            // =========================================================================
            let confirmCallback = null;
            window.showConfirmDialog = function(opts) {
              const modal = document.getElementById('global-confirm-dialog');
              if (!modal) return;

              const card = modal.querySelector('.confirm-card');
              const titleEl = document.getElementById('confirm-dialog-title');
              const descEl = document.getElementById('confirm-dialog-desc');
              const btnAction = document.getElementById('confirm-dialog-btn-action');
              const btnCancel = document.getElementById('confirm-dialog-btn-cancel');
              const iconContainer = document.getElementById('confirm-dialog-icon');

              if (titleEl) titleEl.textContent = opts.title || 'Confirm Action';
              if (descEl) descEl.textContent = opts.message || opts.description || 'Are you sure you want to proceed?';
              
              if (btnAction) {
                btnAction.textContent = opts.confirmText || 'Confirm';
                if (opts.isDestructive) {
                  btnAction.className = 'px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm cursor-pointer';
                  if (iconContainer) {
                    iconContainer.className = 'w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0';
                  }
                } else {
                  btnAction.className = 'px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-sm cursor-pointer';
                  if (iconContainer) {
                    iconContainer.className = 'w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0';
                  }
                }
              }

              if (btnCancel) btnCancel.textContent = opts.cancelText || 'Cancel';

              confirmCallback = typeof opts.onConfirm === 'function' ? opts.onConfirm : null;

              modal.classList.remove('hidden');
              requestAnimationFrame(() => {
                if (card) {
                  card.classList.remove('scale-95', 'opacity-0');
                  card.classList.add('scale-100', 'opacity-100');
                }
              });
            };

            function closeGlobalConfirmModal() {
              const modal = document.getElementById('global-confirm-dialog');
              if (!modal) return;
              const card = modal.querySelector('.confirm-card');
              if (card) {
                card.classList.remove('scale-100', 'opacity-100');
                card.classList.add('scale-95', 'opacity-0');
              }
              setTimeout(() => {
                modal.classList.add('hidden');
                confirmCallback = null;
              }, 200);
            }

            const cancelBtn = document.getElementById('confirm-dialog-btn-cancel');
            const backdropEl = document.querySelector('#global-confirm-dialog .confirm-backdrop');
            const actionBtn = document.getElementById('confirm-dialog-btn-action');

            if (cancelBtn) cancelBtn.onclick = closeGlobalConfirmModal;
            if (backdropEl) backdropEl.onclick = closeGlobalConfirmModal;
            if (actionBtn) {
              actionBtn.onclick = function() {
                if (confirmCallback) confirmCallback();
                closeGlobalConfirmModal();
              };
            }

            // =========================================================================
            // G. International Standard PWA Install Engine & iOS Helper
            // =========================================================================
            let deferredPrompt = null;
            const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

            const installBanner = document.getElementById('pwa-install-banner');
            const installActionBtn = document.getElementById('btn-pwa-install-action');
            const installDismissBtn = document.getElementById('btn-pwa-dismiss');
            const installMobileBtn = document.getElementById('btn-pwa-install-mobile');
            const installDesktopBtn = document.getElementById('btn-pwa-install-desktop');
            const iosGuideModal = document.getElementById('modal-ios-pwa-guide');

            function showPwaBanner() {
              if (isStandalone || !installBanner) return;
              const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
              // Snooze for 24 hours
              if (dismissedAt && (Date.now() - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000)) {
                return;
              }
              installBanner.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
            }

            function hidePwaBanner() {
              if (!installBanner) return;
              installBanner.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
            }

            function openIosGuide() {
              if (!iosGuideModal) return;
              iosGuideModal.classList.remove('opacity-0', 'pointer-events-none');
              const card = iosGuideModal.querySelector('.sheet-spring');
              if (card) {
                card.classList.remove('translate-y-4', 'sm:scale-95');
                card.classList.add('translate-y-0', 'sm:scale-100');
              }
            }

            function closeIosGuide() {
              if (!iosGuideModal) return;
              iosGuideModal.classList.add('opacity-0', 'pointer-events-none');
              const card = iosGuideModal.querySelector('.sheet-spring');
              if (card) {
                card.classList.add('translate-y-4', 'sm:scale-95');
                card.classList.remove('translate-y-0', 'sm:scale-100');
              }
            }

            document.querySelectorAll('.ios-guide-close, .ios-guide-backdrop').forEach(el => {
              el.onclick = closeIosGuide;
            });

            window.addEventListener('beforeinstallprompt', (e) => {
              e.preventDefault();
              deferredPrompt = e;
              setTimeout(showPwaBanner, 3000);
            });

            async function triggerPwaInstall() {
              if (isStandalone) {
                window.showToast({ type: 'info', title: 'Already Installed', message: 'The application is already running in native standalone mode!' });
                return;
              }

              if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                  hidePwaBanner();
                }
                deferredPrompt = null;
              } else if (isIos) {
                hidePwaBanner();
                openIosGuide();
              } else {
                window.showToast({
                  type: 'info',
                  title: 'Install PWA',
                  message: 'To install, click the Install icon in your browser URL bar or Add to Home Screen in browser menu.'
                });
              }
            }

            if (installActionBtn) installActionBtn.onclick = triggerPwaInstall;
            if (installMobileBtn) installMobileBtn.onclick = function() {
              closeDrawer();
              setTimeout(triggerPwaInstall, 250);
            };
            if (installDesktopBtn) installDesktopBtn.onclick = triggerPwaInstall;

            if (installDismissBtn) {
              installDismissBtn.onclick = function() {
                localStorage.setItem('pwa-prompt-dismissed', String(Date.now()));
                hidePwaBanner();
              };
            }

            window.addEventListener('appinstalled', () => {
              hidePwaBanner();
              deferredPrompt = null;
              window.showToast({ type: 'success', title: 'App Installed', message: 'Application installed successfully to your home screen!' });
            });

          })();
        `
      }} />
    </div>
  );
}
