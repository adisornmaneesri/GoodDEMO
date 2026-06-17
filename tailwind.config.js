/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        dark: {
          900: '#050508',
          800: '#0d0d14',
          700: '#12121c',
          600: '#1a1a28',
          500: '#252538',
        },
        rare: {
          common:   '#9ca3af',
          uncommon: '#34d399',
          rare:     '#60a5fa',
          epic:     '#a78bfa',
          legend:   '#fbbf24',
          secret:   '#f472b6',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body:    ['var(--font-body)', 'sans-serif'],
      },
      animation: {
        'shimmer':    'shimmer 2s linear infinite',
        'float':      'float 3s ease-in-out infinite',
        'card-flip':  'cardFlip 0.6s ease-in-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-up':   'slideUp 0.4s ease-out',
      },
      keyframes: {
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float:     { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        cardFlip:  { '0%': { transform: 'rotateY(0deg)' }, '100%': { transform: 'rotateY(180deg)' } },
        glowPulse: { '0%,100%': { boxShadow: '0 0 20px rgba(251,191,36,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(251,191,36,0.8)' } },
        slideUp:   { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      backgroundImage: {
        'card-gradient': 'linear-gradient(135deg, #1a1a28 0%, #252538 50%, #1a1a28 100%)',
        'gold-gradient': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.1) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}
