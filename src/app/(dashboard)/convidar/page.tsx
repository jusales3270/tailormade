import { createClient } from "@/lib/supabase/server";
import { Titulo } from "@/components/shell/titulo";
import { ConvidarForm } from "./convidar-form";

// A sessão já foi checada pelo (dashboard)/layout.tsx — aqui só falta o papel.
export default async function ConvidarPage() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  const { data: membro } = await supabase
    .from("membros")
    .select("org_id, papel")
    .eq("user_id", sessao!.claims.sub)
    .eq("ativo", true)
    .maybeSingle();

  if (!membro) {
    return (
      <>
        <Titulo t="Convidar membro" />
        <p className="cart">Sua conta ainda não está ligada a nenhum membro ativo.</p>
      </>
    );
  }

  if (membro.papel !== "admin") {
    return (
      <>
        <Titulo t="Convidar membro" />
        <p className="cart">Só admin convida novos membros.</p>
      </>
    );
  }

  return (
    <>
      <Titulo t="Convidar membro" />
      <div className="cart">
        <ConvidarForm orgId={membro.org_id} />
      </div>
    </>
  );
}
