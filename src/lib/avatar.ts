// URL pública do avatar. O bucket `avatars` é público (ver migration
// 20260727120000): montar a URL é string, não chamada de rede — o shell aparece em
// toda página do painel e gerar signed URL a cada render custaria um round-trip por
// navegação, só para uma foto de perfil que não é dado sensível.
export function urlAvatar(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/avatars/${avatarPath}`;
}
