import type { Leitura } from "@/lib/regras/tipos";
import { brl } from "@/lib/formatar";

// Linha de apoio de cada card de leitura — puramente determinística (sem LLM), montada
// direto dos "fatos" que a própria regra já calculou. Só o parágrafo de resumo do topo
// passa pelo copiloto (ver lib/copiloto/narrar.ts); os cards nunca precisam do modelo.
export function formatarFatos(leitura: Leitura): string {
  const f = leitura.fatos;

  switch (leitura.regra) {
    case "R05":
      return `${f.codigo} · ${f.grupo}`;
    case "R06":
      return `${f.codigo} · início ${new Date(String(f.inicio)).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`;
    case "R07":
      return `Faltam ${brl(Number(f.faltaCents))}`;
    case "R08":
      return `${f.quantidade} movimento(s) · soma ${brl(Number(f.somaCents))}`;
    case "R09":
      return `${brl(Number(f.caixaCents))} em caixa · queima ${brl(Number(f.queimaMediaCents))}/mês · ${f.folegoMeses} meses de fôlego`;
    case "R10":
      return `Vence em ${new Date(String(f.venceEm)).toLocaleDateString("pt-BR")}`;
    case "R11":
      return "Aguardando revisão humana há mais de 7 dias";
    default:
      return Object.entries(f)
        .map(([chave, valor]) => `${chave}: ${valor}`)
        .join(" · ");
  }
}
