import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/shell/shell";
import { montarAvisos } from "@/lib/avisos";
import { urlAvatar } from "@/lib/avatar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  if (!sessao?.claims) {
    redirect("/login");
  }

  // getUser() e a busca do membro são idas independentes à rede — em série custavam o
  // dobro do RTT em toda navegação. Nome e avatar vêm de `membros`, não do user_metadata:
  // é o que faz o perfil de alguém ser visível para o resto da organização.
  const [{ data: usuarioData }, { data: membro }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("membros")
      .select("id, nome, papel, org_id, avatar_path")
      .eq("user_id", sessao.claims.sub)
      .eq("ativo", true)
      .maybeSingle(),
  ]);

  const email = usuarioData?.user?.email ?? sessao.claims.email ?? "—";

  if (!membro) {
    return (
      <Shell nome={email} papel={null} avisos={[]} email={email} avatarUrl={null}>
        {children}
      </Shell>
    );
  }

  const orgId = membro.org_id;

  // Só o que alimenta o quadro de avisos. Antes daqui saíam 7 consultas com joins para
  // montar o EstadoOrg do copiloto — que ainda existe, mas é usado nas páginas que
  // precisam dele, não no layout que roda em toda navegação.
  const [{ data: reunioes }, { data: movimentos }, { data: deliberacoes }, { data: lidos }] =
    await Promise.all([
      supabase
        .from("reunioes")
        .select("id, codigo, titulo, inicio")
        .eq("org_id", orgId)
        .order("inicio", { ascending: false })
        .limit(30),
      supabase
        .from("movimentos")
        .select("id, codigo, descricao, valor_cents, direcao, competencia")
        .eq("org_id", orgId)
        .order("competencia", { ascending: false })
        .limit(30),
      supabase
        .from("deliberacoes")
        .select("id, codigo, titulo, abre_em")
        .eq("org_id", orgId)
        .order("abre_em", { ascending: false })
        .limit(30),
      supabase.from("avisos_lidos").select("aviso_chave").eq("membro_id", membro.id),
    ]);

  const avisos = montarAvisos({
    reunioes: reunioes ?? [],
    movimentos: (movimentos ?? []).map((m) => ({
      id: m.id,
      codigo: m.codigo,
      descricao: m.descricao,
      valorCents: m.valor_cents,
      direcao: m.direcao,
      competencia: m.competencia,
    })),
    deliberacoes: (deliberacoes ?? []).map((d) => ({
      id: d.id,
      codigo: d.codigo,
      titulo: d.titulo,
      abreEm: d.abre_em,
    })),
    chavesLidas: new Set((lidos ?? []).map((l) => l.aviso_chave)),
  });

  return (
    <Shell
      nome={membro.nome}
      papel={membro.papel}
      avisos={avisos}
      email={email}
      avatarUrl={urlAvatar(membro.avatar_path)}
    >
      {children}
    </Shell>
  );
}
