"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { X, Camera } from "lucide-react";
import { atualizarPerfil } from "@/lib/safe-actions/perfil-atualizar";
import { iniciais } from "@/lib/iniciais";

export function ConfiguracoesModal({
  aberto,
  onFechar,
  nomeAtual,
  avatarUrlAtual,
  email,
}: {
  aberto: boolean;
  onFechar: () => void;
  nomeAtual: string;
  avatarUrlAtual: string | null;
  email: string;
}) {
  const router = useRouter();
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState(nomeAtual);
  const [preview, setPreview] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const salvar = useAction(atualizarPerfil, {
    onSuccess: () => {
      setNovaSenha("");
      setConfirmarSenha("");
      setArquivo(null);
      router.refresh();
      onFechar();
    },
  });

  if (!aberto) return null;

  function aoSelecionarArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arq = e.target.files?.[0];
    if (!arq) return;
    setArquivo(arq);
    setPreview(URL.createObjectURL(arq));
  }

  function salvarPerfil(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (novaSenha || confirmarSenha) {
      if (novaSenha.length < 8) {
        setErro("A nova senha precisa ter pelo menos 8 caracteres.");
        return;
      }
      if (novaSenha !== confirmarSenha) {
        setErro("As senhas não são iguais.");
        return;
      }
    }

    salvar.execute({
      ...(nome.trim() && nome.trim() !== nomeAtual ? { nomeExibicao: nome.trim() } : {}),
      ...(arquivo ? { avatar: arquivo } : {}),
      ...(novaSenha ? { novaSenha } : {}),
    });
  }

  const mostrarAvatar = preview ?? avatarUrlAtual;

  return (
    <div className="modal__fundo" onClick={onFechar}>
      <div className="modal cart" onClick={(e) => e.stopPropagation()}>
        <div className="cart__cab">
          <h2>Configurações</h2>
          <button className="glifo glifo--min" onClick={onFechar} type="button">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={salvarPerfil} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="modal__avatar">
            <button
              type="button"
              className="modal__avatar-bt"
              onClick={() => inputArquivoRef.current?.click()}
              title="Trocar foto"
            >
              {mostrarAvatar ? (
                <img src={mostrarAvatar} alt="" className="modal__avatar-img" />
              ) : (
                <span className="ava ava--eu ava--gr">{iniciais(nome || nomeAtual)}</span>
              )}
              <span className="modal__avatar-sobre">
                <Camera size={15} strokeWidth={2.2} />
              </span>
            </button>
            <input ref={inputArquivoRef} type="file" accept="image/*" hidden onChange={aoSelecionarArquivo} />
            <div>
              <div className="min">{email}</div>
              <button type="button" className="nota" onClick={() => inputArquivoRef.current?.click()}>
                Alterar foto
              </button>
            </div>
          </div>

          <label className="campo-form">
            Nome de exibição
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={120} />
          </label>

          <div className="modal__sep" />

          <label className="campo-form">
            Nova senha
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              autoComplete="new-password"
              placeholder="Deixe em branco para manter a atual"
            />
          </label>
          <label className="campo-form">
            Confirmar nova senha
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <p className="min">
            Nome e foto aparecem só para você — não mudam como os outros membros veem seu registro na
            organização.
          </p>

          {(erro || salvar.result.serverError) && (
            <p className="c-vermelho min">{erro ?? salvar.result.serverError}</p>
          )}

          <div className="modal__acoes">
            <button type="button" className="bt bt--claro" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="bt bt--azul" disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
