"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Circle, Plus, Pencil, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { concluirEncaminhamento } from "@/lib/safe-actions/encaminhamento-concluir";
import { marcarReuniao } from "@/lib/safe-actions/reuniao-marcar";
import { editarReuniao } from "@/lib/safe-actions/reuniao-editar";
import { excluirReuniao } from "@/lib/safe-actions/reuniao-excluir";
import { adicionarPauta } from "@/lib/safe-actions/pauta-adicionar";
import { editarPauta } from "@/lib/safe-actions/pauta-editar";
import { excluirPauta } from "@/lib/safe-actions/pauta-excluir";
import { PublicarAtaForm } from "./publicar-ata-form";
import type { MembroOpcaoUI, ReuniaoUI } from "./tipos";

function AgendarReuniaoForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("Recorrente");
  const [inicio, setInicio] = useState("");

  const marcar = useAction(marcarReuniao, {
    onSuccess: () => {
      router.refresh();
      setTitulo("");
      setInicio("");
      setAberto(false);
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !inicio) return;
    marcar.execute({ orgId, titulo: titulo.trim(), tipo, inicio: new Date(inicio).toISOString() });
  }

  if (!aberto) {
    return (
      <button type="button" className="bt bt--azul" style={{ alignSelf: "flex-start" }} onClick={() => setAberto(true)}>
        <Plus size={14} strokeWidth={2.4} /> Agendar reunião
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="cart" style={{ gap: 10 }}>
      <strong className="min">Agendar reunião</strong>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          style={{ flex: 2, minWidth: 200, background: "var(--fill)", borderRadius: 8, padding: "8px 12px", fontSize: 13.5 }}
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          style={{ background: "var(--fill)", borderRadius: 8, padding: "8px 12px", fontSize: 13.5 }}
        >
          <option value="Recorrente">Recorrente</option>
          <option value="Extraordinária">Extraordinária</option>
        </select>
        <input
          type="datetime-local"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          required
          style={{ background: "var(--fill)", borderRadius: 8, padding: "8px 12px", fontSize: 13.5 }}
        />
      </div>
      {marcar.result.serverError && <p className="min c-vermelho">{marcar.result.serverError}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="bt bt--azul" disabled={marcar.isPending}>
          {marcar.isPending ? "Agendando…" : "Agendar"}
        </button>
        <button type="button" className="bt bt--claro" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function AdicionarPautaForm({ reuniaoId }: { reuniaoId: string }) {
  const router = useRouter();
  const [item, setItem] = useState("");
  const adicionar = useAction(adicionarPauta, {
    onSuccess: () => {
      router.refresh();
      setItem("");
    },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!item.trim()) return;
    adicionar.execute({ reuniaoId, item: item.trim() });
  }

  return (
    <form onSubmit={enviar} style={{ display: "flex", gap: 8 }}>
      <input
        placeholder="Novo item de pauta"
        value={item}
        onChange={(e) => setItem(e.target.value)}
        style={{ flex: 1, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
      />
      <button type="submit" className="bt bt--claro bt--min" disabled={adicionar.isPending}>
        + pauta
      </button>
      {adicionar.result.serverError && <span className="min c-vermelho">{adicionar.result.serverError}</span>}
    </form>
  );
}

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

function ItemPauta({
  item,
  ordem,
  souAutor,
  travado,
}: {
  item: ReuniaoUI["pauta"][number];
  ordem: number;
  souAutor: boolean;
  travado: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(item.item);

  const editar = useAction(editarPauta, { onSuccess: () => { router.refresh(); setEditando(false); } });
  const excluir = useAction(excluirPauta, { onSuccess: () => router.refresh() });

  function salvar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    editar.execute({ pautaItemId: item.id, item: texto.trim() });
  }

  if (editando) {
    return (
      <li className="linha">
        <span className="ord">{ordem}</span>
        <form onSubmit={salvar} style={{ display: "flex", gap: 6, flex: 1 }}>
          <input
            autoFocus
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            style={{ flex: 1, background: "var(--fill)", borderRadius: 8, padding: "5px 9px", fontSize: 13 }}
          />
          <button type="submit" className="bt bt--azul bt--min" disabled={editar.isPending}>
            Salvar
          </button>
          <button type="button" className="bt bt--claro bt--min" onClick={() => setEditando(false)}>
            Cancelar
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="linha">
      <span className="ord">{ordem}</span>
      <span className="linha__t">{item.item}</span>
      {souAutor && (
        <span style={{ display: "flex", gap: 4 }}>
          <button
            className="glifo glifo--min"
            title={travado ? "Ata já publicada — a pauta não muda mais" : "Editar"}
            onClick={() => setEditando(true)}
            disabled={travado}
          >
            <Pencil size={12} strokeWidth={2.2} />
          </button>
          <button
            className="glifo glifo--min"
            title={travado ? "Ata já publicada — a pauta não muda mais" : "Excluir"}
            onClick={() => confirm("Excluir este item de pauta?") && excluir.execute({ pautaItemId: item.id })}
            disabled={excluir.isPending || travado}
          >
            <Trash2 size={12} strokeWidth={2.2} />
          </button>
        </span>
      )}
    </li>
  );
}

function CartaoReuniao({
  reuniao,
  membros,
  meuMembroId,
  podeGerir,
}: {
  reuniao: ReuniaoUI;
  membros: MembroOpcaoUI[];
  meuMembroId: string;
  podeGerir: boolean;
}) {
  const router = useRouter();
  const inicio = new Date(reuniao.inicio);
  const [editandoReuniao, setEditandoReuniao] = useState(false);
  const [titulo, setTitulo] = useState(reuniao.titulo);
  const [tipo, setTipo] = useState(reuniao.tipo);

  const editar = useAction(editarReuniao, { onSuccess: () => { router.refresh(); setEditandoReuniao(false); } });
  const excluir = useAction(excluirReuniao, { onSuccess: () => router.refresh() });
  const souAutorReuniao = reuniao.criadoPor === meuMembroId;

  function salvarReuniao(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    editar.execute({ reuniaoId: reuniao.id, titulo: titulo.trim(), tipo, inicio: reuniao.inicio });
  }

  function excluirReuniaoClick() {
    if (!confirm(`Excluir a reunião "${reuniao.titulo}"?`)) return;
    excluir.execute({ reuniaoId: reuniao.id });
  }

  return (
    <section className={`cart reu ${reuniao.semPauta ? "reu--alerta" : ""}`}>
      <div className="reu__cab">
        <div className="data">
          <span className="data__m">{MESES[inicio.getUTCMonth()]}</span>
          <span className="data__d">{inicio.getUTCDate()}</span>
        </div>
        {editandoReuniao ? (
          <form onSubmit={salvarReuniao} style={{ display: "flex", gap: 8, flex: 1, alignItems: "center" }}>
            <input
              autoFocus
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              style={{ flex: 1, background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13.5 }}
            />
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={{ background: "var(--fill)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
            >
              <option value="Recorrente">Recorrente</option>
              <option value="Extraordinária">Extraordinária</option>
            </select>
            <button type="submit" className="bt bt--azul bt--min" disabled={editar.isPending}>
              Salvar
            </button>
            <button type="button" className="bt bt--claro bt--min" onClick={() => setEditandoReuniao(false)}>
              Cancelar
            </button>
          </form>
        ) : (
          <div className="reu__ti" style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <div>
              <h3>{reuniao.titulo}</h3>
              <em>{reuniao.codigo} · {reuniao.tipo}</em>
            </div>
            {souAutorReuniao && (
              // Com ata publicada os botões continuam visíveis, só desabilitados: sumir
              // com eles fazia parecer que a funcionalidade não existe, em vez de
              // explicar que a reunião virou registro e não muda mais.
              <span style={{ display: "flex", gap: 4 }}>
                <button
                  className="glifo glifo--min"
                  title={
                    reuniao.ata
                      ? "Ata já publicada — a reunião virou registro e não pode mais ser editada"
                      : "Editar reunião"
                  }
                  onClick={() => setEditandoReuniao(true)}
                  disabled={!!reuniao.ata}
                >
                  <Pencil size={13} strokeWidth={2.2} />
                </button>
                <button
                  className="glifo glifo--min"
                  title={
                    reuniao.ata
                      ? "Ata já publicada — a reunião virou registro e não pode mais ser excluída"
                      : "Excluir reunião"
                  }
                  onClick={excluirReuniaoClick}
                  disabled={excluir.isPending || !!reuniao.ata}
                >
                  <Trash2 size={13} strokeWidth={2.2} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
      {(editar.result.serverError || excluir.result.serverError) && (
        <p className="min c-vermelho">{editar.result.serverError ?? excluir.result.serverError}</p>
      )}

      {reuniao.pauta.length > 0 && (
        <ul className="lista">
          {reuniao.pauta.map((p, i) => (
            <ItemPauta
              key={p.id}
              item={p}
              ordem={i + 1}
              souAutor={p.propostoPor === meuMembroId}
              travado={!!reuniao.ata}
            />
          ))}
        </ul>
      )}

      {reuniao.semPauta && (
        <div className="aviso">
          <AlertTriangle size={14} strokeWidth={2.3} /> Sem pauta publicada. Publique a pauta ou a reunião não
          gera decisão.
        </div>
      )}

      {!reuniao.ata && <AdicionarPautaForm reuniaoId={reuniao.id} />}

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
  orgId,
  meuMembroId,
  podeGerir,
}: {
  reunioes: ReuniaoUI[];
  membros: MembroOpcaoUI[];
  orgId: string;
  meuMembroId: string;
  podeGerir: boolean;
}) {
  return (
    <div className="fases">
      {podeGerir && <AgendarReuniaoForm orgId={orgId} />}
      {reunioes.length === 0 && <p className="cart lista__vazio">Nenhuma reunião marcada ainda.</p>}
      {reunioes.map((r) => (
        <CartaoReuniao key={r.id} reuniao={r} membros={membros} meuMembroId={meuMembroId} podeGerir={podeGerir} />
      ))}
    </div>
  );
}
