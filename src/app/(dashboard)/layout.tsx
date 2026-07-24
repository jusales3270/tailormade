import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/shell/shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  if (!sessao?.claims) {
    redirect("/login");
  }

  const { data: membro } = await supabase
    .from("membros")
    .select("nome, papel")
    .eq("user_id", sessao.claims.sub)
    .eq("ativo", true)
    .maybeSingle();

  return (
    <Shell nome={membro?.nome ?? sessao.claims.email ?? "—"} papel={membro?.papel ?? null}>
      {children}
    </Shell>
  );
}
