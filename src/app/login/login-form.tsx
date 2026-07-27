"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TransicaoEntrada } from "@/components/auth/transicao-entrada";

// Instante em que a navegação dispara. Casado com a coreografia em globals.css
// (.auth-transicao), cuja última animação fecha aos 950ms.
const DURACAO_TRANSICAO_MS = 950;

export function LoginForm() {
  const searchParams = useSearchParams();
  const proximo = searchParams.get("proximo") ?? "/";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

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

    // Navegação do próprio navegador, não router.push. Motivo: `proximo` é rota
    // protegida, e o Router Cache do Next pode ter dela uma resposta obtida enquanto
    // ninguém estava logado — que é um 307 para /login. O push consumia esse redirecionamento
    // e a tela ficava parada na logo. Uma navegação de documento ignora esse cache,
    // refaz a requisição já com o cookie de sessão e ainda garante que todo o estado
    // do cliente nasça limpo depois da troca de usuário.
    //
    // (Pelo mesmo motivo não há router.prefetch aqui: pré-buscar rota protegida antes
    // do login só serve para gravar esse redirecionamento no cache.)
    timer.current = setTimeout(() => {
      window.location.assign(proximo);
    }, DURACAO_TRANSICAO_MS);
  }

  if (entrando) {
    return <TransicaoEntrada />;
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
