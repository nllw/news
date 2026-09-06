import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",
        ink: "#000000",
        rule: "#CCCCCC",
        muted: "#595959",
        wire: "#E01F27",
        navbar: "#000000",
        admin: {
          bg: "#F3F4F6",
          accent: "#2A5C8A",
          ink: "#111827"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "Arial", "sans-serif"],
        body: ["var(--font-body)", "Georgia", "serif"],
        ui: ["var(--font-ui)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;