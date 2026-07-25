// Módulo puro (sem I/O, sem "server-only") — a mesma disciplina do motor de regras
// (lib/regras): a construção do prompt e a validação anti-alucinação precisam ser
// testáveis sem chamar o Anthropic de verdade. Quem chama o modelo é narrar.ts.
import type { Leitura, Severidade } from "@/lib/regras/tipos";

export type Contagem = Record<Severidade, number> & { total: number };

export function contarPorSeveridade(leituras: Leitura[]): Contagem {
  const contagem: Contagem = { risco: 0, acao: 0, atencao: 0, info: 0, total: leituras.length };
  for (const l of leituras) contagem[l.severidade]++;
  return contagem;
}

const SISTEMA = `Você é o copiloto do painel Tailor Made, que acompanha a fundação de uma startup.
Vai receber uma lista de "leituras" — fatos já apurados por regras determinísticas do sistema, nunca por você — e uma contagem agregada, também já calculada.
Escreva um único parágrafo curto (3 a 5 frases, português do Brasil, tom direto) resumindo essas leituras para quem abre o painel.

Regras rígidas, sem exceção:
- Use apenas números, nomes, códigos e datas que estejam literalmente nos campos "fatos" ou "titulo" das leituras, ou na contagem agregada informada.
- Nunca invente, estime ou arredonde um número que não esteja nos dados fornecidos.
- Nunca conclua nada sobre um registro que não esteja na lista.
- Não use tom de vendedor. Fatos, não elogios.`;

function montarPromptUsuario(leituras: Leitura[], contagem: Contagem): string {
  const linhas = leituras.map(
    (l) => `- [${l.regra} · ${l.severidade}] ${l.titulo} — fatos: ${JSON.stringify(l.fatos)}`,
  );
  return [
    `Contagem agregada (já calculada, pode citar exatamente): total=${contagem.total}, risco=${contagem.risco}, acao=${contagem.acao}, atencao=${contagem.atencao}, info=${contagem.info}.`,
    "",
    "Leituras:",
    ...linhas,
  ].join("\n");
}

export function montarPrompt(leituras: Leitura[]): { system: string; user: string; contagem: Contagem } {
  const contagem = contarPorSeveridade(leituras);
  return { system: SISTEMA, user: montarPromptUsuario(leituras, contagem), contagem };
}

function normalizarNumero(valor: number): string {
  return valor.toFixed(2);
}

// Todo número que a prosa pode citar sem ser considerado alucinação: os próprios fatos,
// a contagem agregada, e (porque várias leituras guardam valores em centavos) a mesma
// grandeza convertida para reais — a prosa natural fala "R$ 5.000", não "500000".
function numerosPermitidos(leituras: Leitura[], contagem: Contagem): Set<string> {
  const permitidos = new Set<string>();
  const registrar = (valor: number) => {
    if (!Number.isFinite(valor)) return;
    permitidos.add(normalizarNumero(valor));
    permitidos.add(normalizarNumero(valor / 100));
    permitidos.add(normalizarNumero(Math.round(valor)));
  };

  for (const valor of Object.values(contagem)) registrar(valor);

  for (const leitura of leituras) {
    for (const valor of Object.values(leitura.fatos)) {
      if (typeof valor === "number") {
        registrar(valor);
      } else {
        for (const bruto of valor.matchAll(/\d+(?:[.,]\d+)?/g)) {
          registrar(parseFloat(bruto[0].replace(",", ".")));
        }
      }
    }
  }

  return permitidos;
}

// Extrai números de um texto em prosa livre, aceitando tanto o padrão BR (1.234,56)
// quanto números simples (3, 95.4, 8%).
function extrairNumeros(texto: string): number[] {
  const tokens = texto.match(/\d[\d.,]*\d|\d/g) ?? [];
  return tokens
    .map((token) => {
      if (token.includes(",")) {
        return parseFloat(token.replace(/\./g, "").replace(",", "."));
      }
      if (/\.\d{3}(\D|$)/.test(token) || (token.match(/\./g) ?? []).length > 1) {
        return parseFloat(token.replace(/\./g, ""));
      }
      return parseFloat(token);
    })
    .filter((n) => !Number.isNaN(n));
}

// A trava anti-alucinação de fato: em vez de só pedir educadamente no prompt para o
// modelo não inventar números, verifica programaticamente se todo número que aparece na
// prosa gerada rastreia até um fato fornecido. Mesmo princípio do resto do sistema —
// "o veredito é determinístico" — aplicado à própria narração.
export function validarNarracao(texto: string, leituras: Leitura[]): boolean {
  const contagem = contarPorSeveridade(leituras);
  const permitidos = numerosPermitidos(leituras, contagem);
  return extrairNumeros(texto).every((n) => permitidos.has(normalizarNumero(n)));
}
