"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { editarFase } from "@/lib/safe-actions/fase-editar";
import { excluirFase } from "@/lib/safe-actions/fase-excluir";
import { criarFaseItem } from "@/lib/safe-actions/fase-item-criar";
import { ItemLinha } from "./item-linha";
import { CAMPO } from "./estilos";
import type { FaseUI, MembroOpcaoUI } from "./tipos";

function EditarFaseForm({
  fase,
  membros,
  aoFechar,
}: {
  fase: FaseUI;
  membros: MembroOpcaoUI[];
  aoFechar: () => void;
}) {
  const router = useRouter();
  const [nome, setNome] = useState(fase.nome);
  const [trilho, setTrilho] = useState(fase.trilho);
  const [inicio, setInicio] = useState(fase.inicioPrevisto ?? "");
  const [prazo, setPrazo] = useState(fase.prazo ?? "");
  const [responsavel, setResponsavel] = useState(fase.responsavelId ?? "");

  const editar = useAction(editarFase, {
    onSuccess: () => {
      router.refresh();
      aoFechar();
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    editar.execute({
      faseId: fase.id,
      nome: nome.trim(),
      trilho,
      inicioPrevisto: inicio || null,
      prazo: prazo || null,
      responsavelId: responsavel || null,
    });
  }

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          style={{ ...CAMPO, flex: 2, minWidth: 180 }}
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
        <button type="submit" className="bt bt--azul bt--min" disabled={editar.isPending}>
          {editar.isPending ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" className="bt bt--claro bt--min" onClick={aoFechar}>
          Cancelar
        </button>
      </div>
      {editar.result.serverError && <span className="min c-vermelho">{editar.result.serverError}</span>}
    </form>
  );
}

function NovoItemForm({ faseId }: { faseId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");

  const criar = useAction(criarFaseItem, {
    onSuccess: () => {
      router.refresh();
      setTitulo("");
      // Continua aberto: cadastrar checklist é uma sequência, não uma ação isolada.
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    criar.execute({ faseId, titulo: titulo.trim() });
  }

  if (!aberto) {
    return (
      <li className="linha">
        <button className="bt bt--claro bt--min" onClick={() => setAberto(true)}>
          <Plus size={13} strokeWidth={2.4} /> Adicionar item
        </button>
      </li>
    );
  }

  return (
    <li className="linha">
      <form onSubmit={enviar} style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
        <input
          autoFocus
          placeholder="O que precisa ser feito nesta fase?"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          style={{ ...CAMPO, flex: 1, minWidth: 200 }}
        />
        <button type="submit" className="bt bt--azul bt--min" disabled={criar.isPending}>
          {criar.isPending ? "Adicionando…" : "Adicionar"}
        </button>
        <button type="button" className="bt bt--claro bt--min" onClick={() => setAberto(false)}>
          Fechar
        </button>
        {criar.result.serverError && <span className="min c-vermelho">{criar.result.serverError}</span>}
      </form>
    </li>
  );
}

export function FaseCard({
  fase,
  indice,
  membros,
  podeGerir,
}: {
  fase: FaseUI;
  indice: number;
  membros: MembroOpcaoUI[];
  podeGerir: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const excluir = useAction(excluirFase, { onSuccess: () => router.refresh() });

  const feitos = fase.itens.filter((i) => i.concluido).length;
  const total = fase.itens.length;
  const pct = total > 0 ? (feitos / total) * 100 : 0;

  function excluirClick() {
    if (!confirm(`Excluir a fase "${fase.nome}" e seus ${total} ${total === 1 ? "item" : "itens"}?`)) return;
    excluir.execute({ faseId: fase.id });
  }

  return (
    <section className={`cart fase ${fase.concluida ? "fase--ok" : ""} ${fase.bloqueada ? "fase--bloqueada" : ""}`}>
      <div className="fase__cab">
        <span className="fase__n">{indice + 1}</span>
        {editando ? (
          <EditarFaseForm fase={fase} membros={membros} aoFechar={() => setEditando(false)} />
        ) : (
          <>
            <div className="fase__ti">
              <h3>{fase.nome}</h3>
              <em>
                {fase.responsavelNome ?? "sem responsável"} · {fase.prazo ?? "sem prazo"}
              </em>
            </div>
            {fase.bloqueada && <span className="selo selo--vermelho">bloqueada</span>}
            <span className={`selo ${fase.concluida ? "selo--verde" : "selo--cinza"}`}>
              {feitos}/{total}
            </span>
            {podeGerir && (
              <>
                <button className="glifo glifo--min" title="Editar fase" onClick={() => setEditando(true)}>
                  <Pencil size={13} strokeWidth={2.2} />
                </button>
                <button
                  className="glifo glifo--min"
                  title="Excluir fase"
                  onClick={excluirClick}
                  disabled={excluir.isPending}
                >
                  <Trash2 size={13} strokeWidth={2.2} />
                </button>
              </>
            )}
          </>
        )}
      </div>
      {excluir.result.serverError && <p className="min c-vermelho">{excluir.result.serverError}</p>}
      <div className="cap">
        <div className={fase.concluida ? "f-verde" : "f-azul"} style={{ width: `${pct}%` }} />
      </div>
      <ul className="lista">
        {fase.itens.map((item) => (
          <ItemLinha key={item.id} item={item} podeGerir={podeGerir} />
        ))}
        {podeGerir && <NovoItemForm faseId={fase.id} />}
      </ul>
    </section>
  );
}
