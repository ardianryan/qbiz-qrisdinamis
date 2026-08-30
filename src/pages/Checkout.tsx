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
    isSandbox: boolean;
  };
  merchant: {
    name: string;
    logoUrl?: string | null;
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
        <title>{`${merchant.name} - Checkout Pembayaran`}</title>
        
        {/* SEO Metadata */}
        <meta name="description" content={`Halaman pembayaran aman untuk merchant ${merchant.name}. Selesaikan pembayaran menggunakan kode QRIS secara instan.`} />
        <meta name="keywords" content="checkout, qris, payment, bayar, invoice, gopay, shopeepay, ovo, dana" />
        <meta name="robots" content="noindex, nofollow" /> {/* Secure checkout endpoints are excluded from search indexing by default */}
        
        {/* Geographic Targeting (GEO) Tags */}
        <meta name="geo.region" content="ID" />
        <meta name="geo.placename" content="Jakarta" />
        <meta name="geo.position" content="-6.200000;106.816666" />
        <meta name="ICBM" content="-6.200000, 106.816666" />
        
        {/* AI Agent / LLMs Crawling Discoverability Link Headers */}
        <meta name="ai-agent" content="enabled" />
        <link rel="llms" href="/llms.txt" type="text/markdown" />
        <link rel="llms-full" href="/llms-full.txt" type="text/markdown" />
        
        {/* JSON-LD Semantic Structured Data (AEO & SEO Schema.org Order/Invoice) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Order",
              "merchant": {
                "@type": "Organization",
                "name": merchant.name
              },
              "acceptedPaymentMethod": {
                "@type": "PaymentMethod",
                "name": "QRIS"
              },
              "priceCurrency": "IDR",
              "price": invoice.totalAmount.toString(),
              "identifier": invoice.id
            })
          }}
        />
        
        {/* Anti-Flicker Script for System Dark/Light Mode Theme Selection */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && supportDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();
          `
        }} />

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
            /* Force QR code SVG to always be square and fill its container */
            .qr-wrapper svg {
              width: 100% !important;
              height: 100% !important;
              display: block;
            }
          `
        }} />
      </head>
      <body className="text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-950 min-h-screen flex p-4 md:p-12 antialiased transition-colors duration-200">
        
        {/* Responsive Container */}
        <div className="w-full bg-white dark:bg-zinc-900 checkout-card rounded-2xl md:rounded-3xl flex flex-col md:flex-row border border-slate-200 dark:border-zinc-800 shadow-md transition-all duration-300">
          
          {/* LEFT PANEL - White checkout section */}
          <div className="w-full md:w-[48%] bg-white dark:bg-zinc-950 p-5 md:p-6 flex flex-col justify-between rounded-left-panel border-b md:border-b-0 md:border-r border-slate-100 dark:border-zinc-800/50">
            <div>
              {/* Back button */}
              <a 
                href="#" 
                id="back-btn"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors font-medium mb-4"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Kembali
              </a>

              {/* Timer Title & Value */}
              <div className="text-center md:text-left mb-4">
                <span className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Selesaikan pembayaran dalam</span>
                <div id="countdown-timer" className="text-3xl md:text-4xl font-bold text-sky-500 dark:text-sky-400 mt-2 tracking-widest font-mono-qbiz select-none">
                  {timerPlaceholder}
                </div>
              </div>

              {/* Deadline expiry date display */}
              <div className="text-center md:text-left mb-4 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wide block">Batas akhir pembayaran</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-1 block">
                  {formattedExpiry}
                </span>
              </div>

              {/* Payment Method & Copy amount */}
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">QRIS Food Merchant</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 uppercase border border-sky-100 dark:border-sky-900/30">Dinamis</span>
                  </div>
                  {/* QRIS tiny logo */}
                  <div className="w-6 h-6 flex items-center justify-center opacity-70">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-slate-800 dark:fill-zinc-300"><path d="M0 0h24v24H0V0zm2 2v8h8V2H2zm2 2h4v4H4V4zm8-2v4h4V2h-4zm2 2h2v2h-2V4zM2 12v10h10V12H2zm2 2h6v6H4v-6zm10-2v2h2v-2h-2zm2 2v2h4v-2h-4zm0 2h-2v4h4v-4h-2zm-2 2h-2v2h2v-2zm8-6v4h-2v-4h2zm-2 6h2v2h-2v-2z"/></svg>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80">
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
              <div className="flex flex-col items-center justify-center py-2 relative">
                <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm relative max-w-[240px] w-full" style={{ aspectRatio: '1 / 1' }}>
                  <div dangerouslySetInnerHTML={{ __html: qrSvgHtml }} className="qr-wrapper w-full h-full" style={{ lineHeight: 0 }} />
                  
                  {/* Expired Overlay */}
                  <div id="expired-overlay" style={{ display: 'none', position: 'absolute', inset: '0', backgroundColor: 'rgba(255, 255, 255, 0.96)', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center', zIndex: 10 }} className="dark:bg-zinc-950/96">
                    <svg style={{ width: '40px', height: '40px', color: '#ef4444', marginBottom: '8px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <h4 style={{ fontWeight: '700', color: '#1f2937', fontSize: '13px', margin: '0' }} className="dark:text-zinc-50">Kedaluwarsa</h4>
                    <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', marginBottom: '0' }} className="dark:text-zinc-500">Invoice telah kedaluwarsa. Silakan checkout ulang.</p>
                  </div>

                  {/* Paid Success Overlay */}
                  <div id="success-overlay" style={{ display: 'none', position: 'absolute', inset: '0', backgroundColor: 'rgba(236, 253, 245, 0.97)', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center', zIndex: 10 }} className="dark:bg-emerald-950/95">
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#d1fae5', border: '2px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', color: '#047857' }} className="animate-bounce">
                      <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h4 style={{ fontWeight: '700', color: '#065f46', fontSize: '13px', margin: '0' }} className="dark:text-emerald-400">Pembayaran Sukses!</h4>
                    <p style={{ fontSize: '10px', color: '#047857', marginTop: '4px', marginBottom: '0' }} className="dark:text-emerald-500">Mengalihkan halaman dalam beberapa detik...</p>
                  </div>
                </div>
                
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-2 block italic">
                  *Klik untuk memperbesar kode QR
                </span>

                {invoice.isSandbox && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-center max-w-[240px] w-full">
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide block">🧪 Mode Sandbox</span>
                    <p className="text-[9.5px] text-amber-700 dark:text-amber-500 leading-relaxed mt-1">Uji integrasi Anda tanpa melakukan transfer asli.</p>
                    <button 
                      id="btn-simulate-sandbox"
                      type="button"
                      className="w-full mt-2.5 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all select-none cursor-pointer active:scale-[0.98]"
                    >
                      Simulasi Bayar Sukses
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cara Pembayaran Accordion Trigger */}
            <div className="mt-4 border-t border-slate-100 dark:border-zinc-800/80 pt-4">
              <button 
                id="accordion-toggle-btn"
                type="button"
                className="w-full py-2 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer"
              >
                Cara pembayaran
                <svg id="accordion-arrow" className="w-3.5 h-3.5 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              {/* Accordion Content */}
              <div id="accordion-content" style={{ maxHeight: '0px', overflow: 'hidden' }} className="transition-all duration-300 mt-2 px-1 text-slate-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                <ol className="list-decimal pl-4 space-y-1.5 py-2">
                  <li>Buka aplikasi e-wallet atau M-Banking favorit Anda (ShopeePay, GoPay, OVO, Dana, LinkAja, BCA, Mandiri, dll).</li>
                  <li>Pilih menu <strong>Scan / Bayar QRIS</strong>.</li>
                  <li>Scan kode QR yang tampil di layar halaman pembayaran ini.</li>
                  <li>Periksa kembali nominal pembayaran Anda (nominal pembayaran harus persis <strong>Rp{formattedTotal}</strong>).</li>
                  <li>Selesaikan transaksi. Halaman ini akan otomatis terupdate setelah pembayaran terverifikasi.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Cool grey transaction & purchase breakdown */}
          <div className="w-full md:w-[52%] bg-slate-50 dark:bg-zinc-900/40 p-5 md:p-6 flex flex-col justify-between rounded-right-panel">
            <div>
              {/* Header Logo */}
              <div className="flex items-center gap-2 mb-4">
                {merchant.logoUrl ? (
                  <img src={merchant.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 dark:bg-zinc-850 dark:border-zinc-800 shadow-sm shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold text-base shrink-0">
                    {merchant.name ? merchant.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight leading-none text-sm">{merchant.name}</h3>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 tracking-wider uppercase font-bold">Checkout Gateway</span>
                </div>
              </div>

              {/* Guide Alert Text */}
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">
                Pastikan anda melakukan pembayaran dengan nominal yang tepat dan sebelum melewati batas pembayaran.
              </p>

              {/* Detail Transaksi */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-950 dark:text-zinc-100 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200/60 dark:border-zinc-800">Detail Transaksi</h4>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
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
              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-950 dark:text-zinc-100 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200/60 dark:border-zinc-800">Rincian Pembelian</h4>
                
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

        {/* Modern Toast Container */}
        <div id="checkout-toast-container" className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"></div>

        {/* Dynamic timer & polling status script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const invoiceId = ${JSON.stringify(invoice.id)};
              const expiredAt = new Date(${JSON.stringify(invoice.expiredAt)}).getTime();
              const timerDisplay = document.getElementById('countdown-timer');
              const expiredOverlay = document.getElementById('expired-overlay');
              const successOverlay = document.getElementById('success-overlay');

              // --- Toast Helper ---
              function showToast(type, message) {
                const container = document.getElementById('checkout-toast-container');
                if (!container) return;
                const toast = document.createElement('div');
                toast.className = 'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transform transition-all duration-300 translate-y-2 opacity-0 ' +
                  (type === 'success' ? 'bg-white/95 dark:bg-zinc-900/95 border-emerald-200 dark:border-emerald-900/80 text-emerald-950 dark:text-emerald-50' :
                   type === 'error' ? 'bg-white/95 dark:bg-zinc-900/95 border-red-200 dark:border-red-900/80 text-red-950 dark:text-red-50' :
                   type === 'warning' ? 'bg-white/95 dark:bg-zinc-900/95 border-amber-200 dark:border-amber-900/80 text-amber-950 dark:text-amber-50' :
                   'bg-white/95 dark:bg-zinc-900/95 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-50');

                toast.innerHTML = '<div class="text-xs font-semibold leading-relaxed flex-1">' + message + '</div>';
                container.appendChild(toast);
                requestAnimationFrame(() => toast.classList.remove('opacity-0', 'translate-y-2'));
                setTimeout(() => {
                  toast.classList.add('opacity-0', 'translate-y-2');
                  setTimeout(() => toast.remove(), 300);
                }, 4000);
              }

              // --- 1. COUNTDOWN TIMER ---
              function updateTimer() {
                const now = new Date().getTime();
                const distance = expiredAt - now;

                if (distance < 0) {
                  clearInterval(timerInterval);
                  if (timerDisplay) timerDisplay.textContent = 'EXPIRED';
                  if (expiredOverlay) expiredOverlay.style.display = 'flex';
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
                      if (successOverlay) successOverlay.style.display = 'flex';
                      
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
                      if (expiredOverlay) expiredOverlay.style.display = 'flex';
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
                  this.innerHTML = '<svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17.75"></path></svg> Memeriksa...';

                  fetch('/api/v1/invoices/' + invoiceId + '/status')
                    .then(res => res.json())
                    .then(data => {
                      setTimeout(() => {
                        this.disabled = false;
                        this.innerHTML = originalText;
                        
                        if (data.status === 'PAID') {
                          clearInterval(timerInterval);
                          clearInterval(statusInterval);
                          if (successOverlay) successOverlay.style.display = 'flex';
                          
                          const targetRedirect = data.redirectUrl || data.callbackUrl;
                          if (targetRedirect) {
                            setTimeout(() => {
                              window.location.href = targetRedirect;
                            }, 3000);
                          }
                        } else if (data.status === 'EXPIRED') {
                          clearInterval(timerInterval);
                          clearInterval(statusInterval);
                          if (expiredOverlay) expiredOverlay.style.display = 'flex';
                        } else {
                          showToast('warning', 'Pembayaran belum masuk. Mohon tunggu atau coba beberapa saat lagi.');
                        }
                      }, 1000); // 1-second deliberate delay for loading state
                    })
                    .catch(err => {
                      setTimeout(() => {
                        this.disabled = false;
                        this.innerHTML = originalText;
                        showToast('error', 'Gagal memeriksa status pembayaran. Koneksi bermasalah.');
                      }, 1000);
                    });
                });
              }

              // --- 3.5. SANDBOX SIMULATION ---
              const btnSimulateSandbox = document.getElementById('btn-simulate-sandbox');
              if (btnSimulateSandbox) {
                btnSimulateSandbox.addEventListener('click', function() {
                  this.disabled = true;
                  const originalText = this.textContent;
                  this.textContent = 'Memproses Simulasi...';
                  fetch('/api/v1/sandbox/simulate-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invoiceId: invoiceId })
                  })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      showToast('success', 'Simulasi pembayaran berhasil diterima!');
                      checkPaymentStatus();
                    } else {
                      showToast('error', 'Gagal memproses simulasi: ' + (data.error || 'Unknown error'));
                      this.disabled = false;
                      this.textContent = originalText;
                    }
                  })
                  .catch(err => {
                    showToast('error', 'Koneksi galat: ' + err.message);
                    this.disabled = false;
                    this.textContent = originalText;
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
