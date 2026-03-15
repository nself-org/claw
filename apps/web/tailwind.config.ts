import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // nSelf brand: indigo primary, dark bg
        brand: {
          DEFAULT: '#6366F1',
          dark: '#4F46E5',
          light: '#818CF8',
        },
        surface: {
          DEFAULT: '#1A1A2E',
          elevated: '#222236',
          high: '#2A2A40',
        },
      },
    },
  },
  plugins: [],
}

export default config
