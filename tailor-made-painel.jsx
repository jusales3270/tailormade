import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutGrid, Route, MessageCircle, Folder, Wallet, Calendar, Scale, Users,
  Sparkles, Search, ArrowUp, Check, AlertTriangle, Clock, FileText, Plus,
  Sun, Moon, ShieldCheck, Hash, Paperclip, Lock, X, ChevronRight, CheckCircle2,
  Circle, Bell, ListTodo, Download, Bookmark, ArrowRight
} from "lucide-react";

/* ───────────────────────────  DADOS  ─────────────────────────── */

const SOCIOS = [
  { id: "ric", nome: "Ricardo Alencar",   curto: "Ricardo", ini: "RA", papel: "CEO · Comercial",       part: 30, tipo: "socio" },
  { id: "mar", nome: "Marina Duarte",     curto: "Marina",  ini: "MD", papel: "Jurídico · Societário", part: 25, tipo: "socio" },
  { id: "fel", nome: "Felipe Nakamura",   curto: "Felipe",  ini: "FN", papel: "Produto · Operações",   part: 25, tipo: "socio" },
  { id: "ana", nome: "Ana Beatriz Rocha", curto: "Ana",     ini: "AB", papel: "Financeiro",            part: 20, tipo: "socio" },
  { id: "teo", nome: "Téo Vasconcelos",   curto: "Téo",     ini: "TV", papel: "Responsável técnico",   part: 0,  tipo: "tecnico", nota: "Vesting proposto: 8% · cliff de 12 meses" },
];
const EU = "ric";
const socio = (id) => SOCIOS.find((s) => s.id === id) || SOCIOS[0];

const FASES_INI = [
  { id: "F1", nome: "Concepção e alinhamento", resp: "ric", prazo: "concluída", trilho: "legal", itens: [
    { t: "Tese do negócio escrita e aceita pelos quatro", ok: true },
    { t: "Divisão de responsabilidades definida", ok: true },
    { t: "NDA mútuo assinado", ok: true } ] },
  { id: "F2", nome: "Estrutura societária", resp: "mar", prazo: "12 de agosto", trilho: "legal", itens: [
    { t: "Percentuais acordados em ata", ok: true },
    { t: "Cláusula de vesting e cliff", ok: false },
    { t: "Regras de saída (tag along e drag along)", ok: false },
    { t: "Acordo de sócios revisado por advogado externo", ok: false } ] },
  { id: "F3", nome: "Constituição legal", resp: "mar", prazo: "29 de agosto", trilho: "legal", itens: [
    { t: "Consulta de viabilidade na prefeitura", ok: true },
    { t: "Contrato social redigido", ok: true },
    { t: "Registro na Junta Comercial", ok: false },
    { t: "CNPJ e inscrição municipal", ok: false } ] },
  { id: "F4", nome: "Infraestrutura financeira", resp: "ana", prazo: "10 de setembro", trilho: "op", itens: [
    { t: "Escolha do escritório contábil", ok: true },
    { t: "Abertura de conta PJ", ok: false },
    { t: "Chave PIX e emissão de nota fiscal", ok: false },
    { t: "Política de reembolso e alçadas", ok: false } ] },
  { id: "F5", nome: "Propriedade intelectual", resp: "teo", prazo: "24 de setembro", trilho: "op", itens: [
    { t: "Busca de anterioridade da marca", ok: true },
    { t: "Depósito no INPI", ok: false },
    { t: "Registro de domínios e contas", ok: false },
    { t: "Termo de cessão de propriedade do código", ok: false } ] },
  { id: "F6", nome: "Conformidade e LGPD", resp: "mar", prazo: "15 de outubro", trilho: "op", itens: [
    { t: "Mapeamento dos dados pessoais tratados", ok: false },
    { t: "Política de privacidade e termos de uso", ok: false },
    { t: "Encarregado de dados nomeado", ok: false } ] },
  { id: "F7", nome: "Produto — primeira versão", resp: "teo", prazo: "20 de novembro", trilho: "op", itens: [
    { t: "Escopo mínimo congelado", ok: false },
    { t: "Ambiente de produção no ar", ok: false },
    { t: "Três clientes-piloto confirmados", ok: false } ] },
  { id: "F8", nome: "Entrada no mercado", resp: "ric", prazo: "dezembro", trilho: "op", itens: [
    { t: "Tabela de preços aprovada em deliberação", ok: false },
    { t: "Contrato-padrão de prestação de serviço", ok: false } ] },
];

const DOCS = [
  { id: "DOC-01", nome: "Ata de fundação",             v: "v1", status: "assinado", resp: "mar", quando: "há 2 meses",   ass: ["ric","mar","fel","ana"], grupo: "Societário" },
  { id: "DOC-02", nome: "NDA mútuo entre fundadores",  v: "v1", status: "assinado", resp: "mar", quando: "há 2 meses",   ass: ["ric","mar","fel","ana","teo"], grupo: "Societário" },
  { id: "DOC-03", nome: "Contrato social",             v: "v3", status: "revisao",  resp: "mar", quando: "ontem",        ass: [], grupo: "Societário" },
  { id: "DOC-04", nome: "Acordo de sócios",            v: "v2", status: "rascunho", resp: "mar", quando: "há 5 dias",    ass: [], grupo: "Societário" },
  { id: "DOC-05", nome: "Procuração contábil",         v: "v1", status: "pendente", resp: "ana", quando: "há 8 dias",    ass: ["ric"], grupo: "Financeiro" },
  { id: "DOC-06", nome: "Termo de cessão de código",   v: "—",  status: "ausente",  resp: "teo", quando: "nunca enviado",ass: [], grupo: "Propriedade intelectual", critico: true },
  { id: "DOC-07", nome: "Comprovantes de aporte",      v: "v4", status: "assinado", resp: "ana", quando: "há 3 dias",    ass: ["ana"], grupo: "Financeiro" },
  { id: "DOC-08", nome: "Política de privacidade",     v: "v1", status: "rascunho", resp: "mar", quando: "há 11 dias",   ass: [], grupo: "Conformidade" },
  { id: "DOC-09", nome: "Busca de anterioridade INPI", v: "v1", status: "assinado", resp: "teo", quando: "há 3 semanas", ass: ["teo"], grupo: "Propriedade intelectual" },
];
const STATUS_DOC = {
  assinado: { rot: "Assinado", cor: "verde" },
  revisao:  { rot: "Em revisão", cor: "azul" },
  rascunho: { rot: "Rascunho", cor: "cinza" },
  pendente: { rot: "Aguarda assinatura", cor: "laranja" },
  ausente:  { rot: "Não existe", cor: "vermelho" },
};

const CANAIS = [
  { id: "geral", nome: "geral", desc: "Tudo que ainda não tem casa" },
  { id: "produto", nome: "produto", desc: "Escopo, roadmap e clientes-piloto" },
  { id: "juridico", nome: "juridico", desc: "Societário, contratos e INPI" },
  { id: "financeiro", nome: "financeiro", desc: "Aportes, despesas e contabilidade" },
];

const MSGS_INI = {
  geral: [
    { id: "m1", de: "mar", h: "09:12", txt: "Bom dia. Fechei com o escritório do Dr. Peçanha a revisão do contrato social. Retorno prometido para sexta." },
    { id: "m2", de: "fel", h: "09:31", txt: "Consigo travar o escopo do produto até quarta se decidirmos hoje se o módulo de relatórios entra ou não." },
    { id: "m3", de: "ric", h: "10:04", txt: "Proponho extraordinária quinta às 19h só para o contrato social. Quem não puder, avisa até amanhã." },
    { id: "m4", de: "ana", h: "10:10", txt: "Quinta 19h funciona para mim." },
  ],
  produto: [
    { id: "m5", de: "fel", h: "08:40", txt: "Levantei três candidatos a piloto. Dois pagam desde o primeiro mês, o terceiro quer 60 dias grátis." },
    { id: "m6", de: "teo", h: "08:55", txt: "Se o terceiro exigir customização, não entra. Vira projeto e não temos gente para isso." },
    { id: "m7", de: "ric", h: "11:20", txt: "Concordo com o Téo. Piloto serve para validar, não para faturar. Máximo três e sem customização." },
  ],
  juridico: [
    { id: "m8", de: "mar", h: "14:02", txt: "Precisamos fechar o vesting antes de registrar na Junta. Minha proposta: 4 anos, cliff de 12 meses, aceleração de 50% em caso de venda." },
    { id: "m9", de: "ana", h: "14:19", txt: "Aceleração de 50% me parece alta. 25% já resolve." },
    { id: "m10", de: "mar", h: "14:33", txt: "Coloquei em deliberação (D-004) para não decidirmos isso por texto." },
  ],
  financeiro: [
    { id: "m11", de: "ana", h: "16:05", txt: "Caixa hoje: R$ 62.400. Queima média dos últimos três meses: R$ 8.300 por mês." },
    { id: "m12", de: "ana", h: "16:06", txt: "Felipe, faltam R$ 5.000 do seu aporte comprometido. Sem pressa, mas registre a data prevista." },
    { id: "m13", de: "fel", h: "17:41", txt: "Dia 5 do mês que vem eu integralizo o restante." },
  ],
};

const DELIBS_INI = [
  { id: "D-004", titulo: "Vesting de 4 anos, cliff de 12 meses e aceleração de 50%", status: "aberta", quorum: 75, prazo: "Encerra em 2 dias", votos: { mar: "sim", ana: "nao", fel: "sim", ric: null } },
  { id: "D-003", titulo: "Pró-labore zero até o primeiro faturamento recorrente", status: "aprovada", quorum: 75, prazo: "Encerrada", votos: { mar: "sim", ana: "sim", fel: "sim", ric: "sim" } },
  { id: "D-002", titulo: "Contratação do escritório contábil Vértice", status: "aprovada", quorum: 75, prazo: "Encerrada", votos: { mar: "sim", ana: "sim", fel: "sim", ric: "sim" } },
  { id: "D-001", titulo: "Divisão societária inicial de 30, 25, 25 e 20 por cento", status: "aprovada", quorum: 100, prazo: "Encerrada", votos: { mar: "sim", ana: "sim", fel: "sim", ric: "sim" } },
];

const APORTES = [
  { id: "ric", comprometido: 30000, integralizado: 30000 },
  { id: "mar", comprometido: 25000, integralizado: 25000 },
  { id: "fel", comprometido: 25000, integralizado: 20000 },
  { id: "ana", comprometido: 20000, integralizado: 20000 },
];

const DESPESAS_INI = [
  { id: "E-018", desc: "Honorários da revisão do contrato social", valor: 3800, cat: "Jurídico", quem: "mar", status: "aprovar" },
  { id: "E-017", desc: "Taxa da Junta Comercial", valor: 480, cat: "Legal", quem: "mar", status: "aprovar" },
  { id: "E-016", desc: "Servidor e domínios, 12 meses", valor: 2160, cat: "Infraestrutura", quem: "teo", status: "pago" },
  { id: "E-015", desc: "Contabilidade, mensalidade", valor: 890, cat: "Contábil", quem: "ana", status: "pago" },
  { id: "E-014", desc: "Depósito de marca no INPI", valor: 1420, cat: "Marca", quem: "teo", status: "previsto" },
];

const REUNIOES = [
  { id: "R-013", titulo: "Extraordinária — contrato social", quando: "Quinta, 19h00", dia: "25", mes: "JUL", tipo: "Extraordinária", pauta: [], ata: null, alerta: "Sem pauta publicada" },
  { id: "R-012", titulo: "Comitê semanal de fundação", quando: "Segunda, 19h00", dia: "28", mes: "JUL", tipo: "Recorrente", pauta: ["Andamento na Junta Comercial", "Trava de escopo do produto", "Caixa e aportes"], ata: null },
  { id: "R-011", titulo: "Comitê semanal de fundação", quando: "Segunda passada", dia: "21", mes: "JUL", tipo: "Recorrente", pauta: ["Escolha do contador", "Aportes"], ata: "Aprovada a contratação do escritório Vértice (D-002). Ana ficou responsável por enviar a procuração contábil até 18 de julho. Felipe reportou aporte parcial." },
];

const brl = (n) => "R$ " + n.toLocaleString("pt-BR");

/* ───────────────────────────  APP  ─────────────────────────── */

export default function TailorMade() {
  const [tema, setTema] = useState("claro");
  const [vista, setVista] = useState("cockpit");
  const [canal, setCanal] = useState("geral");
  const [msgs, setMsgs] = useState(MSGS_INI);
  const [rascunho, setRascunho] = useState("");
  const [fases, setFases] = useState(FASES_INI);
  const [delibs, setDelibs] = useState(DELIBS_INI);
  const [despesas, setDespesas] = useState(DESPESAS_INI);
  const [tarefas, setTarefas] = useState([
    { id: "T-1", txt: "Enviar a procuração contábil assinada", quem: "ana", origem: "R-011", ok: false },
    { id: "T-2", txt: "Confirmar presença na extraordinária de quinta", quem: "fel", origem: "geral", ok: false },
    { id: "T-3", txt: "Subir o termo de cessão de código", quem: "teo", origem: "DOC-06", ok: false },
  ]);
  const [registros, setRegistros] = useState([]);
  const [copiloto, setCopiloto] = useState(true);
  const [filtroDoc, setFiltroDoc] = useState("Todos");
  const [toast, setToast] = useState(null);
  const fimChat = useRef(null);

  useEffect(() => { fimChat.current?.scrollIntoView({ block: "end" }); }, [msgs, canal]);
  const avisar = (t) => { setToast(t); setTimeout(() => setToast(null), 2600); };

  const progresso = useMemo(() => {
    const tot = fases.reduce((a, f) => a + f.itens.length, 0);
    const fei = fases.reduce((a, f) => a + f.itens.filter((i) => i.ok).length, 0);
    const trilho = (t) => {
      const g = fases.filter((f) => f.trilho === t);
      const a = g.reduce((x, f) => x + f.itens.length, 0);
      const b = g.reduce((x, f) => x + f.itens.filter((i) => i.ok).length, 0);
      return Math.round((b / a) * 100);
    };
    const docsOk = DOCS.filter((d) => d.status === "assinado").length;
    return {
      tot, fei, pct: Math.round((fei / tot) * 100),
      legal: trilho("legal"), op: trilho("op"),
      docs: Math.round((docsOk / DOCS.length) * 100), docsOk,
    };
  }, [fases]);

  const faseAtual = useMemo(() => fases.find((f) => f.itens.some((i) => !i.ok)) || fases[fases.length - 1], [fases]);

  const leituras = useMemo(() => {
    const out = [];
    const critico = DOCS.find((d) => d.critico && d.status === "ausente");
    if (critico) out.push({ n: "risco", t: "Código sem cessão de propriedade",
      d: `O ${critico.id} nunca foi enviado. Até que seja, o software escrito pelo responsável técnico pertence a ele, não à empresa. Isso trava a fase 5 e reprova em qualquer auditoria de investidor.`,
      origem: critico.id, ir: "cofre" });
    const aberta = delibs.find((x) => x.status === "aberta" && x.votos[EU] == null);
    if (aberta) out.push({ n: "acao", t: "Falta o seu voto",
      d: `${aberta.id} está aberta e encerra em 2 dias. Sem o seu voto não há quórum de ${aberta.quorum}%.`, origem: aberta.id, ir: "delib" });
    const semPauta = REUNIOES.find((r) => r.alerta);
    if (semPauta) out.push({ n: "atencao", t: "Reunião sem pauta",
      d: `${semPauta.id} está marcada para ${semPauta.quando.toLowerCase()} e não tem pauta publicada. Reunião sem pauta vira debate sem decisão.`, origem: semPauta.id, ir: "reunioes" });
    const falta = APORTES.find((a) => a.integralizado < a.comprometido);
    if (falta) out.push({ n: "atencao", t: "Aporte comprometido em aberto",
      d: `${socio(falta.id).curto} tem ${brl(falta.comprometido - falta.integralizado)} pendentes. Data informada no canal financeiro: dia 5.`, origem: "financeiro", ir: "financeiro" });
    const aAprovar = despesas.filter((d) => d.status === "aprovar");
    if (aAprovar.length) out.push({ n: "acao", t: `${aAprovar.length} despesas aguardando aprovação`,
      d: `Somam ${brl(aAprovar.reduce((a, b) => a + b.valor, 0))}. A política de alçadas ainda não foi definida, ela está na fase 4.`, origem: "Financeiro", ir: "financeiro" });
    out.push({ n: "info", t: "Fôlego de caixa", d: "R$ 62.400 em caixa contra queima média de R$ 8.300 por mês. Sete meses e meio, sem contar as despesas ainda não aprovadas.", origem: "Financeiro", ir: "financeiro" });
    return out;
  }, [delibs, despesas]);

  const resumo = useMemo(() => {
    const risco = leituras.filter((l) => l.n === "risco").length;
    const acao = leituras.filter((l) => l.n === "acao").length;
    return `A fundação está em ${progresso.pct} por cento, com ${progresso.fei} de ${progresso.tot} entregas concluídas. A frente atual é “${faseAtual.nome}”. Há ${acao} ${acao === 1 ? "item esperando" : "itens esperando"} por você e ${risco} ${risco === 1 ? "risco aberto" : "riscos abertos"} bloqueando a sequência. Cada leitura abaixo aponta o registro que a originou.`;
  }, [leituras, progresso, faseAtual]);

  const enviar = () => {
    if (!rascunho.trim()) return;
    const h = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setMsgs((m) => ({ ...m, [canal]: [...m[canal], { id: "n" + Date.now(), de: EU, h, txt: rascunho.trim() }] }));
    setRascunho("");
  };
  const virarTarefa = (msg) => {
    setTarefas((t) => [{ id: "T-" + (t.length + 1), txt: msg.txt.slice(0, 70), quem: msg.de, origem: canal, ok: false }, ...t]);
    avisar("Tarefa criada");
  };
  const registrar = (msg) => {
    setRegistros((r) => [{ id: "REG-" + String(r.length + 1).padStart(2, "0"), txt: msg.txt, de: msg.de, canal, data: "hoje" }, ...r]);
    avisar("Mensagem guardada no livro de registros");
  };
  const votar = (id, v) => setDelibs((ds) => ds.map((d) => {
    if (d.id !== id) return d;
    const votos = { ...d.votos, [EU]: v };
    const sim = SOCIOS.filter((s) => s.tipo === "socio" && votos[s.id] === "sim").reduce((a, s) => a + s.part, 0);
    return { ...d, votos, status: sim >= d.quorum ? "aprovada" : d.status };
  }));
  const marcar = (fid, idx) => setFases((fs) => fs.map((f) => f.id !== fid ? f : { ...f, itens: f.itens.map((i, k) => k === idx ? { ...i, ok: !i.ok } : i) }));
  const aprovar = (id) => { setDespesas((d) => d.map((x) => x.id === id ? { ...x, status: "pago" } : x)); avisar("Despesa aprovada"); };

  const GRUPOS_NAV = [
    { rot: "Fundação", itens: [
      { id: "cockpit", rot: "Visão geral", Ico: LayoutGrid, cor: "azul" },
      { id: "trilha", rot: "Trilha", Ico: Route, cor: "indigo" } ] },
    { rot: "Trabalho", itens: [
      { id: "debates", rot: "Debates", Ico: MessageCircle, cor: "verde", badge: 4 },
      { id: "cofre", rot: "Documentos", Ico: Folder, cor: "azul" },
      { id: "financeiro", rot: "Financeiro", Ico: Wallet, cor: "verde" } ] },
    { rot: "Governança", itens: [
      { id: "delib", rot: "Deliberações", Ico: Scale, cor: "laranja", badge: delibs.filter((d) => d.status === "aberta").length },
      { id: "reunioes", rot: "Reuniões", Ico: Calendar, cor: "vermelho" },
      { id: "socios", rot: "Sócios", Ico: Users, cor: "roxo" } ] },
  ];
  const tituloVista = GRUPOS_NAV.flatMap((g) => g.itens).find((i) => i.id === vista)?.rot || "";

  return (
    <div className={`ap ap--${tema}`}>
      <style>{CSS}</style>

      <aside className="lat">
        <div className="lat__marca">
          <div className="appicon">TM</div>
          <div>
            <div className="appicon__n">Tailor Made</div>
            <div className="appicon__s">Fundação · 2026</div>
          </div>
        </div>
        <nav className="lat__nav">
          {GRUPOS_NAV.map((g) => (
            <div key={g.rot} className="lat__g">
              <div className="lat__gt">{g.rot}</div>
              {g.itens.map(({ id, rot, Ico, cor, badge }) => (
                <button key={id} className={`item ${vista === id ? "item--on" : ""}`} onClick={() => setVista(id)}>
                  <span className={`item__ic c-${cor}`}><Ico size={14} strokeWidth={2.1} /></span>
                  <span className="item__r">{rot}</span>
                  {badge ? <span className="conta">{badge}</span> : null}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="lat__pe">
          <div className="lat__gt">Migração dos grupos</div>
          {[["Principal", "Debates", 100], ["Documentos", "Documentos", 100], ["Financeiro", "Financeiro", 60]].map(([a, b, p]) => (
            <div key={a} className="mig">
              <div className="mig__t"><span>{a}</span><span className="mig__seta">{b}</span></div>
              <div className="cap cap--fino"><div className={p === 100 ? "f-verde" : "f-laranja"} style={{ width: p + "%" }} /></div>
            </div>
          ))}
        </div>
      </aside>

      <div className="col">
        <header className="barra">
          <div className="barra__esq"><span className="barra__t">{tituloVista}</span></div>
          <div className="campo"><Search size={14} strokeWidth={2.4} /><input placeholder="Buscar" /></div>
          <div className="barra__dir">
            <button className="glifo" onClick={() => setTema(tema === "claro" ? "escuro" : "claro")} title="Alternar aparência">
              {tema === "claro" ? <Moon size={16} strokeWidth={2} /> : <Sun size={16} strokeWidth={2} />}
            </button>
            <label className="switch" title="Copiloto">
              <input type="checkbox" checked={copiloto} onChange={() => setCopiloto(!copiloto)} /><span />
            </label>
            <span className="ava ava--eu">RA</span>
          </div>
        </header>

        <div className="corpo">
          <main className="tela">
            {vista === "cockpit" && <Cockpit p={progresso} faseAtual={faseAtual} leituras={leituras} tarefas={tarefas} setTarefas={setTarefas} delibs={delibs} registros={registros} ir={setVista} />}
            {vista === "trilha" && <Trilha fases={fases} marcar={marcar} />}
            {vista === "debates" && <Debates canal={canal} setCanal={setCanal} msgs={msgs} rascunho={rascunho} setRascunho={setRascunho} enviar={enviar} virarTarefa={virarTarefa} registrar={registrar} fimChat={fimChat} />}
            {vista === "cofre" && <Cofre filtro={filtroDoc} setFiltro={setFiltroDoc} />}
            {vista === "financeiro" && <Financeiro despesas={despesas} aprovar={aprovar} />}
            {vista === "reunioes" && <Reunioes />}
            {vista === "delib" && <Deliberacoes delibs={delibs} votar={votar} registros={registros} />}
            {vista === "socios" && <Socios />}
          </main>

          {copiloto && (
            <aside className="insp">
              <div className="insp__cab">
                <span className="insp__t"><Sparkles size={13} strokeWidth={2.2} /> Copiloto</span>
                <button className="glifo glifo--min" onClick={() => setCopiloto(false)}><X size={14} /></button>
              </div>
              <p className="insp__resumo">{resumo}</p>
              {leituras.map((l, i) => (
                <button key={i} className="leitura" onClick={() => setVista(l.ir)}>
                  <span className={`leitura__ic c-${l.n === "risco" ? "vermelho" : l.n === "acao" ? "laranja" : l.n === "atencao" ? "azul" : "verde"}`}>
                    {l.n === "risco" ? <AlertTriangle size={13} strokeWidth={2.3} /> : l.n === "acao" ? <Bell size={13} strokeWidth={2.3} /> : l.n === "atencao" ? <Clock size={13} strokeWidth={2.3} /> : <ShieldCheck size={13} strokeWidth={2.3} />}
                  </span>
                  <span className="leitura__c">
                    <strong>{l.t}</strong><p>{l.d}</p>
                    <em>origem: {l.origem} <ArrowRight size={10} /></em>
                  </span>
                </button>
              ))}
              <p className="insp__pe">O copiloto só afirma o que consegue apontar em um registro do painel. Sem registro, ele não conclui.</p>
            </aside>
          )}
        </div>
      </div>

      {toast && <div className="toast"><Check size={15} strokeWidth={3} /> {toast}</div>}
    </div>
  );
}

/* ──────────────────  ANÉIS DE PROGRESSO (assinatura)  ────────────────── */

function Aneis({ legal, docs, op }) {
  const C = 90, ESP = 14;
  const anel = (r, val, cls) => {
    const circ = 2 * Math.PI * r;
    return (
      <g key={cls}>
        <circle cx={C} cy={C} r={r} className={`an__t an__t--${cls}`} strokeWidth={ESP} fill="none" />
        <circle cx={C} cy={C} r={r} className={`an__v an__v--${cls}`} strokeWidth={ESP} fill="none"
          strokeLinecap="round" strokeDasharray={`${(val / 100) * circ} ${circ}`}
          transform={`rotate(-90 ${C} ${C})`} />
      </g>
    );
  };
  return (
    <svg viewBox="0 0 180 180" className="an">
      {anel(72, legal, "a")}
      {anel(54, docs, "b")}
      {anel(36, op, "c")}
    </svg>
  );
}

/* ───────────────────────────  VISTAS  ─────────────────────────── */

function Titulo({ t, s, acao }) {
  return (
    <div className="tit">
      <div><h1>{t}</h1>{s && <p>{s}</p>}</div>
      {acao}
    </div>
  );
}

function Cockpit({ p, faseAtual, leituras, tarefas, setTarefas, delibs, registros, ir }) {
  const abertas = tarefas.filter((t) => !t.ok);
  return (
    <>
      <Titulo t="Visão geral" s={`Quinta-feira, 23 de julho · frente atual: ${faseAtual.nome}`} />

      <section className="cart cart--her">
        <div className="her__aneis"><Aneis legal={p.legal} docs={p.docs} op={p.op} /></div>
        <div className="her__dados">
          <div className="her__pct">{p.pct}<small>%</small></div>
          <p className="her__leg">{p.fei} de {p.tot} entregas concluídas</p>
          <div className="leg">
            {[["a", "Societário e legal", p.legal, "Junta Comercial pendente"],
              ["b", "Documentos", p.docs, `${p.docsOk} de ${DOCS.length} assinados`],
              ["c", "Operação e produto", p.op, "Conta PJ é o próximo passo"]].map(([k, r, v, n]) => (
              <div key={k} className="leg__l">
                <span className={`ponto p--${k}`} />
                <span className="leg__r">{r}<em>{n}</em></span>
                <span className="leg__v">{v}%</span>
              </div>
            ))}
          </div>
          <button className="bt bt--claro" onClick={() => ir("trilha")}>Abrir trilha <ChevronRight size={14} /></button>
        </div>
      </section>

      <div className="duplo">
        <section className="cart">
          <div className="cart__cab"><h2>Esperando por você</h2><span className="min">{abertas.length}</span></div>
          <ul className="lista">
            {abertas.length === 0 && <li className="lista__vazio">Nada aberto no seu nome. Puxe algo da trilha.</li>}
            {abertas.map((t) => (
              <li key={t.id} className="linha">
                <button className={`marca ${t.ok ? "marca--on" : ""}`} onClick={() => setTarefas((ts) => ts.map((x) => x.id === t.id ? { ...x, ok: !x.ok } : x))}>
                  {t.ok ? <CheckCircle2 size={19} strokeWidth={2} /> : <Circle size={19} strokeWidth={1.8} />}
                </button>
                <span className="linha__t">{t.txt}<em>{socio(t.quem).curto} · origem {t.origem}</em></span>
              </li>
            ))}
          </ul>
        </section>

        <section className="cart">
          <div className="cart__cab"><h2>Em deliberação</h2></div>
          <ul className="lista">
            {delibs.filter((d) => d.status === "aberta").map((d) => (
              <li key={d.id} className="linha linha--clic" onClick={() => ir("delib")}>
                <span className={`item__ic c-laranja`}><Scale size={14} strokeWidth={2.1} /></span>
                <span className="linha__t">{d.titulo}<em>{d.id} · {d.prazo.toLowerCase()}</em></span>
                <span className="selo selo--laranja">Seu voto</span>
                <ChevronRight size={15} className="chev" />
              </li>
            ))}
          </ul>
          <div className="cart__cab cart__cab--sep"><h2>Livro de registros</h2></div>
          <ul className="lista">
            {registros.length === 0
              ? <li className="lista__vazio">Guarde uma mensagem em Debates para começar o livro. Ele serve de memória das decisões informais.</li>
              : registros.slice(0, 3).map((r) => (
                <li key={r.id} className="linha">
                  <span className="item__ic c-azul"><Bookmark size={14} strokeWidth={2.1} /></span>
                  <span className="linha__t">{r.txt}<em>{r.id} · {r.canal} · {socio(r.de).curto}</em></span>
                </li>
              ))}
          </ul>
        </section>
      </div>

      <section className="cart">
        <div className="cart__cab"><h2>Riscos abertos</h2></div>
        <div className="riscos">
          {leituras.filter((l) => l.n === "risco" || l.n === "atencao").map((l, i) => (
            <div key={i} className={`risco risco--${l.n}`}>
              <div className="risco__c"><strong>{l.t}</strong><p>{l.d}</p><em>origem: {l.origem}</em></div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Trilha({ fases, marcar }) {
  return (
    <>
      <Titulo t="Trilha" s="Cada fase abre a seguinte. Marcar um item aqui move os anéis da visão geral." />
      <div className="fases">
        {fases.map((f, i) => {
          const feitos = f.itens.filter((x) => x.ok).length;
          const ok = feitos === f.itens.length;
          return (
            <section key={f.id} className={`cart fase ${ok ? "fase--ok" : ""}`}>
              <div className="fase__cab">
                <span className="fase__n">{i + 1}</span>
                <div className="fase__ti"><h3>{f.nome}</h3><em>{socio(f.resp).curto} · {f.prazo}</em></div>
                <span className={`selo ${ok ? "selo--verde" : "selo--cinza"}`}>{feitos}/{f.itens.length}</span>
              </div>
              <div className="cap"><div className={ok ? "f-verde" : "f-azul"} style={{ width: (feitos / f.itens.length) * 100 + "%" }} /></div>
              <ul className="lista">
                {f.itens.map((it, k) => (
                  <li key={k} className="linha">
                    <button className={`marca ${it.ok ? "marca--on" : ""}`} onClick={() => marcar(f.id, k)}>
                      {it.ok ? <CheckCircle2 size={19} strokeWidth={2} /> : <Circle size={19} strokeWidth={1.8} />}
                    </button>
                    <span className={`linha__t ${it.ok ? "linha__t--feito" : ""}`}>{it.t}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

function Debates({ canal, setCanal, msgs, rascunho, setRascunho, enviar, virarTarefa, registrar, fimChat }) {
  const c = CANAIS.find((x) => x.id === canal);
  return (
    <div className="conv">
      <div className="conv__lista">
        <div className="lat__gt">Canais</div>
        {CANAIS.map((x) => (
          <button key={x.id} className={`item ${canal === x.id ? "item--on" : ""}`} onClick={() => setCanal(x.id)}>
            <span className="item__ic c-cinza"><Hash size={13} strokeWidth={2.4} /></span>
            <span className="item__r">{x.nome}</span>
          </button>
        ))}
        <p className="conv__nota">Um canal por assunto. Se não cabe em nenhum, ainda não é assunto.</p>
      </div>

      <div className="conv__chat">
        <div className="conv__cab">
          <div><h2>{c.nome}</h2><em>{c.desc}</em></div>
          <div className="pilha">{SOCIOS.map((s) => <span key={s.id} className="ava" title={s.nome}>{s.ini}</span>)}</div>
        </div>

        <div className="conv__fluxo">
          {msgs[canal].map((m) => {
            const meu = m.de === EU;
            return (
              <div key={m.id} className={`bloco ${meu ? "bloco--meu" : ""}`}>
                {!meu && <span className="ava">{socio(m.de).ini}</span>}
                <div className="bloco__c">
                  {!meu && <div className="bloco__n">{socio(m.de).curto} <em>{m.h}</em></div>}
                  <div className={`balao ${meu ? "balao--meu" : ""}`}>{m.txt}</div>
                  <div className="bloco__a">
                    <button onClick={() => virarTarefa(m)}><ListTodo size={12} strokeWidth={2.3} /> Virar tarefa</button>
                    <button onClick={() => registrar(m)}><Bookmark size={12} strokeWidth={2.3} /> Guardar</button>
                    <button><Scale size={12} strokeWidth={2.3} /> Deliberar</button>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={fimChat} />
        </div>

        <div className="compo">
          <button className="glifo"><Paperclip size={17} strokeWidth={2} /></button>
          <input value={rascunho} onChange={(e) => setRascunho(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviar()} placeholder={`Mensagem em ${c.nome}`} />
          <button className="enviar" onClick={enviar} aria-label="Enviar"><ArrowUp size={16} strokeWidth={3} /></button>
        </div>
      </div>
    </div>
  );
}

function Cofre({ filtro, setFiltro }) {
  const grupos = ["Todos", ...Array.from(new Set(DOCS.map((d) => d.grupo)))];
  const lista = filtro === "Todos" ? DOCS : DOCS.filter((d) => d.grupo === filtro);
  return (
    <>
      <Titulo t="Documentos" s="Versão, responsável e assinaturas. O que não existe continua na lista, marcado em vermelho."
        acao={<button className="bt bt--azul"><Plus size={15} strokeWidth={2.6} /> Adicionar</button>} />
      <div className="seg">
        {grupos.map((g) => <button key={g} className={filtro === g ? "on" : ""} onClick={() => setFiltro(g)}>{g}</button>)}
      </div>
      <section className="cart cart--lista">
        <ul className="lista">
          {lista.map((d) => {
            const st = STATUS_DOC[d.status];
            return (
              <li key={d.id} className="linha linha--clic">
                <span className={`item__ic c-${d.critico ? "vermelho" : "azul"}`}>
                  {d.status === "ausente" ? <AlertTriangle size={14} strokeWidth={2.2} /> : <FileText size={14} strokeWidth={2.2} />}
                </span>
                <span className="linha__t">{d.nome}<em>{d.id} · {d.v} · {d.grupo} · {socio(d.resp).curto} · {d.quando}</em></span>
                <span className="assin">
                  {d.ass.length === 0 ? <em className="min">sem assinaturas</em>
                    : d.ass.map((a) => <span key={a} className="ava ava--min" title={socio(a).nome}>{socio(a).ini}</span>)}
                </span>
                <span className={`selo selo--${st.cor}`}>{st.rot}</span>
                <button className="glifo glifo--min"><Download size={14} /></button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

function Financeiro({ despesas, aprovar }) {
  const caixa = 62400, queima = 8300;
  const folego = (caixa / queima).toFixed(1).replace(".", ",");
  const comp = APORTES.reduce((a, b) => a + b.comprometido, 0);
  const integ = APORTES.reduce((a, b) => a + b.integralizado, 0);
  return (
    <>
      <Titulo t="Financeiro" s="Substitui o grupo do financeiro. Toda despesa tem número, categoria e responsável." />
      <div className="metricas">
        {[["Caixa hoje", brl(caixa), "", "verde"],
          ["Queima mensal", brl(queima), "média de três meses", "laranja"],
          ["Fôlego", folego + " meses", "sem novos aportes", "azul"],
          ["Integralizado", Math.round((integ / comp) * 100) + "%", `${brl(integ)} de ${brl(comp)}`, "indigo"]]
          .map(([r, v, n, c]) => (
            <div key={r} className="met">
              <div className="met__r">{r}</div>
              <div className={`met__v c-${c}`}>{v}</div>
              {n && <div className="met__n">{n}</div>}
            </div>
          ))}
      </div>

      <div className="duplo">
        <section className="cart">
          <div className="cart__cab"><h2>Aportes por sócio</h2></div>
          {APORTES.map((a) => {
            const p = (a.integralizado / a.comprometido) * 100;
            return (
              <div key={a.id} className="aporte">
                <div className="aporte__t"><span>{socio(a.id).curto}</span><em>{brl(a.integralizado)} de {brl(a.comprometido)}</em></div>
                <div className="cap"><div className={p < 100 ? "f-laranja" : "f-verde"} style={{ width: p + "%" }} /></div>
              </div>
            );
          })}
        </section>

        <section className="cart cart--lista">
          <div className="cart__cab"><h2>Movimento</h2></div>
          <ul className="lista">
            {despesas.map((d) => (
              <li key={d.id} className="linha">
                <span className="linha__t">{d.desc}<em>{d.id} · {d.cat} · {socio(d.quem).curto}</em></span>
                <span className="valor">{brl(d.valor)}</span>
                {d.status === "aprovar"
                  ? <button className="bt bt--min bt--azul" onClick={() => aprovar(d.id)}>Aprovar</button>
                  : <span className={`selo selo--${d.status === "pago" ? "verde" : "cinza"}`}>{d.status}</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function Reunioes() {
  return (
    <>
      <Titulo t="Reuniões" s="Pauta antes, ata depois. Encaminhamento de ata vira tarefa com responsável."
        acao={<button className="bt bt--azul"><Plus size={15} strokeWidth={2.6} /> Marcar</button>} />
      <div className="fases">
        {REUNIOES.map((r) => (
          <section key={r.id} className={`cart reu ${r.alerta ? "reu--alerta" : ""}`}>
            <div className="reu__cab">
              <div className="data"><span className="data__m">{r.mes}</span><span className="data__d">{r.dia}</span></div>
              <div className="reu__ti">
                <h3>{r.titulo}</h3>
                <em>{r.quando} · {r.tipo}</em>
              </div>
            </div>
            {r.pauta.length > 0 && (
              <ul className="lista">
                {r.pauta.map((p, i) => <li key={i} className="linha"><span className="ord">{i + 1}</span><span className="linha__t">{p}</span></li>)}
              </ul>
            )}
            {r.alerta && <div className="aviso"><AlertTriangle size={14} strokeWidth={2.3} /> {r.alerta}. Publique a pauta ou a reunião não gera decisão.</div>}
            {r.ata && <div className="ata"><span className="ata__r">Ata</span><p>{r.ata}</p></div>}
          </section>
        ))}
      </div>
    </>
  );
}

function Deliberacoes({ delibs, votar, registros }) {
  return (
    <>
      <Titulo t="Deliberações" s="O que precisa de quórum não se resolve no chat. Voto ponderado por participação e resultado imutável." />
      <div className="fases">
        {delibs.map((d) => {
          const sim = SOCIOS.filter((s) => s.tipo === "socio" && d.votos[s.id] === "sim").reduce((a, s) => a + s.part, 0);
          const nao = SOCIOS.filter((s) => s.tipo === "socio" && d.votos[s.id] === "nao").reduce((a, s) => a + s.part, 0);
          const aberta = d.status === "aberta";
          return (
            <section key={d.id} className={`cart delib ${aberta ? "delib--aberta" : ""}`}>
              <div className="delib__cab">
                <em>{d.id} · {d.prazo}</em>
                <span className={`selo selo--${d.status === "aprovada" ? "verde" : "laranja"}`}>{d.status}</span>
              </div>
              <h3>{d.titulo}</h3>
              <div className="cap cap--voto">
                <div className="f-verde" style={{ width: sim + "%" }} />
                <div className="f-vermelho" style={{ width: nao + "%" }} />
                <span className="marcaq" style={{ left: d.quorum + "%" }} />
              </div>
              <em className="min">{sim}% a favor · quórum exigido {d.quorum}%</em>
              <div className="votos">
                {SOCIOS.filter((s) => s.tipo === "socio").map((s) => (
                  <span key={s.id} className={`voto voto--${d.votos[s.id] || "vazio"}`}>
                    <i className="ava ava--min">{s.ini}</i>{d.votos[s.id] === "sim" ? "a favor" : d.votos[s.id] === "nao" ? "contra" : "não votou"}
                  </span>
                ))}
              </div>
              {aberta && (
                <div className="delib__acao">
                  <button className="bt bt--claro" onClick={() => votar(d.id, "nao")}>Votar contra</button>
                  <button className="bt bt--azul" onClick={() => votar(d.id, "sim")}><Check size={15} strokeWidth={3} /> Votar a favor</button>
                </div>
              )}
            </section>
          );
        })}
      </div>
      {registros.length > 0 && (
        <section className="cart cart--lista">
          <div className="cart__cab"><h2>Livro de registros informais</h2></div>
          <ul className="lista">
            {registros.map((r) => (
              <li key={r.id} className="linha">
                <span className="item__ic c-azul"><Bookmark size={14} strokeWidth={2.1} /></span>
                <span className="linha__t">{r.txt}<em>{r.id} · {r.canal} · {socio(r.de).curto} · {r.data}</em></span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Socios() {
  return (
    <>
      <Titulo t="Sócios" s="Participação, área de responsabilidade e o que cada um trava se atrasar." />
      <section className="cart cart--lista">
        <ul className="lista">
          {SOCIOS.map((s) => (
            <li key={s.id} className="linha linha--alta">
              <span className="ava ava--gr">{s.ini}</span>
              <span className="linha__t">{s.nome}<em>{s.papel}</em>
                {s.nota && <span className="nota"><Lock size={11} strokeWidth={2.4} /> {s.nota}</span>}
              </span>
              <span className="parte">{s.part ? s.part + "%" : "—"}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="cart">
        <div className="cart__cab"><h2>Divisão do capital</h2></div>
        <div className="capital">
          {SOCIOS.filter((s) => s.part > 0).map((s, i) => (
            <div key={s.id} className={`capital__f k${i}`} style={{ width: s.part + "%" }}>{s.ini} {s.part}%</div>
          ))}
        </div>
        <p className="obs">O responsável técnico ainda está fora do quadro. A proposta de 8% com cliff de 12 meses depende da deliberação D-004 e da assinatura do DOC-06.</p>
      </section>
    </>
  );
}

/* ───────────────────────────  ESTILO  ─────────────────────────── */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.ap{
--azul:#007AFF;--verde:#34C759;--vermelho:#FF3B30;--laranja:#FF9500;--indigo:#5856D6;--roxo:#AF52DE;--cinza:#8E8E93;
--bg:#F2F2F7;--cart:#FFFFFF;--lat:rgba(246,246,248,.72);--barra:rgba(255,255,255,.72);
--tx:#1C1C1E;--tx2:#6E6E73;--tx3:#A1A1A6;
--sep:rgba(60,60,67,.16);--fill:rgba(120,120,128,.10);--fill2:rgba(120,120,128,.16);--balao:#E9E9EB;
--sombra:0 1px 2px rgba(0,0,0,.05), 0 6px 20px rgba(0,0,0,.045);
font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Inter',system-ui,sans-serif;
-webkit-font-smoothing:antialiased;background:var(--bg);color:var(--tx);
display:flex;min-height:100vh;max-height:100vh;overflow:hidden;font-size:14px;line-height:1.45;letter-spacing:-.006em;}
.ap--escuro{--bg:#000;--cart:#1C1C1E;--lat:rgba(28,28,30,.72);--barra:rgba(28,28,30,.72);
--tx:#FFF;--tx2:#98989F;--tx3:#6E6E73;--sep:rgba(84,84,88,.55);--fill:rgba(120,120,128,.20);--fill2:rgba(120,120,128,.30);--balao:#2C2C2E;
--azul:#0A84FF;--verde:#30D158;--vermelho:#FF453A;--laranja:#FF9F0A;--indigo:#5E5CE6;--roxo:#BF5AF2;
--sombra:0 1px 2px rgba(0,0,0,.4);}
.ap *{box-sizing:border-box;}
.ap button{font:inherit;color:inherit;background:none;border:none;cursor:pointer;letter-spacing:inherit;}
.ap input{font:inherit;color:inherit;background:none;border:none;outline:none;letter-spacing:inherit;}
.ap h1,.ap h2,.ap h3,.ap p,.ap ul,.ap li{margin:0;padding:0;list-style:none;}
.ap :focus-visible{outline:3px solid color-mix(in srgb,var(--azul) 55%,transparent);outline-offset:2px;border-radius:6px;}
.min{font-size:12px;color:var(--tx3);}
.c-azul{color:var(--azul);} .c-verde{color:var(--verde);} .c-vermelho{color:var(--vermelho);}
.c-laranja{color:var(--laranja);} .c-indigo{color:var(--indigo);} .c-roxo{color:var(--roxo);} .c-cinza{color:var(--cinza);}

/* lateral */
.lat{width:238px;flex:0 0 238px;background:var(--lat);backdrop-filter:blur(28px) saturate(180%);
-webkit-backdrop-filter:blur(28px) saturate(180%);border-right:.5px solid var(--sep);
display:flex;flex-direction:column;padding:16px 10px;gap:20px;}
.lat__marca{display:flex;gap:10px;align-items:center;padding:2px 6px 0;}
.appicon{width:34px;height:34px;flex:0 0 34px;border-radius:9px;background:linear-gradient(160deg,#0A84FF,#5856D6);
color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;letter-spacing:-.02em;
box-shadow:0 2px 6px rgba(10,132,255,.32);}
.appicon__n{font-size:14.5px;font-weight:600;letter-spacing:-.02em;}
.appicon__s{font-size:11.5px;color:var(--tx3);}
.lat__nav{display:flex;flex-direction:column;gap:16px;overflow-y:auto;}
.lat__gt{font-size:11px;font-weight:600;color:var(--tx3);letter-spacing:.02em;padding:0 10px 6px;text-transform:none;}
.item{display:flex;align-items:center;gap:9px;width:100%;padding:6px 10px;border-radius:7px;
color:var(--tx);transition:background .12s;text-align:left;}
.item:hover{background:var(--fill);}
.item--on{background:var(--fill2);}
.item__ic{width:20px;display:flex;align-items:center;justify-content:center;flex:0 0 20px;}
.item__r{font-size:13.5px;font-weight:450;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.item--on .item__r{font-weight:600;}
.conta{background:var(--vermelho);color:#fff;font-size:10.5px;font-weight:700;border-radius:9px;padding:1px 6px;min-width:18px;text-align:center;}
.lat__pe{margin-top:auto;padding-top:14px;border-top:.5px solid var(--sep);display:flex;flex-direction:column;gap:9px;}
.mig__t{display:flex;justify-content:space-between;font-size:11.5px;color:var(--tx2);padding:0 10px 4px;}
.mig__seta{color:var(--tx3);}
.mig .cap{margin:0 10px;}

/* coluna */
.col{flex:1;display:flex;flex-direction:column;min-width:0;}
.barra{height:52px;flex:0 0 52px;display:flex;align-items:center;gap:14px;padding:0 20px;
background:var(--barra);backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);
border-bottom:.5px solid var(--sep);}
.barra__t{font-size:15px;font-weight:600;letter-spacing:-.02em;}
.campo{flex:1;max-width:280px;margin-left:auto;display:flex;align-items:center;gap:7px;background:var(--fill);
border-radius:8px;padding:6px 10px;color:var(--tx3);}
.campo input{flex:1;font-size:13px;}
.barra__dir{display:flex;align-items:center;gap:10px;}
.glifo{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--tx2);}
.glifo:hover{background:var(--fill);color:var(--tx);}
.glifo--min{width:26px;height:26px;}
.switch{position:relative;width:40px;height:24px;flex:0 0 40px;}
.switch input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer;}
.switch span{position:absolute;inset:0;background:var(--fill2);border-radius:12px;transition:.2s;pointer-events:none;}
.switch span::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;
background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:.2s;}
.switch input:checked + span{background:var(--verde);}
.switch input:checked + span::after{transform:translateX(16px);}
.corpo{flex:1;display:flex;min-height:0;}
.tela{flex:1;overflow-y:auto;padding:24px 26px 60px;display:flex;flex-direction:column;gap:18px;min-width:0;}

/* base */
.ava{width:26px;height:26px;flex:0 0 26px;border-radius:50%;background:var(--fill2);color:var(--tx2);
display:inline-flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:600;letter-spacing:-.01em;}
.ava--eu{background:linear-gradient(160deg,#0A84FF,#5856D6);color:#fff;}
.ava--min{width:20px;height:20px;flex:0 0 20px;font-size:9px;}
.ava--gr{width:40px;height:40px;flex:0 0 40px;font-size:14px;}
.pilha{display:flex;}
.pilha .ava{margin-left:-7px;border:2px solid var(--cart);}
.tit{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;flex-wrap:wrap;}
.tit h1{font-size:30px;font-weight:700;letter-spacing:-.028em;line-height:1.1;}
.tit p{font-size:13.5px;color:var(--tx2);margin-top:5px;max-width:70ch;}
.cart{background:var(--cart);border-radius:14px;box-shadow:var(--sombra);padding:16px 18px;display:flex;flex-direction:column;gap:12px;}
.cart--lista{padding:4px 0;}
.cart--lista .cart__cab{padding:12px 18px 4px;}
.cart__cab{display:flex;justify-content:space-between;align-items:center;}
.cart__cab h2{font-size:15px;font-weight:600;letter-spacing:-.018em;}
.cart__cab--sep{border-top:.5px solid var(--sep);padding-top:14px;margin-top:4px;}
.duplo{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start;}
.bt{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;font-size:13.5px;font-weight:500;transition:.14s;}
.bt--azul{background:var(--azul);color:#fff;}
.bt--azul:hover{filter:brightness(1.08);}
.bt--claro{background:var(--fill2);color:var(--tx);}
.bt--claro:hover{background:var(--fill);}
.bt--min{padding:4px 11px;font-size:12.5px;border-radius:7px;}
.selo{font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;white-space:nowrap;}
.selo--verde{background:color-mix(in srgb,var(--verde) 16%,transparent);color:var(--verde);}
.selo--azul{background:color-mix(in srgb,var(--azul) 16%,transparent);color:var(--azul);}
.selo--laranja{background:color-mix(in srgb,var(--laranja) 18%,transparent);color:var(--laranja);}
.selo--vermelho{background:color-mix(in srgb,var(--vermelho) 16%,transparent);color:var(--vermelho);}
.selo--cinza{background:var(--fill2);color:var(--tx2);}
.cap{height:7px;border-radius:4px;background:var(--fill2);overflow:hidden;display:flex;position:relative;}
.cap--fino{height:4px;}
.cap div{height:100%;border-radius:4px;transition:width .3s ease;}
.f-verde{background:var(--verde);} .f-azul{background:var(--azul);}
.f-laranja{background:var(--laranja);} .f-vermelho{background:var(--vermelho);}

/* listas inset */
.lista{display:flex;flex-direction:column;}
.linha{display:flex;align-items:center;gap:11px;padding:9px 0;position:relative;}
.cart--lista .linha{padding:10px 18px;}
.linha + .linha::before{content:'';position:absolute;top:0;left:0;right:0;height:.5px;background:var(--sep);}
.cart--lista .linha + .linha::before{left:18px;right:0;}
.linha--clic{cursor:pointer;border-radius:8px;}
.linha--clic:hover{background:var(--fill);}
.linha--alta{padding-top:12px;padding-bottom:12px;}
.linha__t{flex:1;min-width:0;font-size:13.5px;display:flex;flex-direction:column;gap:2px;}
.linha__t em{font-style:normal;font-size:11.5px;color:var(--tx3);}
.linha__t--feito{color:var(--tx3);text-decoration:line-through;}
.lista__vazio{font-size:12.5px;color:var(--tx3);padding:6px 0;}
.marca{color:var(--tx3);display:flex;flex:0 0 auto;}
.marca:hover{color:var(--azul);}
.marca--on{color:var(--verde);}
.chev{color:var(--tx3);flex:0 0 auto;}
.ord{width:20px;height:20px;flex:0 0 20px;border-radius:50%;background:var(--fill2);color:var(--tx2);
font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;}
.assin{display:flex;gap:3px;align-items:center;}
.valor{font-size:13.5px;font-weight:600;font-variant-numeric:tabular-nums;}

/* anéis */
.cart--her{flex-direction:row;align-items:center;gap:28px;padding:22px 24px;}
.her__aneis{flex:0 0 180px;}
.an{width:180px;height:180px;display:block;}
.an__t{stroke:var(--fill2);}
.an__t--a{stroke:color-mix(in srgb,var(--vermelho) 18%,transparent);}
.an__t--b{stroke:color-mix(in srgb,var(--verde) 18%,transparent);}
.an__t--c{stroke:color-mix(in srgb,var(--azul) 18%,transparent);}
.an__v--a{stroke:var(--vermelho);} .an__v--b{stroke:var(--verde);} .an__v--c{stroke:var(--azul);}
.her__dados{flex:1;min-width:0;}
.her__pct{font-size:44px;font-weight:700;letter-spacing:-.035em;line-height:1;}
.her__pct small{font-size:20px;color:var(--tx3);margin-left:2px;}
.her__leg{font-size:13px;color:var(--tx2);margin-top:4px;}
.leg{display:flex;flex-direction:column;gap:8px;margin:16px 0 16px;}
.leg__l{display:flex;align-items:center;gap:9px;}
.ponto{width:9px;height:9px;border-radius:50%;flex:0 0 9px;}
.p--a{background:var(--vermelho);} .p--b{background:var(--verde);} .p--c{background:var(--azul);}
.leg__r{flex:1;font-size:13px;display:flex;flex-direction:column;}
.leg__r em{font-style:normal;font-size:11.5px;color:var(--tx3);}
.leg__v{font-size:13.5px;font-weight:600;font-variant-numeric:tabular-nums;}

/* riscos */
.riscos{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px;}
.risco{border-radius:11px;padding:13px 14px;background:var(--fill);border-left:3px solid var(--cinza);}
.risco--risco{border-left-color:var(--vermelho);background:color-mix(in srgb,var(--vermelho) 7%,transparent);}
.risco--atencao{border-left-color:var(--laranja);background:color-mix(in srgb,var(--laranja) 7%,transparent);}
.risco strong{font-size:13.5px;font-weight:600;}
.risco p{font-size:12.5px;color:var(--tx2);margin:5px 0 7px;line-height:1.5;}
.risco em{font-style:normal;font-size:11px;color:var(--tx3);}

/* fases */
.fases{display:flex;flex-direction:column;gap:14px;}
.fase__cab{display:flex;align-items:center;gap:12px;}
.fase__n{width:26px;height:26px;flex:0 0 26px;border-radius:50%;background:var(--fill2);color:var(--tx2);
display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;}
.fase--ok .fase__n{background:var(--verde);color:#fff;}
.fase__ti{flex:1;min-width:0;}
.fase__ti h3{font-size:15.5px;font-weight:600;letter-spacing:-.018em;}
.fase__ti em{font-style:normal;font-size:11.5px;color:var(--tx3);}

/* conversa */
.conv{display:flex;flex:1;min-height:0;margin:-24px -26px -60px;}
.conv__lista{width:196px;flex:0 0 196px;border-right:.5px solid var(--sep);padding:18px 10px;display:flex;flex-direction:column;gap:2px;}
.conv__nota{margin-top:auto;font-size:11.5px;color:var(--tx3);padding:12px 10px 0;border-top:.5px solid var(--sep);line-height:1.5;}
.conv__chat{flex:1;display:flex;flex-direction:column;min-width:0;background:var(--cart);}
.conv__cab{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 22px;border-bottom:.5px solid var(--sep);}
.conv__cab h2{font-size:16px;font-weight:600;letter-spacing:-.02em;}
.conv__cab em{font-style:normal;font-size:12px;color:var(--tx3);}
.conv__fluxo{flex:1;overflow-y:auto;padding:20px 22px;display:flex;flex-direction:column;gap:14px;}
.bloco{display:flex;gap:9px;align-items:flex-end;max-width:78%;}
.bloco--meu{margin-left:auto;flex-direction:row-reverse;}
.bloco__c{min-width:0;}
.bloco__n{font-size:11.5px;color:var(--tx3);margin:0 0 4px 12px;font-weight:500;}
.bloco__n em{font-style:normal;margin-left:5px;font-weight:400;}
.balao{background:var(--balao);padding:9px 14px;border-radius:19px;border-bottom-left-radius:5px;font-size:14px;line-height:1.4;}
.balao--meu{background:var(--azul);color:#fff;border-bottom-left-radius:19px;border-bottom-right-radius:5px;}
.bloco__a{display:flex;gap:13px;margin:6px 0 0 12px;opacity:0;transition:opacity .15s;}
.bloco--meu .bloco__a{justify-content:flex-end;margin:6px 12px 0 0;}
.bloco:hover .bloco__a{opacity:1;}
.bloco__a button{display:flex;align-items:center;gap:4px;font-size:11.5px;color:var(--tx3);}
.bloco__a button:hover{color:var(--azul);}
.compo{display:flex;align-items:center;gap:8px;padding:12px 20px;border-top:.5px solid var(--sep);}
.compo input{flex:1;background:var(--fill);border-radius:18px;padding:9px 15px;font-size:14px;}
.enviar{width:30px;height:30px;flex:0 0 30px;border-radius:50%;background:var(--azul);color:#fff;
display:flex;align-items:center;justify-content:center;}
.enviar:hover{filter:brightness(1.1);}

/* segmentado */
.seg{display:inline-flex;background:var(--fill2);border-radius:9px;padding:2px;gap:2px;align-self:flex-start;flex-wrap:wrap;}
.seg button{padding:5px 13px;border-radius:7px;font-size:12.5px;font-weight:500;color:var(--tx2);}
.seg button.on{background:var(--cart);color:var(--tx);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.1);}

/* métricas */
.metricas{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:14px;}
.met{background:var(--cart);border-radius:14px;box-shadow:var(--sombra);padding:14px 16px;}
.met__r{font-size:12px;color:var(--tx2);font-weight:500;}
.met__v{font-size:23px;font-weight:700;letter-spacing:-.03em;margin:5px 0 2px;font-variant-numeric:tabular-nums;}
.met__n{font-size:11.5px;color:var(--tx3);}
.aporte{padding:8px 0;}
.aporte__t{display:flex;justify-content:space-between;align-items:baseline;font-size:13.5px;margin-bottom:6px;}
.aporte__t em{font-style:normal;font-size:12px;color:var(--tx3);font-variant-numeric:tabular-nums;}

/* reuniões */
.reu__cab{display:flex;gap:14px;align-items:center;}
.data{width:48px;height:48px;flex:0 0 48px;border-radius:11px;background:var(--fill);display:flex;
flex-direction:column;align-items:center;justify-content:center;}
.data__m{font-size:9.5px;font-weight:700;color:var(--vermelho);letter-spacing:.06em;}
.data__d{font-size:19px;font-weight:600;letter-spacing:-.02em;line-height:1.05;}
.reu__ti h3{font-size:15.5px;font-weight:600;letter-spacing:-.018em;}
.reu__ti em{font-style:normal;font-size:12px;color:var(--tx3);}
.reu--alerta{box-shadow:var(--sombra),0 0 0 1.5px color-mix(in srgb,var(--laranja) 45%,transparent);}
.aviso{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--laranja);
background:color-mix(in srgb,var(--laranja) 9%,transparent);padding:9px 12px;border-radius:10px;}
.ata{background:var(--fill);border-radius:11px;padding:12px 14px;}
.ata__r{font-size:11px;font-weight:700;color:var(--tx3);letter-spacing:.04em;}
.ata p{font-size:13px;color:var(--tx2);margin-top:5px;line-height:1.5;}

/* deliberações */
.delib h3{font-size:16px;font-weight:600;letter-spacing:-.02em;max-width:70ch;}
.delib__cab{display:flex;justify-content:space-between;align-items:center;}
.delib__cab em{font-style:normal;font-size:11.5px;color:var(--tx3);}
.delib--aberta{box-shadow:var(--sombra),0 0 0 1.5px color-mix(in srgb,var(--laranja) 45%,transparent);}
.cap--voto{height:9px;}
.marcaq{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--tx);border-radius:2px;}
.votos{display:flex;gap:16px;flex-wrap:wrap;}
.voto{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--tx3);}
.voto--sim{color:var(--verde);} .voto--nao{color:var(--vermelho);}
.delib__acao{display:flex;gap:9px;justify-content:flex-end;border-top:.5px solid var(--sep);padding-top:12px;}

/* sócios */
.nota{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--azul);margin-top:4px;}
.parte{font-size:19px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums;}
.capital{display:flex;height:34px;border-radius:9px;overflow:hidden;gap:2px;}
.capital__f{display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:600;color:#fff;}
.capital__f.k0{background:var(--azul);} .capital__f.k1{background:var(--indigo);}
.capital__f.k2{background:var(--verde);} .capital__f.k3{background:var(--laranja);}
.obs{font-size:12.5px;color:var(--tx2);line-height:1.5;}

/* inspetor */
.insp{width:308px;flex:0 0 308px;border-left:.5px solid var(--sep);background:var(--lat);
backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);
padding:16px 14px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;}
.insp__cab{display:flex;justify-content:space-between;align-items:center;}
.insp__t{display:flex;align-items:center;gap:7px;font-size:13.5px;font-weight:600;letter-spacing:-.018em;}
.insp__resumo{font-size:12.5px;color:var(--tx2);line-height:1.55;background:var(--cart);border-radius:11px;padding:12px;}
.leitura{display:flex;gap:9px;text-align:left;background:var(--cart);border-radius:11px;padding:11px 12px;transition:.14s;}
.leitura:hover{transform:translateY(-1px);box-shadow:var(--sombra);}
.leitura__ic{flex:0 0 18px;padding-top:1px;}
.leitura__c{min-width:0;}
.leitura__c strong{font-size:13px;font-weight:600;display:block;}
.leitura__c p{font-size:12px;color:var(--tx2);line-height:1.5;margin:3px 0 5px;}
.leitura__c em{font-style:normal;font-size:10.5px;color:var(--tx3);display:inline-flex;align-items:center;gap:4px;}
.insp__pe{margin-top:auto;font-size:11px;color:var(--tx3);line-height:1.5;padding-top:12px;border-top:.5px solid var(--sep);}

/* toast */
.toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:rgba(28,28,30,.92);
backdrop-filter:blur(20px);color:#fff;padding:11px 18px;border-radius:22px;font-size:13.5px;font-weight:500;
display:flex;align-items:center;gap:8px;z-index:60;box-shadow:0 8px 30px rgba(0,0,0,.25);}

@media (max-width:1200px){.insp{display:none;}}
@media (max-width:900px){
.ap{flex-direction:column;max-height:none;overflow:auto;}
.lat{width:100%;flex:0 0 auto;flex-direction:row;align-items:center;gap:12px;overflow-x:auto;padding:10px 12px;}
.lat__nav{flex-direction:row;gap:8px;}
.lat__g{display:flex;gap:2px;}
.lat__gt,.lat__pe{display:none;}
.item__r{display:none;}
.duplo{grid-template-columns:1fr;}
.cart--her{flex-direction:column;text-align:center;}
.conv{flex-direction:column;margin:0;}
.conv__lista{width:100%;flex:0 0 auto;flex-direction:row;overflow-x:auto;border-right:none;border-bottom:.5px solid var(--sep);}
.conv__nota{display:none;}
.tela{padding:18px;}
.bloco{max-width:92%;}
}
@media (prefers-reduced-motion:reduce){.ap *{transition:none!important;}}
`;
