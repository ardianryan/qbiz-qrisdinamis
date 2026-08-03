import { reactRenderer } from '@hono/react-renderer';

export const renderer = reactRenderer(({ children, title }: any) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ? `${title} - QBiz Multi-QRIS` : 'QBiz Multi-QRIS Dynamic Gateway Hub'}</title>
        
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
