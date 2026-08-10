import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#004ac6",
        "on-primary": "#ffffff",
        "primary-container": "#2563eb",
        "on-primary-container": "#eeefff",
        "primary-fixed": "#dbe1ff",
        "primary-fixed-dim": "#b4c5ff",
        "on-primary-fixed": "#00174b",
        "on-primary-fixed-variant": "#003ea8",
        
        secondary: "#575e70",
        "on-secondary": "#ffffff",
        "secondary-container": "#d9dff5",
        "on-secondary-container": "#5c6274",
        "secondary-fixed": "#dce2f7",
        "secondary-fixed-dim": "#c0c6db",

        tertiary: "#006242",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#007d55",
        "on-tertiary-container": "#bdffdb",
        "tertiary-fixed": "#6ffbbe",
        "tertiary-fixed-dim": "#4edea3",
        
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        surface: "#f7f9fb",
        "on-surface": "#191c1e",
        "surface-variant": "#e0e3e5",
        "on-surface-variant": "#434655",
        "surface-bright": "#f7f9fb",
        "surface-dim": "#d8dadc",
        "surface-tint": "#0053db",

        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "surface-container": "#eceef0",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",

        "inverse-surface": "#2d3133",
        "inverse-on-surface": "#eff1f3",
        "inverse-primary": "#b4c5ff",

        background: "#f7f9fb",
        "on-background": "#191c1e",

        outline: "#737686",
        "outline-variant": "#c3c6d7",
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
    },
  },
  plugins: [],
};

export default config;
