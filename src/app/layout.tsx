import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { LayoutChrome } from "@/components/shared/LayoutChrome";
import { BackToTop } from "@/components/shared/BackToTop";
import { Toaster } from "@/components/shared/Toaster";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

import "./globals.css";
import { Providers } from "./providers";

/* ----------------------------------------------------------------------
   Root layout
   ----------------------------------------------------------------------
   - Loads Inter via `next/font/google` (no layout shift).
   - Wires the metadata API: title template, description, OpenGraph,
     Twitter, canonical URL, robots hints.
   - Renders the Providers tree, then <LayoutChrome>{children}</LayoutChrome>
     which conditionally mounts the public <Navbar /> + <Footer /> —
     never on /admin, /dashboard, /donor, /login, /register, /payment.
   - Mounts <BackToTop /> and the global <Toaster /> once, at the root.
   ---------------------------------------------------------------------- */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://blood-donation.example.com"),
  title: {
    default: "Blood Donation & Emergency Platform",
    template: "%s | Blood Donation Platform",
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "blood donation",
    "emergency",
    "donor",
    "requester",
    "admin",
    "blood request",
    "Bangladesh",
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  formatDetection: { telephone: true, email: true, address: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: APP_NAME,
    title: "Blood Donation & Emergency Platform",
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blood Donation & Emergency Platform",
    description: APP_DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-screen flex-col bg-background font-sans text-foreground"
        suppressHydrationWarning
      >
        <Providers>
          <LayoutChrome>{children}</LayoutChrome>
          <BackToTop />
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
