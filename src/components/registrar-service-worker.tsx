"use client";

import { useEffect } from "react";

// Registro do service worker (public/sw.js). Fica em efeito, e não em <script>, para
// rodar só no cliente e só depois da hidratação — registrar durante o carregamento
// disputaria banda com o próprio conteúdo da página.
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Falha em registrar não é erro do usuário: sem SW o app continua inteiro,
    // só não fica instalável. Por isso silencia em vez de propagar.
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
