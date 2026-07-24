import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

const ROTAS_PUBLICAS = ["/login", "/auth/callback", "/definir-senha"];

// Ativos estáticos (arquivo com extensão, ex. /logo.png) e rotas especiais de metadata
// do Next (/icon, /apple-icon — sem extensão na URL) nunca passam pela checagem de
// sessão. Verificado em JS puro em vez de depender só do regex do proxyConfig.matcher:
// o matcher do Next compilou nosso padrão de forma diferente do regex testado em Node
// e deixava passar /logo.png sem excluir de fato.
const ROTAS_METADATA_SEM_EXTENSAO = ["/icon", "/apple-icon", "/manifest.webmanifest"];

function ehAtivoEstatico(pathname: string) {
  if (pathname.startsWith("/_next/")) return true;
  if (ROTAS_METADATA_SEM_EXTENSAO.includes(pathname)) return true;
  const ultimoSegmento = pathname.split("/").pop() ?? "";
  return ultimoSegmento.includes(".");
}

export async function updateSession(request: NextRequest) {
  if (ehAtivoEstatico(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const rotaPublica = ROTAS_PUBLICAS.some((rota) => request.nextUrl.pathname.startsWith(rota));

  if (!data?.claims && !rotaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("proximo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
