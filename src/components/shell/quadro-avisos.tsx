"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Calendar, Wallet, Scale, Check, type LucideIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { marcarAvisoLido } from "@/lib/safe-actions/aviso-marcar-lido";
import type { Aviso, TipoAviso } from "@/lib/avisos";

const ICONE: Record<TipoAviso, { Ico: LucideIcon; cor: string }> = {
  reuniao: { Ico: Calendar, cor: "vermelho" },
  movimento: { Ico: Wallet, cor: "verde" },
  deliberacao: { Ico: Scale, cor: "laranja" },
};

function quando(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function QuadroAvisos({ avisos }: { avisos: Aviso[] }) {
  // Estado local para o clique responder na hora: a marcação vai ao servidor em
  // seguida, mas o usuário não espera round-trip para ver o aviso mudar.
  const [lidosLocais, setLidosLocais] = useState<Record<string, boolean>>({});
  const marcar = useAction(marcarAvisoLido);

  function estaLido(a: Aviso) {
    return lidosLocais[a.chave] ?? a.lido;
  }

  function alternar(a: Aviso) {
    const novo = !estaLido(a);
    setLidosLocais((atual) => ({ ...atual, [a.chave]: novo }));
    marcar.execute({ avisoChave: a.chave, lido: novo });
  }

  const naoLidos = avisos.filter((a) => !estaLido(a)).length;

  return (
    <>
      <div className="insp__cab">
        <span className="insp__t">
          <Bell size={13} strokeWidth={2.2} /> Avisos
          {naoLidos > 0 && <span className="conta">{naoLidos}</span>}
        </span>
      </div>

      {avisos.length === 0 && (
        <p className="insp__resumo">Nada registrado ainda. Reuniões, lançamentos e deliberações aparecem aqui.</p>
      )}

      {avisos.map((a) => {
        const { Ico, cor } = ICONE[a.tipo];
        const lido = estaLido(a);
        return (
          <div key={a.chave} className={`aviso-item ${lido ? "aviso-item--lido" : ""}`}>
            <button
              type="button"
              className={`aviso-item__marca ${lido ? "aviso-item__marca--on" : ""}`}
              onClick={() => alternar(a)}
              title={lido ? "Marcar como não lido" : "Marcar como lido"}
              aria-label={lido ? `Marcar "${a.titulo}" como não lido` : `Marcar "${a.titulo}" como lido`}
            >
              {lido ? <Check size={11} strokeWidth={3} /> : null}
            </button>
            <Link href={a.rota} className="aviso-item__c">
              <span className={`aviso-item__ic c-${cor}`}>
                <Ico size={12} strokeWidth={2.3} />
              </span>
              <span className="aviso-item__txt">
                <strong>{a.titulo}</strong>
                <em>
                  {a.detalhe}
                  {a.quando && ` · ${quando(a.quando)}`}
                </em>
              </span>
            </Link>
          </div>
        );
      })}

      <p className="insp__pe">
        Cada aviso aponta para um registro real do painel. Marcar como lido é pessoal — não muda nada para os
        outros membros.
      </p>
    </>
  );
}
