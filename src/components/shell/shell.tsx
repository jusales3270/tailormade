"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  type LucideIcon,
} from "lucide-react";
import { iniciais } from "@/lib/iniciais";

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
  children,
}: {
  nome: string;
  papel: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [tema, setTema] = useState<"claro" | "escuro">("claro");
  const [copiloto, setCopiloto] = useState(true);

  useEffect(() => {
    document.documentElement.dataset.theme = tema === "escuro" ? "escuro" : "";
  }, [tema]);

  const tituloAtual = GRUPOS_NAV.flatMap((g) => g.itens).find((i) => i.href === pathname)?.rot ?? "";

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
            <span className="ava ava--eu" title={`${nome} · ${papel ?? "sem papel"}`}>
              {iniciais(nome)}
            </span>
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
              <p className="insp__resumo">
                O motor de regras ainda não foi construído (T-007) — por enquanto não há leituras para
                mostrar.
              </p>
              <p className="insp__pe">
                O copiloto só afirma o que consegue apontar em um registro do painel. Sem registro, ele não
                conclui.
              </p>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
