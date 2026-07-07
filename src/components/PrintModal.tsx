"use client";

import { useState } from "react";
import { Pedido } from "@/types/pedido";
import { esAppNativa } from "@/lib/printer";
import { construirTicketCaja, imprimirEnCocina, imprimirEnCaja } from "@/lib/imprimirPedido";

interface Props {
  pedido: Pedido | null;
  nombreNegocio: string;
  onClose: () => void;
}

function imprimirEnRawBT(texto: string) {
  window.location.href =
    "intent:" +
    encodeURIComponent(texto) +
    "#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;";
}

export function PrintModal({ pedido, nombreNegocio, onClose }: Props) {
  const [imprimiendo, setImprimiendo] = useState(false);
  const [errorImpresion, setErrorImpresion] = useState("");

  if (!pedido) return null;

  async function manejarImprimir() {
    setErrorImpresion("");

    if (!esAppNativa()) {
      imprimirEnRawBT(construirTicketCaja(pedido!, nombreNegocio));
      return;
    }

    // Una vez que el pedido ya esta listo o entregado, la cocina ya lo hizo
    // (le llego su ticket al aceptar) - reimprimir manualmente en ese punto
    // solo debe repetir el ticket de Caja, no volver a mandar a cocina.
    const soloCaja = pedido!.estado === "listo" || pedido!.estado === "entregado";

    setImprimiendo(true);
    try {
      const resultadoCocina = soloCaja
        ? { fallas: [], sinAsignar: false, huboEstaciones: true }
        : await imprimirEnCocina(pedido!, nombreNegocio);
      const resultadoCaja = await imprimirEnCaja(pedido!, nombreNegocio);

      const fallas = [...resultadoCocina.fallas];
      if (resultadoCaja.huboImpresoraCaja && !resultadoCaja.ok) fallas.push("Caja");

      if (!resultadoCocina.huboEstaciones && !resultadoCaja.huboImpresoraCaja) {
        setErrorImpresion(
          "No hay ninguna impresora configurada. Ve a Estaciones para configurar una."
        );
      } else if (fallas.length > 0) {
        setErrorImpresion(`No se pudo imprimir en: ${fallas.join(", ")}.`);
      } else if (resultadoCocina.sinAsignar) {
        setErrorImpresion(
          "Algunos productos no tienen estacion asignada (ve a Estaciones para asignarlos)."
        );
      }
    } finally {
      setImprimiendo(false);
    }
  }

  return (
    <div
      className="print-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="receipt-wrap">
        <div className="receipt">
          <div className="r-title">COMANDA</div>
          <div className="r-sub">{nombreNegocio}</div>
          <hr />
          <div className="r-row">
            <span>Folio</span>
            <span>#{pedido.folio}</span>
          </div>
          <div className="r-row">
            <span>Cliente</span>
            <span>{pedido.cliente}</span>
          </div>
          <div className="r-row">
            <span>Tel</span>
            <span>•••• {pedido.telefono}</span>
          </div>
          <hr />
          {pedido.items.map((i, idx) => (
            <div key={idx}>
              <div className="r-row">
                <span>
                  {i.cantidad}x {i.producto}
                </span>
              </div>
              {i.mods ? (
                <div
                  style={{
                    fontSize: "10.5px",
                    color: "#666",
                    margin: "-2px 0 4px 10px",
                  }}
                >
                  {i.mods}
                </div>
              ) : null}
            </div>
          ))}
          <hr />
          <div className="r-row r-total">
            <span>TOTAL</span>
            <span>${pedido.total}</span>
          </div>
          <hr />
          <div style={{ fontSize: "10.5px" }}>📍 {pedido.direccion}</div>
          {pedido.nota ? (
            <div style={{ fontSize: "10.5px", marginTop: "6px" }}>
              📌 {pedido.nota}
            </div>
          ) : null}
        </div>
        {errorImpresion ? (
          <div style={{ padding: "0 18px", fontSize: 11.5, color: "#b23a2b" }}>
            {errorImpresion}
          </div>
        ) : null}
        <div className="modal-actions">
          <button className="modal-close" onClick={onClose}>
            Cerrar
          </button>
          <button className="modal-print" onClick={manejarImprimir} disabled={imprimiendo}>
            {imprimiendo ? "Imprimiendo..." : "🖨️ Imprimir"}
          </button>
        </div>
      </div>
    </div>
  );
}
