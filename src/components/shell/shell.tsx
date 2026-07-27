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
  Search,
  Sun,
  Moon,
  Bell,
  X,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { createClient } from "@/lib/supabase/client";
import { ConfiguracoesModal } from "./configuracoes-modal";
import { QuadroAvisos } from "./quadro-avisos";
import type { Aviso } from "@/lib/avisos";

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

export function Shell({
  nome,
  papel,
  avisos,
  email,
  avatarUrl,
  children,
}: {
  nome: string;
  papel: string | null;
  avisos: Aviso[];
  email: string;
  avatarUrl: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [tema, setTema] = useState<"claro" | "escuro">("claro");
  const [avisosAbertos, setAvisosAbertos] = useState(true);
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
  // Contador no sino: no celular o painel de avisos fica fechado por padrão, então o
  // número é a única pista de que há coisa nova para ler.
  const naoLidos = avisos.filter((a) => !a.lido).length;

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
            <button
              type="button"
              className="glifo glifo--sino"
              onClick={() => setAvisosAbertos((v) => !v)}
              title="Avisos"
              aria-label={`Avisos${naoLidos > 0 ? `, ${naoLidos} não lidos` : ""}`}
              aria-expanded={avisosAbertos}
            >
              <Bell size={16} strokeWidth={2} />
              {naoLidos > 0 && <span className="glifo__conta">{naoLidos > 9 ? "9+" : naoLidos}</span>}
            </button>
            <button
              type="button"
              className="ava-bt"
              onClick={() => setConfigAberto(true)}
              title={`${nome} · ${papel ?? "sem papel"}`}
            >
              <Avatar nome={nome} avatarUrl={avatarUrl} className={avatarUrl ? "" : "ava--eu"} />
            </button>
          </div>
        </header>

        <div className="corpo">
          <main className="tela">{children}</main>

          {avisosAbertos && (
            <>
              <button
                type="button"
                className="insp__fundo"
                onClick={() => setAvisosAbertos(false)}
                aria-label="Fechar avisos"
              />
              <aside className="insp">
                <button
                  type="button"
                  className="glifo glifo--min insp__fechar"
                  onClick={() => setAvisosAbertos(false)}
                  aria-label="Fechar avisos"
                >
                  <X size={15} />
                </button>
                <QuadroAvisos avisos={avisos} />
              </aside>
            </>
          )}
        </div>
      </div>

      <ConfiguracoesModal
        aberto={configAberto}
        onFechar={() => setConfigAberto(false)}
        nomeAtual={nome}
        avatarUrlAtual={avatarUrl}
        email={email}
      />
    </div>
  );
}
