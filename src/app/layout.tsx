import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PwaRegister } from "@/components/shared/pwa-register";
import { FloatingWhatsApp } from "@/components/shared/floating-whatsapp";
import { patchGlobalFetch } from "@/lib/api-client";

// Patch global fetch to always send JWT cookie + Authorization header
// This ensures ALL fetch() calls in the app are authenticated
if (typeof window !== "undefined") {
  patchGlobalFetch();
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yonukom.qrtags.pro"),
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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
  themeColor: "#E91E63", // Rose vibrant YonuKom (inspiration Boutiko)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* No-flash theme init — runs before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('yonukom_theme');if(!t){if(window.matchMedia('(prefers-color-scheme: dark)').matches){t='dark';}else{t='light';}}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <PwaRegister />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
