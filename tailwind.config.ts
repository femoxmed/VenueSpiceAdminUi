import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2960EC",
        secondary: "#6739D2",
        tertiary: "#18B368",
        "primary-10": "#E8EEFF",
        "primary-20": "#DBE5FE",
        "primary-80": "#174FDF",
        "primary-100": "#0335B4",
        "secondary-10": "#F5F0FF",
        "secondary-80": "#3A1D6E",
        "tertiary-10": "#F0FFF4",
        "tertiary-80": "#176F2C",
        ink: "#0F172A",
        muted: "#64748B",
        panel: "#F8FAFC",
        line: "#E2E8F0"
      },
      boxShadow: {
        soft: "0 12px 40px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
} satisfies Config;
