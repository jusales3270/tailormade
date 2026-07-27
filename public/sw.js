// Service worker deliberadamente conservador.
//
// Este app mostra saldo de caixa, votos e documentos assinados: servir uma versão
// cacheada desses dados é pior do que não funcionar offline — alguém tomaria decisão
// olhando número velho sem perceber. Por isso NADA de HTML, API ou Supabase entra em
// cache; só os estáticos de /_next/static, que têm hash no nome e por isso nunca
// mudam de conteúdo sob o mesmo endereço.
//
// O que isso entrega: instalação na tela de início, abertura em janela própria e
// carregamento mais rápido dos assets. O que não entrega: usar o painel offline —
// intencional.

const CACHE = "tailor-made-estaticos-v1";

self.addEventListener("install", (evento) => {
  // Assume o controle já na primeira visita, sem esperar a aba ser fechada.
  self.skipWaiting();
  evento.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Só mesma origem e só o bundle estático versionado. Navegação (modo "navigate"),
  // rotas de API e qualquer chamada ao Supabase passam direto para a rede.
  const estaticoVersionado = url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");

  if (!estaticoVersionado) return;

  evento.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const emCache = await cache.match(req);
      if (emCache) return emCache;

      const resposta = await fetch(req);
      if (resposta.ok) cache.put(req, resposta.clone());
      return resposta;
    })(),
  );
});
