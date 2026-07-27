import { createClient } from "@/lib/supabase/server";
import { urlAvatar } from "@/lib/avatar";
import { DebatesClient } from "./debates-client";

export default async function DebatesPage() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  const [{ data: canais }, { data: membro }] = await Promise.all([
    supabase
      .from("canais")
      .select("id, slug, nome, descricao, criado_por")
      .eq("arquivado", false)
      .order("slug"),
    supabase
      .from("membros")
      .select("id, org_id, papel")
      .eq("user_id", sessao!.claims.sub)
      .eq("ativo", true)
      .maybeSingle(),
  ]);

  const { data: membrosOrg } = membro
    ? await supabase.from("membros").select("id, nome, avatar_path").eq("org_id", membro.org_id).eq("ativo", true)
    : { data: [] };

  const canaisUI = (canais ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    nome: c.nome,
    descricao: c.descricao,
    criadoPor: c.criado_por,
  }));

  return (
    <DebatesClient
      canais={canaisUI}
      membros={(membrosOrg ?? []).map((m) => ({ id: m.id, nome: m.nome, avatarUrl: urlAvatar(m.avatar_path) }))}
      meuMembroId={membro?.id ?? null}
      orgId={membro?.org_id ?? null}
      souAdmin={membro?.papel === "admin"}
    />
  );
}
