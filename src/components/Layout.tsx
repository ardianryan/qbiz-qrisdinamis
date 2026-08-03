import React from 'react';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'REGIONAL_ADMIN' | 'MERCHANT' | 'MERCHANT_EMPLOYEE';
  merchantId: string | null;
}

interface LayoutProps {
  children: React.ReactNode;
  activePath: string;
  user?: UserSession;
}

export function Layout({ children, activePath, user }: LayoutProps) {
  // Define fallback user for demo purposes if not authenticated (should not happen in prod due to middleware)
  const currentUser = user || {
    id: 'usr_demo',
    name: 'Guest User',
    email: 'guest@qbiz.com',
    role: 'MERCHANT' as const,
    merchantId: null
  };

  // Enforce role-based visibility:
  // - SUPER_ADMIN, ADMIN, REGIONAL_ADMIN can access Merchants, Transactions, Developer Hub.
  // - MERCHANT, MERCHANT_EMPLOYEE can ONLY access Transactions (Live Transaction Monitor).
  const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN'].includes(currentUser.role);

  const navItems = [];
  if (isPrivileged) {
    navItems.push({ label: 'Merchants', path: '/merchants', icon: 'Store' });
  }
  navItems.push({ label: 'Transactions', path: '/transactions', icon: 'Receipt' });
  if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
    navItems.push({ label: 'User Directory', path: '/users', icon: 'Users' });
  }
  if (currentUser.role !== 'MERCHANT_EMPLOYEE') {
    navItems.push({ label: 'Developer Hub', path: '/developer', icon: 'Code2' });
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
    <div className="min-h-screen flex flex-col md:flex-row relative">
      
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
      <header className="sticky top-0 z-40 w-full md:hidden h-16 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-600 dark:bg-sky-500 flex items-center justify-center text-white font-bold text-lg">
            Q
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-zinc-50">QBiz Gateway</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Theme Toggle Mobile */}
          <button 
            id="mobile-theme-toggle"
            aria-label="Toggle Dark Mode"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {/* Sun Icon */}
            <svg id="sun-icon-mobile" className="w-5 h-5 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
            {/* Moon Icon */}
            <svg id="moon-icon-mobile" className="w-5 h-5 block dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          {/* Hamburger Menu Button */}
          <button 
            id="mobile-menu-open"
            aria-label="Open navigation menu"
            aria-expanded="false"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE DRAWER OVERLAY & MENU */}
      {/* ========================================================================= */}
      <div id="mobile-drawer" className="fixed inset-0 z-50 hidden md:hidden">
        {/* Backdrop overlay */}
        <div id="mobile-drawer-backdrop" className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300 opacity-0"></div>
        {/* Drawer body */}
        <aside id="mobile-drawer-body" className="absolute top-0 right-0 w-80 max-w-[85vw] h-full bg-white dark:bg-zinc-900 shadow-2xl flex flex-col p-6 transition-transform duration-300 translate-x-full">
          <div className="flex items-center justify-between mb-6">
            <span className="font-bold text-xl text-slate-900 dark:text-zinc-50">QBiz Hub</span>
            <button 
              id="mobile-menu-close"
              aria-label="Close navigation menu"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User profile details in mobile view */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl mb-6">
            <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400 font-bold text-sm flex items-center justify-center uppercase">
              {currentUser.name.slice(0, 2)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 truncate">{currentUser.name}</span>
              <span className="text-[10px] text-slate-500 truncate">{currentUser.email}</span>
              <span className="w-max mt-1 text-[9px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {roleLabels[currentUser.role]}
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-2 flex-grow">
            {navItems.map((item) => {
              const isActive = activePath === item.path;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                    isActive 
                      ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <span className="w-5 h-5 flex items-center justify-center">
                    {item.icon === 'Store' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    {item.icon === 'Receipt' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                    {item.icon === 'Users' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                    {item.icon === 'Code2' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                  </span>
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Logout Mobile */}
          <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-4">
            <a 
              href="/logout"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout Session
            </a>
          </div>
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* 3. DESKTOP SIDEBAR (Collapsible) */}
      {/* ========================================================================= */}
      <aside 
        id="desktop-sidebar" 
        className="hidden md:flex flex-col h-screen sticky top-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 transition-all duration-300 z-30 w-64 shrink-0"
      >
        {/* Header Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 sidebar-logo-container transition-opacity duration-200">
            <div className="w-8 h-8 rounded-lg bg-sky-600 dark:bg-sky-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
              Q
            </div>
            <span className="font-bold text-lg tracking-tight sidebar-logo-text text-slate-900 dark:text-zinc-50">QBiz Gateway</span>
          </div>
          
          <button 
            id="sidebar-toggle"
            aria-label="Collapse sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-zinc-50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {/* Collapse / Chevron Left Icon */}
            <svg id="chevron-left" className="w-4 h-4 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-grow p-4 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
                title={item.label}
              >
                <span className="w-5 h-5 flex items-center justify-center shrink-0">
                  {item.icon === 'Store' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                  {item.icon === 'Receipt' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                  {item.icon === 'Users' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                  {item.icon === 'Code2' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                </span>
                <span className="sidebar-item-text transition-opacity duration-200 truncate">
                  {item.label}
                </span>
              </a>
            );
          })}
        </nav>

        {/* Footer Settings, User details & Theme Toggle */}
        <div className="border-t border-slate-200 dark:border-zinc-800 p-4 flex flex-col gap-2 shrink-0">
          
          {/* User profile details bottom of sidebar */}
          <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-zinc-800/30 rounded-lg sidebar-logo-container transition-opacity duration-200">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
              {currentUser.name.slice(0, 2)}
            </div>
            <div className="flex flex-col min-w-0 sidebar-item-text">
              <span className="font-bold text-[11px] text-slate-800 dark:text-zinc-200 truncate leading-none">{currentUser.name}</span>
              <span className="text-[9px] text-slate-400 truncate mt-0.5">{currentUser.email}</span>
              <span className="w-max mt-1 text-[8px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400 px-1 py-0.5 rounded uppercase tracking-wider scale-90 -ml-1">
                {roleLabels[currentUser.role]}
              </span>
            </div>
          </div>

          {/* Theme Toggle Desktop */}
          <button 
            id="desktop-theme-toggle"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/60 transition-all w-full"
          >
            <span className="w-5 h-5 flex items-center justify-center shrink-0">
              <svg id="sun-icon-desktop" className="w-5 h-5 hidden dark:block text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              <svg id="moon-icon-desktop" className="w-5 h-5 block dark:hidden text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </span>
            <span className="sidebar-item-text truncate">
              <span className="block dark:hidden">Dark Mode</span>
              <span className="hidden dark:block">Light Mode</span>
            </span>
          </button>

          {/* Logout Button */}
          <a 
            href="/logout"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all w-full"
          >
            <span className="w-5 h-5 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </span>
            <span className="sidebar-item-text truncate">Logout Session</span>
          </a>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 4. MAIN CONTENT CONTAINER */}
      {/* ========================================================================= */}
      <main 
        id="main-content" 
        className="flex-grow flex flex-col min-w-0 transition-all duration-300 md:ml-0"
        tabIndex={-1}
      >
        <div className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 5. LIGHTWEIGHT CLIENT INTERACTIONS SCRIPT */}
      {/* ========================================================================= */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // --- A. Theme Management ---
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
            if (deskThemeBtn) deskThemeBtn.addEventListener('click', toggleTheme);
            if (mobThemeBtn) mobThemeBtn.addEventListener('click', toggleTheme);

            // --- B. Desktop Sidebar Collapse ---
            const sidebar = document.getElementById('desktop-sidebar');
            const sidebarToggle = document.getElementById('sidebar-toggle');
            const chevron = document.getElementById('chevron-left');
            
            // Check state
            let isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
            if (isCollapsed && sidebar) {
              applyCollapse(true);
            }
            
            function applyCollapse(collapsed) {
              if (!sidebar) return;
              if (collapsed) {
                sidebar.className = 'hidden md:flex flex-col h-screen sticky top-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 transition-all duration-300 z-30 w-16';
                if (chevron) chevron.style.transform = 'rotate(180deg)';
                document.querySelectorAll('.sidebar-logo-text, .sidebar-item-text').forEach(el => el.classList.add('md:hidden'));
                document.querySelectorAll('.sidebar-logo-container').forEach(el => el.classList.add('opacity-0'));
              } else {
                sidebar.className = 'hidden md:flex flex-col h-screen sticky top-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 transition-all duration-300 z-30 w-64';
                if (chevron) chevron.style.transform = 'rotate(0deg)';
                document.querySelectorAll('.sidebar-logo-text, .sidebar-item-text').forEach(el => el.classList.remove('md:hidden'));
                document.querySelectorAll('.sidebar-logo-container').forEach(el => el.classList.remove('opacity-0'));
              }
            }
            
            if (sidebarToggle) {
              sidebarToggle.addEventListener('click', function() {
                isCollapsed = !isCollapsed;
                localStorage.setItem('sidebar-collapsed', isCollapsed);
                applyCollapse(isCollapsed);
              });
            }

            // --- C. Mobile Drawer Menu Toggle ---
            const openBtn = document.getElementById('mobile-menu-open');
            const closeBtn = document.getElementById('mobile-menu-close');
            const drawer = document.getElementById('mobile-drawer');
            const backdrop = document.getElementById('mobile-drawer-backdrop');
            const body = document.getElementById('mobile-drawer-body');
            
            function openMobileMenu() {
              if (!drawer || !backdrop || !body) return;
              drawer.classList.remove('hidden');
              openBtn.setAttribute('aria-expanded', 'true');
              setTimeout(() => {
                backdrop.classList.add('opacity-100');
                body.classList.remove('translate-x-full');
              }, 10);
            }
            
            function closeMobileMenu() {
              if (!drawer || !backdrop || !body) return;
              backdrop.classList.remove('opacity-100');
              body.classList.add('translate-x-full');
              openBtn.setAttribute('aria-expanded', 'false');
              setTimeout(() => {
                drawer.classList.add('hidden');
              }, 300);
            }
            
            if (openBtn) openBtn.addEventListener('click', openMobileMenu);
            if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);
            if (backdrop) backdrop.addEventListener('click', closeMobileMenu);
          })();
        `
      }} />
      
    </div>
  );
}
