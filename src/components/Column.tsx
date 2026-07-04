"use client";

import { Pedido } from "@/types/pedido";
import { TicketCard } from "./TicketCard";

type ColumnaTipo = "nuevo" | "en_preparacion" | "listo";

interface Props {
  columna: ColumnaTipo;
  titulo: string;
  claseColumna: string;
  pedidos: Pedido[];
  totalSinFiltrar: number;
  now: number;
  busyIds: Set<number>;
  onAccept: (id: number) => void;
  onReject: (id: number) => Promise<void>;
  onReady: (id: number) => void;
  onDone: (id: number) => void;
  onPrint: (id: number) => void;
  onSaveNota: (id: number, nota: string) => void;
}

export function Column({
  columna,
  titulo,
  claseColumna,
  pedidos,
  totalSinFiltrar,
  now,
  busyIds,
  onAccept,
  onReject,
  onReady,
  onDone,
  onPrint,
  onSaveNota,
}: Props) {
  return (
    <div className={`column ${claseColumna}`}>
      <div className="column-head">
        <div className="ctitle">
          <span className="bar" />
          {titulo}
        </div>
        <span className="count-pill">{totalSinFiltrar}</span>
      </div>

      {pedidos.length === 0 ? (
        <div className="empty-col">
          {totalSinFiltrar > 0
            ? "Sin resultados para tu búsqueda"
            : "Sin pedidos aquí por ahora"}
        </div>
      ) : (
        pedidos.map((p) => (
          <TicketCard
            key={p.id}
            pedido={p}
            columna={columna}
            now={now}
            busy={busyIds.has(p.id)}
            onAccept={onAccept}
            onReject={onReject}
            onReady={onReady}
            onDone={onDone}
            onPrint={onPrint}
            onSaveNota={onSaveNota}
          />
        ))
      )}
    </div>
  );
}
