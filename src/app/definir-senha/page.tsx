import Image from "next/image";
import { DefinirSenhaForm } from "./definir-senha-form";

export default function DefinirSenhaPage() {
  return (
    <main style={{ maxWidth: 360, margin: "80px auto", fontFamily: "sans-serif" }}>
      <Image src="/logo.png" alt="Tailor Made" width={160} height={88} priority style={{ marginBottom: 24 }} />
      <h1>Defina sua senha</h1>
      <p>Você chegou aqui por um convite ou link de recuperação. Escolha uma senha para acessar.</p>
      <DefinirSenhaForm />
    </main>
  );
}
