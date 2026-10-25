import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YonuKom - La gestion de votre commerce, enfin Yomb",
  description:
    "Logiciel de caisse et de gestion adapté aux commerçants africains. Fonctionne hors ligne, anti-fraude, et s'adapte à votre métier.",
  keywords: [
    "logiciel caisse",
    "gestion commerce",
    "SaaS Afrique",
    "YonuKom",
    "POS Sénégal",
    "offline",
    "FCFA",
    "commerçant",
    "boutique",
    "restaurant",
    "grossiste",
  ],
  authors: [{ name: "YonuKom" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "YonuKom - La gestion de votre commerce, enfin Yomb",
    description:
      "Logiciel de caisse et de gestion adapté aux commerçants africains. Fonctionne hors ligne, anti-fraude, et s'adapte à votre métier.",
    url: "https://yonukom.com",
    siteName: "YonuKom",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "YonuKom - La gestion de votre commerce, enfin Yomb",
    description:
      "Logiciel de caisse et de gestion adapté aux commerçants africains. Fonctionne hors ligne.",
  },
  // PWA manifest
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1B3A5C", // Bleu profond YonuKom
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
