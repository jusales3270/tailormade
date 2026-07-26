"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileText, Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { enviarDocumentoVersao } from "@/lib/safe-actions/documento-versao-enviar";
import { criarDocumento } from "@/lib/safe-actions/documento-criar";
import type { DocumentoUI, StatusDocumento } from "./tipos";

function NovoDocumentoForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [grupo, setGrupo] = useState("");
  const [critico, setCritico] = useState(false);

  const criar = useAction(criarDocumento, {
    onSuccess: () => {
      router.refresh();
      setNome("");
      setGrupo("");
      setCritico(false);
      setAberto(false);
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !grupo.trim()) return;
    criar.execute({ orgId, nome: nome.trim(), grupo: grupo.trim(), critico });
  }

  if (!aberto) {
    return (
      <button type="button" className="bt bt--azul bt--min" style={{ alignSelf: "flex-start" }} onClick={() => setAberto(true)}>
        <Plus size={13} strokeWidth={2.4} /> Novo documento
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="cart" style={{ gap: 10 }}>
      <strong className="min">Novo documento</strong>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Nome do documento"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          style={{ flex: 2, minWidth: 200, background: "var(--fill)", borderRadius: 8, padding: "8px 12px", fontSize: 13.5 }}
        />
        <input
          placeholder="Grupo (ex: Societário)"
          value={grupo}
          onChange={(e) => setGrupo(e.target.value)}
          required
          style={{ flex: 1, minWidth: 160, background: "var(--fill)", borderRadius: 8, padding: "8px 12px", fontSize: 13.5 }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={critico} onChange={(e) => setCritico(e.target.checked)} />
          crítico
        </label>
      </div>
      {criar.result.serverError && <p className="min c-vermelho">{criar.result.serverError}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="bt bt--azul" disabled={criar.isPending}>
          {criar.isPending ? "Criando…" : "Criar"}
        </button>
        <button type="button" className="bt bt--claro" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

const STATUS_DOC: Record<StatusDocumento, { rot: string; cor: string }> = {
  assinado: { rot: "Assinado", cor: "verde" },
  revisao: { rot: "Em revisão", cor: "azul" },
  rascunho: { rot: "Rascunho", cor: "cinza" },
  aguarda_assinatura: { rot: "Aguarda assinatura", cor: "laranja" },
  ausente: { rot: "Não existe", cor: "vermelho" },
  vencido: { rot: "Vencido", cor: "vermelho" },
};

function LinhaDocumento({ doc }: { doc: DocumentoUI }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const enviar = useAction(enviarDocumentoVersao, { onSuccess: () => router.refresh() });
  const st = STATUS_DOC[doc.status];

  function aoSelecionarArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    enviar.execute({ documentoId: doc.id, arquivo });
    e.target.value = "";
  }

  return (
    <li className="linha">
      <span className={`item__ic c-${doc.critico ? "vermelho" : "azul"}`}>
        {doc.status === "ausente" ? (
          <AlertTriangle size={14} strokeWidth={2.2} />
        ) : (
          <FileText size={14} strokeWidth={2.2} />
        )}
      </span>
      <span className="linha__t">
        {doc.nome}
        <em>
          {doc.codigo} · {doc.ultimaVersao ? `v${doc.ultimaVersao}` : "sem versão"} · {doc.grupo} ·{" "}
          {doc.responsavelNome ?? "sem responsável"}
        </em>
        {doc.ultimoHash && (
          <em title={doc.ultimoHash} style={{ fontFamily: "monospace" }}>
            hash {doc.ultimoHash.slice(0, 12)}…
          </em>
        )}
        {enviar.result.serverError && <em className="c-vermelho">{enviar.result.serverError}</em>}
      </span>
      <span className={`selo selo--${st.cor}`}>{st.rot}</span>
      <input ref={inputRef} type="file" hidden onChange={aoSelecionarArquivo} />
      <button
        className="bt bt--claro bt--min"
        onClick={() => inputRef.current?.click()}
        disabled={enviar.isPending}
      >
        {enviar.isPending ? "Enviando…" : doc.ultimaVersao ? "Reenviar" : "Enviar"}
      </button>
    </li>
  );
}

export function CofreClient({
  documentos,
  orgId,
  podeGerir,
}: {
  documentos: DocumentoUI[];
  orgId: string | null;
  podeGerir: boolean;
}) {
  const [filtro, setFiltro] = useState("Todos");
  const grupos = ["Todos", ...Array.from(new Set(documentos.map((d) => d.grupo)))];
  const lista = filtro === "Todos" ? documentos : documentos.filter((d) => d.grupo === filtro);

  return (
    <>
      {podeGerir && orgId && <NovoDocumentoForm orgId={orgId} />}
      <div className="seg">
        {grupos.map((g) => (
          <button key={g} className={filtro === g ? "on" : ""} onClick={() => setFiltro(g)}>
            {g}
          </button>
        ))}
      </div>
      <section className="cart cart--lista">
        <ul className="lista">
          {lista.length === 0 && <li className="lista__vazio">Nenhum documento cadastrado ainda.</li>}
          {lista.map((doc) => (
            <LinhaDocumento key={doc.id} doc={doc} />
          ))}
        </ul>
      </section>
    </>
  );
}
