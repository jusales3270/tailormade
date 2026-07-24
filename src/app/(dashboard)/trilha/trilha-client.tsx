"use client";

import { useState } from "react";
import { FaseCard } from "./fase-card";
import { Gantt } from "./gantt";
import type { FaseUI } from "./tipos";

export function TrilhaClient({ fases }: { fases: FaseUI[] }) {
  const [vista, setVista] = useState<"lista" | "gantt">("lista");

  return (
    <>
      <div className="seg">
        <button className={vista === "lista" ? "on" : ""} onClick={() => setVista("lista")}>
          Lista
        </button>
        <button className={vista === "gantt" ? "on" : ""} onClick={() => setVista("gantt")}>
          Linha do tempo
        </button>
      </div>

      {vista === "lista" ? (
        <div className="fases">
          {fases.map((fase, i) => (
            <FaseCard key={fase.id} fase={fase} indice={i} />
          ))}
        </div>
      ) : (
        <Gantt fases={fases} />
      )}
    </>
  );
}
