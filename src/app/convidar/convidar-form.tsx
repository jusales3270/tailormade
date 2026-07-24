"use client";

import { useState, type FormEvent } from "react";
import { convidarMembro } from "@/lib/actions/convidar-membro";

const PAPEIS = ["admin", "socio", "tecnico", "convidado"] as const;

export function ConvidarForm({ orgId }: { orgId: string }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<(typeof PAPEIS)[number]>("convidado");
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setMensagem(null);
    setCarregando(true);

    const resultado = await convidarMembro({ orgId, nome, email, papel });

    setCarregando(false);
    if (!resultado.ok) {
      setMensagem({ tipo: "erro", texto: resultado.erro });
      return;
    }
    setMensagem({ tipo: "ok", texto: `Convite enviado para ${email}.` });
    setNome("");
    setEmail("");
    setPapel("convidado");
  }

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 360 }}>
      <label>
        Nome
        <input value={nome} onChange={(e) => setNome(e.target.value)} required />
      </label>
      <label>
        E-mail
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Papel
        <select value={papel} onChange={(e) => setPapel(e.target.value as (typeof PAPEIS)[number])}>
          {PAPEIS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      {mensagem && (
        <p style={{ color: mensagem.tipo === "erro" ? "crimson" : "seagreen" }}>{mensagem.texto}</p>
      )}
      <button type="submit" disabled={carregando}>
        {carregando ? "Enviando…" : "Convidar"}
      </button>
    </form>
  );
}
