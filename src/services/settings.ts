import { db } from '../../db/db.ts';
import { systemSettings } from '../../db/schema.ts';
import { DEFAULT_TEMPLATES } from './notification.ts';

export interface SystemSettingsConfig {
  // Tab 1: Branding & Visuals
  appName: string;
  appLogoUrl: string;
  appFaviconUrl: string;
  appTagline: string;
  footerText: string;
  themeColor: string;
  appleTouchIconUrl: string;

  // Tab 2: PWA & Mobile App
  pwaEnabled: boolean;
  pwaInstallPrompt: boolean;
  pwaPromptDelaySeconds: number;
  pwaIcon192Url: string;
  pwaIcon512Url: string;

  // Tab 3: Payment & QRIS Policies
  invoiceExpiryMinutes: number;
  uniqueCodeMin: number;
  uniqueCodeMax: number;
  minAmount: number;
  maxAmount: number;
  defaultStaticQris: string;
  defaultWebhookRetryLimit: number;
  webhookRetryDelaySeconds: number;

  // Tab 4: Scraper & Engine Fleet
  scraperIntervalSeconds: number;
  scraperAutoRestart: boolean;
  scraperAlertOnNeedsOtp: boolean;

  // Tab 5: Security & Access Controls
  sessionTimeoutHours: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowDemoLogin: boolean;
  rateLimitPerMinute: number;

  // Tab 6: Notification Fallbacks & System Alerts
  defaultTelegramTemplate: string;
  defaultWhatsappTemplate: string;
  defaultDiscordTemplate: string;
  adminAlertWebhook: string;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsConfig = {
  // Tab 1: Branding
  appName: 'QBiz Gateway',
  appLogoUrl: '',
  appFaviconUrl: '',
  appTagline: 'Dynamic QRIS Payment Gateway',
  footerText: '© 2026 QBiz Gateway. All rights reserved.',
  themeColor: '#0284c7',
  appleTouchIconUrl: '',

  // Tab 2: PWA
  pwaEnabled: true,
  pwaInstallPrompt: true,
  pwaPromptDelaySeconds: 3,
  pwaIcon192Url: '',
  pwaIcon512Url: '',

  // Tab 3: Payment
  invoiceExpiryMinutes: 15,
  uniqueCodeMin: 1,
  uniqueCodeMax: 999,
  minAmount: 1000,
  maxAmount: 50000000,
  defaultStaticQris: '',
  defaultWebhookRetryLimit: 3,
  webhookRetryDelaySeconds: 5,

  // Tab 4: Scraper
  scraperIntervalSeconds: 30,
  scraperAutoRestart: true,
  scraperAlertOnNeedsOtp: true,

  // Tab 5: Security
  sessionTimeoutHours: 168,
  maintenanceMode: false,
  maintenanceMessage: 'System is currently undergoing scheduled maintenance. Please try again later.',
  allowDemoLogin: false,
  rateLimitPerMinute: 60,

  // Tab 6: Notifications
  defaultTelegramTemplate: DEFAULT_TEMPLATES.telegram,
  defaultWhatsappTemplate: DEFAULT_TEMPLATES.whatsapp,
  defaultDiscordTemplate: DEFAULT_TEMPLATES.discord,
  adminAlertWebhook: '',
};

let cachedSettings: SystemSettingsConfig | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute background revalidation

/**
 * Retrieve cached system settings with database fallback and automatic defaults.
 */
export async function getSystemSettings(forceRefresh = false): Promise<SystemSettingsConfig> {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && (now - lastFetchTime < CACHE_TTL_MS)) {
    return cachedSettings;
  }

  try {
    const rows = await db.select().from(systemSettings);
    const map = new Map<string, string>();
    for (const r of rows) {
      map.set(r.key, r.value);
    }

    const config: SystemSettingsConfig = {
      // Tab 1: Branding
      appName: map.get('app_name') || DEFAULT_SYSTEM_SETTINGS.appName,
      appLogoUrl: map.get('app_logo_url') || DEFAULT_SYSTEM_SETTINGS.appLogoUrl,
      appFaviconUrl: map.get('app_favicon_url') || DEFAULT_SYSTEM_SETTINGS.appFaviconUrl,
      appTagline: map.get('app_tagline') || DEFAULT_SYSTEM_SETTINGS.appTagline,
      footerText: map.get('footer_text') || DEFAULT_SYSTEM_SETTINGS.footerText,
      themeColor: map.get('theme_color') || DEFAULT_SYSTEM_SETTINGS.themeColor,
      appleTouchIconUrl: map.get('apple_touch_icon_url') || DEFAULT_SYSTEM_SETTINGS.appleTouchIconUrl,

      // Tab 2: PWA
      pwaEnabled: map.has('pwa_enabled') ? map.get('pwa_enabled') === 'true' : DEFAULT_SYSTEM_SETTINGS.pwaEnabled,
      pwaInstallPrompt: map.has('pwa_install_prompt') ? map.get('pwa_install_prompt') === 'true' : DEFAULT_SYSTEM_SETTINGS.pwaInstallPrompt,
      pwaPromptDelaySeconds: map.has('pwa_prompt_delay_seconds') ? parseInt(map.get('pwa_prompt_delay_seconds') || '3', 10) : DEFAULT_SYSTEM_SETTINGS.pwaPromptDelaySeconds,
      pwaIcon192Url: map.get('pwa_icon_192_url') || DEFAULT_SYSTEM_SETTINGS.pwaIcon192Url,
      pwaIcon512Url: map.get('pwa_icon_512_url') || DEFAULT_SYSTEM_SETTINGS.pwaIcon512Url,

      // Tab 3: Payment
      invoiceExpiryMinutes: map.has('invoice_expiry_minutes') 
        ? Math.max(1, parseInt(map.get('invoice_expiry_minutes') || '15', 10)) 
        : DEFAULT_SYSTEM_SETTINGS.invoiceExpiryMinutes,
      uniqueCodeMin: map.has('unique_code_min') ? parseInt(map.get('unique_code_min') || '1', 10) : DEFAULT_SYSTEM_SETTINGS.uniqueCodeMin,
      uniqueCodeMax: map.has('unique_code_max') ? parseInt(map.get('unique_code_max') || '999', 10) : DEFAULT_SYSTEM_SETTINGS.uniqueCodeMax,
      minAmount: map.has('min_amount') ? parseInt(map.get('min_amount') || '1000', 10) : DEFAULT_SYSTEM_SETTINGS.minAmount,
      maxAmount: map.has('max_amount') ? parseInt(map.get('max_amount') || '50000000', 10) : DEFAULT_SYSTEM_SETTINGS.maxAmount,
      defaultStaticQris: map.get('default_static_qris') || DEFAULT_SYSTEM_SETTINGS.defaultStaticQris,
      defaultWebhookRetryLimit: map.has('default_webhook_retry_limit')
        ? Math.max(1, parseInt(map.get('default_webhook_retry_limit') || '3', 10))
        : DEFAULT_SYSTEM_SETTINGS.defaultWebhookRetryLimit,
      webhookRetryDelaySeconds: map.has('webhook_retry_delay_seconds') ? parseInt(map.get('webhook_retry_delay_seconds') || '5', 10) : DEFAULT_SYSTEM_SETTINGS.webhookRetryDelaySeconds,

      // Tab 4: Scraper
      scraperIntervalSeconds: map.has('scraper_interval_seconds') ? parseInt(map.get('scraper_interval_seconds') || '30', 10) : DEFAULT_SYSTEM_SETTINGS.scraperIntervalSeconds,
      scraperAutoRestart: map.has('scraper_auto_restart') ? map.get('scraper_auto_restart') === 'true' : DEFAULT_SYSTEM_SETTINGS.scraperAutoRestart,
      scraperAlertOnNeedsOtp: map.has('scraper_alert_on_needs_otp') ? map.get('scraper_alert_on_needs_otp') === 'true' : DEFAULT_SYSTEM_SETTINGS.scraperAlertOnNeedsOtp,

      // Tab 5: Security
      sessionTimeoutHours: map.has('session_timeout_hours')
        ? Math.max(1, parseInt(map.get('session_timeout_hours') || '168', 10))
        : DEFAULT_SYSTEM_SETTINGS.sessionTimeoutHours,
      maintenanceMode: map.get('maintenance_mode') === 'true',
      maintenanceMessage: map.get('maintenance_message') || DEFAULT_SYSTEM_SETTINGS.maintenanceMessage,
      allowDemoLogin: map.get('allow_demo_login') === 'true',
      rateLimitPerMinute: map.has('rate_limit_per_minute') ? parseInt(map.get('rate_limit_per_minute') || '60', 10) : DEFAULT_SYSTEM_SETTINGS.rateLimitPerMinute,

      // Tab 6: Notifications
      defaultTelegramTemplate: map.get('default_telegram_template') || DEFAULT_SYSTEM_SETTINGS.defaultTelegramTemplate,
      defaultWhatsappTemplate: map.get('default_whatsapp_template') || DEFAULT_SYSTEM_SETTINGS.defaultWhatsappTemplate,
      defaultDiscordTemplate: map.get('default_discord_template') || DEFAULT_SYSTEM_SETTINGS.defaultDiscordTemplate,
      adminAlertWebhook: map.get('admin_alert_webhook') || DEFAULT_SYSTEM_SETTINGS.adminAlertWebhook,
    };

    cachedSettings = config;
    lastFetchTime = now;
    return config;
  } catch (err: any) {
    console.warn('[Settings] Failed to fetch settings from DB, using fallback defaults:', err.message);
    return cachedSettings || DEFAULT_SYSTEM_SETTINGS;
  }
}

/**
 * Update system settings in DB and immediately invalidate/refresh memory cache.
 */
export async function updateSystemSettings(updates: Partial<SystemSettingsConfig>): Promise<SystemSettingsConfig> {
  const keyMap: Record<keyof SystemSettingsConfig, string> = {
    // Tab 1: Branding
    appName: 'app_name',
    appLogoUrl: 'app_logo_url',
    appFaviconUrl: 'app_favicon_url',
    appTagline: 'app_tagline',
    footerText: 'footer_text',
    themeColor: 'theme_color',
    appleTouchIconUrl: 'apple_touch_icon_url',

    // Tab 2: PWA
    pwaEnabled: 'pwa_enabled',
    pwaInstallPrompt: 'pwa_install_prompt',
    pwaPromptDelaySeconds: 'pwa_prompt_delay_seconds',
    pwaIcon192Url: 'pwa_icon_192_url',
    pwaIcon512Url: 'pwa_icon_512_url',

    // Tab 3: Payment
    invoiceExpiryMinutes: 'invoice_expiry_minutes',
    uniqueCodeMin: 'unique_code_min',
    uniqueCodeMax: 'unique_code_max',
    minAmount: 'min_amount',
    maxAmount: 'max_amount',
    defaultStaticQris: 'default_static_qris',
    defaultWebhookRetryLimit: 'default_webhook_retry_limit',
    webhookRetryDelaySeconds: 'webhook_retry_delay_seconds',

    // Tab 4: Scraper
    scraperIntervalSeconds: 'scraper_interval_seconds',
    scraperAutoRestart: 'scraper_auto_restart',
    scraperAlertOnNeedsOtp: 'scraper_alert_on_needs_otp',

    // Tab 5: Security
    sessionTimeoutHours: 'session_timeout_hours',
    maintenanceMode: 'maintenance_mode',
    maintenanceMessage: 'maintenance_message',
    allowDemoLogin: 'allow_demo_login',
    rateLimitPerMinute: 'rate_limit_per_minute',

    // Tab 6: Notifications
    defaultTelegramTemplate: 'default_telegram_template',
    defaultWhatsappTemplate: 'default_whatsapp_template',
    defaultDiscordTemplate: 'default_discord_template',
    adminAlertWebhook: 'admin_alert_webhook',
  };

  for (const [field, dbKey] of Object.entries(keyMap)) {
    const val = updates[field as keyof SystemSettingsConfig];
    if (val !== undefined) {
      const stringValue = typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val);
      await db.insert(systemSettings)
        .values({
          key: dbKey,
          value: stringValue,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value: stringValue,
            updatedAt: new Date(),
          },
        });
    }
  }

  // Force cache refresh
  return await getSystemSettings(true);
}

/**
 * Helper to manually invalidate settings cache
 */
export function invalidateSettingsCache() {
  cachedSettings = null;
  lastFetchTime = 0;
}

