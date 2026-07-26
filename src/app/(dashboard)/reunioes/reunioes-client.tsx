"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Circle, Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { concluirEncaminhamento } from "@/lib/safe-actions/encaminhamento-concluir";
import { marcarReuniao } from "@/lib/safe-actions/reuniao-marcar";
import { adicionarPauta } from "@/lib/safe-actions/pauta-adicionar";
import { PublicarAtaForm } from "./publicar-ata-form";
import type { MembroOpcaoUI, ReuniaoUI } from "./tipos";

function AgendarReuniaoForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("Recorrente");
  const [inicio, setInicio] = useState("");

  const marcar = useAction(marcarReuniao, {
    onSuccess: () => {
      router.refresh();
      setTitulo("");
      setInicio("");
      setAberto(false);
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !inicio) return;
    marcar.execute({ orgId, titulo: titulo.trim(), tipo, inicio: new Date(inicio).toISOString() });
  }

  if (!aberto) {
    return (
      <button type="button" className="bt bt--azul" style={{ alignSelf: "flex-start" }} onClick={() => setAberto(true)}>
        <Plus size={14} strokeWidth={2.4} /> Agendar reunião
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="cart" style={{ gap: 10 }}>
      <strong className="min">Agendar reunião</strong>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          style={{ flex: 2, minWidth: 200, background: "var(--fill)", borderRadius: 8, padding: "8px 12px", fontSize: 13.5 }}
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          style={{ background: "var(--fill)", borderRadius: 8, padding: "8px 12px", fontSize: 13.5 }}
        >
          <option value="Recorrente">Recorrente</option>
          <option value="Extraordinária">Extraordinária</option>
        </select>
        <input
          type="datetime-local"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          required
          style={{ background: "var(--fill)", borderRadius: 8, padding: "8px 12px", fontSize: 13.5 }}
        />
      </div>
      {marcar.result.serverError && <p className="min c-vermelho">{marcar.result.serverError}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="bt bt--azul" disabled={marcar.isPending}>
          {marcar.isPending ? "Agendando…" : "Agendar"}
        </button>
        <button type="button" className="bt bt--claro" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function AdicionarPautaForm({ reuniaoId }: { reuniaoId: string }) {
  const router = useRouter();
  const [item, setItem] = useState("");
  const adicionar = useAction(adicionarPauta, {
    onSuccess: () => {
      router.refresh();
      setItem("");
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!item.trim()) return;
    adicionar.execute({ reuniaoId, item: item.trim() });
  }

  return (
    <form onSubmit={enviar} style={{ display: "flex", gap: 8 }}>
      <input
        placeholder="Novo item de pauta"
        value={item}
        onChange={(e) => setItem(e.target.value)}
        style={{ flex: 1, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
      />
      <button type="submit" className="bt bt--claro bt--min" disabled={adicionar.isPending}>
        + pauta
      </button>
      {adicionar.result.serverError && <span className="min c-vermelho">{adicionar.result.serverError}</span>}
    </form>
  );
}

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function EncaminhamentoLinha({ enc }: { enc: ReuniaoUI["encaminhamentos"][number] }) {
  const router = useRouter();
  const concluir = useAction(concluirEncaminhamento, { onSuccess: () => router.refresh() });
  const feito = enc.status === "concluido";

  return (
    <li className="linha">
      <button
        className={`marca ${feito ? "marca--on" : ""}`}
        onClick={() => !feito && concluir.execute({ encaminhamentoId: enc.id })}
        disabled={feito || concluir.isPending}
      >
        {feito ? <CheckCircle2 size={17} strokeWidth={2} /> : <Circle size={17} strokeWidth={1.8} />}
      </button>
      <span className={`linha__t ${feito ? "linha__t--feito" : ""}`}>
        {enc.titulo}
        <em>
          {enc.responsavelNome} · prazo {enc.prazo}
        </em>
      </span>
    </li>
  );
}

function CartaoReuniao({
  reuniao,
  membros,
  podeGerir,
}: {
  reuniao: ReuniaoUI;
  membros: MembroOpcaoUI[];
  podeGerir: boolean;
}) {
  const inicio = new Date(reuniao.inicio);

  return (
    <section className={`cart reu ${reuniao.semPauta ? "reu--alerta" : ""}`}>
      <div className="reu__cab">
        <div className="data">
          <span className="data__m">{MESES[inicio.getUTCMonth()]}</span>
          <span className="data__d">{inicio.getUTCDate()}</span>
        </div>
        <div className="reu__ti">
          <h3>{reuniao.titulo}</h3>
          <em>{reuniao.codigo} · {reuniao.tipo}</em>
        </div>
      </div>

      {reuniao.pauta.length > 0 && (
        <ul className="lista">
          {reuniao.pauta.map((p, i) => (
            <li key={p.id} className="linha">
              <span className="ord">{i + 1}</span>
              <span className="linha__t">{p.item}</span>
            </li>
          ))}
        </ul>
      )}

      {reuniao.semPauta && (
        <div className="aviso">
          <AlertTriangle size={14} strokeWidth={2.3} /> Sem pauta publicada. Publique a pauta ou a reunião não
          gera decisão.
        </div>
      )}

      {!reuniao.ata && <AdicionarPautaForm reuniaoId={reuniao.id} />}

      {reuniao.ata ? (
        <>
          <div className="ata">
            <span className="ata__r">Ata</span>
            <p>{reuniao.ata.corpo}</p>
          </div>
          {reuniao.encaminhamentos.length > 0 && (
            <ul className="lista">
              {reuniao.encaminhamentos.map((enc) => (
                <EncaminhamentoLinha key={enc.id} enc={enc} />
              ))}
            </ul>
          )}
        </>
      ) : (
        podeGerir && <PublicarAtaForm reuniaoId={reuniao.id} membros={membros} />
      )}
    </section>
  );
}

export function ReunioesClient({
  reunioes,
  membros,
  orgId,
  podeGerir,
}: {
  reunioes: ReuniaoUI[];
  membros: MembroOpcaoUI[];
  orgId: string;
  podeGerir: boolean;
}) {
  return (
    <div className="fases">
      {podeGerir && <AgendarReuniaoForm orgId={orgId} />}
      {reunioes.length === 0 && <p className="cart lista__vazio">Nenhuma reunião marcada ainda.</p>}
      {reunioes.map((r) => (
        <CartaoReuniao key={r.id} reuniao={r} membros={membros} podeGerir={podeGerir} />
      ))}
    </div>
  );
}
