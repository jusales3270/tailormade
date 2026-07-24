"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { publicarAta } from "@/lib/safe-actions/ata-publicar";
import type { MembroOpcaoUI } from "./tipos";

type LinhaEncaminhamento = { titulo: string; responsavelId: string; prazo: string };

export function PublicarAtaForm({ reuniaoId, membros }: { reuniaoId: string; membros: MembroOpcaoUI[] }) {
  const router = useRouter();
  const [corpo, setCorpo] = useState("");
  const [itens, setItens] = useState<LinhaEncaminhamento[]>([{ titulo: "", responsavelId: "", prazo: "" }]);

  const publicar = useAction(publicarAta, {
    onSuccess: () => {
      router.refresh();
      setCorpo("");
      setItens([{ titulo: "", responsavelId: "", prazo: "" }]);
    },
  });

  function atualizarItem(i: number, campo: keyof LinhaEncaminhamento, valor: string) {
    setItens((atual) => atual.map((item, k) => (k === i ? { ...item, [campo]: valor } : item)));
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!corpo.trim()) return;
    const itensComTitulo = itens.filter((i) => i.titulo.trim());
    publicar.execute({
      reuniaoId,
      corpo: corpo.trim(),
      encaminhamentos: itensComTitulo.map((i) => ({
        titulo: i.titulo.trim(),
        responsavelId: i.responsavelId || null,
        prazo: i.prazo,
      })),
    });
  }

  return (
    <form onSubmit={enviar} className="cart" style={{ gap: 10 }}>
      <strong className="min">Publicar ata</strong>
      <textarea
        placeholder="O que foi decidido nesta reunião…"
        value={corpo}
        onChange={(e) => setCorpo(e.target.value)}
        rows={3}
        required
        style={{ background: "var(--fill)", borderRadius: 10, padding: "8px 12px", fontSize: 13.5, resize: "vertical" }}
      />

      <strong className="min">Encaminhamentos discutidos</strong>
      {itens.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            placeholder="O que precisa ser feito"
            value={item.titulo}
            onChange={(e) => atualizarItem(i, "titulo", e.target.value)}
            style={{ flex: 2, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
          />
          <select
            value={item.responsavelId}
            onChange={(e) => atualizarItem(i, "responsavelId", e.target.value)}
            style={{ flex: 1, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
          >
            <option value="">sem responsável</option>
            {membros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={item.prazo}
            onChange={(e) => atualizarItem(i, "prazo", e.target.value)}
            style={{ background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
          />
        </div>
      ))}
      <button
        type="button"
        className="bt bt--claro bt--min"
        onClick={() => setItens((a) => [...a, { titulo: "", responsavelId: "", prazo: "" }])}
        style={{ alignSelf: "flex-start" }}
      >
        + item
      </button>

      {publicar.result.serverError && <p className="min c-vermelho">{publicar.result.serverError}</p>}
      <button type="submit" className="bt bt--azul" disabled={publicar.isPending} style={{ alignSelf: "flex-start" }}>
        {publicar.isPending ? "Publicando…" : "Publicar ata"}
      </button>
    </form>
  );
}
