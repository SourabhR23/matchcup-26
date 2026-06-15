import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f5f0e8',
        surface: '#ffffff',
        ink: '#111111',
        'ink-muted': '#555555',
        'ink-faint': '#999999',
        'ink-ghost': '#cccccc',
        accent: '#8b0000',
        danger: '#cc0000',
        warning: '#d4a700',
        success: '#16a34a',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'Arial Narrow', 'sans-serif'],
        body: ['var(--font-inter)', 'Helvetica Neue', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: '#111111',
        muted: '#ddd8cc',
        faint: '#f0ece4',
      },
    },
  },
  plugins: [],
}

export default config
