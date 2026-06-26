import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
        outfit: ["var(--font-outfit)", "sans-serif"],
      },
      colors: {
        nb: {
          deep: "#080b14",
          surface: "#0d1117",
          "surface-2": "#131927",
          "surface-3": "#1a2235",
          border: "#1e2d45",
          "border-2": "#243550",
          accent: "#6c63ff",
          purple: "#a855f7",
          teal: "#06b6d4",
          "text-primary": "#e8eaf0",
          "text-secondary": "#8b95ad",
          "text-muted": "#4a556e",
          "text-accent": "#a5b4fc",
        },
      },
      backgroundImage: {
        "nb-gradient": "linear-gradient(135deg, #6c63ff, #a855f7)",
        "nb-hero": "radial-gradient(ellipse at 20% 30%, rgba(108,99,255,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(168,85,247,0.08) 0%, transparent 50%), #080b14",
      },
      animation: {
        "nb-pulse-glow": "nb-pulse-glow 3s infinite ease-in-out",
        "nb-fade-in-up": "nb-fade-in-up 0.6s ease forwards",
        "nb-float": "nb-float 6s ease-in-out infinite",
      },
      keyframes: {
        "nb-pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(108,99,255,0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(108,99,255,0.5)" },
        },
        "nb-fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "nb-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
