import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// Next.js 16 renomeou middleware.ts -> proxy.ts (mesma função, export renomeado).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Exclusão fina de estático/metadata (logo.png, /icon etc.) mora em updateSession, em
// JS puro — o matcher aqui só corta o pipeline interno do Next, que nunca precisa disso.
export const proxyConfig = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
