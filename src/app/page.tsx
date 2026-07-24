import { createClient } from "@/lib/supabase/server";

// Placeholder até o T-005 (shell). Serve só para confirmar que o proxy.ts protege a
// rota e que a sessão chega corretamente ao Server Component.
export default async function Home() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  const { data: membro } = sessao?.claims
    ? await supabase
        .from("membros")
        .select("nome, papel, org_id")
        .eq("user_id", sessao.claims.sub)
        .maybeSingle()
    : { data: null };

  return (
    <main style={{ maxWidth: 480, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1>Tailor Made</h1>
      <p>Logado como {sessao?.claims?.email ?? "—"}</p>
      {membro && (
        <p>
          {membro.nome} · papel: {membro.papel}
        </p>
      )}
      <p>
        <a href="/convidar">Convidar membro</a>
      </p>
    </main>
  );
}
