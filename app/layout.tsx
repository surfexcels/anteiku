import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anteiku | Cafe operations & profit intelligence",
  description:
    "Daily inventory, waste tracking, supplier imports, and margin insights for independent cafés.",
  appleWebApp: {
    capable: true,
    title: "Anteiku",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1713",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
