import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { RegistrarServiceWorker } from "@/components/registrar-service-worker";
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
  // Sem isso, o iOS abre a partir da tela de início dentro do Safari, com a barra de
  // endereço — o manifest sozinho não basta lá.
  appleWebApp: {
    capable: true,
    title: "Tailor Made",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // viewportFit cover: deixa o conteúdo ir até as bordas em telas com notch; quem
  // cuida de não ficar embaixo do recorte é o padding com env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  // userScalable fica no padrão (permitido): travar zoom quebra acessibilidade para
  // quem precisa ampliar, e a doc do Next desaconselha mexer sem motivo.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
