import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1200px" } },
    extend: {
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        rule: "rgb(var(--rule) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        wire: "rgb(var(--wire) / <alpha-value>)",
        "wire-text": "rgb(var(--wire-text) / <alpha-value>)",
        navbar: "rgb(var(--navbar) / <alpha-value>)",
        "navbar-text": "rgb(var(--navbar-text) / <alpha-value>)",
        // Admin palette (shadcn-style tokens)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        "muted-ui": {
          DEFAULT: "hsl(var(--muted-ui))",
          foreground: "hsl(var(--muted-ui-foreground))",
        },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
        body: ["var(--font-body)", "Georgia", "Times New Roman", "serif"],
        ui: ["var(--font-ui)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      typography: () => ({
        news: {
          css: {
            "--tw-prose-body": "rgb(var(--ink))",
            "--tw-prose-headings": "rgb(var(--ink))",
            "--tw-prose-lead": "rgb(var(--muted))",
            "--tw-prose-links": "rgb(var(--wire-text))",
            "--tw-prose-bold": "rgb(var(--ink))",
            "--tw-prose-counters": "rgb(var(--muted))",
            "--tw-prose-bullets": "rgb(var(--rule))",
            "--tw-prose-hr": "rgb(var(--rule))",
            "--tw-prose-quotes": "rgb(var(--ink))",
            "--tw-prose-quote-borders": "rgb(var(--wire))",
            "--tw-prose-captions": "rgb(var(--muted))",
            "--tw-prose-code": "rgb(var(--ink))",
            "--tw-prose-pre-code": "rgb(var(--paper))",
            "--tw-prose-pre-bg": "rgb(var(--ink))",
            "--tw-prose-th-borders": "rgb(var(--rule))",
            "--tw-prose-td-borders": "rgb(var(--rule))",
            fontFamily: "var(--font-body), Georgia, serif",
            fontSize: "1.1875rem",
            lineHeight: "1.7",
            maxWidth: "none",
            p: { marginTop: "0", marginBottom: "1.35em" },
            h2: {
              fontFamily: "var(--font-display), Georgia, serif",
              fontWeight: "700",
              fontSize: "1.65em",
              marginTop: "1.6em",
              marginBottom: "0.6em",
              lineHeight: "1.2",
            },
            h3: {
              fontFamily: "var(--font-ui), system-ui, sans-serif",
              fontWeight: "600",
              fontSize: "1.15em",
              marginTop: "1.5em",
              marginBottom: "0.5em",
            },
            blockquote: {
              fontStyle: "italic",
              fontWeight: "400",
              fontSize: "1.2em",
              borderLeftWidth: "3px",
              paddingLeft: "1.2em",
              quotes: "none",
            },
            "blockquote p:first-of-type::before": { content: "none" },
            "blockquote p:last-of-type::after": { content: "none" },
            a: { textDecoration: "underline", textUnderlineOffset: "3px", fontWeight: "500" },
            "a:hover": { color: "rgb(var(--wire))" },
            figure: { marginTop: "2em", marginBottom: "2em" },
            figcaption: {
              fontFamily: "var(--font-ui), system-ui, sans-serif",
              fontSize: "0.8rem",
              marginTop: "0.6em",
            },
            img: { borderRadius: "2px" },
            hr: { marginTop: "2.5em", marginBottom: "2.5em" },
          },
        },
      }),
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [typography, animate],
};

export default config;
