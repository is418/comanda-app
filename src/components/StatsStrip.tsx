import { promedioPrep } from "@/lib/timers";

interface Props {
  totalPedidos: number;
  ventaTotal: number;
  enPreparacion: number;
  temposPrepMin: number[];
}

export function StatsStrip({
  totalPedidos,
  ventaTotal,
  enPreparacion,
  temposPrepMin,
}: Props) {
  const ticketProm = totalPedidos
    ? "$" + Math.round(ventaTotal / totalPedidos)
    : "$0";

  return (
    <div className="stats">
      <div className="stat">
        <div className="label">Pedidos hoy</div>
        <div className="value">{totalPedidos}</div>
        <div className="delta up" />
      </div>
      <div className="stat">
        <div className="label">Venta hoy</div>
        <div className="value">${ventaTotal.toLocaleString("es-MX")}</div>
        <div className="delta up" />
      </div>
      <div className="stat">
        <div className="label">Ticket promedio</div>
        <div className="value small">{ticketProm}</div>
      </div>
      <div className="stat">
        <div className="label">En preparación</div>
        <div className="value small">{enPreparacion}</div>
      </div>
      <div className="stat">
        <div className="label">Tiempo prom. prep.</div>
        <div className="value small">{promedioPrep(temposPrepMin)}</div>
      </div>
    </div>
  );
}
