"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutGrid,
  Route,
  MessageCircle,
  Folder,
  Wallet,
  Calendar,
  Scale,
  Users,
  Sparkles,
  Search,
  Sun,
  Moon,
  X,
  AlertTriangle,
  Bell,
  Clock,
  ShieldCheck,
  ArrowRight,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { iniciais } from "@/lib/iniciais";
import { formatarFatos } from "@/lib/copiloto/formatar-fatos";
import { createClient } from "@/lib/supabase/client";
import { ConfiguracoesModal } from "./configuracoes-modal";
import type { Leitura, Severidade } from "@/lib/regras/tipos";

type ItemNav = { href: string; rot: string; Ico: LucideIcon; cor: string };
type GrupoNav = { rot: string; itens: ItemNav[] };

const GRUPOS_NAV: GrupoNav[] = [
  {
    rot: "Fundação",
    itens: [
      { href: "/", rot: "Visão geral", Ico: LayoutGrid, cor: "azul" },
      { href: "/trilha", rot: "Trilha", Ico: Route, cor: "indigo" },
    ],
  },
  {
    rot: "Trabalho",
    itens: [
      { href: "/debates", rot: "Debates", Ico: MessageCircle, cor: "verde" },
      { href: "/cofre", rot: "Documentos", Ico: Folder, cor: "azul" },
      { href: "/financeiro", rot: "Financeiro", Ico: Wallet, cor: "verde" },
    ],
  },
  {
    rot: "Governança",
    itens: [
      { href: "/deliberacoes", rot: "Deliberações", Ico: Scale, cor: "laranja" },
      { href: "/reunioes", rot: "Reuniões", Ico: Calendar, cor: "vermelho" },
      { href: "/socios", rot: "Sócios", Ico: Users, cor: "roxo" },
    ],
  },
];

const ROTA_POR_TABELA: Record<string, string> = {
  fases: "/trilha",
  fase_itens: "/trilha",
  documentos: "/cofre",
  deliberacoes: "/deliberacoes",
  reunioes: "/reunioes",
  aportes: "/financeiro",
  movimentos: "/financeiro",
  sugestoes: "/debates",
};

const CONFIG_SEVERIDADE: Record<Severidade, { cor: string; Ico: LucideIcon }> = {
  risco: { cor: "vermelho", Ico: AlertTriangle },
  acao: { cor: "laranja", Ico: Bell },
  atencao: { cor: "azul", Ico: Clock },
  info: { cor: "verde", Ico: ShieldCheck },
};

export function Shell({
  nome,
  papel,
  leituras,
  resumo,
  email,
  nomeExibicao,
  avatarUrl,
  children,
}: {
  nome: string;
  papel: string | null;
  leituras: Leitura[];
  resumo: string;
  email: string;
  nomeExibicao: string | null;
  avatarUrl: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [tema, setTema] = useState<"claro" | "escuro">("claro");
  const [copiloto, setCopiloto] = useState(true);
  const [configAberto, setConfigAberto] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = tema === "escuro" ? "escuro" : "";
  }, [tema]);

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const tituloAtual = GRUPOS_NAV.flatMap((g) => g.itens).find((i) => i.href === pathname)?.rot ?? "";
  const nomeMostrado = nomeExibicao ?? nome;

  return (
    <div className="ap">
      <aside className="lat">
        <div className="lat__marca">
          <Image src="/icon.png" alt="" width={34} height={34} style={{ borderRadius: 9 }} priority />
          <div>
            <div className="appicon__n">Tailor Made</div>
            <div className="appicon__s">Fundação · 2026</div>
          </div>
        </div>
        <nav className="lat__nav">
          {GRUPOS_NAV.map((g) => (
            <div key={g.rot} className="lat__g">
              <div className="lat__gt">{g.rot}</div>
              {g.itens.map(({ href, rot, Ico, cor }) => (
                <Link key={href} href={href} className={`item ${pathname === href ? "item--on" : ""}`}>
                  <span className={`item__ic c-${cor}`}>
                    <Ico size={14} strokeWidth={2.1} />
                  </span>
                  <span className="item__r">{rot}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="lat__rodape">
          <button type="button" className="item" onClick={() => setConfigAberto(true)}>
            <span className="item__ic c-cinza">
              <Settings size={14} strokeWidth={2.1} />
            </span>
            <span className="item__r">Configurações</span>
          </button>
          <button type="button" className="item item--sair" onClick={sair}>
            <span className="item__ic c-vermelho">
              <LogOut size={14} strokeWidth={2.1} />
            </span>
            <span className="item__r">Sair</span>
          </button>
        </div>
      </aside>

      <div className="col">
        <header className="barra">
          <span className="barra__t">{tituloAtual}</span>
          <div className="campo">
            <Search size={14} strokeWidth={2.4} />
            <input placeholder="Buscar" />
          </div>
          <div className="barra__dir">
            <button
              className="glifo"
              onClick={() => setTema(tema === "claro" ? "escuro" : "claro")}
              title="Alternar aparência"
            >
              {tema === "claro" ? <Moon size={16} strokeWidth={2} /> : <Sun size={16} strokeWidth={2} />}
            </button>
            <label className="switch" title="Copiloto">
              <input type="checkbox" checked={copiloto} onChange={() => setCopiloto(!copiloto)} />
              <span />
            </label>
            <button
              type="button"
              className="ava-bt"
              onClick={() => setConfigAberto(true)}
              title={`${nomeMostrado} · ${papel ?? "sem papel"}`}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="ava ava--foto" />
              ) : (
                <span className="ava ava--eu">{iniciais(nomeMostrado)}</span>
              )}
            </button>
          </div>
        </header>

        <div className="corpo">
          <main className="tela">{children}</main>

          {copiloto && (
            <aside className="insp">
              <div className="insp__cab">
                <span className="insp__t">
                  <Sparkles size={13} strokeWidth={2.2} /> Copiloto
                </span>
                <button className="glifo glifo--min" onClick={() => setCopiloto(false)}>
                  <X size={14} />
                </button>
              </div>
              <p className="insp__resumo">{resumo}</p>
              {leituras.map((l) => {
                const { cor, Ico } = CONFIG_SEVERIDADE[l.severidade];
                const rota = ROTA_POR_TABELA[l.origem.tabela];
                const conteudo = (
                  <>
                    <span className={`leitura__ic c-${cor}`}>
                      <Ico size={13} strokeWidth={2.3} />
                    </span>
                    <span className="leitura__c">
                      <strong>{l.titulo}</strong>
                      <p>{formatarFatos(l)}</p>
                      <em>
                        origem: {l.origem.tabela} <ArrowRight size={10} />
                      </em>
                    </span>
                  </>
                );
                const chave = `${l.regra}-${l.origem.id}`;
                return rota ? (
                  <Link key={chave} href={rota} className="leitura">
                    {conteudo}
                  </Link>
                ) : (
                  <div key={chave} className="leitura">
                    {conteudo}
                  </div>
                );
              })}
              <p className="insp__pe">
                O copiloto só afirma o que consegue apontar em um registro do painel. Sem registro, ele não
                conclui.
              </p>
            </aside>
          )}
        </div>
      </div>

      <ConfiguracoesModal
        aberto={configAberto}
        onFechar={() => setConfigAberto(false)}
        nomeAtual={nomeMostrado}
        avatarUrlAtual={avatarUrl}
        email={email}
      />
    </div>
  );
}
