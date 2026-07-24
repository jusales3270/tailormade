import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConvidarForm } from "./convidar-form";

export default async function ConvidarPage() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  if (!sessao?.claims) {
    redirect("/login?proximo=/convidar");
  }

  const { data: membro } = await supabase
    .from("membros")
    .select("org_id, papel")
    .eq("user_id", sessao.claims.sub)
    .eq("ativo", true)
    .maybeSingle();

  if (!membro) {
    return (
      <main style={{ maxWidth: 480, margin: "80px auto", fontFamily: "sans-serif" }}>
        <p>Sua conta ainda não está ligada a nenhum membro ativo.</p>
      </main>
    );
  }

  if (membro.papel !== "admin") {
    return (
      <main style={{ maxWidth: 480, margin: "80px auto", fontFamily: "sans-serif" }}>
        <p>Só admin convida novos membros.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1>Convidar membro</h1>
      <ConvidarForm orgId={membro.org_id} />
    </main>
  );
}
