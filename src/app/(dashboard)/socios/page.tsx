import { createClient } from "@/lib/supabase/server";
import { urlAvatar } from "@/lib/avatar";
import { Titulo } from "@/components/shell/titulo";
import { SociosClient } from "./socios-client";
import type { DeliberacaoAprovadaUI, MembroUI } from "./tipos";

export default async function SociosPage() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  const { data: membro } = await supabase
    .from("membros")
    .select("id, org_id, papel")
    .eq("user_id", sessao!.claims.sub)
    .eq("ativo", true)
    .maybeSingle();

  if (!membro) {
    return <Titulo t="Sócios" s="Sua conta ainda não está ligada a nenhum membro ativo." />;
  }

  const ehAdmin = membro.papel === "admin";

  const [{ data: membros }, { data: deliberacoesAprovadas }] = await Promise.all([
    supabase
      .from("membros")
      .select("id, nome, email, papel, participacao_pct, ativo, avatar_path")
      .eq("org_id", membro.org_id)
      .eq("ativo", true)
      .order("participacao_pct", { ascending: false }),
    ehAdmin
      ? supabase
          .from("deliberacoes")
          .select("id, codigo, titulo")
          .eq("org_id", membro.org_id)
          .eq("status", "aprovada")
          .is("participacao_aplicada_em", null)
      : Promise.resolve({ data: [] as DeliberacaoAprovadaUI[] }),
  ]);

  const membrosUI: MembroUI[] = (membros ?? []).map((m) => ({
    id: m.id,
    nome: m.nome,
    email: m.email,
    papel: m.papel,
    participacaoPct: Number(m.participacao_pct),
    avatarUrl: urlAvatar(m.avatar_path),
    ativo: m.ativo,
  }));

  const deliberacoesUI: DeliberacaoAprovadaUI[] = (deliberacoesAprovadas ?? []).map((d) => ({
    id: d.id,
    codigo: d.codigo,
    titulo: d.titulo,
  }));

  return (
    <>
      <Titulo
        t="Sócios"
        s="Participação, área de responsabilidade e o que cada um trava se atrasar."
      />
      <SociosClient
        orgId={membro.org_id}
        membroId={membro.id}
        ehAdmin={ehAdmin}
        membros={membrosUI}
        deliberacoesAprovadas={deliberacoesUI}
      />
    </>
  );
}
