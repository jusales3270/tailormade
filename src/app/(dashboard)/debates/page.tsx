import { createClient } from "@/lib/supabase/server";
import { DebatesClient } from "./debates-client";

export default async function DebatesPage() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  const [{ data: canais }, { data: membro }] = await Promise.all([
    supabase.from("canais").select("id, slug, nome, descricao").eq("arquivado", false).order("slug"),
    supabase.from("membros").select("id, org_id").eq("user_id", sessao!.claims.sub).eq("ativo", true).maybeSingle(),
  ]);

  const { data: membrosOrg } = membro
    ? await supabase.from("membros").select("id, nome").eq("org_id", membro.org_id).eq("ativo", true)
    : { data: [] };

  return (
    <DebatesClient
      canais={canais ?? []}
      membros={membrosOrg ?? []}
      meuMembroId={membro?.id ?? null}
    />
  );
}
