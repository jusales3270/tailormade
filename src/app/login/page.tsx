import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthShell>
      <h1 className="auth-card__titulo">Entrar</h1>
      <p className="auth-card__sub">Acesse o painel de fundação da sua organização.</p>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
