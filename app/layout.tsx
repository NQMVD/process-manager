import type React from "react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Fallback fonts for build environment
const plexSans = {
  variable: "--font-geist-sans",
  className: "font-sans",
};

const plexMono = {
  variable: "--font-geist-mono", 
  className: "font-mono",
};

export const metadata: Metadata = {
  title: "Process Manager",
  description: "Pueue Process Management Frontend",
  generator: "v0.app",
};

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>Loading...</span>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${plexMono.className}`}
      suppressHydrationWarning
    >
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html:
              'code,pre,kbd,samp,.font-mono{font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,"Liberation Mono","Courier New",monospace !important;}',
          }}
        />
      </head>
      <body className={`${plexSans.className} font-sans antialiased`}>
        <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  );
}
