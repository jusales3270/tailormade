"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { criarFase } from "@/lib/safe-actions/fase-criar";
import { FaseCard } from "./fase-card";
import { Gantt } from "./gantt";
import { CAMPO } from "./estilos";
import type { FaseUI, MembroOpcaoUI } from "./tipos";

function NovaFaseForm({ orgId, membros }: { orgId: string; membros: MembroOpcaoUI[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [trilho, setTrilho] = useState<"legal" | "op">("legal");
  const [inicio, setInicio] = useState("");
  const [prazo, setPrazo] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const criar = useAction(criarFase, {
    onSuccess: () => {
      router.refresh();
      setNome("");
      setInicio("");
      setPrazo("");
      setResponsavel("");
      setAberto(false);
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    criar.execute({
      orgId,
      nome: nome.trim(),
      trilho,
      inicioPrevisto: inicio || null,
      prazo: prazo || null,
      responsavelId: responsavel || null,
    });
  }

  if (!aberto) {
    return (
      <button
        type="button"
        className="bt bt--azul bt--min"
        style={{ alignSelf: "flex-start" }}
        onClick={() => setAberto(true)}
      >
        <Plus size={13} strokeWidth={2.4} /> Nova fase
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="cart" style={{ gap: 10 }}>
      <strong className="min">Nova fase</strong>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          autoFocus
          placeholder="Nome da fase"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          style={{ ...CAMPO, flex: 2, minWidth: 200 }}
        />
        <select value={trilho} onChange={(e) => setTrilho(e.target.value as "legal" | "op")} style={CAMPO}>
          <option value="legal">Societário e legal</option>
          <option value="op">Operação e produto</option>
        </select>
        <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} style={CAMPO}>
          <option value="">Sem responsável</option>
          {membros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <label className="min" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Início previsto
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} style={CAMPO} />
        </label>
        <label className="min" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Prazo
          <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} style={CAMPO} />
        </label>
      </div>
      <p className="min">Sem início previsto e prazo a fase não desenha barra na linha do tempo.</p>
      {criar.result.serverError && <p className="min c-vermelho">{criar.result.serverError}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="bt bt--azul" disabled={criar.isPending}>
          {criar.isPending ? "Criando…" : "Criar fase"}
        </button>
        <button type="button" className="bt bt--claro" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function TrilhaClient({
  fases,
  membros,
  orgId,
  podeGerir,
}: {
  fases: FaseUI[];
  membros: MembroOpcaoUI[];
  orgId: string | null;
  podeGerir: boolean;
}) {
  const [vista, setVista] = useState<"lista" | "gantt">("lista");

  return (
    <>
      {podeGerir && orgId && <NovaFaseForm orgId={orgId} membros={membros} />}

      <div className="seg">
        <button className={vista === "lista" ? "on" : ""} onClick={() => setVista("lista")}>
          Lista
        </button>
        <button className={vista === "gantt" ? "on" : ""} onClick={() => setVista("gantt")}>
          Linha do tempo
        </button>
      </div>

      {vista === "lista" ? (
        <div className="fases">
          {fases.length === 0 && (
            <section className="cart">
              <p className="min">
                A trilha ainda está vazia. Crie a primeira fase para começar o checklist de fundação.
              </p>
            </section>
          )}
          {fases.map((fase, i) => (
            <FaseCard key={fase.id} fase={fase} indice={i} membros={membros} podeGerir={podeGerir} />
          ))}
        </div>
      ) : (
        <Gantt fases={fases} />
      )}
    </>
  );
}
