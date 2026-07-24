import { createClient } from "@/lib/supabase/server";
import { Titulo } from "@/components/shell/titulo";
import { r06ReunioesSemPauta } from "@/lib/regras/regras";
import { ReunioesClient } from "./reunioes-client";
import type { ReuniaoUI } from "./tipos";

export default async function ReunioesPage() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  const { data: membro } = await supabase
    .from("membros")
    .select("id, org_id, papel")
    .eq("user_id", sessao!.claims.sub)
    .eq("ativo", true)
    .maybeSingle();

  if (!membro) {
    return <Titulo t="Reuniões" s="Sua conta ainda não está ligada a nenhum membro ativo." />;
  }

  const [{ data: reunioes }, { data: membrosOrg }] = await Promise.all([
    supabase
      .from("reunioes")
      .select(
        `id, codigo, titulo, tipo, inicio,
         pauta:reuniao_pauta(id, ordem, item),
         atas(corpo, publicada_em)`,
      )
      .eq("org_id", membro.org_id)
      .order("inicio", { ascending: false }),
    supabase.from("membros").select("id, nome").eq("org_id", membro.org_id).eq("ativo", true),
  ]);

  // Busca à parte, filtrando por origem_tipo — um embed direto reuniões→encaminhamentos
  // não existe (a relação é polimórfica via origem_tipo/origem_id, não FK).
  const { data: todosEncaminhamentos } = await supabase
    .from("encaminhamentos")
    .select("id, titulo, prazo, status, origem_id, responsavel:membros(nome)")
    .eq("org_id", membro.org_id)
    .eq("origem_tipo", "reuniao");

  const encPorReuniao = new Map<string, typeof todosEncaminhamentos>();
  for (const e of todosEncaminhamentos ?? []) {
    const lista = encPorReuniao.get(e.origem_id) ?? [];
    lista.push(e);
    encPorReuniao.set(e.origem_id, lista);
  }

  const agora = new Date();
  const reunioesParaRegra = (reunioes ?? []).map((r) => ({
    id: r.id,
    codigo: r.codigo,
    titulo: r.titulo,
    inicio: r.inicio,
    pauta: r.pauta.map((p) => p.item),
  }));
  const semPautaIds = new Set(r06ReunioesSemPauta(reunioesParaRegra, agora).map((l) => l.origem.id));

  const reunioesUI: ReuniaoUI[] = (reunioes ?? []).map((r) => {
    const ata = r.atas[0] ?? null;
    const encaminhamentos = encPorReuniao.get(r.id) ?? [];
    return {
      id: r.id,
      codigo: r.codigo,
      titulo: r.titulo,
      tipo: r.tipo,
      inicio: r.inicio,
      pauta: r.pauta.slice().sort((a, b) => a.ordem - b.ordem).map((p) => ({ id: p.id, item: p.item })),
      ata: ata ? { corpo: ata.corpo, publicadaEm: ata.publicada_em } : null,
      encaminhamentos: encaminhamentos.map((e) => ({
        id: e.id,
        titulo: e.titulo,
        responsavelNome: e.responsavel?.nome ?? "?",
        prazo: e.prazo,
        status: e.status,
      })),
      semPauta: semPautaIds.has(r.id),
    };
  });

  return (
    <>
      <Titulo
        t="Reuniões"
        s="Pauta antes, ata depois. Encaminhamento de ata vira tarefa com responsável."
      />
      <ReunioesClient
        reunioes={reunioesUI}
        membros={membrosOrg ?? []}
        orgId={membro.org_id}
        podeGerir={membro.papel === "admin" || membro.papel === "socio"}
      />
    </>
  );
}
