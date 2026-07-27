"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Download, Lock, Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { convidarMembro } from "@/lib/safe-actions/membro-convidar";
import { desativarMembro } from "@/lib/safe-actions/membro-desativar";
import { aplicarParticipacao } from "@/lib/safe-actions/participacao-aplicar";
import { iniciais } from "@/lib/iniciais";
import { Avatar } from "@/components/avatar";
import type { DeliberacaoAprovadaUI, MembroUI, PapelMembro } from "./tipos";

const PAPEIS: PapelMembro[] = ["admin", "socio", "tecnico", "convidado"];
const CORES_CAPITAL = ["k0", "k1", "k2", "k3"];

function LinhaMembro({ membro, ehAdmin, souEu }: { membro: MembroUI; ehAdmin: boolean; souEu: boolean }) {
  const router = useRouter();
  const desativar = useAction(desativarMembro, { onSuccess: () => router.refresh() });

  return (
    <li className="linha linha--alta">
      <Avatar nome={membro.nome} avatarUrl={membro.avatarUrl} className="ava--gr" />
      <span className="linha__t">
        {membro.nome}
        <em>
          {membro.papel} · {membro.email}
        </em>
        {desativar.result.serverError && <em className="c-vermelho">{desativar.result.serverError}</em>}
      </span>
      <span className="parte">{membro.participacaoPct > 0 ? `${membro.participacaoPct}%` : "—"}</span>
      {ehAdmin && !souEu && (
        <button
          className="bt bt--claro bt--min"
          onClick={() => desativar.execute({ membroId: membro.id })}
          disabled={desativar.isPending}
        >
          {desativar.isPending ? "Desativando…" : "Desativar"}
        </button>
      )}
    </li>
  );
}

function DivisaoCapital({ membros }: { membros: MembroUI[] }) {
  const comParte = membros.filter((m) => m.participacaoPct > 0);
  const semParte = membros.filter((m) => m.participacaoPct === 0);

  return (
    <section className="cart">
      <div className="cart__cab">
        <h2>Divisão do capital</h2>
      </div>
      <div className="capital">
        {comParte.map((m, i) => (
          <div key={m.id} className={`capital__f ${CORES_CAPITAL[i % CORES_CAPITAL.length]}`} style={{ width: m.participacaoPct + "%" }}>
            {iniciais(m.nome)} {m.participacaoPct}%
          </div>
        ))}
      </div>
      {semParte.length > 0 && (
        <p className="obs">
          {semParte.map((m) => m.nome).join(", ")} ainda {semParte.length === 1 ? "está" : "estão"} fora do
          quadro societário. Só uma deliberação aprovada muda isso (SA-25).
        </p>
      )}
    </section>
  );
}

function ConvidarForm({ orgId, aoFechar }: { orgId: string; aoFechar: () => void }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<PapelMembro>("convidado");

  const convidar = useAction(convidarMembro, {
    onSuccess: () => {
      router.refresh();
      aoFechar();
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;
    convidar.execute({ orgId, nome: nome.trim(), email: email.trim(), papel });
  }

  return (
    <form onSubmit={enviar} className="cart" style={{ gap: 8, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ flex: 1, minWidth: 140, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
        />
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ flex: 1, minWidth: 160, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
        />
        <select
          value={papel}
          onChange={(e) => setPapel(e.target.value as PapelMembro)}
          style={{ background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
        >
          {PAPEIS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      {convidar.result.serverError && <p className="min c-vermelho">{convidar.result.serverError}</p>}
      <button type="submit" className="bt bt--azul bt--min" disabled={convidar.isPending} style={{ alignSelf: "flex-start" }}>
        {convidar.isPending ? "Convidando…" : "Convidar"}
      </button>
    </form>
  );
}

function AplicarParticipacaoForm({
  orgId,
  membros,
  deliberacoesAprovadas,
  aoFechar,
}: {
  orgId: string;
  membros: MembroUI[];
  deliberacoesAprovadas: DeliberacaoAprovadaUI[];
  aoFechar: () => void;
}) {
  const router = useRouter();
  const [deliberacaoId, setDeliberacaoId] = useState(deliberacoesAprovadas[0]?.id ?? "");
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(membros.map((m) => [m.id, m.participacaoPct.toString()])),
  );

  const aplicar = useAction(aplicarParticipacao, {
    onSuccess: () => {
      router.refresh();
      aoFechar();
    },
  });

  const soma = membros.reduce((acc, m) => acc + (parseFloat(valores[m.id]) || 0), 0);

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!deliberacaoId) return;
    aplicar.execute({
      orgId,
      deliberacaoId,
      distribuicao: membros.map((m) => ({
        membroId: m.id,
        participacaoPct: parseFloat(valores[m.id]) || 0,
      })),
    });
  }

  return (
    <form onSubmit={enviar} className="cart" style={{ gap: 8, marginBottom: 12 }}>
      <strong className="min">Aplicar participação de uma deliberação aprovada</strong>
      {deliberacoesAprovadas.length === 0 ? (
        <p className="min">Nenhuma deliberação aprovada aguardando aplicação.</p>
      ) : (
        <>
          <select
            value={deliberacaoId}
            onChange={(e) => setDeliberacaoId(e.target.value)}
            style={{ background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
          >
            {deliberacoesAprovadas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.codigo} · {d.titulo}
              </option>
            ))}
          </select>
          {membros.map((m) => (
            <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="linha__t" style={{ flex: 1 }}>
                {m.nome}
              </span>
              <input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={valores[m.id]}
                onChange={(e) => setValores((v) => ({ ...v, [m.id]: e.target.value }))}
                style={{ width: 80, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
              />
              <span className="min">%</span>
            </div>
          ))}
          <p className={`min ${Math.abs(soma - 100) > 0.01 ? "c-vermelho" : "c-verde"}`}>Soma: {soma.toFixed(2)}%</p>
          {aplicar.result.serverError && <p className="min c-vermelho">{aplicar.result.serverError}</p>}
          <button
            type="submit"
            className="bt bt--azul bt--min"
            disabled={aplicar.isPending}
            style={{ alignSelf: "flex-start" }}
          >
            {aplicar.isPending ? "Aplicando…" : "Aplicar participação"}
          </button>
        </>
      )}
    </form>
  );
}

export function SociosClient({
  orgId,
  membroId,
  ehAdmin,
  membros,
  deliberacoesAprovadas,
}: {
  orgId: string;
  membroId: string;
  ehAdmin: boolean;
  membros: MembroUI[];
  deliberacoesAprovadas: DeliberacaoAprovadaUI[];
}) {
  const [abrirConvidar, setAbrirConvidar] = useState(false);
  const [abrirAplicar, setAbrirAplicar] = useState(false);

  return (
    <>
      <section className="cart cart--lista">
        <div className="cart__cab">
          <h2>Quadro societário</h2>
          {ehAdmin && !abrirConvidar && (
            <button className="bt bt--claro bt--min" onClick={() => setAbrirConvidar(true)}>
              <Plus size={13} strokeWidth={2.6} /> Convidar
            </button>
          )}
        </div>
        {abrirConvidar && <ConvidarForm orgId={orgId} aoFechar={() => setAbrirConvidar(false)} />}
        <ul className="lista">
          {membros.map((m) => (
            <LinhaMembro key={m.id} membro={m} ehAdmin={ehAdmin} souEu={m.id === membroId} />
          ))}
        </ul>
      </section>

      <DivisaoCapital membros={membros} />

      {ehAdmin && (
        <section className="cart">
          <div className="cart__cab">
            <h2>
              <Lock size={13} strokeWidth={2.4} style={{ verticalAlign: -2, marginRight: 6 }} />
              Gate de participação
            </h2>
            {!abrirAplicar && (
              <button className="bt bt--claro bt--min" onClick={() => setAbrirAplicar(true)}>
                Aplicar
              </button>
            )}
          </div>
          {abrirAplicar ? (
            <AplicarParticipacaoForm
              orgId={orgId}
              membros={membros}
              deliberacoesAprovadas={deliberacoesAprovadas}
              aoFechar={() => setAbrirAplicar(false)}
            />
          ) : (
            <p className="obs">
              Não existe tela para editar percentual de sócio diretamente. A única porta é uma
              deliberação aprovada (SA-25).
            </p>
          )}
        </section>
      )}

      {ehAdmin && (
        <section className="cart">
          <div className="cart__cab">
            <h2>Exportações</h2>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href="/api/exportar/auditoria" className="bt bt--claro bt--min">
              <Download size={13} strokeWidth={2.6} /> Auditoria (CSV)
            </a>
            <a href="/api/exportar/dossie" className="bt bt--claro bt--min">
              <Download size={13} strokeWidth={2.6} /> Dossiê da org (PDF)
            </a>
          </div>
        </section>
      )}
    </>
  );
}
