/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg0: '#0a0a0f',
          bg1: '#0d1117',
          blue: '#00d4ff',
          green: '#00ff88',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glowBlue: '0 0 0 1px rgba(0,212,255,0.25), 0 0 24px rgba(0,212,255,0.18)',
        glowGreen: '0 0 0 1px rgba(0,255,136,0.25), 0 0 24px rgba(0,255,136,0.18)',
        glowRed: '0 0 0 1px rgba(239,68,68,0.28), 0 0 24px rgba(239,68,68,0.22)',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-30%)' },
          '100%': { transform: 'translateY(130%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        scan: 'scan 6s linear infinite',
        pulseSoft: 'pulseSoft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

