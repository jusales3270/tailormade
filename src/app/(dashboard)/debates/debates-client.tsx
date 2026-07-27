"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Hash, Paperclip, ArrowUp, Bookmark, Pencil, Plus, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { createClient } from "@/lib/supabase/client";
import { iniciais } from "@/lib/iniciais";
import { Avatar } from "@/components/avatar";
import { publicarMensagem } from "@/lib/safe-actions/mensagem-publicar";
import { editarMensagem } from "@/lib/safe-actions/mensagem-editar";
import { excluirMensagem } from "@/lib/safe-actions/mensagem-excluir";
import { guardarNoLivro } from "@/lib/safe-actions/mensagem-guardar-no-livro";
import { criarCanal } from "@/lib/safe-actions/canal-criar";
import { editarCanal } from "@/lib/safe-actions/canal-editar";
import { excluirCanal } from "@/lib/safe-actions/canal-excluir";
import type { CanalUI, MembroAvatarUI, MensagemUI } from "./tipos";

const JANELA_EDICAO_MS = 15 * 60 * 1000;

function NovoCanalForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");

  const criar = useAction(criarCanal, {
    onSuccess: () => {
      router.refresh();
      setNome("");
      setAberto(false);
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    criar.execute({ orgId, nome: nome.trim() });
  }

  if (!aberto) {
    return (
      <button type="button" className="item" onClick={() => setAberto(true)}>
        <span className="item__ic c-cinza">
          <Plus size={14} strokeWidth={2.4} />
        </span>
        <span className="item__r">Novo canal</span>
      </button>
    );
  }

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 10px" }}>
      <input
        autoFocus
        placeholder="nome do canal"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={{ background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
      />
      {criar.result.serverError && <span className="min c-vermelho">{criar.result.serverError}</span>}
      <div style={{ display: "flex", gap: 6 }}>
        <button type="submit" className="bt bt--azul bt--min" disabled={criar.isPending}>
          Criar
        </button>
        <button type="button" className="bt bt--claro bt--min" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function CabecalhoCanal({ canal, souCriador }: { canal: CanalUI; souCriador: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(canal.nome);
  const [descricao, setDescricao] = useState(canal.descricao ?? "");

  const editar = useAction(editarCanal, { onSuccess: () => { router.refresh(); setEditando(false); } });
  const excluir = useAction(excluirCanal, { onSuccess: () => router.refresh() });

  function salvar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    editar.execute({ canalId: canal.id, nome: nome.trim(), descricao: descricao.trim() || undefined });
  }

  function excluirCanalClick() {
    if (!confirm(`Excluir o canal "${canal.nome}"? Só é possível se ele estiver vazio.`)) return;
    excluir.execute({ canalId: canal.id });
  }

  if (editando) {
    return (
      <form onSubmit={salvar} style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
        <input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13.5 }}
        />
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="descrição"
          style={{ flex: 1, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
        />
        <button type="submit" className="bt bt--azul bt--min" disabled={editar.isPending}>
          Salvar
        </button>
        <button type="button" className="bt bt--claro bt--min" onClick={() => setEditando(false)}>
          Cancelar
        </button>
        {editar.result.serverError && <span className="min c-vermelho">{editar.result.serverError}</span>}
      </form>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div>
        <h2>{canal.nome}</h2>
        <em>{canal.descricao}</em>
      </div>
      {souCriador && (
        <div style={{ display: "flex", gap: 4 }}>
          <button className="glifo glifo--min" title="Editar canal" onClick={() => setEditando(true)}>
            <Pencil size={13} strokeWidth={2.2} />
          </button>
          <button className="glifo glifo--min" title="Excluir canal" onClick={excluirCanalClick} disabled={excluir.isPending}>
            <Trash2 size={13} strokeWidth={2.2} />
          </button>
        </div>
      )}
      {excluir.result.serverError && <span className="min c-vermelho">{excluir.result.serverError}</span>}
    </div>
  );
}

export function DebatesClient({
  canais,
  membros,
  meuMembroId,
  orgId,
  souAdmin,
}: {
  canais: CanalUI[];
  membros: MembroAvatarUI[];
  meuMembroId: string | null;
  orgId: string | null;
  souAdmin: boolean;
}) {
  const [canalSelecionadoId, setCanalSelecionadoId] = useState<string | null>(null);
  const canalAtivo = canais.find((c) => c.id === canalSelecionadoId) ?? canais[0] ?? null;
  const [mensagens, setMensagens] = useState<MensagemUI[]>([]);
  const [rascunho, setRascunho] = useState("");
  const [editando, setEditando] = useState<{ id: string; texto: string } | null>(null);
  const [guardadas, setGuardadas] = useState<Set<string>>(new Set());
  const fimChat = useRef<HTMLDivElement>(null);

  const nomePorMembroId = useMemo(() => new Map(membros.map((m) => [m.id, m.nome])), [membros]);
  const avatarPorMembroId = useMemo(() => new Map(membros.map((m) => [m.id, m.avatarUrl])), [membros]);

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
  const excluirMsg = useAction(excluirMensagem, {
    onSuccess: ({ input }) => setMensagens((atual) => atual.filter((m) => m.id !== input.mensagemId)),
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

  // Congelado na montagem (lazy initializer) em vez de Date.now() no corpo do render:
  // ler o relógio durante o render é impuro e faz o botão aparecer/sumir de forma
  // imprevisível a cada re-render. Se a janela vencer com a aba aberta, o botão fica
  // visível mas SA-02 recusa no servidor com a mensagem dos 15 minutos.
  const [montadoEm] = useState(() => Date.now());

  function podeEditar(m: MensagemUI) {
    if (m.autorId !== meuMembroId) return false;
    return montadoEm - new Date(m.criadoEm).getTime() < JANELA_EDICAO_MS;
  }

  function salvarEdicao(e: FormEvent) {
    e.preventDefault();
    if (!editando || !editando.texto.trim()) return;
    editar.execute({ mensagemId: editando.id, novoCorpo: editando.texto.trim() });
  }

  if (!canalAtivo) {
    return (
      <div className="conv">
        <div className="conv__lista">
          <div className="lat__gt">Canais</div>
          <p className="lista__vazio">Nenhum canal ainda.</p>
          {souAdmin && orgId && <NovoCanalForm orgId={orgId} />}
        </div>
      </div>
    );
  }

  return (
    <div className="conv">
      <div className="conv__lista">
        <div className="lat__gt">Canais</div>
        {canais.map((c) => (
          <button
            key={c.id}
            className={`item ${canalAtivo.id === c.id ? "item--on" : ""}`}
            onClick={() => setCanalSelecionadoId(c.id)}
          >
            <span className="item__ic c-cinza">
              <Hash size={13} strokeWidth={2.4} />
            </span>
            <span className="item__r">{c.nome}</span>
          </button>
        ))}
        {souAdmin && orgId && <NovoCanalForm orgId={orgId} />}
        <p className="conv__nota">Um canal por assunto. Se não cabe em nenhum, ainda não é assunto.</p>
      </div>

      <div className="conv__chat">
        <div className="conv__cab">
          <CabecalhoCanal key={canalAtivo.id} canal={canalAtivo} souCriador={canalAtivo.criadoPor === meuMembroId} />
          <div className="pilha">
            {membros.map((m) => (
              <Avatar key={m.id} nome={m.nome} avatarUrl={m.avatarUrl} />
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
                {!meu && <Avatar nome={m.autorNome} avatarUrl={avatarPorMembroId.get(m.autorId) ?? null} />}
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
                      {meu && (
                        <button
                          onClick={() => confirm("Excluir esta mensagem?") && excluirMsg.execute({ mensagemId: m.id })}
                          disabled={excluirMsg.isPending}
                        >
                          <Trash2 size={12} strokeWidth={2.3} /> Excluir
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
