import { createClient } from "@/lib/supabase/server";
import { Titulo } from "@/components/shell/titulo";
import { r09FolegoDeCaixa } from "@/lib/regras/regras";
import { calcularCaixaEQueima } from "@/lib/financeiro/derivacao";
import { FinanceiroClient } from "./financeiro-client";
import type { AporteUI, DocumentoOpcaoUI, MetricasUI, MovimentoUI } from "./tipos";

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  const { data: membro } = await supabase
    .from("membros")
    .select("id, org_id, papel")
    .eq("user_id", sessao!.claims.sub)
    .eq("ativo", true)
    .maybeSingle();

  if (!membro) {
    return <Titulo t="Financeiro" s="Sua conta ainda não está ligada a nenhum membro ativo." />;
  }
  if (membro.papel === "tecnico") {
    return <Titulo t="Financeiro" s="Perfil técnico não acessa dados financeiros." />;
  }

  const [{ data: aportes }, { data: movimentos }, { data: documentos }] = await Promise.all([
    supabase
      .from("aportes")
      .select("id, comprometido_cents, membro:membros(nome), eventos:aporte_eventos(valor_cents)")
      .eq("org_id", membro.org_id),
    supabase
      .from("movimentos")
      .select(
        `id, codigo, descricao, categoria, valor_cents, direcao, status, competencia,
         solicitante:membros!movimentos_solicitante_id_fkey(id, nome)`,
      )
      .eq("org_id", membro.org_id)
      .order("codigo", { ascending: false }),
    supabase.from("documentos").select("id, codigo, nome").eq("org_id", membro.org_id).order("codigo"),
  ]);

  const aportesUI: AporteUI[] = (aportes ?? []).map((a) => ({
    id: a.id,
    membroNome: a.membro?.nome ?? "?",
    comprometidoCents: a.comprometido_cents,
    integralizadoCents: a.eventos.reduce((acc, e) => acc + e.valor_cents, 0),
  }));

  const movimentosUI: MovimentoUI[] = (movimentos ?? []).map((m) => ({
    id: m.id,
    codigo: m.codigo,
    descricao: m.descricao,
    categoria: m.categoria,
    valorCents: m.valor_cents,
    direcao: m.direcao,
    status: m.status,
    solicitanteId: m.solicitante?.id ?? null,
    solicitanteNome: m.solicitante?.nome ?? null,
  }));

  const documentosUI: DocumentoOpcaoUI[] = (documentos ?? []).map((d) => ({
    id: d.id,
    codigo: d.codigo,
    nome: d.nome,
  }));

  const integralizadoCents = aportesUI.reduce((acc, a) => acc + a.integralizadoCents, 0);
  const comprometidoCents = aportesUI.reduce((acc, a) => acc + a.comprometidoCents, 0);

  const { caixaCents, queimaMediaCents } = calcularCaixaEQueima(
    (movimentos ?? []).map((m) => ({
      valorCents: m.valor_cents,
      direcao: m.direcao,
      status: m.status,
      competencia: m.competencia,
    })),
    integralizadoCents,
    new Date(),
  );

  const leituraFolego = r09FolegoDeCaixa(caixaCents, queimaMediaCents);
  const metricas: MetricasUI = {
    caixaCents,
    queimaMediaCents,
    folegoMeses: leituraFolego.fatos.folegoMeses as number,
    comprometidoCents,
    integralizadoCents,
  };

  return (
    <>
      <Titulo t="Financeiro" s="Substitui o grupo do financeiro. Toda despesa tem número, categoria e responsável." />
      <FinanceiroClient
        orgId={membro.org_id}
        podeGerir={membro.papel === "admin" || membro.papel === "socio"}
        metricas={metricas}
        aportes={aportesUI}
        movimentos={movimentosUI}
        documentos={documentosUI}
      />
    </>
  );
}
