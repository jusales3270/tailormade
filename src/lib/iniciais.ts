export function iniciais(nome: string): string {
  const primeiras = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "");
  return primeiras.join("") || "?";
}
