import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import { ProcessCleanupProvider } from "@/components/ProcessCleanupProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WOLO SENEGAL - Cagnottes d'anniversaire avec cadeaux cinéma",
  description: "Créez des cagnottes d'anniversaire uniques avec WOLO SENEGAL. Recevez des QR codes cinéma et profitez d'expériences mémorables avec vos proches. Paiements sécurisés via Wave Mobile.",
  keywords: "cagnotte anniversaire, cadeau cinéma, WOLO SENEGAL, Wave Mobile, QR code cinéma, fête anniversaire",
  authors: [{ name: "WOLO SENEGAL" }],
  creator: "WOLO SENEGAL",
  publisher: "Connect Africa",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/favicon.ico'
  },
  openGraph: {
    title: 'WOLO SENEGAL - Cagnottes d\'anniversaire avec cadeaux cinéma',
    description: 'Créez des cagnottes d\'anniversaire uniques avec des cadeaux cinéma. Paiements via Wave Mobile.',
    type: 'website',
    locale: 'fr_SN',
    siteName: 'WOLO SENEGAL'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WOLO SENEGAL',
    description: 'Cagnottes d\'anniversaire avec cadeaux cinéma au Sénégal'
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ProcessCleanupProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
              <Toaster />
              <SpeedInsights />
            </AuthProvider>
          </ThemeProvider>
        </ProcessCleanupProvider>
      </body>
    </html>
  );
}