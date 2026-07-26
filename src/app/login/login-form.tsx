"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const DURACAO_TRANSICAO_MS = 1500;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proximo = searchParams.get("proximo") ?? "/";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    router.prefetch(proximo);
  }, [router, proximo]);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setCarregando(false);
      setErro(error.message);
      return;
    }

    setEntrando(true);
    setTimeout(() => {
      router.push(proximo);
      router.refresh();
    }, DURACAO_TRANSICAO_MS);
  }

  if (entrando) {
    return (
      <div className="auth-transicao">
        <Image
          src="/logo.png"
          alt="Tailor Made"
          width={130}
          height={72}
          priority
          className="auth-transicao__logo"
        />
      </div>
    );
  }

  return (
    <form onSubmit={entrar} className="auth-form">
      <label className="campo-form campo-form--auth">
        E-mail
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="voce@empresa.com"
        />
      </label>
      <label className="campo-form campo-form--auth">
        Senha
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </label>
      {erro && <p className="auth-erro">{erro}</p>}
      <button type="submit" className="bt bt--azul auth-bt" disabled={carregando}>
        {carregando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
