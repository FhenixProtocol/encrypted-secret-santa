import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vibrant Christmas red palette
        santa: {
          red: "#E63946",
          darkRed: "#C41E3A",
          deepRed: "#9B1B30",
        },
        // Pastel palette for cards
        pastel: {
          pink: "#FFB4B8",
          mint: "#B8E4D8",
          coral: "#FFA090",
          cream: "#FFF8E7",
          blush: "#FFD6D0",
        },
        // Fhenix brand colors
        fhenix: {
          purple: "#8B5CF6",
          blue: "#3B82F6",
          cyan: "#06B6D4",
        }
      },
      fontFamily: {
        sans: ['ClashDisplay', 'var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['ClashDisplay', 'sans-serif'],
      },
      boxShadow: {
        'polaroid': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        'polaroid-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'twinkle': 'twinkle 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        christmas: {
          "primary": "#8B5CF6",          // Fhenix purple
          "secondary": "#B8E4D8",        // Mint green
          "accent": "#FFA090",           // Coral
          "neutral": "#9B1B30",          // Deep red
          "base-100": "#E63946",         // Main background - vibrant red
          "base-200": "#D32F3D",         // Slightly darker red
          "base-300": "#C41E3A",         // Even darker for borders
          "base-content": "#FFFFFF",     // White text
          "info": "#3B82F6",             // Fhenix blue
          "success": "#10B981",          // Green
          "warning": "#F59E0B",          // Amber
          "error": "#FFB4B8",            // Light pink for errors
        },
      },
    ],
  },
};
export default config;
