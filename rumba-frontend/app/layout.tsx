import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Rumba Puzzle - Logic Game",
  description: "Play Rumba puzzle game - a challenging logic game similar to Takuzu/Binairo. Fill the grid with X's and O's following simple rules!",
  keywords: ["puzzle", "game", "logic", "rumba", "takuzu", "binairo", "brain training"],
  authors: [{ name: "Rumba Game Team" }],
  creator: "Rumba Game Team",
  publisher: "Rumba Game Team",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rumba Puzzle",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Rumba Puzzle",
    title: "Rumba Puzzle - Logic Game",
    description: "Play Rumba puzzle game - a challenging logic game similar to Takuzu/Binairo",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' }
  ],
  colorScheme: 'light',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Mobile optimizations */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Rumba Puzzle" />
        
        {/* Prevent zoom on input focus and improve touch */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Prevent text selection on game elements */
            .game-cell, .game-board {
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              -khtml-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              user-select: none;
            }
            
            /* Smooth scrolling */
            html {
              scroll-behavior: smooth;
            }
            
            /* Prevent rubber band scrolling on iOS */
            body {
              overscroll-behavior: none;
              -webkit-overflow-scrolling: touch;
            }
            
            /* Improve button touch targets on mobile */
            @media (max-width: 768px) {
              button {
                min-height: 44px;
                min-width: 44px;
              }
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
