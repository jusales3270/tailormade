import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// -apple-system/BlinkMacSystemFont cobrem macOS/iOS sem carregar nada; Inter só entra
// como fallback em quem não tem SF Pro (master doc §6).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tailor Made",
  description: "Painel de fundação de startups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
