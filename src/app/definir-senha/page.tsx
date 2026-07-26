import { AuthShell } from "@/components/auth/auth-shell";
import { DefinirSenhaForm } from "./definir-senha-form";

export default function DefinirSenhaPage() {
  return (
    <AuthShell>
      <h1 className="auth-card__titulo">Defina sua senha</h1>
      <p className="auth-card__sub">
        Você chegou aqui por um convite ou link de recuperação. Escolha uma senha para acessar.
      </p>
      <DefinirSenhaForm />
    </AuthShell>
  );
}
