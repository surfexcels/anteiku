import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anteiku | Find the leaks in your cafe profit",
  description:
    "Track food waste, uncover hidden costs, and make smarter production decisions.",
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
