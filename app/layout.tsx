import type { Metadata } from "next";
import localFont from "next/font/local";
import { Pirata_One, Cormorant_Garamond, Inter, UnifrakturCook } from "next/font/google";
import "./globals.css";
import { privateDecrypt } from "crypto";

const display = localFont({
  src: "../components/fonts/OPTIGoudy-Text.otf",
  variable: "--font-display",
  display: "swap",
});

const body = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-body"
});

const ui = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ui"
});

export const metadata: Metadata = {
  title: "The Washington Host",
  description: "."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${ui.variable} font-body bg-paper text-ink`}
      >
        {children}
      </body>
    </html>
  );
}