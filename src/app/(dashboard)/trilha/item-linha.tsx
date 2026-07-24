"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { CheckCircle2, Circle } from "lucide-react";
import { concluirFaseItem } from "@/lib/safe-actions/fase-item-concluir";
import { reabrirFaseItem } from "@/lib/safe-actions/fase-item-reabrir";
import type { FaseItemUI } from "./tipos";

export function ItemLinha({ item }: { item: FaseItemUI }) {
  const router = useRouter();
  const [motivoAberto, setMotivoAberto] = useState(false);
  const [motivo, setMotivo] = useState("");

  const concluir = useAction(concluirFaseItem, { onSuccess: () => router.refresh() });
  const reabrir = useAction(reabrirFaseItem, {
    onSuccess: () => {
      router.refresh();
      setMotivoAberto(false);
      setMotivo("");
    },
  });

  function enviarReabertura(e: FormEvent) {
    e.preventDefault();
    if (!motivo.trim()) return;
    reabrir.execute({ faseItemId: item.id, justificativa: motivo.trim() });
  }

  if (!item.concluido) {
    return (
      <li className="linha">
        <button
          className="marca"
          onClick={() => concluir.execute({ faseItemId: item.id })}
          disabled={concluir.isPending}
          aria-label={`Marcar "${item.titulo}" como concluído`}
        >
          <Circle size={19} strokeWidth={1.8} />
        </button>
        <span className="linha__t">{item.titulo}</span>
        {concluir.result.serverError && <span className="min c-vermelho">{concluir.result.serverError}</span>}
      </li>
    );
  }

  return (
    <li className="linha" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <button
          className="marca marca--on"
          onClick={() => setMotivoAberto((v) => !v)}
          aria-label={`Reabrir "${item.titulo}"`}
        >
          <CheckCircle2 size={19} strokeWidth={2} />
        </button>
        <span className="linha__t linha__t--feito">{item.titulo}</span>
      </div>
      {motivoAberto && (
        <form
          onSubmit={enviarReabertura}
          style={{ display: "flex", gap: 8, marginLeft: 30, marginTop: 6 }}
        >
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Por que reabrir este item?"
            required
            style={{ flex: 1, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
          />
          <button type="submit" className="bt bt--claro bt--min" disabled={reabrir.isPending}>
            Reabrir
          </button>
        </form>
      )}
      {reabrir.result.serverError && <span className="min c-vermelho">{reabrir.result.serverError}</span>}
    </li>
  );
}
