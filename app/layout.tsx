import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/env";
import { cn } from "@/lib/utils";
import "./globals.css";

const display = localFont({
  src: "../components/fonts/OPTIGoudy-Text.otf",
  variable: "--font-display",
  weight: "400 900",
  display: "swap",
  preload: true,
});

const body = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const ui = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: settings.siteName, template: `%s | ${settings.siteName}` },
    description: settings.description,
    applicationName: settings.siteName,
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      title: settings.siteName,
      description: settings.description,
      url: siteUrl,
    },
    twitter: { card: "summary_large_image", site: settings.twitter || undefined },
    alternates: {
      canonical: siteUrl,
      types: { "application/rss+xml": `${siteUrl}/feed.xml` },
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = headers().get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(display.variable, body.variable, ui.variable)}
    >
      <body className="min-h-screen bg-paper font-body text-ink">
        <ThemeProvider nonce={nonce}>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          {children}
          <Toaster richColors closeButton position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
