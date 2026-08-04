import type { CSSProperties } from "react";

// Campos de texto, data e select repetem o mesmo visual nos quatro formulários da Trilha
// (nova fase, editar fase, novo item, reabrir item). O estilo mora aqui em vez de virar
// quatro cópias de style inline.
export const CAMPO: CSSProperties = {
  background: "var(--fill)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 13.5,
};
