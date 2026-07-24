"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { registrarVoto } from "@/lib/safe-actions/voto-registrar";
import { abrirDeliberacao } from "@/lib/safe-actions/deliberacao-abrir";
import type { DeliberacaoUI } from "./tipos";

function CartaoDeliberacao({ deliberacao }: { deliberacao: DeliberacaoUI }) {
  const router = useRouter();
  const votar = useAction(registrarVoto, { onSuccess: () => router.refresh() });
  const aberta = deliberacao.status === "aberta";

  return (
    <section className={`cart delib ${aberta ? "delib--aberta" : ""}`}>
      <div className="delib__cab">
        <em>{deliberacao.codigo}</em>
        <span className={`selo selo--${deliberacao.status === "aprovada" ? "verde" : "laranja"}`}>
          {deliberacao.status}
        </span>
      </div>
      <h3>{deliberacao.titulo}</h3>
      <div className="cap cap--voto">
        <div className="f-verde" style={{ width: `${deliberacao.simPct}%` }} />
        <div className="f-vermelho" style={{ width: `${deliberacao.naoPct}%` }} />
        <span className="marcaq" style={{ left: `${deliberacao.quorumPct}%` }} />
      </div>
      <em className="min">
        {deliberacao.simPct}% a favor · quórum exigido {deliberacao.quorumPct}%
      </em>
      <div className="votos">
        {deliberacao.votos.map((v) => (
          <span key={v.membroId} className={`voto voto--${v.voto ?? "vazio"}`}>
            <i className="ava ava--min">{v.membroNome.slice(0, 2).toUpperCase()}</i>
            {v.voto === "sim" ? "a favor" : v.voto === "nao" ? "contra" : "não votou"}
          </span>
        ))}
      </div>
      {aberta && !deliberacao.meuVoto && (
        <div className="delib__acao">
          <button
            className="bt bt--claro"
            onClick={() => votar.execute({ deliberacaoId: deliberacao.id, voto: "nao" })}
            disabled={votar.isPending}
          >
            Votar contra
          </button>
          <button
            className="bt bt--azul"
            onClick={() => votar.execute({ deliberacaoId: deliberacao.id, voto: "sim" })}
            disabled={votar.isPending}
          >
            <Check size={15} strokeWidth={3} /> Votar a favor
          </button>
        </div>
      )}
      {votar.result.serverError && <p className="min c-vermelho">{votar.result.serverError}</p>}
    </section>
  );
}

function FormularioNovaDeliberacao({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [titulo, setTitulo] = useState("");
  const [quorumPct, setQuorumPct] = useState("75");
  const [encerraEm, setEncerraEm] = useState("");

  const abrir = useAction(abrirDeliberacao, {
    onSuccess: () => {
      router.refresh();
      setAberto(false);
      setCodigo("");
      setTitulo("");
      setEncerraEm("");
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || !titulo.trim() || !encerraEm) return;
    abrir.execute({
      orgId,
      codigo: codigo.trim(),
      titulo: titulo.trim(),
      quorumPct: Number(quorumPct),
      encerraEm: new Date(encerraEm).toISOString(),
    });
  }

  if (!aberto) {
    return (
      <button className="bt bt--claro" onClick={() => setAberto(true)}>
        <Plus size={15} strokeWidth={2.6} /> Nova deliberação
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="cart" style={{ gap: 10 }}>
      <input placeholder="Código (ex.: D-005)" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
      <input placeholder="Título da deliberação" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
      <label className="min">
        Quórum exigido (%)
        <input
          type="number"
          min={1}
          max={100}
          value={quorumPct}
          onChange={(e) => setQuorumPct(e.target.value)}
          required
        />
      </label>
      <label className="min">
        Encerra em
        <input
          type="datetime-local"
          value={encerraEm}
          onChange={(e) => setEncerraEm(e.target.value)}
          required
        />
      </label>
      {abrir.result.serverError && <p className="min c-vermelho">{abrir.result.serverError}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="bt bt--azul" disabled={abrir.isPending}>
          Abrir
        </button>
        <button type="button" className="bt bt--claro" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function DeliberacoesClient({
  deliberacoes,
  orgId,
}: {
  deliberacoes: DeliberacaoUI[];
  orgId: string;
}) {
  return (
    <>
      <FormularioNovaDeliberacao orgId={orgId} />
      <div className="fases">
        {deliberacoes.map((d) => (
          <CartaoDeliberacao key={d.id} deliberacao={d} />
        ))}
      </div>
    </>
  );
}
