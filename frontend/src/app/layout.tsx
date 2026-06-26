import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "NiteBuddy — Your Emotionally Intelligent AI Companion",
  description:
    "NiteBuddy understands you. An emotionally intelligent AI companion that provides meaningful companionship, emotional understanding, and personal growth support.",
  keywords: ["AI companion", "emotional intelligence", "mental wellness", "AI chat", "NiteBuddy"],
  authors: [{ name: "NiteBuddy" }],
  openGraph: {
    title: "NiteBuddy — Your Emotionally Intelligent AI Companion",
    description: "An AI that truly understands you. Not just answers questions.",
    type: "website",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-inter antialiased bg-nb-deep text-nb-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
