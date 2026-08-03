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
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: string; // JSON array of items
  };
  merchant: {
    name: string;
  };
  qrSvgHtml: string;
}

export function CheckoutPage({ invoice, merchant, qrSvgHtml }: CheckoutPageProps) {
  // Parse items
  let purchaseItems: Array<{ name: string; quantity: number; price: number }> = [];
  try {
    purchaseItems = JSON.parse(invoice.items || '[]');
  } catch (_e) {
    purchaseItems = [];
  }

  // Gracefully fallback to showing base amount if items array is empty
  if (!Array.isArray(purchaseItems) || purchaseItems.length === 0) {
    purchaseItems = [
      {
        name: `Pembelian #${invoice.orderId}`,
        quantity: 1,
        price: invoice.baseAmount
      }
    ];
  }

  // Format payment expiry date in ID-id format: "Senin, 3 Agustus 2026 19:15 WIB"
  const expiredDate = new Date(invoice.expiredAt);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Agustus' /* fallback list */, 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dayName = days[expiredDate.getDay()];
  const dateNum = expiredDate.getDate();
  const monthName = months[expiredDate.getMonth() + 1] || 'Agustus';
  const yearNum = expiredDate.getFullYear();
  const hourStr = String(expiredDate.getHours()).padStart(2, '0');
  const minStr = String(expiredDate.getMinutes()).padStart(2, '0');
  const formattedExpiry = `${dayName}, ${dateNum} ${monthName} ${yearNum} ${hourStr}:${minStr} WIB`;

  // Format monetary amounts
  const formattedTotal = invoice.totalAmount.toLocaleString('id-ID');

  // Initial countdown placeholder format "0 : 05 : 00"
  const diffMs = new Date(invoice.expiredAt).getTime() - Date.now();
  const diffMins = Math.max(0, Math.floor(diffMs / 1000 / 60));
  const diffSecs = Math.max(0, Math.floor((diffMs / 1000) % 60));
  const timerPlaceholder = `0 : ${String(diffMins).padStart(2, '0')} : ${String(diffSecs).padStart(2, '0')}`;

  return (
    <html lang="id">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>QBiz Secure Checkout - Portal Pembayaran</title>
        <link rel="stylesheet" href="/static/styles.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              font-family: 'Outfit', sans-serif;
              background-color: #2ea1f8;
            }
            .font-mono-qbiz {
              font-family: 'JetBrains Mono', monospace;
            }
            .checkout-card {
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              width: 100%;
              min-height: auto;
              margin: auto !important; /* Center correctly without cropping in flex container */
            }
            /* Rounded corners for left/right panels on mobile */
            .rounded-left-panel {
              border-top-left-radius: 16px;
              border-top-right-radius: 16px;
            }
            .rounded-right-panel {
              border-bottom-left-radius: 16px;
              border-bottom-right-radius: 16px;
            }
            @media (min-width: 768px) {
              .checkout-card {
                border-radius: 24px;
                overflow: hidden;
                max-width: 1040px !important;
                min-height: 0 !important;
                height: auto !important;
              }
              .rounded-left-panel {
                border-top-left-radius: 24px;
                border-bottom-left-radius: 24px;
                border-top-right-radius: 0;
              }
              .rounded-right-panel {
                border-top-right-radius: 24px;
                border-bottom-right-radius: 24px;
                border-bottom-left-radius: 0;
              }
            }
          `
        }} />
      </head>
      <body className="text-slate-800 dark:text-zinc-200 min-h-screen flex p-4 md:p-12 antialiased">
        
        {/* Responsive Container */}
        <div className="w-full bg-white dark:bg-zinc-900 checkout-card rounded-2xl md:rounded-3xl flex flex-col md:flex-row transition-all duration-300">
          
          {/* LEFT PANEL - White checkout section */}
          <div className="w-full md:w-[48%] bg-white dark:bg-zinc-950 p-5 md:p-8 flex flex-col justify-between rounded-left-panel border-b md:border-b-0 md:border-r border-slate-100 dark:border-zinc-800/50">
            <div>
              {/* Back button */}
              <a 
                href="#" 
                id="back-btn"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors font-medium mb-6"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Kembali
              </a>

              {/* Timer Title & Value */}
              <div className="text-center md:text-left mb-6">
                <span className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Selesaikan pembayaran dalam</span>
                <div id="countdown-timer" className="text-3xl md:text-4xl font-bold text-sky-500 dark:text-sky-400 mt-2 tracking-widest font-mono-qbiz select-none">
                  {timerPlaceholder}
                </div>
              </div>

              {/* Deadline expiry date display */}
              <div className="text-center md:text-left mb-6 border-b border-slate-100 dark:border-zinc-800/80 pb-5">
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wide block">Batas akhir pembayaran</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-1 block">
                  {formattedExpiry}
                </span>
              </div>

              {/* Payment Method & Copy amount */}
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">QRIS by ShopeePay</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 uppercase border border-sky-100 dark:border-sky-900/30">Dinamis</span>
                  </div>
                  {/* QRIS tiny logo */}
                  <div className="w-6 h-6 flex items-center justify-center opacity-70">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-slate-800 dark:fill-zinc-300"><path d="M0 0h24v24H0V0zm2 2v8h8V2H2zm2 2h4v4H4V4zm8-2v4h4V2h-4zm2 2h2v2h-2V4zM2 12v10h10V12H2zm2 2h6v6H4v-6zm10-2v2h2v-2h-2zm2 2v2h4v-2h-4zm0 2h-2v4h4v-4h-2zm-2 2h-2v2h2v-2zm8-6v4h-2v-4h2zm-2 6h2v2h-2v-2z"/></svg>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Jumlah Bayar</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-zinc-50 font-mono-qbiz mt-1 block">
                      Rp{formattedTotal}
                    </span>
                  </div>
                  <button 
                    id="copy-amount-btn" 
                    data-amount={invoice.totalAmount}
                    className="text-xs font-bold text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 select-none cursor-pointer flex items-center gap-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg active:scale-[0.97] transition-all"
                  >
                    Salin
                  </button>
                </div>
              </div>

              {/* QR CODE DISPLAY */}
              <div className="flex flex-col items-center justify-center py-4 relative">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden max-w-[240px] w-full flex items-center justify-center">
                  <div dangerouslySetInnerHTML={{ __html: qrSvgHtml }} className="w-full h-full" />
                  
                  {/* Expired Overlay */}
                  <div id="expired-overlay" className="absolute inset-0 bg-white/95 dark:bg-zinc-950/95 flex flex-col items-center justify-center p-4 text-center hidden">
                    <svg className="w-10 h-10 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <h4 className="font-bold text-slate-900 dark:text-zinc-50 text-xs">Kedaluwarsa</h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 leading-relaxed">Invoice telah kedaluwarsa. Silakan checkout ulang.</p>
                  </div>

                  {/* Paid Success Overlay */}
                  <div id="success-overlay" className="absolute inset-0 bg-emerald-50/95 dark:bg-emerald-950/95 flex flex-col items-center justify-center p-4 text-center hidden">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2 animate-bounce">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-xs">Pembayaran Sukses!</h4>
                    <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">Mengalihkan halaman dalam beberapa detik...</p>
                  </div>
                </div>
                
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-3 block italic">
                  *Klik untuk memperbesar kode QR
                </span>
              </div>
            </div>

            {/* Cara Pembayaran Accordion Trigger */}
            <div className="mt-6 border-t border-slate-100 dark:border-zinc-800/80 pt-6">
              <button 
                id="accordion-toggle-btn"
                type="button"
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer"
              >
                Cara pembayaran
                <svg id="accordion-arrow" className="w-3.5 h-3.5 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              {/* Accordion Content */}
              <div id="accordion-content" className="max-h-0 overflow-hidden transition-all duration-300 mt-2 px-1 text-slate-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                <ol className="list-decimal pl-4 space-y-1.5 py-2">
                  <li>Buka aplikasi e-wallet atau M-Banking favorit Anda (ShopeePay, GoPay, OVO, Dana, LinkAja, BCA, Mandiri, dll).</li>
                  <li>Pilih menu **Scan / Bayar QRIS**.</li>
                  <li>Scan kode QR yang tampil di layar halaman pembayaran ini.</li>
                  <li>Periksa kembali nominal pembayaran Anda (nominal pembayaran harus persis **Rp{formattedTotal}**).</li>
                  <li>Selesaikan transaksi. Halaman ini akan otomatis terupdate setelah pembayaran terverifikasi.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Light grey transaction & purchase breakdown */}
          <div className="w-full md:w-[52%] bg-[#f4f8fc] dark:bg-zinc-900 p-6 md:p-10 flex flex-col justify-between rounded-right-panel">
            <div>
              {/* Header Logo */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold text-base">
                  P
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight leading-none text-sm">Premium Portal</h3>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 tracking-wider uppercase font-bold">Checkout Gateway</span>
                </div>
              </div>

              {/* Guide Alert Text */}
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
                Pastikan anda melakukan pembayaran dengan nominal yang tepat dan sebelum melewati batas pembayaran.
              </p>

              {/* Detail Transaksi */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-950 dark:text-zinc-100 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200/60 dark:border-zinc-800">Detail Transaksi</h4>
                
                <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase block">Merchant</span>
                    <span className="text-slate-800 dark:text-zinc-200 font-semibold mt-0.5 block">{merchant.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase block">Nama Pelanggan</span>
                    <span className="text-slate-800 dark:text-zinc-200 font-semibold mt-0.5 block">{invoice.customerName || 'Pelanggan'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase block">No Invoice</span>
                    <span className="text-slate-800 dark:text-zinc-200 font-mono-qbiz mt-0.5 block">{invoice.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase block">No Hp</span>
                    <span className="text-slate-800 dark:text-zinc-200 font-mono-qbiz mt-0.5 block">{invoice.customerPhone || '-'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase block">No Referensi</span>
                    <span className="text-slate-800 dark:text-zinc-200 font-mono-qbiz mt-0.5 block text-[11px] truncate" title={invoice.orderId}>{invoice.orderId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase block">Email</span>
                    <span className="text-slate-800 dark:text-zinc-200 font-semibold mt-0.5 block truncate" title={invoice.customerEmail}>{invoice.customerEmail || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Rincian Pembelian */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-950 dark:text-zinc-100 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200/60 dark:border-zinc-800">Rincian Pembelian</h4>
                
                <div className="bg-white dark:bg-zinc-950/40 p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800/80">
                  {/* Purchase Item List */}
                  <div className="space-y-2 mb-3">
                    {purchaseItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-zinc-400 font-medium">
                          {item.name} <span className="text-slate-400 dark:text-zinc-500 font-normal ml-1">({item.quantity}x)</span>
                        </span>
                        <span className="font-mono-qbiz text-slate-800 dark:text-zinc-300 font-medium">
                          Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Kode Unik (Unique Code line item display) */}
                  <div className="flex justify-between items-center text-xs text-amber-600 dark:text-amber-500 font-semibold border-t border-slate-100 dark:border-zinc-800/50 pt-2.5 mb-2.5">
                    <span>Kode Unik</span>
                    <span className="font-mono-qbiz">Rp{invoice.uniqueCode.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Total Payment Amount */}
                  <div className="flex justify-between items-center border-t border-slate-200 dark:border-zinc-800 pt-3 text-xs font-bold text-slate-900 dark:text-zinc-100">
                    <span>Total</span>
                    <span className="font-mono-qbiz text-sm text-sky-600 dark:text-sky-400">
                      Rp{formattedTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom check button */}
            <div className="mt-4 pt-4 border-t border-slate-200/55 dark:border-zinc-800/80 flex flex-col gap-2">
              <button 
                id="btn-check-status"
                type="button"
                className="w-full h-10 inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-medium text-xs rounded-xl transition-all active:scale-[0.98] shadow-sm cursor-pointer select-none"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Periksa Status Pembayaran
              </button>

              <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 dark:text-zinc-500 font-medium">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Protected by QBiz Gateway Encryption
              </div>
            </div>
          </div>
        </div>

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
                    '0 : ' + String(minutes).padStart(2, '0') + ' : ' + String(seconds).padStart(2, '0');
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

              // --- 4. ACCORDION ACCESSIBILITY ---
              const accordionBtn = document.getElementById('accordion-toggle-btn');
              const accordionContent = document.getElementById('accordion-content');
              const accordionArrow = document.getElementById('accordion-arrow');
              if (accordionBtn && accordionContent) {
                accordionBtn.addEventListener('click', function() {
                  if (accordionContent.style.maxHeight === '0px' || !accordionContent.style.maxHeight) {
                    accordionContent.style.maxHeight = '250px';
                    if (accordionArrow) accordionArrow.classList.add('rotate-180');
                  } else {
                    accordionContent.style.maxHeight = '0px';
                    if (accordionArrow) accordionArrow.classList.remove('rotate-180');
                  }
                });
              }

              // --- 5. CLIPBOARD COPY UTILITY ---
              const copyAmountBtn = document.getElementById('copy-amount-btn');
              if (copyAmountBtn) {
                copyAmountBtn.addEventListener('click', function() {
                  const amountVal = this.getAttribute('data-amount');
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(amountVal).then(() => {
                      const originalText = this.textContent;
                      this.textContent = 'Tersalin!';
                      this.classList.remove('text-sky-500');
                      this.classList.add('text-emerald-500');
                      setTimeout(() => {
                        this.textContent = originalText;
                        this.classList.remove('text-emerald-500');
                        this.classList.add('text-sky-500');
                      }, 1500);
                    }).catch(err => {
                      console.error('Failed to copy: ', err);
                    });
                  } else {
                    // Fallback select method
                    const tempInput = document.createElement('input');
                    tempInput.value = amountVal;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    const originalText = this.textContent;
                    this.textContent = 'Tersalin!';
                    setTimeout(() => { this.textContent = originalText; }, 1500);
                  }
                });
              }

              // --- 6. BACK BUTTON UTILITY ---
              const backBtn = document.getElementById('back-btn');
              if (backBtn) {
                backBtn.addEventListener('click', function(e) {
                  e.preventDefault();
                  history.back();
                });
              }
            })();
          `
        }} />
      </body>
    </html>
  );
}
