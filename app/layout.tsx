import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CPHO AI Training System",
  description: "Internal physics olympiad AI learning platform.",
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
