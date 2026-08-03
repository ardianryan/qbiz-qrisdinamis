/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./main.tsx"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom branding colors mapped to Slate/Zinc and Sky base
        canvas: {
          light: '#f8fafc', // slate-50
          dark: '#09090b',  // zinc-950
        },
        surface: {
          light: '#ffffff', // white
          dark: '#18181b',  // zinc-900
        },
        borderToken: {
          light: '#e2e8f0', // slate-200
          dark: '#27272a',  // zinc-800
        }
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"Geist Sans"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', '"SF Mono"', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
