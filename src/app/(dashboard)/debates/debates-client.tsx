"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Hash, Paperclip, ArrowUp, Bookmark, Pencil } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { createClient } from "@/lib/supabase/client";
import { iniciais } from "@/lib/iniciais";
import { publicarMensagem } from "@/lib/safe-actions/mensagem-publicar";
import { editarMensagem } from "@/lib/safe-actions/mensagem-editar";
import { guardarNoLivro } from "@/lib/safe-actions/mensagem-guardar-no-livro";
import type { CanalUI, MembroAvatarUI, MensagemUI } from "./tipos";

const JANELA_EDICAO_MS = 15 * 60 * 1000;

export function DebatesClient({
  canais,
  membros,
  meuMembroId,
}: {
  canais: CanalUI[];
  membros: MembroAvatarUI[];
  meuMembroId: string | null;
}) {
  const [canalAtivo, setCanalAtivo] = useState<CanalUI | null>(canais[0] ?? null);
  const [mensagens, setMensagens] = useState<MensagemUI[]>([]);
  const [rascunho, setRascunho] = useState("");
  const [editando, setEditando] = useState<{ id: string; texto: string } | null>(null);
  const [guardadas, setGuardadas] = useState<Set<string>>(new Set());
  const fimChat = useRef<HTMLDivElement>(null);

  const nomePorMembroId = useMemo(() => new Map(membros.map((m) => [m.id, m.nome])), [membros]);

  const enviar = useAction(publicarMensagem, { onSuccess: () => setRascunho("") });
  const editar = useAction(editarMensagem, {
    onSuccess: ({ data }) => {
      if (!data) return;
      setMensagens((atual) => atual.map((m) => (m.id === data.id ? { ...m, corpo: data.corpo, editadoEm: new Date().toISOString() } : m)));
      setEditando(null);
    },
  });
  const guardar = useAction(guardarNoLivro, {
    onSuccess: ({ input }) => setGuardadas((atual) => new Set(atual).add(input.mensagemId)),
  });

  useEffect(() => {
    if (!canalAtivo) return;
    const supabase = createClient();
    let cancelado = false;

    async function carregar() {
      const { data } = await supabase
        .from("mensagens")
        .select("id, corpo, criado_em, editado_em, autor_id")
        .eq("canal_id", canalAtivo!.id)
        .order("criado_em");
      if (!cancelado && data) {
        setMensagens(
          data.map((m) => ({
            id: m.id,
            corpo: m.corpo,
            criadoEm: m.criado_em,
            editadoEm: m.editado_em,
            autorId: m.autor_id,
            autorNome: nomePorMembroId.get(m.autor_id) ?? "?",
          })),
        );
      }
    }
    carregar();

    const canalRealtime = supabase
      .channel(`mensagens:${canalAtivo.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens", filter: `canal_id=eq.${canalAtivo.id}` },
        (payload) => {
          const nova = payload.new as {
            id: string;
            corpo: string;
            criado_em: string;
            editado_em: string | null;
            autor_id: string;
          };
          setMensagens((atual) => {
            if (atual.some((m) => m.id === nova.id)) return atual;
            return [
              ...atual,
              {
                id: nova.id,
                corpo: nova.corpo,
                criadoEm: nova.criado_em,
                editadoEm: nova.editado_em,
                autorId: nova.autor_id,
                autorNome: nomePorMembroId.get(nova.autor_id) ?? "?",
              },
            ];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "mensagens", filter: `canal_id=eq.${canalAtivo.id}` },
        (payload) => {
          const atualizada = payload.new as { id: string; corpo: string; editado_em: string | null };
          setMensagens((atual) =>
            atual.map((m) =>
              m.id === atualizada.id ? { ...m, corpo: atualizada.corpo, editadoEm: atualizada.editado_em } : m,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      cancelado = true;
      supabase.removeChannel(canalRealtime);
    };
  }, [canalAtivo, nomePorMembroId]);

  useEffect(() => {
    fimChat.current?.scrollIntoView({ block: "end" });
  }, [mensagens]);

  function enviarMensagem() {
    if (!canalAtivo || !rascunho.trim()) return;
    enviar.execute({ canalId: canalAtivo.id, corpo: rascunho.trim() });
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") enviarMensagem();
  }

  function podeEditar(m: MensagemUI) {
    if (m.autorId !== meuMembroId) return false;
    return Date.now() - new Date(m.criadoEm).getTime() < JANELA_EDICAO_MS;
  }

  function salvarEdicao(e: FormEvent) {
    e.preventDefault();
    if (!editando || !editando.texto.trim()) return;
    editar.execute({ mensagemId: editando.id, novoCorpo: editando.texto.trim() });
  }

  if (!canalAtivo) {
    return <p className="cart">Nenhum canal disponível.</p>;
  }

  return (
    <div className="conv">
      <div className="conv__lista">
        <div className="lat__gt">Canais</div>
        {canais.map((c) => (
          <button
            key={c.id}
            className={`item ${canalAtivo.id === c.id ? "item--on" : ""}`}
            onClick={() => setCanalAtivo(c)}
          >
            <span className="item__ic c-cinza">
              <Hash size={13} strokeWidth={2.4} />
            </span>
            <span className="item__r">{c.nome}</span>
          </button>
        ))}
        <p className="conv__nota">Um canal por assunto. Se não cabe em nenhum, ainda não é assunto.</p>
      </div>

      <div className="conv__chat">
        <div className="conv__cab">
          <div>
            <h2>{canalAtivo.nome}</h2>
            <em>{canalAtivo.descricao}</em>
          </div>
          <div className="pilha">
            {membros.map((m) => (
              <span key={m.id} className="ava" title={m.nome}>
                {iniciais(m.nome)}
              </span>
            ))}
          </div>
        </div>

        <div className="conv__fluxo">
          {mensagens.map((m) => {
            const meu = m.autorId === meuMembroId;
            const hora = new Date(m.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            const emEdicao = editando?.id === m.id;

            return (
              <div key={m.id} className={`bloco ${meu ? "bloco--meu" : ""}`}>
                {!meu && <span className="ava">{iniciais(m.autorNome)}</span>}
                <div className="bloco__c">
                  {!meu && (
                    <div className="bloco__n">
                      {m.autorNome} <em>{hora}</em>
                    </div>
                  )}

                  {emEdicao ? (
                    <form onSubmit={salvarEdicao} style={{ display: "flex", gap: 8 }}>
                      <input
                        autoFocus
                        value={editando.texto}
                        onChange={(e) => setEditando({ id: m.id, texto: e.target.value })}
                        style={{ flex: 1, background: "var(--fill)", borderRadius: 14, padding: "8px 12px", fontSize: 13.5 }}
                      />
                      <button type="submit" className="bt bt--azul bt--min" disabled={editar.isPending}>
                        Salvar
                      </button>
                      <button type="button" className="bt bt--claro bt--min" onClick={() => setEditando(null)}>
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <div className={`balao ${meu ? "balao--meu" : ""}`}>
                      {m.corpo}
                      {m.editadoEm && (
                        <span style={{ opacity: 0.7, fontSize: 11, marginLeft: 6 }}>(editado)</span>
                      )}
                    </div>
                  )}

                  {!emEdicao && (
                    <div className="bloco__a">
                      <button
                        onClick={() => guardar.execute({ mensagemId: m.id })}
                        disabled={guardar.isPending || guardadas.has(m.id)}
                      >
                        <Bookmark size={12} strokeWidth={2.3} /> {guardadas.has(m.id) ? "Guardado" : "Guardar"}
                      </button>
                      {podeEditar(m) && (
                        <button onClick={() => setEditando({ id: m.id, texto: m.corpo })}>
                          <Pencil size={12} strokeWidth={2.3} /> Editar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={fimChat} />
        </div>

        <div className="compo">
          <button className="glifo" disabled title="Anexos chegam com T-011 (documentos)">
            <Paperclip size={17} strokeWidth={2} />
          </button>
          <input
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            onKeyDown={aoTeclar}
            placeholder={`Mensagem em ${canalAtivo.nome}`}
          />
          <button className="enviar" onClick={enviarMensagem} disabled={enviar.isPending} aria-label="Enviar">
            <ArrowUp size={16} strokeWidth={3} />
          </button>
        </div>
        {enviar.result.serverError && <p className="min c-vermelho">{enviar.result.serverError}</p>}
      </div>
    </div>
  );
}
