"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { concluirFaseItem } from "@/lib/safe-actions/fase-item-concluir";
import { reabrirFaseItem } from "@/lib/safe-actions/fase-item-reabrir";
import { excluirFaseItem } from "@/lib/safe-actions/fase-item-excluir";
import type { FaseItemUI } from "./tipos";

export function ItemLinha({ item, podeGerir }: { item: FaseItemUI; podeGerir: boolean }) {
  const router = useRouter();
  const [motivoAberto, setMotivoAberto] = useState(false);
  const [motivo, setMotivo] = useState("");

  const concluir = useAction(concluirFaseItem, { onSuccess: () => router.refresh() });
  const excluir = useAction(excluirFaseItem, { onSuccess: () => router.refresh() });
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

  function excluirClick() {
    if (!confirm(`Remover o item "${item.titulo}" da trilha?`)) return;
    excluir.execute({ faseItemId: item.id });
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
        {excluir.result.serverError && <span className="min c-vermelho">{excluir.result.serverError}</span>}
        {podeGerir && (
          <button
            className="glifo glifo--min"
            title="Remover item"
            onClick={excluirClick}
            disabled={excluir.isPending}
          >
            <Trash2 size={13} strokeWidth={2.2} />
          </button>
        )}
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
