/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ced-IT Theme
        ced: {
          primary: '#0a1628',
          secondary: '#0d1f35',
          tertiary: '#132743',
          card: '#0f2541',
          accent: '#00d4ff',
          'accent-dark': '#00a8cc',
        },
        // Override gray with darker navy tones
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#0f2541',
          750: '#0d1f35',
          800: '#0a1628',
          850: '#081220',
          900: '#060e18',
          950: '#040a10',
        },
        // Cyan accent colors
        cyan: {
          400: '#22d3ee',
          500: '#00d4ff',
          600: '#00a8cc',
        },
        blue: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#0066ff',
          700: '#0052cc',
        }
      },
      boxShadow: {
        'glow': '0 0 15px rgba(0, 212, 255, 0.5)',
        'glow-lg': '0 0 25px rgba(0, 212, 255, 0.6)',
      },
      backgroundImage: {
        'gradient-ced': 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
      }
    },
  },
  plugins: [],
}
