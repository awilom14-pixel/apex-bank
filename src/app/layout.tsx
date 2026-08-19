import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Apex Bank - Modern Digital Banking",
  description: "A premium digital banking experience with real-time transfers, analytics, and admin controls.",
  keywords: ["banking", "finance", "digital bank", "money transfer", "dashboard"],
  openGraph: {
    title: "Apex Bank",
    description: "Premium digital banking experience",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='url(%23g)'/><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%237c3aed'/><stop offset='100%' stop-color='%232563eb'/></linearGradient></defs><text x='50' y='68' font-size='52' font-weight='bold' fill='white' text-anchor='middle' font-family='system-ui'>A</text></svg>" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('apex-theme');
            if (t === 'light') document.documentElement.classList.remove('dark');
            else document.documentElement.classList.add('dark');
          } catch(e) {}
        `}} />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            },
          }}
          richColors
        />
        {children}
      </body>
    </html>
  );
}
