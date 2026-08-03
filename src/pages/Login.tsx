import React from 'react';

interface LoginPageProps {
  error?: string;
}

export function LoginPage({ error }: LoginPageProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-zinc-950">
      
      {/* ========================================================================= */}
      {/* LEFT COLUMN: BRAND PANEL (Split Screen on Desktop, Top Banner on Mobile) */}
      {/* ========================================================================= */}
      <div className="w-full md:w-1/2 bg-zinc-900 dark:bg-zinc-900/40 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col justify-between p-8 md:p-12 relative overflow-hidden shrink-0">
        
        {/* Floating background graphic details to avoid slop grids */}
        <div className="absolute top-1/4 -right-16 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl"></div>

        {/* Top Logo Section */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sky-500/20">
            Q
          </div>
          <span className="font-bold text-xl tracking-tight text-white">QBiz Gateway</span>
        </div>

        {/* Middle Value Proposition Copy (Design Taste: max 20 words subtext, no cliché words) */}
        <div className="my-12 md:my-auto max-w-sm relative z-10">
          <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-semibold">
            In-House Infrastructure
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-none mt-2">
            Dynamic QRIS Payment Router
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed mt-4">
            Connect GoBiz portals, automate bank mutations, and trigger webhook callbacks directly to your POS system.
          </p>
        </div>

        {/* Bottom Metadata */}
        <div className="text-[10px] text-zinc-500 font-mono relative z-10 hidden md:block">
          QBIZ GATEWAY HUB v2.1 &bull; 2026 PRODUCTION RUNTIME
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: LOGIN FORM PANEL */}
      {/* ========================================================================= */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-sm flex flex-col gap-6">
          
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
              Access the Gateway
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5">
              Enter credentials to manage QRIS listeners and view live transactions.
            </p>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-lg p-3 flex gap-3 text-xs leading-relaxed" role="alert">
              <svg className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <span className="font-semibold">Authentication Failed:</span>{' '}
                {error === 'forbidden' 
                  ? 'Access denied. You do not have permissions to view this resource.' 
                  : 'Invalid email or password credentials. Please try again.'}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form action="/login" method="POST" className="space-y-4">
            
            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Email Address
              </label>
              <input 
                type="email" 
                id="login-email" 
                name="email" 
                required 
                placeholder="name@qbiz.com"
                className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Password
                </label>
                <a href="#" className="text-xs text-sky-600 dark:text-sky-400 hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  id="login-password" 
                  name="password" 
                  required 
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all pr-10"
                />
                
                {/* Toggle Password Visibility */}
                <button 
                  type="button" 
                  id="btn-toggle-password"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                  aria-label="Toggle password text visibility"
                >
                  {/* Eye Open */}
                  <svg id="eye-open" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {/* Eye Closed */}
                  <svg id="eye-closed" className="w-4 h-4 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A7.971 7.971 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2.5 pt-1.5">
              <input 
                type="checkbox" 
                id="login-remember" 
                name="remember" 
                className="w-4 h-4 text-sky-600 border-slate-200 dark:border-zinc-800 rounded focus:ring-sky-500 focus:ring-2 cursor-pointer bg-transparent"
              />
              <label htmlFor="login-remember" className="text-xs text-slate-600 dark:text-zinc-400 cursor-pointer">
                Keep me logged in for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2.5">
              <button 
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 flex items-center justify-center gap-2 cursor-pointer"
              >
                Sign In to Dashboard
              </button>
            </div>
          </form>
          
          <div className="text-center pt-2 text-xs text-slate-400">
            For demo login credentials, check the admin manual or contact operations.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CLIENT INTERACTION SCRIPT */}
      {/* ========================================================================= */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            const pwdInput = document.getElementById('login-password');
            const toggleBtn = document.getElementById('btn-toggle-password');
            const eyeOpen = document.getElementById('eye-open');
            const eyeClosed = document.getElementById('eye-closed');

            if (toggleBtn && pwdInput) {
              toggleBtn.addEventListener('click', function() {
                if (pwdInput.type === 'password') {
                  pwdInput.type = 'text';
                  if (eyeOpen) eyeOpen.classList.add('hidden');
                  if (eyeClosed) eyeClosed.classList.remove('hidden');
                } else {
                  pwdInput.type = 'password';
                  if (eyeOpen) eyeOpen.classList.remove('hidden');
                  if (eyeClosed) eyeClosed.classList.add('hidden');
                }
              });
            }
          })();
        `
      }} />

    </div>
  );
}
