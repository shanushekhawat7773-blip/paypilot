import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#FCFAF7",
          100: "#F9F6F0",
          200: "#F5F2EC", // warm paper base
          300: "#ECE7DE",
          400: "#DDD6C7",
          500: "#C8BEA8",
        },
        ink: {
          DEFAULT: "#111111",
          muted: "#4A4742",
          subtle: "#7A766F",
          faint: "#B4AFA5",
          border: "rgba(17, 17, 17, 0.12)",
          hairline: "rgba(17, 17, 17, 0.08)",
        },
        navy: {
          DEFAULT: "#0B2A5B", // primary brand accent
          light: "#143D7E",
          dark: "#071B3B",
          subtle: "#EBF1F9",
        },
        amber: {
          alert: "#D97706",
          light: "#FEF3C7",
          border: "#F59E0B",
        },
        status: {
          allowed: "#1E5E3A",
          allowedBg: "#EBF5EE",
          held: "#B45309",
          heldBg: "#FEF3C7",
          blocked: "#9E2A2B",
          blockedBg: "#FDF2F2",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      keyframes: {
        inkSettle: {
          "0%": { transform: "scale(1.4) rotate(-8deg)", opacity: "0" },
          "60%": { transform: "scale(0.96) rotate(-2deg)", opacity: "0.9" },
          "100%": { transform: "scale(1) rotate(-3deg)", opacity: "1" },
        },
        drawThinking: {
          "0%": { width: "0%" },
          "50%": { width: "70%" },
          "100%": { width: "100%" },
        },
      },
      animation: {
        "ink-settle": "inkSettle 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "thinking": "drawThinking 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
