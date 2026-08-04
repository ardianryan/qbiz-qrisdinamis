import { reactRenderer } from '@hono/react-renderer';

export const renderer = reactRenderer(({ children, title }: any) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* SEO Metadata */}
        <title>{title ? `${title} - QBiz Gateway` : 'QBiz Gateway - Dynamic QRIS Hub'}</title>
        <meta name="description" content="QBiz Gateway - Professional self-hosted dynamic QRIS payment router and GoBiz transaction interceptor gateway." />
        <meta name="keywords" content="qris, dynamic qris, gopay, gobiz, gofood, payment gateway, transaction listener, api qris" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph / Social Media Web Integration */}
        <meta property="og:title" content="QBiz Gateway - Dynamic QRIS Hub" />
        <meta property="og:description" content="Professional self-hosted dynamic QRIS payment router and GoBiz transaction interceptor gateway." />
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
        
        {/* JSON-LD Semantic Structured Data (AEO & SEO Schema.org) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "QBiz Gateway",
              "description": "Self-hosted dynamic QRIS payment gateway hub and GoBiz transaction interceptor gateway.",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Linux, macOS, Windows",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
        
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
        
        {/* Premium Font Pairing Links (Self-contained system family fallback used in CSS) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Geist+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        <style>
          {`
            body {
              font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            code, pre, .font-mono {
              font-family: 'Geist Mono', 'SF Mono', JetBrains Mono, monospace;
            }
          `}
        </style>
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
});
