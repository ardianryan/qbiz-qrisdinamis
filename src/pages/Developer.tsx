import React from 'react';
import { Layout } from '../components/Layout.tsx';

import { MerchantContext } from '../middleware/auth.ts';
import { SystemSettingsConfig } from '../services/settings.ts';
import { ApiKeyRecord, ApiScopeDefinition, AVAILABLE_SCOPES } from '../services/api-keys.ts';
import { WebhookEndpoint, AVAILABLE_WEBHOOK_EVENTS } from '../services/webhooks.ts';

interface DeveloperPageProps {
  apiKeys?: ApiKeyRecord[];
  availableScopes?: ApiScopeDefinition[];
  webhooksList?: WebhookEndpoint[];
  apiKey: string;
  webhookUrl: string;
  webhookSecret: string;
  baseUrl: string;
  currentUser?: any;
  activeMerchant?: MerchantContext | null;
  accessibleMerchants?: MerchantContext[];
  systemSettings?: SystemSettingsConfig;
}

export function DeveloperPage({ 
  apiKeys = [], 
  availableScopes = AVAILABLE_SCOPES, 
  webhooksList = [],
  apiKey, 
  webhookUrl, 
  webhookSecret, 
  baseUrl, 
  currentUser, 
  activeMerchant, 
  accessibleMerchants = [], 
  systemSettings 
}: DeveloperPageProps) {
  const currentMerchantId = activeMerchant?.id || 'mrc_toko_cabang_1';
  const isSuperOrAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  // Static code snippets for code tabs
  const codeSnippets = {
    curl: `curl -X POST ${baseUrl}/api/v1/invoices \\
  -H "Authorization: Bearer ${apiKeys.length > 0 ? (apiKeys[0].keyPrefix.replace('...', 'example_token_')) : (apiKey || 'qbiz_live_token_demo_2026')}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_id": "ORDER-100239",
    "amount": 50000,
    "merchant_id": "${currentMerchantId}",
    "callback_url": "${webhookUrl || 'https://yourserver.com/webhooks/qris'}"
  }'`,
    go: `package main

import (
	"context"
	"fmt"
	"log"
	"qbiz" // import "your-project/sdk"
)

func main() {
	client := qbiz.NewClient("${apiKeys.length > 0 ? apiKeys[0].keyPrefix : (apiKey || 'qbiz_live_token_demo_2026')}", "${baseUrl}")

	invoice, err := client.CreateInvoice(context.Background(), qbiz.CreateInvoiceParams{
		OrderID:     "ORDER-100239",
		Amount:      50000,
		MerchantID:  "${currentMerchantId}",
		CallbackURL: "${webhookUrl || 'https://yourserver.com/webhooks/qris'}",
	})
	if err != nil {
		log.Fatalf("Failed creating invoice: %v", err)
	}

	fmt.Printf("Invoice ID: %s | Dynamic QR URL: %s\\n", invoice.ID, invoice.CheckoutURL)
}`,
    ts: `import { QBizClient } from './sdk/qbiz.ts';

const client = new QBizClient({
  apiKey: '${apiKeys.length > 0 ? apiKeys[0].keyPrefix : (apiKey || 'qbiz_live_token_demo_2026')}',
  baseUrl: '${baseUrl}'
});

const invoice = await client.createInvoice({
  orderId: 'ORDER-100239',
  amount: 50000,
  merchantId: '${currentMerchantId}',
  callbackUrl: '${webhookUrl || 'https://yourserver.com/webhooks/qris'}'
});

console.log('Dynamic QRIS Checkout URL:', invoice.checkoutUrl);`,
    node: `const response = await fetch('${baseUrl}/api/v1/invoices', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKeys.length > 0 ? apiKeys[0].keyPrefix : (apiKey || 'qbiz_live_token_demo_2026')}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    order_id: 'ORDER-100239',
    amount: 50000,
    merchant_id: '${currentMerchantId}',
    callback_url: '${webhookUrl || 'https://yourserver.com/webhooks/qris'}'
  })
});
const data = await response.json();
console.log(data);`,
    python: `import requests

payload = {
    "order_id": "ORDER-100239",
    "amount": 50000,
    "merchant_id": "${currentMerchantId}",
    "callback_url": "${webhookUrl || 'https://yourserver.com/webhooks/qris'}"
}

headers = {
    "Authorization": "Bearer ${apiKeys.length > 0 ? apiKeys[0].keyPrefix : (apiKey || 'qbiz_live_token_demo_2026')}",
    "Content-Type": "application/json"
}

response = requests.post(
    "${baseUrl}/api/v1/invoices",
    json=payload,
    headers=headers
)
print(response.json())`,
    php: `<?php
require_once __DIR__ . '/sdk/qbiz.php';

$client = new QBizClient(
    apiKey: '${apiKeys.length > 0 ? apiKeys[0].keyPrefix : (apiKey || 'qbiz_live_token_demo_2026')}',
    baseUrl: '${baseUrl}'
);

$invoice = $client->createInvoice([
    'order_id' => 'ORDER-100239',
    'amount' => 50000,
    'merchant_id' => '${currentMerchantId}',
    'callback_url' => '${webhookUrl || 'https://yourserver.com/webhooks/qris'}'
]);

echo "Dynamic QRIS URL: " . $invoice['checkout_url'];`,
    rust: `// Cargo.toml dependencies: reqwest, serde, serde_json
let client = reqwest::Client::new();
let response = client.post("${baseUrl}/api/v1/invoices")
    .header("Authorization", "Bearer ${apiKeys.length > 0 ? apiKeys[0].keyPrefix : (apiKey || 'qbiz_live_token_demo_2026')}")
    .header("Content-Type", "application/json")
    .json(&serde_json::json!({
        "order_id": "ORDER-100239",
        "amount": 50000,
        "merchant_id": "${currentMerchantId}",
        "callback_url": "${webhookUrl || 'https://yourserver.com/webhooks/qris'}"
    }))
    .send()
    .await?;

let data: serde_json::Value = response.json().await?;
println!("{:#?}", data);`
  };

  return (
    <Layout activePath="/developer" user={currentUser} activeMerchant={activeMerchant} accessibleMerchants={accessibleMerchants}>
      
      {/* ========================================================================= */}
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
            Developer & API Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Integrate the QRIS middleware with external Point-of-Sale, billing software or custom backends.
          </p>
        </div>
        <a 
          href="/docs" 
          target="_blank"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer w-full sm:w-auto text-center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          Open Scalar API Reference
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: API Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ========================================================================= */}
          {/* SECTION 1: ENTERPRISE MULTI-API KEY MANAGER */}
          {/* ========================================================================= */}
          <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                    <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-5 8a5 5 0 1110 0a5 5 0 01-10 0zM19 12a1 1 0 112 0 1 1 0 01-2 0z" /></svg>
                    Enterprise API Keys
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60">
                    Scoped RBAC
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Create isolated API keys for each store integration (POS, WooCommerce, ERP) with granular read/write permissions.
                </p>
              </div>

              <button
                type="button"
                id="btn-open-create-key-modal"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Create New API Key
              </button>
            </div>

            {/* List of Enterprise API Keys */}
            <div className="mt-4">
              {apiKeys.length === 0 ? (
                <div className="py-8 text-center bg-slate-50/50 dark:bg-zinc-950/50 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 mx-auto mb-2.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-5 8a5 5 0 1110 0a5 5 0 01-10 0zM19 12a1 1 0 112 0 1 1 0 01-2 0z" /></svg>
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">No Enterprise API Keys Generated</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-3">
                    Generate an API key to securely connect external billing apps, point-of-sale systems, or e-commerce plugins.
                  </p>
                  <button
                    type="button"
                    className="btn-trigger-create-key inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    + Generate First Key
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map(k => {
                    const isRevoked = k.status === 'REVOKED';
                    return (
                      <div 
                        key={k.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isRevoked 
                            ? 'bg-slate-50/60 dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800/80 opacity-70' 
                            : 'bg-white dark:bg-zinc-950 border-slate-200/90 dark:border-zinc-800 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-start gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isRevoked ? 'bg-red-50 dark:bg-red-950/40 text-red-600' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-5 8a5 5 0 1110 0a5 5 0 01-10 0zM19 12a1 1 0 112 0 1 1 0 01-2 0z" /></svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">{k.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isRevoked 
                                    ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400' 
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                }`}>
                                  {k.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="text-xs font-mono font-semibold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                  {k.keyPrefix}
                                </code>
                                <button 
                                  className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-semibold btn-copy-prefix-trigger"
                                  data-prefix={k.keyPrefix}
                                >
                                  Copy Prefix
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {!isRevoked && (
                              <button
                                type="button"
                                className="btn-revoke-key px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 transition-colors cursor-pointer"
                                data-id={k.id}
                                data-name={k.name}
                              >
                                Revoke
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-delete-key p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                              data-id={k.id}
                              data-name={k.name}
                              title="Delete API Key Record"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>

                        {/* Metadata & Scopes */}
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400">Store Scope:</span>
                            <span className="font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md">
                              {k.merchantId ? `🏪 ${k.merchantName}` : '🌐 All Stores (Global)'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 flex-wrap">
                            {k.scopes.map(sc => (
                              <span 
                                key={sc}
                                className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold ${
                                  sc.includes('create') || sc.includes('manage')
                                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/50'
                                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50'
                                }`}
                              >
                                {sc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Collapsible Legacy Key Section for Backward Compatibility */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200">
                  <span className="flex items-center gap-2">
                    <span>🗝️</span> Legacy Personal User Key (Backward Compatible)
                  </span>
                  <span className="text-[10px] text-sky-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                
                <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Legacy single-user API key. For enhanced security and multi-merchant routing, we recommend using Enterprise API keys above.
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      id="api-key-input" 
                      value={apiKey || 'qbiz_api_key_demo_2026_x7a9c8b3d'} 
                      readOnly
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-50 font-mono outline-none"
                    />
                    <button 
                      id="btn-toggle-key-visibility"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100"
                    >
                      Show
                    </button>
                    <button 
                      id="btn-copy-key"
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-zinc-800 text-xs font-semibold hover:bg-slate-800"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      id="btn-regenerate-key"
                      className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold hover:underline"
                    >
                      ↻ Regenerate Legacy Key
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 2: ENTERPRISE MULTI-WEBHOOK ENDPOINTS MANAGER */}
          {/* ========================================================================= */}
          <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                    <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    Enterprise Webhooks
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60">
                    Store Scoped
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Configure per-store or global webhook subscriptions with dedicated HMAC signing keys and granular event triggers.
                </p>
              </div>

              <button
                type="button"
                id="btn-open-create-webhook-modal"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add Webhook Endpoint
              </button>
            </div>

            {/* List of Configured Webhooks */}
            <div className="mt-4">
              {webhooksList.length === 0 ? (
                <div className="py-8 text-center bg-slate-50/50 dark:bg-zinc-950/50 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 mx-auto mb-2.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">No Webhook Endpoints Configured</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-3">
                    Add a webhook destination to receive instant HTTP callback payloads when customers complete dynamic QRIS payments.
                  </p>
                  <button
                    type="button"
                    className="btn-trigger-create-webhook inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    + Add First Webhook
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {webhooksList.map(w => {
                    const isPaused = w.status === 'PAUSED';
                    const targetStoreName = w.merchantId 
                      ? (accessibleMerchants.find(m => m.id === w.merchantId)?.name || w.merchantId) 
                      : 'All Stores (Global)';

                    return (
                      <div 
                        key={w.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isPaused 
                            ? 'bg-slate-50/60 dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800/80 opacity-75' 
                            : 'bg-white dark:bg-zinc-950 border-slate-200/90 dark:border-zinc-800 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isPaused ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600' : 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                            }`}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">{w.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  w.merchantId 
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400' 
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                                }`}>
                                  🏪 {targetStoreName}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPaused 
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' 
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                }`}>
                                  {w.status}
                                </span>
                              </div>
                              <div className="mt-1 text-xs font-mono text-slate-600 dark:text-zinc-300 break-all">
                                {w.url}
                              </div>
                              <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 flex-wrap">
                                <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                                  Secret: {w.secret ? `${w.secret.slice(0, 10)}...${w.secret.slice(-4)}` : '••••'}
                                </span>
                                <span>•</span>
                                <span>
                                  {w.lastTriggeredAt ? (
                                    <span className={w.lastStatusCode && w.lastStatusCode < 400 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-500 font-semibold'}>
                                      Last: HTTP {w.lastStatusCode} ({new Date(w.lastTriggeredAt).toLocaleTimeString()})
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Never triggered</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              data-id={w.id}
                              className="btn-test-webhook-endpoint inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
                            >
                              ⚡ Test
                            </button>
                            <button
                              type="button"
                              data-id={w.id}
                              data-status={w.status}
                              className="btn-toggle-webhook-status inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              {isPaused ? '▶ Activate' : '⏸ Pause'}
                            </button>
                            <button
                              type="button"
                              data-id={w.id}
                              data-name={w.name}
                              className="btn-delete-webhook-endpoint p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Delete Webhook"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>

                        {/* Subscribed Events Tags */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-850 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Events:</span>
                          {w.events.map(ev => (
                            <span key={ev} className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Collapsible Legacy Single-Webhook Form for Backward Compatibility */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200">
                  <span className="flex items-center gap-2">
                    <span>🔄</span> Legacy Default Webhook URL (Backward Compatible)
                  </span>
                  <span className="text-[10px] text-sky-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>

                <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                  <form action="/api/v1/developer/webhook" method="POST" className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="webhook-url" className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                        Default Fallback Webhook URL
                      </label>
                      <input 
                        type="url" 
                        id="webhook-url" 
                        name="webhookUrl" 
                        defaultValue={webhookUrl || ''} 
                        placeholder="https://yourserver.com/api/webhooks/qris"
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-50 font-mono outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="webhook-secret" className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                        Default HMAC Secret
                      </label>
                      <input 
                        type="text" 
                        id="webhook-secret" 
                        name="webhookSecret" 
                        defaultValue={webhookSecret || ''} 
                        placeholder="qbiz_webhook_signing_secret_key"
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-50 font-mono outline-none"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <button 
                        type="button" 
                        id="btn-test-webhook"
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-zinc-700 cursor-pointer"
                      >
                        ⚡ Test Legacy Webhook
                      </button>
                      <button 
                        type="submit" 
                        className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 cursor-pointer shadow-2xs"
                      >
                        Save Legacy Webhook
                      </button>
                    </div>
                  </form>
                </div>
              </details>
            </div>
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
                <strong>Official Client SDKs available!</strong> Ready in the <code>sdk/</code> folder: <strong>Go</strong> (<a href="https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/qbiz.go" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-mono">sdk/qbiz.go</a>), <strong>TypeScript</strong> (<a href="https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/qbiz.ts" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-mono">sdk/qbiz.ts</a>), <strong>PHP</strong> (<a href="https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/qbiz.php" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-mono">sdk/qbiz.php</a>), <strong>Node.js</strong> (<a href="https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/qbiz-node.js" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-mono">sdk/qbiz-node.js</a>), <strong>Python</strong> (<a href="https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/qbiz.py" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-mono">sdk/qbiz.py</a>), <strong>Dart/Flutter</strong> (<a href="https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/qbiz.dart" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-mono">sdk/qbiz.dart</a>), <strong>Java</strong> (<a href="https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/QBizClient.java" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-mono">sdk/QBizClient.java</a>), and <strong>Rust</strong> (<a href="https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/qbiz.rs" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-mono">sdk/qbiz.rs</a>).
              </span>
            </div>
          </div>

          {/* Tab Switcher Headers */}
          <div className="flex flex-wrap border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/50">
            <button 
              className="px-3.5 py-2 text-xs font-semibold border-b-2 border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400 tab-btn outline-none"
              data-tab="curl"
            >
              cURL
            </button>
            <button 
              className="px-3.5 py-2 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 tab-btn outline-none"
              data-tab="go"
            >
              Go
            </button>
            <button 
              className="px-3.5 py-2 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 tab-btn outline-none"
              data-tab="ts"
            >
              TypeScript
            </button>
            <button 
              className="px-3.5 py-2 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 tab-btn outline-none"
              data-tab="php"
            >
              PHP
            </button>
            <button 
              className="px-3.5 py-2 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 tab-btn outline-none"
              data-tab="node"
            >
              Node.js
            </button>
            <button 
              className="px-3.5 py-2 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 tab-btn outline-none"
              data-tab="python"
            >
              Python
            </button>
            <button 
              className="px-3.5 py-2 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 tab-btn outline-none"
              data-tab="rust"
            >
              Rust
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
              <pre id="panel-go" className="text-xs text-zinc-300 font-mono overflow-auto max-h-[320px] whitespace-pre-wrap hidden">
                <code>{codeSnippets.go}</code>
              </pre>
              <pre id="panel-ts" className="text-xs text-zinc-300 font-mono overflow-auto max-h-[320px] whitespace-pre-wrap hidden">
                <code>{codeSnippets.ts}</code>
              </pre>
              <pre id="panel-php" className="text-xs text-zinc-300 font-mono overflow-auto max-h-[320px] whitespace-pre-wrap hidden">
                <code>{codeSnippets.php}</code>
              </pre>
              <pre id="panel-node" className="text-xs text-zinc-300 font-mono overflow-auto max-h-[320px] whitespace-pre-wrap hidden">
                <code>{codeSnippets.node}</code>
              </pre>
              <pre id="panel-python" className="text-xs text-zinc-300 font-mono overflow-auto max-h-[320px] whitespace-pre-wrap hidden">
                <code>{codeSnippets.python}</code>
              </pre>
              <pre id="panel-rust" className="text-xs text-zinc-300 font-mono overflow-auto max-h-[320px] whitespace-pre-wrap hidden">
                <code>{codeSnippets.rust}</code>
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
      {/* SECTION 4: REAL-TIME NOTIFICATION BOTS INTEGRATION (Telegram, Discord, WhatsApp) */}
      {/* ========================================================================= */}
      <section className="mt-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-zinc-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 text-[11px] font-bold mb-2">
              <span>⚡</span> Real-Time Multi-Channel Bot Alerts
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
              Merchant Notification Bots (Telegram, Discord & WhatsApp)
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Panduan lengkap menghubungkan bot notifikasi otomatis untuk setiap toko (merchant) yang Anda kelola. Notifikasi dikirimkan secara instan detik itu juga ketika pembayaran QRIS berhasil diverifikasi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <div className="text-left">
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Active Store Context</span>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate block max-w-[160px]">{activeMerchant?.name || 'All Merchant Stores'}</span>
              </div>
            </div>
            <a
              href="/merchants"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Kelola Notifikasi Toko (/merchants)
            </a>
          </div>
        </div>

        {/* Tab Navigation for Bot Channels */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
            <button
              className="dev-bot-tab-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-sky-600 text-white shadow-xs cursor-pointer"
              data-target="bot-panel-telegram"
            >
              <span>✈️</span> Telegram Bot
            </button>
            <button
              className="dev-bot-tab-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              data-target="bot-panel-discord"
            >
              <span>🎮</span> Discord Webhook
            </button>
            <button
              className="dev-bot-tab-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              data-target="bot-panel-whatsapp"
            >
              <span>💬</span> WhatsApp (GOWA)
            </button>
            <button
              className="dev-bot-tab-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              data-target="bot-panel-variables"
            >
              <span>📋</span> Template Variables
            </button>
            <button
              className="dev-bot-tab-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              data-target="bot-panel-api"
            >
              <span>⚡</span> REST API Reference
            </button>
          </div>

          {/* TAB 1: TELEGRAM BOT */}
          <div id="bot-panel-telegram" className="dev-bot-panel mt-6 space-y-6">
            <div className="bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                <p className="font-bold text-slate-900 dark:text-zinc-100 mb-1">Keunggulan Integrasi Telegram Bot:</p>
                Gratis tanpa batas pengiriman, 100% instan, mendukung pesan pribadi langsung ke kasir/owner maupun ke grup staf dengan format teks kaya (HTML Formatting).
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 & 2 */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center">1</span>
                  Buat Bot di @BotFather
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Buka aplikasi Telegram, cari akun resmi <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 font-mono font-bold text-sky-600 dark:text-sky-400">@BotFather</code>. Kirimkan perintah <code className="font-mono bg-slate-200 dark:bg-zinc-800 px-1 rounded">/newbot</code>, tentukan nama bot dan username unik berakhiran <code>bot</code>.
                </p>
                <div className="p-2.5 rounded-lg bg-zinc-900 text-zinc-300 font-mono text-[10.5px]">
                  Bot Token Example: <span className="text-amber-400">1234567890:ABCDefGhIJKlmNoPQRsTUVwxyZ</span>
                </div>
              </div>

              {/* Step 3 & 4 */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center">2</span>
                  Dapatkan Target Chat ID
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  <strong>Pribadi:</strong> Klik Start pada bot Anda, lalu chat <code className="font-mono bg-slate-200 dark:bg-zinc-800 px-1 rounded">@userinfobot</code> untuk melihat ID Anda (misal: <code className="font-mono">987654321</code>).<br />
                  <strong>Grup:</strong> Masukkan bot ke grup toko, jadikan Admin grup, dan gunakan ID grup berawalan minus (misal: <code className="font-mono">-1001234567890</code>).
                </p>
              </div>
            </div>

            {/* Config & Test Endpoint Example */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">Uji Coba Pengiriman Telegram via REST API:</span>
              <div className="bg-zinc-950 rounded-xl p-4 font-mono text-xs text-zinc-300 overflow-x-auto">
                <pre>{`curl -X POST ${baseUrl}/api/v1/merchants/${currentMerchantId}/notifications/test \\
  -H "Authorization: Bearer ${apiKey || 'qbiz_api_key_demo_2026'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "telegram",
    "merchantName": "${activeMerchant?.name || 'Toko Demo'}",
    "config": {
      "telegramBotToken": "1234567890:ABCDefGhIJKlmNoPQRsTUVwxyZ",
      "telegramChatId": "987654321",
      "telegramTemplate": "🔔 <b>Pembayaran Berhasil!</b>\\nOrder: {order_id}\\nTotal: {amount_formatted}"
    }
  }'`}</pre>
              </div>
            </div>
          </div>

          {/* TAB 2: DISCORD WEBHOOK */}
          <div id="bot-panel-discord" className="dev-bot-panel mt-6 space-y-6 hidden">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">🎮</span>
              <div className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                <p className="font-bold text-slate-900 dark:text-zinc-100 mb-1">Keunggulan Integrasi Discord Webhook:</p>
                Paling mudah diintegrasikan (cukup 1 URL webhook tanpa perlu token bot), mendukung visual kartu embed berwarna hijau sukses dengan logo QBiz otomatis.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">1</span>
                  Buat Webhook Channel Discord
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Buka Discord di PC/Web &rarr; Masuk ke Server Anda &rarr; Arahkan kursor ke Channel target (misal <code className="font-mono bg-slate-200 dark:bg-zinc-800 px-1 rounded">#transaksi-qris</code>) &rarr; Klik ikon <strong>Gear (Edit Channel)</strong> &rarr; Pilih menu <strong>Integrations</strong> &rarr; Klik <strong>Create Webhook</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">2</span>
                  Salin Webhook URL & Simpan
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Klik tombol <strong>Copy Webhook URL</strong>. Masuk ke halaman <a href="/merchants" className="text-sky-600 hover:underline font-bold">Kelola Toko (/merchants)</a>, klik tombol lonceng notifikasi pada toko Anda, lalu aktifkan tab Discord dan tempel URL tersebut.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">Uji Coba Pengiriman Discord via REST API:</span>
              <div className="bg-zinc-950 rounded-xl p-4 font-mono text-xs text-zinc-300 overflow-x-auto">
                <pre>{`curl -X POST ${baseUrl}/api/v1/merchants/${currentMerchantId}/notifications/test \\
  -H "Authorization: Bearer ${apiKey || 'qbiz_api_key_demo_2026'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "discord",
    "merchantName": "${activeMerchant?.name || 'Toko Demo'}",
    "config": {
      "discordWebhookUrl": "https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz"
    }
  }'`}</pre>
              </div>
            </div>
          </div>

          {/* TAB 3: WHATSAPP (GOWA) */}
          <div id="bot-panel-whatsapp" className="dev-bot-panel mt-6 space-y-6 hidden">
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <div className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                <p className="font-bold text-slate-900 dark:text-zinc-100 mb-1">WhatsApp Multi-Device Gateway (GOWA Engine by Aldinokemal):</p>
                Menggunakan gateway open-source WhatsApp Multi-Device mandiri. Tidak membutuhkan langganan API berbayar bulanan pihak ketiga dan dapat mengirim pesan ke nomor pribadi kasir maupun grup WhatsApp toko.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">1</span>
                  Jalankan Server GOWA
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Jalankan container GOWA pada server Anda menggunakan Docker:
                </p>
                <div className="p-2 rounded bg-zinc-900 text-zinc-300 font-mono text-[10px]">
                  docker run -d -p 3000:3000 aldinokemal/go-whatsapp-web-multidevice
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">2</span>
                  Scan QR Login WhatsApp
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Buka dashboard GOWA (<code className="font-mono">http://localhost:3000</code>). Gunakan menu <strong>Linked Devices (Perangkat Tertaut)</strong> di aplikasi WhatsApp HP Anda untuk scan barcode.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">3</span>
                  Atur Target Nomor / Grup
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  <strong>Pribadi:</strong> Format internasional tanpa +, contoh <code className="font-mono">6281234567890</code>.<br />
                  <strong>Grup:</strong> Format JID Group WhatsApp, contoh <code className="font-mono">120363028192837465@g.us</code>.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">Uji Coba Pengiriman WhatsApp via REST API:</span>
              <div className="bg-zinc-950 rounded-xl p-4 font-mono text-xs text-zinc-300 overflow-x-auto">
                <pre>{`curl -X POST ${baseUrl}/api/v1/merchants/${currentMerchantId}/notifications/test \\
  -H "Authorization: Bearer ${apiKey || 'qbiz_api_key_demo_2026'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "whatsapp",
    "merchantName": "${activeMerchant?.name || 'Toko Demo'}",
    "config": {
      "whatsappApiUrl": "http://localhost:3000/send/message",
      "whatsappAuthType": "NONE",
      "whatsappRecipient": "6281234567890",
      "whatsappTemplate": "🔔 *Pembayaran Masuk!*\\nOrder: {order_id}\\nTotal: {amount_formatted}"
    }
  }'`}</pre>
              </div>
            </div>
          </div>

          {/* TAB 4: TEMPLATE VARIABLES */}
          <div id="bot-panel-variables" className="dev-bot-panel mt-6 space-y-4 hidden">
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Anda dapat mengkustomisasi format pesan untuk Telegram, Discord, dan WhatsApp menggunakan variabel dinamis di bawah ini. Sistem akan secara otomatis mengganti setiap tag dengan data transaksi riil:
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 font-bold text-slate-700 dark:text-zinc-300">
                  <tr>
                    <th className="py-3 px-4">Placeholder Tag</th>
                    <th className="py-3 px-4">Deskripsi</th>
                    <th className="py-3 px-4">Contoh Output Riil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-600 dark:text-zinc-400 font-mono">
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-sky-600 dark:text-sky-400">{`{merchant_name}`}</td>
                    <td className="py-2.5 px-4 font-sans">Nama Toko / Outlet Merchant</td>
                    <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-sans">Resto Ayam Bakar Cobek</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-sky-600 dark:text-sky-400">{`{order_id}`}</td>
                    <td className="py-2.5 px-4 font-sans">ID Pesanan dari Backend / POS Anda</td>
                    <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400">ORDER-100239</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-sky-600 dark:text-sky-400">{`{invoice_id}`}</td>
                    <td className="py-2.5 px-4 font-sans">ID Invoice Unik QBiz Gateway</td>
                    <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400">inv_17857592</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-sky-600 dark:text-sky-400">{`{amount_formatted}`}</td>
                    <td className="py-2.5 px-4 font-sans">Total nominal terformat mata uang Rupiah</td>
                    <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-sans">Rp 50.123</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-sky-600 dark:text-sky-400">{`{total_amount}`}</td>
                    <td className="py-2.5 px-4 font-sans">Total nominal numerik (termasuk kode unik)</td>
                    <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400">50123</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-sky-600 dark:text-sky-400">{`{base_amount}`}</td>
                    <td className="py-2.5 px-4 font-sans">Nominal pokok tagihan awal</td>
                    <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400">50000</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-sky-600 dark:text-sky-400">{`{unique_code}`}</td>
                    <td className="py-2.5 px-4 font-sans">3 digit kode unik suffix transaksi</td>
                    <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400">123</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-sky-600 dark:text-sky-400">{`{paid_at}`}</td>
                    <td className="py-2.5 px-4 font-sans">Waktu verifikasi transaksi sukses</td>
                    <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-sans">30/08/2026, 14:45:00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TAB 5: REST API REFERENCE */}
          <div id="bot-panel-api" className="dev-bot-panel mt-6 space-y-4 hidden">
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Daftar endpoint REST API yang tersedia untuk mengelola konfigurasi notifikasi secara otomatis dari sistem ERP/POS Anda:
            </p>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-[10px] mr-2">GET</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">/api/v1/merchants/:id/notifications</span>
                <p className="font-sans text-[11px] text-slate-500 mt-1">Mengambil konfigurasi aktif bot Telegram, Discord, dan WhatsApp untuk merchant spesifik.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] mr-2">POST</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">/api/v1/merchants/:id/notifications</span>
                <p className="font-sans text-[11px] text-slate-500 mt-1">Menyimpan atau memperbarui token, chat ID, webhook URL, dan template notifikasi toko.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[10px] mr-2">POST</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">/api/v1/merchants/:id/notifications/test</span>
                <p className="font-sans text-[11px] text-slate-500 mt-1">Mengirimkan pesan uji coba instan untuk memvalidasi kredensial bot sebelum diaktifkan di toko.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MODALS: CREATE API KEY & SECRET REVEAL & CREATE WEBHOOK */}
      {/* ========================================================================= */}

      {/* MODAL 1: CREATE ENTERPRISE API KEY */}
      <div id="modal-create-api-key" className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto hidden">
        <div className="relative my-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
                🔑
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">Create Enterprise API Key</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Configure store scope and granular permissions</p>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close-modal text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form id="form-create-api-key" className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Key Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Key Label / Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. POS Tablet Kasir Cabang 1 / WooCommerce Plugin"
                className="w-full bg-slate-50 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Merchant Store Scoping */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Store Workspace Scope <span className="text-red-500">*</span>
              </label>
              <select
                name="merchantId"
                className="w-full bg-slate-50 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-sky-500"
              >
                {isSuperOrAdmin && (
                  <option value="ALL">🌐 All Stores (Global Super Admin Scope)</option>
                )}
                {accessibleMerchants.map(m => (
                  <option key={m.id} value={m.id} selected={activeMerchant?.id === m.id}>
                    🏪 {m.name} ({m.id})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 leading-tight">
                Integrations using this key will automatically bind to the selected store without needing <code className="font-mono">merchant_id</code> in request bodies.
              </span>
            </div>

            {/* Granular Scopes */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Permission Scopes (Access Control) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    id="btn-preset-all"
                    className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    id="btn-preset-pos"
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 cursor-pointer"
                  >
                    POS Preset
                  </button>
                  <button
                    type="button"
                    id="btn-preset-readonly"
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 cursor-pointer"
                  >
                    Read Only
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {availableScopes.map(sc => (
                  <label 
                    key={sc.id}
                    className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      name="scopes"
                      value={sc.id}
                      defaultChecked={sc.id === 'invoices:create' || sc.id === 'invoices:read'}
                      className="mt-1 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 scope-checkbox"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{sc.label}</span>
                        <code className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">{sc.id}</code>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          sc.category === 'WRITE' 
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50' 
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/50'
                        }`}>
                          {sc.category}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        {sc.description}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100 dark:border-zinc-800 shrink-0">
              <button
                type="button"
                className="btn-close-modal px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-submit-create-key"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Generate API Key
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL 2: SECRET REVEAL DIALOG (ONE-TIME VIEW) */}
      <div id="modal-reveal-api-key" className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto hidden">
        <div className="relative my-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg font-bold">
              ✅
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">API Key Successfully Created!</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Save your secret token in a secure location now.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-2.5">
            <span className="text-base">⚠️</span>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
              <strong>Simpan API Key ini sekarang.</strong> Demi alasan keamanan, token rahasia ini <strong>tidak akan ditampilkan lagi</strong> setelah Anda menutup jendela ini.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Your Secret API Bearer Key:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="revealed-secret-key-input"
                readOnly
                className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold select-all outline-none"
              />
              <button
                type="button"
                id="btn-copy-revealed-key"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-zinc-800 hover:bg-slate-800 transition-all cursor-pointer shrink-0"
              >
                Copy Key
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              id="btn-close-reveal-modal"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer"
            >
              Saya Sudah Menyimpan API Key Ini
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 3: ADD ENTERPRISE WEBHOOK ENDPOINT */}
      <div id="modal-create-webhook" className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto hidden">
        <div className="relative my-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
                ⚡
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">Add Webhook Endpoint</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Receive real-time HTTP events when QRIS payments succeed.</p>
              </div>
            </div>
            <button type="button" className="btn-close-modal p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form id="form-create-webhook" className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Target Store Scope */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Target Merchant Store Scope
              </label>
              <select
                name="merchantId"
                className="w-full bg-slate-50 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {isSuperOrAdmin && (
                  <option value="ALL">🌐 All Stores (Global Webhook Subscription)</option>
                )}
                {accessibleMerchants.map(m => (
                  <option key={m.id} value={m.id} selected={activeMerchant?.id === m.id}>
                    🏪 {m.name} ({m.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Webhook Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Endpoint Label / Integration Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. POS Tablet Kasir Surabaya, WooCommerce Main"
                className="w-full bg-slate-50 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Target URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Target Payload Endpoint URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="url"
                required
                placeholder="https://yourserver.com/api/webhooks/qris"
                className="w-full bg-slate-50 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Must be a publicly reachable HTTPS or HTTP endpoint.</span>
            </div>

            {/* Event Subscriptions Checkboxes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Subscribed Events <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  id="btn-webhook-events-all"
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Select All
                </button>
              </div>
              <div className="space-y-2 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 bg-slate-50/50 dark:bg-zinc-950/40">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-zinc-200 cursor-pointer">
                  <input type="checkbox" name="events" value="payment.success" defaultChecked className="webhook-event-cb rounded text-sky-600 focus:ring-sky-500" />
                  <span><code>payment.success</code> - Customer successfully paid dynamic QRIS</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-zinc-200 cursor-pointer">
                  <input type="checkbox" name="events" value="invoice.created" className="webhook-event-cb rounded text-sky-600 focus:ring-sky-500" />
                  <span><code>invoice.created</code> - New dynamic invoice charge generated</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-zinc-200 cursor-pointer">
                  <input type="checkbox" name="events" value="invoice.expired" className="webhook-event-cb rounded text-sky-600 focus:ring-sky-500" />
                  <span><code>invoice.expired</code> - Charge reached expiration timeout</span>
                </label>
              </div>
            </div>

            {/* HMAC Secret */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  HMAC SHA-256 Signing Secret
                </label>
                <button
                  type="button"
                  id="btn-gen-webhook-secret"
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  ↻ Auto-Generate
                </button>
              </div>
              <input
                type="text"
                id="input-webhook-secret"
                name="secret"
                placeholder="whsec_..."
                className="w-full bg-slate-50 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="pt-3 flex gap-2 justify-end border-t border-slate-100 dark:border-zinc-800 shrink-0">
              <button
                type="button"
                className="btn-close-modal px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-submit-create-webhook"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Create Webhook Endpoint
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. CLIENT INTERACTIVITY SCRIPT */}
      {/* ========================================================================= */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Helper for generating random hex secret
            function randomHexSecret() {
              const arr = new Uint8Array(24);
              window.crypto.getRandomValues(arr);
              return 'whsec_' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
            }

            // --- A. Legacy Key Mask Visibility ---
            const keyInput = document.getElementById('api-key-input');
            const visibilityBtn = document.getElementById('btn-toggle-key-visibility');

            if (visibilityBtn && keyInput) {
              visibilityBtn.addEventListener('click', function() {
                if (keyInput.type === 'password') {
                  keyInput.type = 'text';
                  visibilityBtn.textContent = 'Hide';
                } else {
                  keyInput.type = 'password';
                  visibilityBtn.textContent = 'Show';
                }
              });
            }

            // --- B. Copy Legacy Key ---
            const copyKeyBtn = document.getElementById('btn-copy-key');
            if (copyKeyBtn && keyInput) {
              copyKeyBtn.addEventListener('click', function() {
                navigator.clipboard.writeText(keyInput.value).then(() => {
                  window.showToast({ type: 'success', title: 'Copied', message: 'Legacy API Key copied!' });
                });
              });
            }

            // --- C. Regenerate Legacy Key ---
            const regenBtn = document.getElementById('btn-regenerate-key');
            if (regenBtn) {
              regenBtn.addEventListener('click', function() {
                window.showConfirmDialog({
                  title: 'Regenerate Legacy API Key',
                  message: 'Are you sure? Existing clients using the old legacy key will lose access immediately.',
                  isDestructive: true,
                  confirmText: 'Regenerate',
                  onConfirm: () => {
                    fetch('/api/v1/developer/regenerate-key', { method: 'POST' })
                      .then(res => res.json())
                      .then(data => {
                        if (data.success && keyInput) {
                          keyInput.value = data.apiKey;
                          window.showToast({ type: 'success', title: 'API Key Regenerated', message: 'Legacy key updated!' });
                          setTimeout(() => window.location.reload(), 1000);
                        }
                      });
                  }
                });
              });
            }

            // --- D. Copy Key Prefix from Table ---
            document.querySelectorAll('.btn-copy-prefix-trigger').forEach(btn => {
              btn.addEventListener('click', function() {
                const prefix = this.getAttribute('data-prefix');
                if (prefix) {
                  navigator.clipboard.writeText(prefix).then(() => {
                    window.showToast({ type: 'success', title: 'Copied', message: 'Key reference prefix copied: ' + prefix });
                  });
                }
              });
            });

            // --- E. Create Key Modal Controls ---
            const createModal = document.getElementById('modal-create-api-key');
            const revealModal = document.getElementById('modal-reveal-api-key');
            const openModalBtn = document.getElementById('btn-open-create-key-modal');
            const formCreateKey = document.getElementById('form-create-api-key');
            const revealedKeyInput = document.getElementById('revealed-secret-key-input');
            const copyRevealedBtn = document.getElementById('btn-copy-revealed-key');
            const closeRevealBtn = document.getElementById('btn-close-reveal-modal');

            const createWebhookModal = document.getElementById('modal-create-webhook');
            const openWebhookModalBtn = document.getElementById('btn-open-create-webhook-modal');
            const formCreateWebhook = document.getElementById('form-create-webhook');
            const inputWebhookSecret = document.getElementById('input-webhook-secret');
            const genWebhookSecretBtn = document.getElementById('btn-gen-webhook-secret');

            function openCreateModal() {
              if (createModal) createModal.classList.remove('hidden');
            }
            function openCreateWebhookModal() {
              if (createWebhookModal) {
                createWebhookModal.classList.remove('hidden');
                if (inputWebhookSecret && !inputWebhookSecret.value) {
                  inputWebhookSecret.value = randomHexSecret();
                }
              }
            }
            function closeModals() {
              if (createModal) createModal.classList.add('hidden');
              if (revealModal) revealModal.classList.add('hidden');
              if (createWebhookModal) createWebhookModal.classList.add('hidden');
            }

            if (openModalBtn) openModalBtn.addEventListener('click', openCreateModal);
            document.querySelectorAll('.btn-trigger-create-key').forEach(b => b.addEventListener('click', openCreateModal));
            if (openWebhookModalBtn) openWebhookModalBtn.addEventListener('click', openCreateWebhookModal);
            document.querySelectorAll('.btn-trigger-create-webhook').forEach(b => b.addEventListener('click', openCreateWebhookModal));
            document.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', closeModals));

            if (genWebhookSecretBtn && inputWebhookSecret) {
              genWebhookSecretBtn.addEventListener('click', () => {
                inputWebhookSecret.value = randomHexSecret();
              });
            }

            document.getElementById('btn-webhook-events-all')?.addEventListener('click', () => {
              document.querySelectorAll('.webhook-event-cb').forEach(cb => cb.checked = true);
            });

            // Presets
            const scopeCheckboxes = document.querySelectorAll('.scope-checkbox');
            document.getElementById('btn-preset-all')?.addEventListener('click', () => {
              scopeCheckboxes.forEach(cb => cb.checked = true);
            });
            document.getElementById('btn-preset-pos')?.addEventListener('click', () => {
              scopeCheckboxes.forEach(cb => {
                cb.checked = (cb.value === 'invoices:create' || cb.value === 'invoices:read');
              });
            });
            document.getElementById('btn-preset-readonly')?.addEventListener('click', () => {
              scopeCheckboxes.forEach(cb => {
                cb.checked = (cb.value === 'invoices:read' || cb.value === 'transactions:read' || cb.value === 'merchants:read');
              });
            });

            // Form Submit Create Key
            if (formCreateKey) {
              formCreateKey.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const name = formData.get('name');
                const merchantId = formData.get('merchantId');
                const scopes = formData.getAll('scopes');

                if (scopes.length === 0) {
                  window.showToast({ type: 'warning', title: 'Scopes Required', message: 'Please select at least one permission scope.' });
                  return;
                }

                const submitBtn = document.getElementById('btn-submit-create-key');
                if (submitBtn) {
                  submitBtn.disabled = true;
                  submitBtn.textContent = 'Generating...';
                }

                fetch('/api/v1/developer/keys', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, merchantId, scopes })
                })
                  .then(res => res.json())
                  .then(data => {
                    if (submitBtn) {
                      submitBtn.disabled = false;
                      submitBtn.textContent = 'Generate API Key';
                    }

                    if (data.success && data.fullSecretKey) {
                      closeModals();
                      if (revealedKeyInput) revealedKeyInput.value = data.fullSecretKey;
                      if (revealModal) revealModal.classList.remove('hidden');
                    } else {
                      window.showToast({ type: 'error', title: 'Failed to Create Key', message: data.error || 'Unknown error' });
                    }
                  })
                  .catch(err => {
                    if (submitBtn) {
                      submitBtn.disabled = false;
                      submitBtn.textContent = 'Generate API Key';
                    }
                    window.showToast({ type: 'error', title: 'Network Error', message: 'Failed to connect to server' });
                  });
              });
            }

            // Form Submit Create Webhook
            if (formCreateWebhook) {
              formCreateWebhook.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const name = formData.get('name');
                const merchantId = formData.get('merchantId');
                const url = formData.get('url');
                const secret = formData.get('secret');
                const events = formData.getAll('events');

                if (events.length === 0) {
                  window.showToast({ type: 'warning', title: 'Events Required', message: 'Please select at least one event subscription.' });
                  return;
                }

                const submitBtn = document.getElementById('btn-submit-create-webhook');
                if (submitBtn) {
                  submitBtn.disabled = true;
                  submitBtn.textContent = 'Saving...';
                }

                fetch('/api/v1/developer/webhooks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, merchantId, url, secret, events })
                })
                  .then(res => res.json())
                  .then(data => {
                    if (submitBtn) {
                      submitBtn.disabled = false;
                      submitBtn.textContent = 'Create Webhook Endpoint';
                    }

                    if (data.success) {
                      closeModals();
                      window.showToast({ type: 'success', title: 'Webhook Created', message: 'Webhook endpoint registered successfully!' });
                      setTimeout(() => window.location.reload(), 1000);
                    } else {
                      window.showToast({ type: 'error', title: 'Failed to Create Webhook', message: data.error || 'Unknown error' });
                    }
                  })
                  .catch(err => {
                    if (submitBtn) {
                      submitBtn.disabled = false;
                      submitBtn.textContent = 'Create Webhook Endpoint';
                    }
                    window.showToast({ type: 'error', title: 'Network Error', message: 'Failed to connect to server' });
                  });
              });
            }

            // --- F. Individual Webhook Test Dispatch ---
            document.querySelectorAll('.btn-test-webhook-endpoint').forEach(btn => {
              btn.addEventListener('click', function() {
                const webhookId = this.getAttribute('data-id');
                if (!webhookId) return;

                const origHtml = this.innerHTML;
                this.disabled = true;
                this.innerHTML = 'Testing...';

                fetch('/api/v1/developer/webhooks/' + webhookId + '/test', { method: 'POST' })
                  .then(res => res.json())
                  .then(data => {
                    this.disabled = false;
                    this.innerHTML = origHtml;

                    if (data.success) {
                      window.showToast({
                        type: 'success',
                        title: 'Webhook Test Passed',
                        message: 'Delivered in ' + data.durationMs + 'ms! Destination returned HTTP ' + data.statusCode
                      });
                      setTimeout(() => window.location.reload(), 1500);
                    } else {
                      window.showToast({
                        type: 'error',
                        title: 'Webhook Test Failed',
                        message: 'Test failed (HTTP ' + data.statusCode + '): ' + (data.error || 'Connection error')
                      });
                    }
                  })
                  .catch(err => {
                    this.disabled = false;
                    this.innerHTML = origHtml;
                    window.showToast({ type: 'error', title: 'Network Error', message: 'Failed to reach test server' });
                  });
              });
            });

            // --- G. Toggle Webhook Status (Pause / Activate) ---
            document.querySelectorAll('.btn-toggle-webhook-status').forEach(btn => {
              btn.addEventListener('click', function() {
                const webhookId = this.getAttribute('data-id');
                const currentStatus = this.getAttribute('data-status');
                if (!webhookId) return;

                const nextStatus = currentStatus === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
                fetch('/api/v1/developer/webhooks/' + webhookId, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: nextStatus })
                })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      window.showToast({
                        type: 'success',
                        title: 'Status Updated',
                        message: 'Webhook is now ' + nextStatus
                      });
                      setTimeout(() => window.location.reload(), 800);
                    } else {
                      window.showToast({ type: 'error', title: 'Error', message: data.error || 'Failed to update status' });
                    }
                  });
              });
            });

            // --- H. Delete Webhook Endpoint ---
            document.querySelectorAll('.btn-delete-webhook-endpoint').forEach(btn => {
              btn.addEventListener('click', function() {
                const webhookId = this.getAttribute('data-id');
                const webhookName = this.getAttribute('data-name');
                if (!webhookId) return;

                window.showConfirmDialog({
                  title: 'Delete Webhook Endpoint',
                  message: 'Permanently remove webhook destination "' + webhookName + '"? No further events will be dispatched to this URL.',
                  isDestructive: true,
                  confirmText: 'Delete Permanently',
                  onConfirm: () => {
                    fetch('/api/v1/developer/webhooks/' + webhookId, { method: 'DELETE' })
                      .then(res => res.json())
                      .then(data => {
                        if (data.success) {
                          window.showToast({ type: 'success', title: 'Webhook Deleted', message: 'Webhook endpoint removed.' });
                          setTimeout(() => window.location.reload(), 800);
                        } else {
                          window.showToast({ type: 'error', title: 'Error', message: data.error || 'Failed to delete webhook' });
                        }
                      });
                  }
                });
              });
            });

            // Copy Revealed Key
            if (copyRevealedBtn && revealedKeyInput) {
              copyRevealedBtn.addEventListener('click', function() {
                navigator.clipboard.writeText(revealedKeyInput.value).then(() => {
                  copyRevealedBtn.textContent = 'Copied!';
                  copyRevealedBtn.classList.replace('bg-slate-900', 'bg-emerald-600');
                  copyRevealedBtn.classList.replace('dark:bg-zinc-800', 'dark:bg-emerald-600');
                  setTimeout(() => {
                    copyRevealedBtn.textContent = 'Copy Key';
                    copyRevealedBtn.classList.replace('bg-emerald-600', 'bg-slate-900');
                    copyRevealedBtn.classList.replace('dark:bg-emerald-600', 'dark:bg-zinc-800');
                  }, 2000);
                });
              });
            }

            if (closeRevealBtn) {
              closeRevealBtn.addEventListener('click', function() {
                closeModals();
                window.location.reload();
              });
            }

            // --- I. Revoke API Key ---
            document.querySelectorAll('.btn-revoke-key').forEach(btn => {
              btn.addEventListener('click', function() {
                const keyId = this.getAttribute('data-id');
                const keyName = this.getAttribute('data-name');
                if (!keyId) return;

                window.showConfirmDialog({
                  title: 'Revoke API Key',
                  message: 'Are you sure you want to revoke "' + keyName + '"? Any applications using this key will be blocked immediately.',
                  isDestructive: true,
                  confirmText: 'Revoke Key',
                  onConfirm: () => {
                    fetch('/api/v1/developer/keys/' + keyId + '/revoke', { method: 'POST' })
                      .then(res => res.json())
                      .then(data => {
                        if (data.success) {
                          window.showToast({ type: 'success', title: 'Key Revoked', message: 'API key has been revoked.' });
                          setTimeout(() => window.location.reload(), 1000);
                        } else {
                          window.showToast({ type: 'error', title: 'Error', message: data.error || 'Failed to revoke key' });
                        }
                      });
                  }
                });
              });
            });

            // --- J. Delete API Key ---
            document.querySelectorAll('.btn-delete-key').forEach(btn => {
              btn.addEventListener('click', function() {
                const keyId = this.getAttribute('data-id');
                const keyName = this.getAttribute('data-name');
                if (!keyId) return;

                window.showConfirmDialog({
                  title: 'Delete API Key',
                  message: 'Permanently remove "' + keyName + '" from database? This cannot be undone.',
                  isDestructive: true,
                  confirmText: 'Delete Permanently',
                  onConfirm: () => {
                    fetch('/api/v1/developer/keys/' + keyId, { method: 'DELETE' })
                      .then(res => res.json())
                      .then(data => {
                        if (data.success) {
                          window.showToast({ type: 'success', title: 'Key Deleted', message: 'API key removed.' });
                          setTimeout(() => window.location.reload(), 1000);
                        } else {
                          window.showToast({ type: 'error', title: 'Error', message: data.error || 'Failed to delete key' });
                        }
                      });
                  }
                });
              });
            });

            // --- K. Interactive Snippets Tab Switcher ---
            const tabButtons = document.querySelectorAll('.tab-btn');
            let activeTab = 'curl';

            tabButtons.forEach(btn => {
              btn.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                activeTab = targetTab;

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

                document.querySelectorAll('[id^="panel-"]').forEach(p => p.classList.add('hidden'));
                const targetPanel = document.getElementById('panel-' + targetTab);
                if (targetPanel) targetPanel.classList.remove('hidden');
              });
            });

            // --- L. Copy Code Snippet ---
            const copySnippetBtn = document.getElementById('btn-copy-snippet');
            if (copySnippetBtn) {
              copySnippetBtn.addEventListener('click', function() {
                const codePre = document.getElementById('panel-' + activeTab);
                if (!codePre) return;
                
                const codeText = codePre.querySelector('code').textContent;
                navigator.clipboard.writeText(codeText).then(() => {
                  window.showToast({ type: 'success', title: 'Copied', message: 'Code snippet copied to clipboard!' });
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

            // --- M. Legacy Webhook Test Event Dispatcher ---
            const testWebhookBtn = document.getElementById('btn-test-webhook');
            if (testWebhookBtn) {
              testWebhookBtn.addEventListener('click', function() {
                const urlInput = document.getElementById('webhook-url');
                const secretInput = document.getElementById('webhook-secret');
                if (!urlInput || !urlInput.value) {
                  window.showToast({ type: 'warning', title: 'Validation Warning', message: 'Please enter a target callback endpoint URL first.' });
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
                      window.showToast({ type: 'success', title: 'Webhook Test Passed', message: 'Test webhook dispatch successfully accepted by destination! Status: HTTP ' + data.status });
                    } else {
                      window.showToast({ type: 'error', title: 'Webhook Test Failed', message: 'Webhook dispatch test failed: ' + (data.error || 'Connection timed out') });
                    }
                  })
                  .catch(err => {
                    this.disabled = false;
                    this.innerHTML = 'Send Test Event';
                    window.showToast({ type: 'error', title: 'Network Error', message: 'Network error testing webhook dispatch' });
                  });
              });
            }

            // --- N. Bot Channels Tab Switcher ---
            const botTabBtns = document.querySelectorAll('.dev-bot-tab-btn');
            botTabBtns.forEach(btn => {
              btn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                if (!targetId) return;

                botTabBtns.forEach(b => {
                  b.className = 'dev-bot-tab-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer';
                });

                this.className = 'dev-bot-tab-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-sky-600 text-white shadow-xs cursor-pointer';

                document.querySelectorAll('.dev-bot-panel').forEach(panel => {
                  panel.classList.add('hidden');
                });

                const activePanel = document.getElementById(targetId);
                if (activePanel) {
                  activePanel.classList.remove('hidden');
                }
              });
            });

          })();
        `
      }} />

    </Layout>
  );
}
