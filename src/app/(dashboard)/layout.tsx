import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/shell/shell";
import { ResumoCopiloto } from "@/components/shell/resumo-copiloto";
import { calcularLeituras } from "@/lib/regras/regras";
import { calcularCaixaEQueima } from "@/lib/financeiro/derivacao";
import type { EstadoOrg } from "@/lib/regras/tipos";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  if (!sessao?.claims) {
    redirect("/login");
  }

  // getUser() e a busca do membro são idas independentes à rede — em série custavam o
  // dobro do RTT em toda navegação. user_metadata (nome de exibição e avatar) não vem
  // nas claims do JWT, só em getUser(); é perfil individual, por isso fora de `membros`.
  const [{ data: usuarioData }, { data: membro }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("membros")
      .select("nome, papel, org_id")
      .eq("user_id", sessao.claims.sub)
      .eq("ativo", true)
      .maybeSingle(),
  ]);

  const metadata = (usuarioData?.user?.user_metadata ?? {}) as {
    nome_exibicao?: string;
    avatar_path?: string;
  };
  const nomeExibicao = metadata.nome_exibicao ?? null;
  const email = usuarioData?.user?.email ?? sessao.claims.email ?? "—";

  let avatarUrl: string | null = null;
  if (metadata.avatar_path) {
    const { data: assinado } = await supabase.storage
      .from("avatars")
      .createSignedUrl(metadata.avatar_path, 3600);
    avatarUrl = assinado?.signedUrl ?? null;
  }

  if (!membro) {
    return (
      <Shell
        nome={email}
        papel={null}
        leituras={[]}
        resumo=""
        email={email}
        nomeExibicao={nomeExibicao}
        avatarUrl={avatarUrl}
      >
        {children}
      </Shell>
    );
  }

  const orgId = membro.org_id;
  const agora = new Date();

  const [
    { data: fases },
    { data: documentos },
    { data: deliberacoes },
    { data: reunioes },
    { data: aportes },
    { data: movimentos },
    { data: sugestoes },
  ] = await Promise.all([
    supabase.from("fases").select("id, nome, itens:fase_itens(id, concluido, depende_documento_id)").eq("org_id", orgId),
    supabase.from("documentos").select("id, codigo, nome, grupo, critico, status, vence_em").eq("org_id", orgId),
    supabase
      .from("deliberacoes")
      .select("id, codigo, titulo, quorum_pct, encerra_em, votos(membro_id, voto, peso_pct)")
      .eq("org_id", orgId),
    supabase.from("reunioes").select("id, codigo, titulo, inicio, pauta:reuniao_pauta(item)").eq("org_id", orgId),
    supabase
      .from("aportes")
      .select("id, membro:membros(nome), comprometido_cents, eventos:aporte_eventos(valor_cents)")
      .eq("org_id", orgId),
    supabase
      .from("movimentos")
      .select("id, codigo, descricao, valor_cents, direcao, status, competencia")
      .eq("org_id", orgId),
    supabase.from("sugestoes").select("id, status, criado_em").eq("org_id", orgId),
  ]);

  const aportesEstado = (aportes ?? []).map((a) => ({
    id: a.id,
    membroNome: a.membro?.nome ?? "?",
    comprometidoCents: a.comprometido_cents,
    integralizadoCents: a.eventos.reduce((acc, e) => acc + e.valor_cents, 0),
  }));
  const integralizadoCents = aportesEstado.reduce((acc, a) => acc + a.integralizadoCents, 0);

  const { caixaCents, queimaMediaCents } = calcularCaixaEQueima(
    (movimentos ?? []).map((m) => ({
      valorCents: m.valor_cents,
      direcao: m.direcao,
      status: m.status,
      competencia: m.competencia,
    })),
    integralizadoCents,
    agora,
  );

  const estado: EstadoOrg = {
    agora,
    fases: (fases ?? []).map((f) => ({
      id: f.id,
      nome: f.nome,
      itens: f.itens.map((i) => ({ id: i.id, concluido: i.concluido, dependeDocumentoId: i.depende_documento_id })),
    })),
    documentos: (documentos ?? []).map((d) => ({
      id: d.id,
      codigo: d.codigo,
      nome: d.nome,
      grupo: d.grupo,
      critico: d.critico,
      status: d.status,
      venceEm: d.vence_em,
    })),
    deliberacoes: (deliberacoes ?? []).map((d) => ({
      id: d.id,
      codigo: d.codigo,
      titulo: d.titulo,
      quorumPct: d.quorum_pct,
      encerraEm: d.encerra_em,
      votos: d.votos.map((v) => ({ membroId: v.membro_id, voto: v.voto, pesoPct: v.peso_pct })),
    })),
    reunioes: (reunioes ?? []).map((r) => ({
      id: r.id,
      codigo: r.codigo,
      titulo: r.titulo,
      inicio: r.inicio,
      pauta: r.pauta.map((p) => p.item),
    })),
    aportes: aportesEstado,
    movimentos: (movimentos ?? []).map((m) => ({
      id: m.id,
      codigo: m.codigo,
      descricao: m.descricao,
      valorCents: m.valor_cents,
      status: m.status,
    })),
    sugestoes: (sugestoes ?? []).map((s) => ({ id: s.id, status: s.status, criadoEm: s.criado_em })),
    caixaCents,
    queimaMediaCents,
  };

  const leituras = calcularLeituras(estado);

  return (
    <Shell
      nome={membro.nome}
      papel={membro.papel}
      leituras={leituras}
      resumo={
        <Suspense fallback={<span className="min">Lendo os registros…</span>}>
          <ResumoCopiloto leituras={leituras} />
        </Suspense>
      }
      email={email}
      nomeExibicao={nomeExibicao}
      avatarUrl={avatarUrl}
    >
      {children}
    </Shell>
  );
}
