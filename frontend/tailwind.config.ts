import type { Config } from "tailwindcss";

const oklch = (name: string) => `oklch(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: oklch("bg"),
        surface: oklch("surface"),
        ink: oklch("ink"),
        muted: oklch("muted"),
        line: oklch("line"),
        accent: {
          DEFAULT: oklch("accent"),
          strong: oklch("accent-strong"),
          soft: oklch("accent-soft"),
        },
        success: {
          DEFAULT: oklch("success"),
          soft: oklch("success-soft"),
        },
        warn: {
          DEFAULT: oklch("warn"),
          soft: oklch("warn-soft"),
        },
        danger: {
          DEFAULT: oklch("danger"),
          soft: oklch("danger-soft"),
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
