import type { Metadata, Viewport } from "next";
import "./globals.css";
import SyncProvider from "@/components/layout/SyncProvider";

export const metadata: Metadata = {
  title: "ZOLO — do the thing. get the points.",
  description: "A Gen Z-native gamified productivity app.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ZOLO" },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SyncProvider>
          {children}
        </SyncProvider>
      </body>
    </html>
  );
}
