import { reactRenderer } from '@hono/react-renderer';
import { getSystemSettings } from './services/settings.ts';

function hexToRgb(hex: string): string {
  if (!hex) return '2, 132, 199';
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return `${r}, ${g}, ${b}`;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return `${r}, ${g}, ${b}`;
  }
  return '2, 132, 199';
}

export const renderer = reactRenderer(async ({ children, title, ...props }: any) => {
  const settings = await getSystemSettings();
  const appName = props.appName || settings.appName || 'QBiz Gateway';
  const appFaviconUrl = props.appFaviconUrl || settings.appFaviconUrl || '';
  const appTagline = props.appTagline || settings.appTagline || 'Dynamic QRIS Hub';
  const themeColor = props.themeColor || settings.themeColor || '#0284c7';
  const appleTouchIconUrl = props.appleTouchIconUrl || settings.appleTouchIconUrl || '';
  const pwaEnabled = props.pwaEnabled !== undefined ? props.pwaEnabled : (settings.pwaEnabled !== undefined ? settings.pwaEnabled : true);
  const rgb = hexToRgb(themeColor);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        
        {/* International Standard PWA & Web App Manifest */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content={themeColor} />
        <meta name="color-scheme" content="dark light" />
        
        {/* Apple iOS Web App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={appName} />
        <link rel="apple-touch-icon" href={appleTouchIconUrl || appFaviconUrl || "/static/logo.png"} />
        
        {/* Dynamic Favicon */}
        {appFaviconUrl ? (
          <link rel="icon" href={appFaviconUrl} />
        ) : (
          <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
        )}

        {/* SEO Metadata */}
        <title>{title ? `${title} - ${appName}` : `${appName} - ${appTagline}`}</title>
        <meta name="description" content={`${appName} - Professional self-hosted dynamic QRIS payment router and GoBiz transaction interceptor gateway.`} />
        <meta name="keywords" content="qris, dynamic qris, gopay, gobiz, gofood, payment gateway, transaction listener, api qris, pwa" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph / Social Media Web Integration */}
        <meta property="og:title" content={`${appName} - ${appTagline}`} />
        <meta property="og:description" content={`${appName} - Professional self-hosted dynamic QRIS payment router and GoBiz transaction interceptor gateway.`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/static/logo.png" />
        
        {/* Geographic Targeting (GEO) Tags */}
        <meta name="geo.region" content="ID" />
        <meta name="geo.placename" content="Jakarta" />
        <meta name="geo.position" content="-6.200000;106.816666" />
        <meta name="ICBM" content="-6.200000, 106.816666" />
        
        {/* AI Agent / LLMs Crawling Discoverability Link Headers */}
        <meta name="ai-agent" content="enabled" />
        <link rel="llms" href="/llms.txt" type="text/markdown" />
        <link rel="llms-full" href="/llms-full.txt" type="text/markdown" />
        
        {/* Anti-Flicker Script for System Dark/Light Mode Theme Selection */}
        <script
          dangerouslySetInnerHTML={{
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
            `,
          }}
        />
        
        {/* Tailwind CSS stylesheet */}
        <link rel="stylesheet" href="/static/styles.css" />
        
        {/* Premium Font Pairing Links */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Geist+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        <style>
          {`
            :root {
              --brand-primary: ${themeColor};
              --brand-primary-rgb: ${rgb};
            }
            body {
              font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            code, pre, .font-mono {
              font-family: 'Geist Mono', 'SF Mono', JetBrains Mono, monospace;
            }

            /* ========================================================================= */
            /* DYNAMIC PRIMARY BRAND COLOR ENGINE */
            /* ========================================================================= */
            .bg-sky-600, .bg-sky-500 {
              background-color: var(--brand-primary) !important;
            }
            .hover\\:bg-sky-700:hover, .hover\\:bg-sky-600:hover {
              filter: brightness(0.9) !important;
            }
            .active\\:bg-sky-800:active {
              filter: brightness(0.8) !important;
            }
            .text-sky-600, .text-sky-500, .dark\\:text-sky-400 {
              color: var(--brand-primary) !important;
            }
            .border-sky-600, .border-sky-500, .dark\\:border-sky-400 {
              border-color: var(--brand-primary) !important;
            }
            .bg-sky-50, .bg-sky-100 {
              background-color: rgba(var(--brand-primary-rgb), 0.09) !important;
            }
            .dark\\:bg-sky-950, .dark\\:bg-sky-950\\/40, .dark\\:bg-sky-950\\/60 {
              background-color: rgba(var(--brand-primary-rgb), 0.18) !important;
            }
            .border-sky-200, .dark\\:border-sky-900\\/50, .dark\\:border-sky-800 {
              border-color: rgba(var(--brand-primary-rgb), 0.28) !important;
            }
            :focus-visible, .focus\\:ring-sky-500:focus {
              --tw-ring-color: var(--brand-primary) !important;
            }
            
            /* Fluid Apple/iOS Spring Curves & View Transitions */
            @keyframes spaViewEnter {
              0% {
                opacity: 0;
                transform: translateY(10px);
              }
              100% {
                opacity: 1;
                transform: none;
              }
            }

            @keyframes tabSpring {
              0% { transform: scale(1); }
              35% { transform: scale(0.82) translateY(2px); }
              70% { transform: scale(1.1) translateY(-2px); }
              100% { transform: scale(1) translateY(0); }
            }

            .animate-view-enter {
              animation: spaViewEnter 200ms cubic-bezier(0.16, 1, 0.3, 1);
            }

            .tab-spring-tap {
              animation: tabSpring 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .sheet-spring {
              transition: transform 340ms cubic-bezier(0.32, 0.72, 0, 1), opacity 260ms ease !important;
            }

            #main-content {
              transition: opacity 120ms ease;
            }

            #spa-progress-bar {
              position: fixed;
              top: 0;
              left: 0;
              height: 2.5px;
              width: 0%;
              background: linear-gradient(90deg, var(--brand-primary), rgba(var(--brand-primary-rgb), 0.7), #60a5fa) !important;
              box-shadow: 0 0 10px var(--brand-primary), 0 0 5px var(--brand-primary) !important;
              z-index: 99999;
              transition: width 200ms ease, opacity 150ms ease;
              pointer-events: none;
              opacity: 0;
            }
          `}
        </style>
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-200">
        <div id="spa-progress-bar"></div>
        {children}

        {/* International Standard PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && ${pwaEnabled ? 'true' : 'false'}) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('[PWA] Service Worker active, scope:', reg.scope);
                    })
                    .catch(function(err) {
                      console.warn('[PWA] Service Worker registration failed:', err);
                    });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
});
