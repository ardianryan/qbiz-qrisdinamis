import React from 'react';

interface CheckoutPageProps {
  invoice: {
    id: string;
    orderId: string;
    baseAmount: number;
    uniqueCode: number;
    totalAmount: number;
    status: string;
    expiredAt: string;
  };
  merchant: {
    name: string;
  };
  qrSvgHtml: string;
}

export function CheckoutPage({ invoice, merchant, qrSvgHtml }: CheckoutPageProps) {
  const formattedBase = invoice.baseAmount.toLocaleString('id-ID');
  const formattedTotal = invoice.totalAmount.toLocaleString('id-ID');

  const diffMs = new Date(invoice.expiredAt).getTime() - Date.now();
  const diffMins = Math.max(0, Math.floor(diffMs / 1000 / 60));
  const diffSecs = Math.max(0, Math.floor((diffMs / 1000) % 60));
  const timerPlaceholder = `${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`;

  return (
    <html lang="id">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>QBiz Secure Checkout - Payment Gateway</title>
        <link rel="stylesheet" href="/static/styles.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              font-family: 'Outfit', sans-serif;
            }
            .font-mono-qbiz {
              font-family: 'JetBrains Mono', monospace;
            }
          `
        }} />
      </head>
      <body className="bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 min-h-screen flex flex-col justify-between antialiased">
        
        {/* Main Content Container */}
        <main className="flex-grow flex items-center justify-center p-4 py-8">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
            
            {/* Header / Merchant Info */}
            <div className="bg-slate-900 text-white p-5 text-center relative">
              <div className="absolute top-4 left-4 flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Secure Payment</span>
              </div>
              
              <h1 className="text-lg font-bold mt-2 text-slate-50">{merchant.name}</h1>
              <p className="text-xs text-slate-400 mt-0.5">Order ID: <span className="font-mono-qbiz">{invoice.orderId}</span></p>
            </div>

            {/* Price Details */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 text-center bg-slate-50/50 dark:bg-zinc-900/30">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Pembayaran</span>
              {(() => {
                const thousandsPart = Math.floor(invoice.totalAmount / 1000).toLocaleString('id-ID');
                const unitsPart = (invoice.totalAmount % 1000).toString().padStart(3, '0');
                return (
                  <>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 mt-1 font-mono-qbiz">
                      Rp {thousandsPart}<span className="text-sky-600 dark:text-sky-400">.{unitsPart}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed px-4">
                      PENTING: Mohon bayar sesuai nominal di atas. Perbedaan 3 digit terakhir (**{unitsPart}**) digunakan untuk verifikasi pembayaran instan Anda.
                    </p>
                  </>
                );
              })()}
            </div>

            {/* QR Code section */}
            <div className="p-6 flex flex-col items-center justify-center">
              
              {/* QR Container */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm relative group overflow-hidden max-w-[280px] w-full">
                <div dangerouslySetInnerHTML={{ __html: qrSvgHtml }} className="w-full h-full flex items-center justify-center" />
                
                {/* Expired overlay */}
                <div id="expired-overlay" className="absolute inset-0 bg-white/95 dark:bg-zinc-900/95 flex flex-col items-center justify-center p-4 text-center hidden">
                  <svg className="w-12 h-12 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <h3 className="font-bold text-slate-900 dark:text-zinc-50 text-sm">Pembayaran Kedaluwarsa</h3>
                  <p className="text-xs text-slate-400 mt-1">Silakan buat tagihan baru untuk menyelesaikan pembelian Anda.</p>
                </div>

                {/* Paid success overlay */}
                <div id="success-overlay" className="absolute inset-0 bg-emerald-50/95 dark:bg-emerald-950/95 flex flex-col items-center justify-center p-4 text-center hidden">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2 animate-bounce">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">Pembayaran Berhasil!</h3>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">Halaman ini akan menutup otomatis dalam beberapa detik.</p>
                </div>
              </div>

              {/* QRIS / Scan instructions */}
              <div className="flex items-center gap-1.5 mt-4">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 uppercase tracking-wide border border-sky-200/50">QRIS Dinamis</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">Semua E-Wallet & Bank</span>
              </div>

              {/* Countdown timer */}
              <div className="mt-5 w-full bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-3 border border-slate-100 dark:border-zinc-800 text-center">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Sisa Waktu Pembayaran</span>
                <div id="countdown-timer" className="text-xl font-bold font-mono-qbiz text-slate-700 dark:text-zinc-200 mt-0.5">
                  {timerPlaceholder}
                </div>
              </div>

              {/* Check status button */}
              <div className="mt-3 w-full">
                <button 
                  id="btn-check-status"
                  type="button"
                  className="w-full h-10 inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-medium text-xs rounded-xl transition-all active:scale-[0.98] shadow-sm cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Periksa Status Pembayaran
                </button>
              </div>

            </div>

            {/* Footer security */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Protected by QBiz Gateway Encryption
            </div>

          </div>
        </main>

        {/* Footer info */}
        <footer className="text-center py-4 text-[10px] text-slate-400 dark:text-zinc-600">
          &copy; 2026 QBiz Payment Solutions. All rights reserved.
        </footer>

        {/* Dynamic timer & polling status script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const invoiceId = ${JSON.stringify(invoice.id)};
              const expiredAt = new Date(${JSON.stringify(invoice.expiredAt)}).getTime();
              const timerDisplay = document.getElementById('countdown-timer');
              const expiredOverlay = document.getElementById('expired-overlay');
              const successOverlay = document.getElementById('success-overlay');

              // --- 1. COUNTDOWN TIMER ---
              function updateTimer() {
                const now = new Date().getTime();
                const distance = expiredAt - now;

                if (distance < 0) {
                  clearInterval(timerInterval);
                  if (timerDisplay) timerDisplay.textContent = 'EXPIRED';
                  if (expiredOverlay) expiredOverlay.classList.remove('hidden');
                  return;
                }

                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                if (timerDisplay) {
                  timerDisplay.textContent = 
                    String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
                }
              }

              const timerInterval = setInterval(updateTimer, 1000);
              updateTimer(); // Initial call

              // --- 2. PAYMENT STATUS POLLING ---
              function checkPaymentStatus() {
                fetch('/api/v1/invoices/' + invoiceId + '/status')
                  .then(res => res.json())
                  .then(data => {
                    if (data.status === 'PAID') {
                      clearInterval(timerInterval);
                      clearInterval(statusInterval);
                      if (successOverlay) successOverlay.classList.remove('hidden');
                      
                      // Redirect to client success page after 3 seconds
                      const targetRedirect = data.redirectUrl || data.callbackUrl;
                      if (targetRedirect) {
                        setTimeout(() => {
                          window.location.href = targetRedirect;
                        }, 3000);
                      }
                    } else if (data.status === 'EXPIRED') {
                      clearInterval(timerInterval);
                      clearInterval(statusInterval);
                      if (expiredOverlay) expiredOverlay.classList.remove('hidden');
                    }
                  })
                  .catch(err => console.error('Status check failed:', err));
              }

              const statusInterval = setInterval(checkPaymentStatus, 3000);
              checkPaymentStatus(); // Initial call

              // --- 3. MANUAL STATUS CHECK ---
              const btnCheckStatus = document.getElementById('btn-check-status');
              if (btnCheckStatus) {
                btnCheckStatus.addEventListener('click', function() {
                  const originalText = this.innerHTML;
                  this.disabled = true;
                  this.innerHTML = \`
                    <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17.75"></path></svg>
                    Memeriksa...
                  \`;

                  fetch('/api/v1/invoices/' + invoiceId + '/status')
                    .then(res => res.json())
                    .then(data => {
                      setTimeout(() => {
                        this.disabled = false;
                        this.innerHTML = originalText;
                        
                        if (data.status === 'PAID') {
                          clearInterval(timerInterval);
                          clearInterval(statusInterval);
                          if (successOverlay) successOverlay.classList.remove('hidden');
                          if (data.callbackUrl) {
                            setTimeout(() => {
                              window.location.href = data.callbackUrl;
                            }, 3000);
                          }
                        } else if (data.status === 'EXPIRED') {
                          clearInterval(timerInterval);
                          clearInterval(statusInterval);
                          if (expiredOverlay) expiredOverlay.classList.remove('hidden');
                        } else {
                          alert('Pembayaran belum masuk. Mohon tunggu atau coba beberapa saat lagi.');
                        }
                      }, 1000); // 1-second deliberate delay for loading state
                    })
                    .catch(err => {
                      setTimeout(() => {
                        this.disabled = false;
                        this.innerHTML = originalText;
                        alert('Gagal memeriksa status pembayaran. Koneksi bermasalah.');
                      }, 1000);
                    });
                });
              }
            })();
          `
        }} />
      </body>
    </html>
  );
}
