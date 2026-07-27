import type { MetadataRoute } from "next";

// PWA instalável (guia oficial: node_modules/next/dist/docs/01-app/02-guides/
// progressive-web-apps.md). `display: standalone` tira a barra do navegador quando
// aberto pela tela de início — é o que faz parecer aplicativo no celular.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tailor Made — Painel de fundação",
    short_name: "Tailor Made",
    description: "Trilha, documentos, deliberações, reuniões e financeiro da fundação da sua startup.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f2f2f7",
    theme_color: "#f2f2f7",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // `maskable` separado do `any`: o SO recorta o ícone em círculo/squircle, e um
      // ícone sem margem própria sai com as bordas cortadas.
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
