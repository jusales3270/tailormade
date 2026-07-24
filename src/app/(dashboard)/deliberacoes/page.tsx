import { createClient } from "@/lib/supabase/server";
import { Titulo } from "@/components/shell/titulo";
import { DeliberacoesClient } from "./deliberacoes-client";
import type { DeliberacaoUI } from "./tipos";

export default async function DeliberacoesPage() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  const { data: membro } = await supabase
    .from("membros")
    .select("id, org_id")
    .eq("user_id", sessao!.claims.sub)
    .eq("ativo", true)
    .maybeSingle();

  if (!membro) {
    return <Titulo t="Deliberações" s="Sua conta ainda não está ligada a nenhum membro ativo." />;
  }

  const [{ data: votantes }, { data: deliberacoes }] = await Promise.all([
    supabase
      .from("membros")
      .select("id, nome")
      .eq("org_id", membro.org_id)
      .eq("ativo", true)
      .in("papel", ["admin", "socio"]),
    supabase
      .from("deliberacoes")
      .select("id, codigo, titulo, quorum_pct, status, encerra_em, votos(membro_id, voto, peso_pct)")
      .eq("org_id", membro.org_id)
      .order("abre_em", { ascending: false }),
  ]);

  const nomePorMembroId = new Map((votantes ?? []).map((v) => [v.id, v.nome]));

  const deliberacoesUI: DeliberacaoUI[] = (deliberacoes ?? []).map((d) => {
    const votosPorMembro = new Map(d.votos.map((v) => [v.membro_id, v.voto]));
    const simPct = d.votos.filter((v) => v.voto === "sim").reduce((acc, v) => acc + Number(v.peso_pct), 0);
    const naoPct = d.votos.filter((v) => v.voto === "nao").reduce((acc, v) => acc + Number(v.peso_pct), 0);

    return {
      id: d.id,
      codigo: d.codigo,
      titulo: d.titulo,
      quorumPct: Number(d.quorum_pct),
      status: d.status,
      encerraEm: d.encerra_em,
      simPct,
      naoPct,
      meuVoto: votosPorMembro.get(membro.id) ?? null,
      votos: (votantes ?? []).map((v) => ({
        membroId: v.id,
        membroNome: nomePorMembroId.get(v.id) ?? "?",
        voto: votosPorMembro.get(v.id) ?? null,
      })),
    };
  });

  return (
    <>
      <Titulo
        t="Deliberações"
        s="O que precisa de quórum não se resolve no chat. Voto ponderado por participação, resultado imutável."
      />
      <DeliberacoesClient deliberacoes={deliberacoesUI} orgId={membro.org_id} />
    </>
  );
}
