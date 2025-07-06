import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { generateNonce, generateSecurityHeaders } from "@/lib/security";
import { SecurityProvider } from "@/components/security-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Generate nonce for this request
const nonce = generateNonce();

export const metadata: Metadata = {
  title: "HTML Slideshow Viewer",
  description: "A Next.js application for viewing HTML slideshows",
  other: generateSecurityHeaders(nonce),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <SecurityProvider nonce={nonce}>
          {children}
        </SecurityProvider>
      </body>
    </html>
  );
}
