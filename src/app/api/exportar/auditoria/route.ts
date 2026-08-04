import { createClient } from "@/lib/supabase/server";
import { gerarCsvAuditoria, type LinhaAuditoria } from "@/lib/exportar/auditoria-csv";

// T-019: exportação de auditoria. Só admin (a policy auditoria_select já restringe a
// leitura a admin, mas o guard explícito abaixo devolve um erro claro em vez de um CSV
// vazio para quem não tem acesso).
export async function GET() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  if (!sessao?.claims) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const { data: membro } = await supabase
    .from("membros")
    .select("org_id, papel")
    .eq("user_id", sessao.claims.sub)
    .eq("ativo", true)
    .maybeSingle();

  if (!membro || membro.papel !== "admin") {
    return new Response("Só admin pode exportar a auditoria.", { status: 403 });
  }

  const { data: linhas } = await supabase
    .from("auditoria")
    .select("criado_em, acao, entidade, entidade_id, antes, depois, ator:membros(nome)")
    .eq("org_id", membro.org_id)
    .order("criado_em", { ascending: false });

  const linhasCsv: LinhaAuditoria[] = (linhas ?? []).map((l) => ({
    criadoEm: l.criado_em,
    atorNome: l.ator?.nome ?? null,
    acao: l.acao,
    entidade: l.entidade,
    entidadeId: l.entidade_id,
    antes: l.antes,
    depois: l.depois,
  }));

  const csv = gerarCsvAuditoria(linhasCsv);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="auditoria-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
