import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        captivator: {
          accent: '#1F4E79',
          'accent-light': '#D9E2F3',
        },
      },
    },
  },
  plugins: [],
};

export default config;
