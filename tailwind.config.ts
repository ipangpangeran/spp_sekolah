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
        // Exact Stitch Sisma Enterprise Palette
        surface: "#faf8ff",
        "surface-dim": "#d8d9e7",
        "surface-bright": "#faf8ff",
        "surface-variant": "#e1e2ef",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f3ff",
        "surface-container": "#ecedfb",
        "surface-container-high": "#e6e7f5",
        "surface-container-highest": "#e1e2ef",
        "on-surface": "#191b25",
        "on-surface-variant": "#414659",
        outline: "#71768b",
        "outline-variant": "#c1c5dd",

        primary: "#00677e",
        "on-primary": "#ffffff",
        "primary-container": "#b5ebff",
        "on-primary-container": "#004e60",
        "primary-fixed": "#b5ebff",
        "primary-fixed-dim": "#5bd5fa",
        "on-primary-fixed": "#001f28",
        "on-primary-fixed-variant": "#004e60",

        secondary: "#04677e",
        "on-secondary": "#ffffff",
        "secondary-container": "#b5ebff",
        "on-secondary-container": "#004e60",
        "secondary-fixed": "#b5ebff",
        "secondary-fixed-dim": "#87d1eb",
        "on-secondary-fixed": "#001f28",

        tertiary: "#4b5c92",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#dbe1ff",
        "on-tertiary-container": "#324478",
        "tertiary-fixed": "#dbe1ff",

        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        // Stripe-inspired Stitch workspace tokens
        "stripe-dark": "#0a2540",
        "stripe-gray": "#f7f9fc",
        "stripe-border": "#e3e8ee",
        "stripe-blue": "#635bff",

        // Semantic aliases used across pages
        canvas: "#f7f9fc",
        panel: "#ffffff",
        card: "#ffffff",
        subtle: "#f4f6fb",
        line: "#e2e8f0",
        "line-strong": "#cbd5e1",
        sidebar: "#001f28",

        brand: {
          DEFAULT: "#00677e",
          hover: "#004e60",
          bright: "#5bd5fa",
          soft: "#e6f6fc",
          border: "#b5ebff",
          text: "#004e60",
        },
        sage: {
          DEFAULT: "#059669",
          hover: "#047857",
          soft: "#ecfdf5",
          border: "#a7f3d0",
          text: "#065f46",
        },
        brick: {
          DEFAULT: "#ba1a1a",
          hover: "#93000a",
          soft: "#ffdad6",
          border: "#f5b8b2",
          text: "#93000a",
        },
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        stripe: "0 2px 5px -1px rgba(50, 50, 93, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.05)",
        premium: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
