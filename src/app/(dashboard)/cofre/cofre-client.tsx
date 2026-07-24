"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileText } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { enviarDocumentoVersao } from "@/lib/safe-actions/documento-versao-enviar";
import type { DocumentoUI, StatusDocumento } from "./tipos";

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

export function CofreClient({ documentos }: { documentos: DocumentoUI[] }) {
  const [filtro, setFiltro] = useState("Todos");
  const grupos = ["Todos", ...Array.from(new Set(documentos.map((d) => d.grupo)))];
  const lista = filtro === "Todos" ? documentos : documentos.filter((d) => d.grupo === filtro);

  return (
    <>
      <div className="seg">
        {grupos.map((g) => (
          <button key={g} className={filtro === g ? "on" : ""} onClick={() => setFiltro(g)}>
            {g}
          </button>
        ))}
      </div>
      <section className="cart cart--lista">
        <ul className="lista">
          {lista.map((doc) => (
            <LinhaDocumento key={doc.id} doc={doc} />
          ))}
        </ul>
      </section>
    </>
  );
}
