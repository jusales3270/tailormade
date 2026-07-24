import { createAdminClient } from "@/lib/supabase/admin";

// Escrita em auditoria é sempre pelo admin client (service role) — nunca pela sessão
// do usuário comum, que só tem SELECT na tabela (rls_policies.sql). Ver §2.7 do master doc.
export async function registrarAuditoria(params: {
  orgId: string;
  atorId: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  antes: unknown;
  depois: unknown;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("auditoria").insert({
    org_id: params.orgId,
    ator_id: params.atorId,
    acao: params.acao,
    entidade: params.entidade,
    entidade_id: params.entidadeId,
    antes: params.antes as never,
    depois: params.depois as never,
  });

  if (error) {
    throw new Error(`Falha ao gravar auditoria: ${error.message}`);
  }
}
