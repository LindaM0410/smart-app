import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bella Vista",
  description: "Interne Restaurant-App für Bella Vista",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
