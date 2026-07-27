import { narrar } from "@/lib/copiloto/narrar";
import type { Leitura } from "@/lib/regras/tipos";

// Componente async isolado só pra `narrar()` poder ficar dentro de um <Suspense> no
// layout. Antes o layout dava await direto nela, então TODA navegação e todo
// router.refresh() (um tick de checklist, um documento criado) só pintava a tela depois
// que a API do modelo respondia — até 6s de espera pra uma ação que já terminou no banco.
// Aqui a narração é a única coisa que espera; o resto do painel aparece na hora.
export async function ResumoCopiloto({ leituras }: { leituras: Leitura[] }) {
  const resumo = await narrar(leituras);
  return <>{resumo}</>;
}
