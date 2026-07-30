import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta neutra provisional de Allbanks&Onebank (fácil de cambiar: solo estos 6 valores).
        brand: {
          DEFAULT: "#64748B",
          cyan: "#64748B",
          "cyan-dark": "#475569",
          "cyan-50": "#F1F5F9",
          blue: "#334155",
          "blue-dark": "#1E293B",
          ink: "#0F172A",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-montserrat)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
