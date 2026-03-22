module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#6C5DD3',    // Default primary purple
          'purple-light': '#8A7CEB', // Lighter purple for hover/gradients
          'purple-dark': '#5549B8',  // Darker purple for active/pressed
          cyan: '#00C9A7',      // Primary cyan/teal
          'cyan-dark': '#00A388', // Darker cyan
          text: '#111827',      // Main heading color
          muted: '#52606D',     // Subtitle text color
          background: '#F8F9FA' // Light page background
        }
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'var(--font-ibm-plex-sans)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['IBM Plex Sans', 'var(--font-ibm-plex-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
