import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dynamic theme accent — controlled by CSS variable, changes per album/song
        't-accent': 'rgb(var(--t-accent-rgb) / <alpha-value>)',
        't-tint':   'rgb(var(--t-bg-tint-rgb) / <alpha-value>)',
        noir: {
          void: '#04040A',
          black: '#080810',
          deep: '#0D1625',
          navy: '#0D1B2A',
          atlantic: '#1B3A4B',
          slate: '#2C4A5E',
          fog: '#526E82',
          mist: '#7A9AAD',
          silver: '#B8C5D0',
          pearl: '#D4DDE3',
          ivory: '#F2EDE3',
          gold: '#C4953A',
          'gold-light': '#D4A84B',
          'gold-dark': '#9A7020',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fog-drift': 'fogDrift 25s ease-in-out infinite',
        'fog-drift-alt': 'fogDriftAlt 30s ease-in-out infinite reverse',
        'particle-float': 'particleFloat 6s ease-in-out infinite',
        'wave-slow': 'waveSlow 12s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'equalizer-1': 'equalizer1 0.7s ease-in-out infinite alternate',
        'equalizer-2': 'equalizer2 0.9s ease-in-out infinite alternate',
        'equalizer-3': 'equalizer3 0.6s ease-in-out infinite alternate',
        'equalizer-4': 'equalizer4 0.8s ease-in-out infinite alternate',
        'equalizer-5': 'equalizer5 0.75s ease-in-out infinite alternate',
      },
      keyframes: {
        fogDrift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '25%': { transform: 'translate(1%, 1%) scale(1.01)', opacity: '0.95' },
          '50%': { transform: 'translate(-1%, 2%) scale(1.02)', opacity: '1' },
          '75%': { transform: 'translate(2%, -1%) scale(0.99)', opacity: '0.9' },
        },
        fogDriftAlt: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.8' },
          '33%': { transform: 'translate(-2%, -1%) scale(1.01)', opacity: '0.6' },
          '66%': { transform: 'translate(1%, 2%) scale(1.02)', opacity: '0.9' },
        },
        particleFloat: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.4' },
          '50%': { transform: 'translateY(-12px) translateX(6px)', opacity: '0.8' },
        },
        waveSlow: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-40px)' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        equalizer1: { '0%': { height: '30%' }, '100%': { height: '100%' } },
        equalizer2: { '0%': { height: '60%' }, '100%': { height: '30%' } },
        equalizer3: { '0%': { height: '20%' }, '100%': { height: '80%' } },
        equalizer4: { '0%': { height: '80%' }, '100%': { height: '40%' } },
        equalizer5: { '0%': { height: '40%' }, '100%': { height: '90%' } },
      },
    },
  },
  plugins: [],
}

export default config
