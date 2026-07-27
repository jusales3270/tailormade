import Image from "next/image";

// Feixes que caem e "estouram" ao bater no chão da tela, nas cores da marca
// (violeta #4a1af0 e ciano #00c8e2, amostrados da própria logo.png).
//
// Posições/atrasos fixos, nunca Math.random(): esta tela é renderizada no cliente logo
// após o login, e valores aleatórios por render fariam a animação "pular" a cada
// re-render do React.
//
// A colisão aqui é coreografada, não detectada: cada estouro dispara com
// atraso = atraso do feixe + duração da queda. Não precisa de getBoundingClientRect
// num intervalo de 50ms (como faria a versão em JS) porque a distância de queda é
// sempre a altura da tela — dá pra saber o instante do impacto de antemão.
const QUEDA_MS = 700;

const FEIXES = [
  { x: 8, atraso: 0, altura: 56 },
  { x: 22, atraso: 170, altura: 34 },
  { x: 35, atraso: 60, altura: 72 },
  { x: 50, atraso: 250, altura: 44 },
  { x: 64, atraso: 110, altura: 62 },
  { x: 78, atraso: 210, altura: 38 },
  { x: 92, atraso: 40, altura: 50 },
] as const;

// 10 partículas por estouro, em leque para cima (dy sempre negativo).
const PARTICULAS = [
  { dx: -34, dy: -22 },
  { dx: -26, dy: -38 },
  { dx: -15, dy: -28 },
  { dx: -8, dy: -44 },
  { dx: 0, dy: -34 },
  { dx: 8, dy: -46 },
  { dx: 16, dy: -26 },
  { dx: 25, dy: -40 },
  { dx: 33, dy: -20 },
  { dx: 42, dy: -32 },
] as const;

export function TransicaoEntrada() {
  return (
    <div className="auth-transicao">
      <div className="feixes" aria-hidden>
        {FEIXES.map((f) => (
          <span
            key={`feixe-${f.x}`}
            className="feixe"
            style={
              {
                left: `${f.x}%`,
                height: `${f.altura}px`,
                animationDelay: `${f.atraso}ms`,
                animationDuration: `${QUEDA_MS}ms`,
              } as React.CSSProperties
            }
          />
        ))}

        {FEIXES.map((f) => (
          <span
            key={`estouro-${f.x}`}
            className="estouro"
            style={{ left: `${f.x}%` } as React.CSSProperties}
          >
            <span
              className="estouro__brilho"
              style={{ animationDelay: `${f.atraso + QUEDA_MS}ms` } as React.CSSProperties}
            />
            {PARTICULAS.map((p, i) => (
              <span
                key={i}
                className="estouro__p"
                style={
                  {
                    "--dx": `${p.dx}px`,
                    "--dy": `${p.dy}px`,
                    animationDelay: `${f.atraso + QUEDA_MS}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
          </span>
        ))}

        <span className="feixes__chao" />
      </div>

      <Image
        src="/logo.png"
        alt="Tailor Made"
        width={280}
        height={154}
        priority
        className="auth-transicao__logo"
      />
    </div>
  );
}
