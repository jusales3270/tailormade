"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { concluirEncaminhamento } from "@/lib/safe-actions/encaminhamento-concluir";
import { PublicarAtaForm } from "./publicar-ata-form";
import type { MembroOpcaoUI, ReuniaoUI } from "./tipos";

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function EncaminhamentoLinha({ enc }: { enc: ReuniaoUI["encaminhamentos"][number] }) {
  const router = useRouter();
  const concluir = useAction(concluirEncaminhamento, { onSuccess: () => router.refresh() });
  const feito = enc.status === "concluido";

  return (
    <li className="linha">
      <button
        className={`marca ${feito ? "marca--on" : ""}`}
        onClick={() => !feito && concluir.execute({ encaminhamentoId: enc.id })}
        disabled={feito || concluir.isPending}
      >
        {feito ? <CheckCircle2 size={17} strokeWidth={2} /> : <Circle size={17} strokeWidth={1.8} />}
      </button>
      <span className={`linha__t ${feito ? "linha__t--feito" : ""}`}>
        {enc.titulo}
        <em>
          {enc.responsavelNome} · prazo {enc.prazo}
        </em>
      </span>
    </li>
  );
}

function CartaoReuniao({
  reuniao,
  membros,
  podeGerir,
}: {
  reuniao: ReuniaoUI;
  membros: MembroOpcaoUI[];
  podeGerir: boolean;
}) {
  const inicio = new Date(reuniao.inicio);

  return (
    <section className={`cart reu ${reuniao.semPauta ? "reu--alerta" : ""}`}>
      <div className="reu__cab">
        <div className="data">
          <span className="data__m">{MESES[inicio.getUTCMonth()]}</span>
          <span className="data__d">{inicio.getUTCDate()}</span>
        </div>
        <div className="reu__ti">
          <h3>{reuniao.titulo}</h3>
          <em>{reuniao.codigo} · {reuniao.tipo}</em>
        </div>
      </div>

      {reuniao.pauta.length > 0 && (
        <ul className="lista">
          {reuniao.pauta.map((p, i) => (
            <li key={p.id} className="linha">
              <span className="ord">{i + 1}</span>
              <span className="linha__t">{p.item}</span>
            </li>
          ))}
        </ul>
      )}

      {reuniao.semPauta && (
        <div className="aviso">
          <AlertTriangle size={14} strokeWidth={2.3} /> Sem pauta publicada. Publique a pauta ou a reunião não
          gera decisão.
        </div>
      )}

      {reuniao.ata ? (
        <>
          <div className="ata">
            <span className="ata__r">Ata</span>
            <p>{reuniao.ata.corpo}</p>
          </div>
          {reuniao.encaminhamentos.length > 0 && (
            <ul className="lista">
              {reuniao.encaminhamentos.map((enc) => (
                <EncaminhamentoLinha key={enc.id} enc={enc} />
              ))}
            </ul>
          )}
        </>
      ) : (
        podeGerir && <PublicarAtaForm reuniaoId={reuniao.id} membros={membros} />
      )}
    </section>
  );
}

export function ReunioesClient({
  reunioes,
  membros,
  podeGerir,
}: {
  reunioes: ReuniaoUI[];
  membros: MembroOpcaoUI[];
  orgId: string;
  podeGerir: boolean;
}) {
  return (
    <div className="fases">
      {reunioes.map((r) => (
        <CartaoReuniao key={r.id} reuniao={r} membros={membros} podeGerir={podeGerir} />
      ))}
    </div>
  );
}
