import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Leitura } from "@/lib/regras/tipos";
import { montarPrompt, validarNarracao } from "./prompt";

const MODELO = "claude-haiku-4-5-20251001";

export const MENSAGEM_VAZIA =
  "Não há leituras no momento — nenhuma regra apontou risco, ação ou atenção pendente.";
export const MENSAGEM_FALHA =
  "O copiloto recebeu leituras, mas não conseguiu narrá-las com segurança agora. Veja a lista abaixo.";

// master doc §5: "recebe fatos prontos, devolve prosa. Sem acesso a banco, sem tool
// calling". Uma única chamada de texto, sem ferramentas — e se o array vier vazio, nem
// chama o modelo: "não preenche o silêncio" é uma garantia de código, não de prompt.
// Timeout curto porque narrar() está no caminho crítico do carregamento do painel
// inteiro (DashboardLayout dá await nela antes de renderizar qualquer coisa) — uma
// API lenta ou fora do ar não pode travar a navegação de todo mundo indefinidamente.
const TIMEOUT_MS = 6000;

export async function narrar(leituras: Leitura[]): Promise<string> {
  if (leituras.length === 0) return MENSAGEM_VAZIA;

  const { system, user } = montarPrompt(leituras);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let resposta: Anthropic.Message;
  try {
    resposta = await client.messages.create(
      {
        model: MODELO,
        max_tokens: 300,
        system,
        messages: [{ role: "user", content: user }],
      },
      { timeout: TIMEOUT_MS },
    );
  } catch {
    return MENSAGEM_FALHA;
  }

  const texto = resposta.content
    .filter((bloco): bloco is Anthropic.TextBlock => bloco.type === "text")
    .map((bloco) => bloco.text)
    .join("")
    .trim();

  if (!texto || !validarNarracao(texto, leituras)) {
    return MENSAGEM_FALHA;
  }
  return texto;
}
