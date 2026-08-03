import React from 'react';
import { Layout } from '../components/Layout.tsx';

interface DeveloperPageProps {
  apiKey: string;
  webhookUrl: string;
  webhookSecret: string;
  baseUrl: string;
  currentUser?: any;
}

export function DeveloperPage({ apiKey, webhookUrl, webhookSecret, baseUrl, currentUser }: DeveloperPageProps) {
  // Static code snippets for code tabs
  const codeSnippets = {
    curl: `curl -X POST ${baseUrl}/api/v1/invoices \\
  -H "Authorization: Bearer ${apiKey || 'qbiz_api_key_demo_2026'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_id": "ORDER-100239",
    "amount": 50000,
    "callback_url": "${webhookUrl || 'https://yourserver.com/webhooks/qris'}"
  }'`,
    node: `const response = await fetch('${baseUrl}/api/v1/invoices', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey || 'qbiz_api_key_demo_2026'}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    order_id: 'ORDER-100239',
    amount: 50000,
    callback_url: '${webhookUrl || 'https://yourserver.com/webhooks/qris'}'
  })
});
const data = await response.json();
console.log(data);`,
    python: `import requests

payload = {
    "order_id": "ORDER-100239",
    "amount": 50000,
    "callback_url": "${webhookUrl || 'https://yourserver.com/webhooks/qris'}"
}

headers = {
    "Authorization": "Bearer ${apiKey || 'qbiz_api_key_demo_2026'}",
    "Content-Type": "application/json"
}

response = requests.post(
    "${baseUrl}/api/v1/invoices",
    json=payload,
    headers=headers
)
print(response.json())`
  };

  return (
    <Layout activePath="/developer" user={currentUser}>
      
      {/* ========================================================================= */}
      {/* 1. HEADER */}
      {/* ========================================================================= */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
          Developer & API Hub
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Integrate the QRIS middleware with external Point-of-Sale, billing software or custom backends.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: API Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ========================================================================= */}
          {/* SECTION 1: API KEY MANAGER */}
          {/* ========================================================================= */}
          <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-1 flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-5 8a5 5 0 1110 0a5 5 0 01-10 0zM19 12a1 1 0 112 0 1 1 0 01-2 0z" /></svg>
              API Credentials
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
              Use this bearer key in headers to authenticate invoice creation requests.
            </p>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="api-key-input" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Secret API Bearer Key
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <input 
                      type="password" 
                      id="api-key-input" 
                      value={apiKey || 'qbiz_api_key_demo_2026_x7a9c8b3d'} 
                      readOnly
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 font-mono outline-none focus-visible:ring-2 focus-visible:ring-sky-500 pr-10"
                    />
                    {/* Toggle Key Visibility */}
                    <button 
                      id="btn-toggle-key-visibility"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                      aria-label="Toggle visible API key"
                    >
                      {/* Eye Icon */}
                      <svg id="eye-show" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      {/* Eye Off Icon */}
                      <svg id="eye-hide" className="w-4 h-4 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A7.971 7.971 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    </button>
                  </div>
                  
                  {/* Copy Button */}
                  <button 
                    id="btn-copy-key"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 flex items-center gap-1.5"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Regenerate Button */}
              <div className="flex justify-end pt-1">
                <button 
                  id="btn-regenerate-key"
                  className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sky-500 rounded p-1 outline-none"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17.75" /></svg>
                  Regenerate API Key
                </button>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 2: WEBHOOK ENDPOINT SETTINGS */}
          {/* ========================================================================= */}
          <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-1 flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              Webhook Deliveries
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
              Configure target URL endpoints to receive payload responses once payment succeeds.
            </p>

            <form action="/api/v1/developer/webhook" method="POST" className="space-y-4">
              {/* Callback URL */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="webhook-url" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Target Callback Endpoint URL
                </label>
                <input 
                  type="url" 
                  id="webhook-url" 
                  name="webhookUrl" 
                  value={webhookUrl || ''} 
                  required 
                  placeholder="https://yourserver.com/api/webhooks/qris"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
                />
              </div>

              {/* HMAC Secret */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="webhook-secret" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  HMAC SHA-256 Signing Secret
                </label>
                <input 
                  type="text" 
                  id="webhook-secret" 
                  name="webhookSecret" 
                  value={webhookSecret || ''} 
                  required 
                  placeholder="qbiz_webhook_signing_secret_key"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all font-mono"
                />
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  Payloads are signed with this secret in the `X-QBiz-Signature` header. Keep this value secure.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-between items-center">
                <button 
                  type="button" 
                  id="btn-test-webhook"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  Send Test Event
                </button>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </section>

        </div>

        {/* Right Column: Code Snippets & interactive cURL execution */}
        {/* ========================================================================= */}
        {/* SECTION 3: CODE SNIPPETS */}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
          <div className="p-5 border-b border-slate-100 dark:border-zinc-800/60">
            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              Integration Snippets
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Select runtime to copy template scripts.
            </p>
            <div className="mt-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-lg p-2.5 flex items-start gap-2">
              <span className="text-[14px]">💡</span>
              <span className="text-[10px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                <strong>Official SDKs available!</strong> Prebuilt client clients for <strong>PHP</strong> (<a href="https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/qbiz.php" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-mono">sdk/qbiz.php</a>) and <strong>Node.js</strong> (<a href="https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/qbiz-node.js" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-mono">sdk/qbiz-node.js</a>) are ready in the <code>sdk/</code> folder!
              </span>
            </div>
          </div>

          {/* Tab Switcher Headers */}
          <div className="flex border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/50">
            <button 
              className="px-4 py-2.5 text-xs font-semibold border-b-2 border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400 tab-btn outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              data-tab="curl"
            >
              cURL
            </button>
            <button 
              className="px-4 py-2.5 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 tab-btn outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              data-tab="node"
            >
              Node.js
            </button>
            <button 
              className="px-4 py-2.5 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 tab-btn outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              data-tab="python"
            >
              Python
            </button>
          </div>

          {/* Code Panels */}
          <div className="flex-grow bg-zinc-950 p-5 flex flex-col justify-between relative min-h-[300px]">
            {/* Copy snippet helper */}
            <button 
              id="btn-copy-snippet"
              className="absolute top-4 right-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 rounded px-2 py-1 text-[10px] font-semibold transition-all focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-label="Copy code snippet to clipboard"
            >
              Copy Code
            </button>

            {/* Snippet displays */}
            <div className="flex-grow">
              <pre id="panel-curl" className="text-xs text-zinc-300 font-mono overflow-auto max-h-[320px] whitespace-pre-wrap">
                <code>{codeSnippets.curl}</code>
              </pre>
              <pre id="panel-node" className="text-xs text-zinc-300 font-mono overflow-auto max-h-[320px] whitespace-pre-wrap hidden">
                <code>{codeSnippets.node}</code>
              </pre>
              <pre id="panel-python" className="text-xs text-zinc-300 font-mono overflow-auto max-h-[320px] whitespace-pre-wrap hidden">
                <code>{codeSnippets.python}</code>
              </pre>
            </div>
            
            <div className="border-t border-zinc-900 pt-4 mt-4 space-y-4">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono">POST /api/v1/invoices {"->"} Expected response:</span>
                <pre className="text-[10.5px] text-emerald-400 font-mono mt-1 overflow-x-auto whitespace-pre">
{`{
  "success": true,
  "invoice": {
    "id": "inv_10923840",
    "order_id": "ORDER-100239",
    "base_amount": 50000,
    "unique_code": 123,
    "total_amount": 50123,
    "status": "PENDING",
    "qris_payload": "00020101021238590014...",
    "checkout_url": "${baseUrl}/pay/inv_10923840"
  }
}`}
                </pre>
              </div>

              <div className="border-t border-zinc-800/60 pt-3">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-1.5">Integration Methods:</span>
                <ul className="list-disc pl-4 text-[10.5px] text-zinc-400 space-y-1">
                  <li><strong>Method A (Direct QRIS)</strong>: Take the raw <code>qris_payload</code> string response and generate the QR code directly inside your own application page.</li>
                  <li><strong>Method B (Redirect Checkout)</strong>: Redirect the buyer's browser to the hosted <code>checkout_url</code> page to complete their payment.</li>
                </ul>
              </div>

              <div className="bg-amber-950/20 border border-amber-900/60 rounded-lg p-3 mt-3">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold mb-1 font-mono">⚠️ IMPORTANT: Unique Suffix (Nominal Unik) Display</span>
                <p className="text-[10.5px] text-zinc-300 leading-relaxed font-sans">
                  QBiz automatically adds a unique 3-digit suffix (e.g., <code>unique_code: 123</code>) to prevent payment conflicts. 
                  <strong>You MUST display the <code>total_amount</code> (e.g., Rp 50,123) to the customer</strong> in your client application. Do NOT display the base amount (e.g., Rp 50,000). The generated <code>qris_payload</code> is already pre-configured with this exact total amount.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* 4. CLIENT INTERACTIVITY SCRIPT */}
      {/* ========================================================================= */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // --- A. API Key Mask Visibility ---
            const keyInput = document.getElementById('api-key-input');
            const visibilityBtn = document.getElementById('btn-toggle-key-visibility');
            const eyeShow = document.getElementById('eye-show');
            const eyeHide = document.getElementById('eye-hide');

            if (visibilityBtn && keyInput) {
              visibilityBtn.addEventListener('click', function() {
                if (keyInput.type === 'password') {
                  keyInput.type = 'text';
                  if (eyeShow) eyeShow.classList.add('hidden');
                  if (eyeHide) eyeHide.classList.remove('hidden');
                } else {
                  keyInput.type = 'password';
                  if (eyeShow) eyeShow.classList.remove('hidden');
                  if (eyeHide) eyeHide.classList.add('hidden');
                }
              });
            }

            // --- B. Copy API Key ---
            const copyKeyBtn = document.getElementById('btn-copy-key');
            if (copyKeyBtn && keyInput) {
              copyKeyBtn.addEventListener('click', function() {
                navigator.clipboard.writeText(keyInput.value).then(() => {
                  const originalText = copyKeyBtn.textContent;
                  copyKeyBtn.textContent = 'Copied!';
                  copyKeyBtn.classList.replace('bg-slate-100', 'bg-emerald-600');
                  copyKeyBtn.classList.replace('text-slate-800', 'text-white');
                  copyKeyBtn.classList.replace('dark:bg-zinc-800', 'dark:bg-emerald-600');
                  
                  setTimeout(() => {
                    copyKeyBtn.textContent = originalText;
                    copyKeyBtn.classList.replace('bg-emerald-600', 'bg-slate-100');
                    copyKeyBtn.classList.replace('text-white', 'text-slate-800');
                    copyKeyBtn.classList.replace('dark:bg-emerald-600', 'dark:bg-zinc-800');
                  }, 1500);
                });
              });
            }

            // --- C. Regenerate API Key Mock Call ---
            const regenBtn = document.getElementById('btn-regenerate-key');
            if (regenBtn) {
              regenBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to invalidate your current API key and regenerate a new one? External clients using the old key will lose access immediately.')) {
                  fetch('/api/v1/developer/regenerate-key', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                      if (data.success && keyInput) {
                        keyInput.value = data.apiKey;
                        alert('API Key successfully regenerated! Please update your integration clients.');
                        window.location.reload();
                      }
                    });
                }
              });
            }

            // --- D. Interactive Snippets Tab Switcher ---
            const tabButtons = document.querySelectorAll('.tab-btn');
            let activeTab = 'curl';

            tabButtons.forEach(btn => {
              btn.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                activeTab = targetTab;

                // Toggle headers active visual
                tabButtons.forEach(b => {
                  b.classList.replace('border-sky-600', 'border-transparent');
                  b.classList.replace('text-sky-600', 'text-slate-500');
                  b.classList.replace('dark:text-sky-400', 'dark:text-slate-400');
                  b.classList.replace('dark:border-sky-400', 'dark:border-transparent');
                });
                this.classList.replace('border-transparent', 'border-sky-600');
                this.classList.replace('text-slate-500', 'text-sky-600');
                this.classList.replace('dark:text-slate-400', 'dark:text-sky-400');
                this.classList.replace('dark:border-transparent', 'dark:border-sky-400');

                // Toggle display blocks
                document.getElementById('panel-curl').classList.add('hidden');
                document.getElementById('panel-node').classList.add('hidden');
                document.getElementById('panel-python').classList.add('hidden');

                document.getElementById('panel-' + targetTab).classList.remove('hidden');
              });
            });

            // --- E. Copy Code Snippet ---
            const copySnippetBtn = document.getElementById('btn-copy-snippet');
            if (copySnippetBtn) {
              copySnippetBtn.addEventListener('click', function() {
                const codePre = document.getElementById('panel-' + activeTab);
                if (!codePre) return;
                
                const codeText = codePre.querySelector('code').textContent;
                navigator.clipboard.writeText(codeText).then(() => {
                  const originalText = copySnippetBtn.textContent;
                  copySnippetBtn.textContent = 'Copied!';
                  copySnippetBtn.classList.replace('bg-zinc-900', 'bg-emerald-600');
                  copySnippetBtn.classList.replace('text-zinc-400', 'text-white');
                  
                  setTimeout(() => {
                    copySnippetBtn.textContent = originalText;
                    copySnippetBtn.classList.replace('bg-emerald-600', 'bg-zinc-900');
                    copySnippetBtn.classList.replace('text-white', 'text-zinc-400');
                  }, 1500);
                });
              });
            }

            // --- F. Webhook Test Event Dispatcher ---
            const testWebhookBtn = document.getElementById('btn-test-webhook');
            if (testWebhookBtn) {
              testWebhookBtn.addEventListener('click', function() {
                const urlInput = document.getElementById('webhook-url');
                const secretInput = document.getElementById('webhook-secret');
                if (!urlInput || !urlInput.value) {
                  alert('Please enter a target callback endpoint URL first.');
                  return;
                }

                this.disabled = true;
                this.innerHTML = 'Sending...';

                fetch('/api/v1/developer/test-webhook', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    url: urlInput.value,
                    secret: secretInput ? secretInput.value : ''
                  })
                })
                  .then(res => res.json())
                  .then(data => {
                    this.disabled = false;
                    this.innerHTML = 'Send Test Event';

                    if (data.success) {
                      alert('Test webhook dispatch successfully accepted by destination! Status: HTTP ' + data.status);
                    } else {
                      alert('Webhook dispatch test failed: ' + (data.error || 'Connection timed out'));
                    }
                  })
                  .catch(err => {
                    this.disabled = false;
                    this.innerHTML = 'Send Test Event';
                    alert('Network error testing webhook dispatch');
                  });
              });
            }
          })();
        `
      }} />

    </Layout>
  );
}
