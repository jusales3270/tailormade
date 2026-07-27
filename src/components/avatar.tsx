import { iniciais } from "@/lib/iniciais";

// Foto quando existe, iniciais quando não. Centralizado porque a foto de perfil precisa
// aparecer igual em todo lugar que mostra gente (barra, debates, sócios) — era o que
// faltava para o avatar significar alguma coisa para os outros membros.
export function Avatar({
  nome,
  avatarUrl,
  className = "",
  titulo,
}: {
  nome: string;
  avatarUrl: string | null;
  className?: string;
  titulo?: string;
}) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- URL do Supabase Storage, fora do domínio configurado no next/image
    return <img src={avatarUrl} alt="" title={titulo ?? nome} className={`ava ava--foto ${className}`} />;
  }
  return (
    <span title={titulo ?? nome} className={`ava ${className}`}>
      {iniciais(nome)}
    </span>
  );
}
