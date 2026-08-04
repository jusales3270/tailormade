"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { lancarMovimento } from "@/lib/safe-actions/movimento-lancar";
import { registrarIntegralizacao } from "@/lib/safe-actions/aporte-registrar-integralizacao";
import { criarAporte } from "@/lib/safe-actions/aporte-criar";
import { CATEGORIAS_MOVIMENTO } from "@/lib/financeiro/categorias";
import { brl } from "@/lib/formatar";
import type {
  AporteUI,
  DocumentoOpcaoUI,
  MembroOpcaoUI,
  MetricasUI,
  MovimentoUI,
  StatusMovimento,
} from "./tipos";

const STATUS_MOVIMENTO: Record<StatusMovimento, { rot: string; cor: string }> = {
  previsto: { rot: "Previsto", cor: "cinza" },
  aguarda_aprovacao: { rot: "Lançado", cor: "cinza" },
  aprovado: { rot: "Lançado", cor: "cinza" },
  pago: { rot: "Registrado", cor: "verde" },
  rejeitado: { rot: "Rejeitado", cor: "vermelho" },
};

function Metricas({ m }: { m: MetricasUI }) {
  const pctIntegralizado =
    m.comprometidoCents > 0 ? Math.round((m.integralizadoCents / m.comprometidoCents) * 100) : 0;
  const cartoes = [
    ["Caixa hoje", brl(m.caixaCents), "", "verde"],
    ["Queima mensal", brl(m.queimaMediaCents), "média de três meses", "laranja"],
    [
      "Fôlego",
      Number.isFinite(m.folegoMeses) ? m.folegoMeses.toString().replace(".", ",") + " meses" : "—",
      "sem novos aportes",
      "azul",
    ],
    [
      "Integralizado",
      pctIntegralizado + "%",
      `${brl(m.integralizadoCents)} de ${brl(m.comprometidoCents)}`,
      "indigo",
    ],
  ] as const;

  return (
    <div className="metricas">
      {cartoes.map(([r, v, n, c]) => (
        <div key={r} className="met">
          <div className="met__r">{r}</div>
          <div className={`met__v c-${c}`}>{v}</div>
          {n && <div className="met__n">{n}</div>}
        </div>
      ))}
    </div>
  );
}

function IntegralizacaoForm({
  aporteId,
  documentos,
  aoFechar,
}: {
  aporteId: string;
  documentos: DocumentoOpcaoUI[];
  aoFechar: () => void;
}) {
  const router = useRouter();
  const [valor, setValor] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [comprovanteId, setComprovanteId] = useState("");

  const registrar = useAction(registrarIntegralizacao, {
    onSuccess: () => {
      router.refresh();
      aoFechar();
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    const valorCents = Math.round(parseFloat(valor.replace(",", ".")) * 100);
    if (!valorCents || valorCents <= 0 || !comprovanteId) return;
    registrar.execute({ aporteId, valorCents, data, comprovanteDocumentoId: comprovanteId });
  }

  return (
    <form onSubmit={enviar} style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
      <input
        placeholder="Valor (R$)"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        style={{ width: 100, background: "var(--fill)", borderRadius: 8, padding: "5px 8px", fontSize: 12.5 }}
      />
      <input
        type="date"
        value={data}
        onChange={(e) => setData(e.target.value)}
        style={{ background: "var(--fill)", borderRadius: 8, padding: "5px 8px", fontSize: 12.5 }}
      />
      <select
        value={comprovanteId}
        onChange={(e) => setComprovanteId(e.target.value)}
        required
        style={{ flex: 1, minWidth: 140, background: "var(--fill)", borderRadius: 8, padding: "5px 8px", fontSize: 12.5 }}
      >
        <option value="">comprovante…</option>
        {documentos.map((d) => (
          <option key={d.id} value={d.id}>
            {d.codigo} · {d.nome}
          </option>
        ))}
      </select>
      <button type="submit" className="bt bt--azul bt--min" disabled={registrar.isPending}>
        {registrar.isPending ? "Salvando…" : "Registrar"}
      </button>
      {registrar.result.serverError && <em className="min c-vermelho">{registrar.result.serverError}</em>}
    </form>
  );
}

function LinhaAporte({ aporte, podeGerir, documentos }: { aporte: AporteUI; podeGerir: boolean; documentos: DocumentoOpcaoUI[] }) {
  const [abrirForm, setAbrirForm] = useState(false);
  const p = aporte.comprometidoCents > 0 ? (aporte.integralizadoCents / aporte.comprometidoCents) * 100 : 100;
  const pendente = aporte.integralizadoCents < aporte.comprometidoCents;

  return (
    <div className="aporte">
      <div className="aporte__t">
        <span>{aporte.membroNome}</span>
        <em>
          {brl(aporte.integralizadoCents)} de {brl(aporte.comprometidoCents)}
        </em>
      </div>
      <div className="cap">
        <div className={p < 100 ? "f-laranja" : "f-verde"} style={{ width: Math.min(p, 100) + "%" }} />
      </div>
      {podeGerir && pendente && !abrirForm && (
        <button className="bt bt--claro bt--min" style={{ marginTop: 6 }} onClick={() => setAbrirForm(true)}>
          + Registrar integralização
        </button>
      )}
      {abrirForm && (
        <IntegralizacaoForm aporteId={aporte.id} documentos={documentos} aoFechar={() => setAbrirForm(false)} />
      )}
    </div>
  );
}

function NovoAporteForm({
  orgId,
  membros,
  aoFechar,
}: {
  orgId: string;
  membros: MembroOpcaoUI[];
  aoFechar: () => void;
}) {
  const router = useRouter();
  const [membroId, setMembroId] = useState(membros[0]?.id ?? "");
  const [valor, setValor] = useState("");
  const [prazo, setPrazo] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const criar = useAction(criarAporte, {
    onSuccess: () => {
      router.refresh();
      aoFechar();
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!membroId) {
      setErro("Escolha o sócio que está se comprometendo.");
      return;
    }
    const comprometidoCents = Math.round(parseFloat(valor.replace(".", "").replace(",", ".")) * 100);
    if (!Number.isFinite(comprometidoCents) || comprometidoCents <= 0) {
      setErro("Informe um valor maior que zero (ex: 50.000,00).");
      return;
    }

    criar.execute({ orgId, membroId, comprometidoCents, prazo: prazo || null });
  }

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select
          value={membroId}
          onChange={(e) => setMembroId(e.target.value)}
          style={{ flex: 1, minWidth: 140, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
        >
          {membros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
        <input
          placeholder="Comprometido (R$)"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          style={{ width: 140, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
        />
        <input
          type="date"
          title="Prazo para integralizar"
          value={prazo}
          onChange={(e) => setPrazo(e.target.value)}
          style={{ background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
        />
      </div>
      {(erro || criar.result.serverError) && (
        <p className="min c-vermelho">{erro ?? criar.result.serverError}</p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="bt bt--azul bt--min" disabled={criar.isPending}>
          {criar.isPending ? "Declarando…" : "Declarar aporte"}
        </button>
        <button type="button" className="bt bt--claro bt--min" onClick={aoFechar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function LancarMovimentoForm({ orgId, aoFechar }: { orgId: string; aoFechar: () => void }) {
  const router = useRouter();
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_MOVIMENTO[0]);
  const [direcao, setDirecao] = useState<"entrada" | "saida">("saida");
  const [competencia, setCompetencia] = useState(() => new Date().toISOString().slice(0, 10));
  const [erro, setErro] = useState<string | null>(null);

  const lancar = useAction(lancarMovimento, {
    onSuccess: () => {
      router.refresh();
      aoFechar();
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!descricao.trim()) {
      setErro("Descreva o movimento.");
      return;
    }
    const valorCents = Math.round(parseFloat(valor.replace(",", ".")) * 100);
    if (!Number.isFinite(valorCents) || valorCents <= 0) {
      setErro("Informe um valor maior que zero (ex: 150,00).");
      return;
    }

    lancar.execute({
      orgId,
      descricao: descricao.trim(),
      valorCents,
      categoria: categoria as (typeof CATEGORIAS_MOVIMENTO)[number],
      direcao,
      competencia,
    });
  }

  return (
    <form onSubmit={enviar} className="cart" style={{ gap: 8, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          style={{ flex: 1, minWidth: 160, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
        />
        <input
          placeholder="Valor (R$)"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          style={{ width: 100, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          style={{ background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
        >
          {CATEGORIAS_MOVIMENTO.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={direcao}
          onChange={(e) => setDirecao(e.target.value as "entrada" | "saida")}
          style={{ background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
        >
          <option value="saida">Saída</option>
          <option value="entrada">Entrada</option>
        </select>
        <input
          type="date"
          value={competencia}
          onChange={(e) => setCompetencia(e.target.value)}
          style={{ background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
        />
      </div>
      {(erro || lancar.result.serverError) && (
        <p className="min c-vermelho">{erro ?? lancar.result.serverError}</p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="bt bt--azul bt--min" disabled={lancar.isPending}>
          {lancar.isPending ? "Lançando…" : "Lançar movimento"}
        </button>
        <button type="button" className="bt bt--claro bt--min" onClick={aoFechar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function LinhaMovimento({ mov }: { mov: MovimentoUI }) {
  const st = STATUS_MOVIMENTO[mov.status];

  return (
    <li className="linha">
      <span className="linha__t">
        {mov.descricao}
        <em>
          {mov.codigo} · {mov.categoria} · {mov.solicitanteNome ?? "?"}
        </em>
      </span>
      <span className="valor">
        {mov.direcao === "saida" ? "−" : "+"}
        {brl(mov.valorCents)}
      </span>
      <span className={`selo selo--${st.cor}`}>{st.rot}</span>
    </li>
  );
}

export function FinanceiroClient({
  orgId,
  podeGerir,
  metricas,
  aportes,
  movimentos,
  documentos,
  membros,
}: {
  orgId: string;
  podeGerir: boolean;
  metricas: MetricasUI;
  aportes: AporteUI[];
  movimentos: MovimentoUI[];
  documentos: DocumentoOpcaoUI[];
  membros: MembroOpcaoUI[];
}) {
  const [abrirLancar, setAbrirLancar] = useState(false);
  const [abrirAporte, setAbrirAporte] = useState(false);

  return (
    <>
      <Metricas m={metricas} />
      <div className="duplo">
        <section className="cart">
          <div className="cart__cab">
            <h2>Aportes por sócio</h2>
            {podeGerir && !abrirAporte && (
              <button className="bt bt--claro bt--min" onClick={() => setAbrirAporte(true)}>
                <Plus size={13} strokeWidth={2.6} /> Declarar
              </button>
            )}
          </div>
          {aportes.length === 0 && !abrirAporte && (
            <p className="min">
              Nenhum aporte declarado. Registre o capital que cada sócio se comprometeu a integralizar.
            </p>
          )}
          {aportes.map((a) => (
            <LinhaAporte key={a.id} aporte={a} podeGerir={podeGerir} documentos={documentos} />
          ))}
          {abrirAporte && (
            <NovoAporteForm orgId={orgId} membros={membros} aoFechar={() => setAbrirAporte(false)} />
          )}
        </section>

        <section className="cart cart--lista">
          <div className="cart__cab">
            <h2>Movimento</h2>
            {podeGerir && !abrirLancar && (
              <button className="bt bt--claro bt--min" onClick={() => setAbrirLancar(true)}>
                <Plus size={13} strokeWidth={2.6} /> Lançar
              </button>
            )}
          </div>
          {abrirLancar && <LancarMovimentoForm orgId={orgId} aoFechar={() => setAbrirLancar(false)} />}
          <ul className="lista">
            {movimentos.map((m) => (
              <LinhaMovimento key={m.id} mov={m} />
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
