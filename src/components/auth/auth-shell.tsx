import Image from "next/image";

// Posições/cores/atrasos fixos (não Math.random): mantém o SSR determinístico, sem
// mismatch de hidratação entre o HTML do servidor e o primeiro render no cliente.
const FEIXES = [
  { x: 12, atraso: 0, duracao: 7.5, cor: "var(--azul)" },
  { x: 34, atraso: 1.8, duracao: 6.5, cor: "var(--roxo)" },
  { x: 58, atraso: 3.6, duracao: 8, cor: "var(--indigo)" },
  { x: 82, atraso: 2.4, duracao: 7, cor: "var(--verde)" },
] as const;

function Face({ tipo }: { tipo: "cima" | "baixo" | "esquerda" | "direita" }) {
  return (
    <div className={`warp__face warp__face--${tipo}`}>
      {FEIXES.map((f, i) => (
        <span
          key={i}
          className="warp__feixe"
          style={
            {
              left: `${f.x}%`,
              background: `linear-gradient(${f.cor}, transparent)`,
              animationDelay: `${f.atraso}s`,
              animationDuration: `${f.duracao}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="tela-auth">
      <div className="warp" aria-hidden>
        <div className="warp__cena">
          <Face tipo="cima" />
          <Face tipo="baixo" />
          <Face tipo="esquerda" />
          <Face tipo="direita" />
        </div>
      </div>
      <div className="tela-auth__vinheta" aria-hidden />

      <div className="auth-card">
        <div className="auth-card__marca">
          <Image src="/logo.png" alt="Tailor Made" width={140} height={77} priority className="auth-card__logo" />
        </div>
        {children}
      </div>
    </div>
  );
}
