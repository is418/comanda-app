"use client";

import { useState } from "react";
import { Pedido } from "@/types/pedido";
import { esAppNativa, imprimirTexto, imprimirEnDireccion } from "@/lib/printer";
import { obtenerEstaciones, obtenerMapaProductos } from "@/lib/estaciones";

interface Props {
  pedido: Pedido | null;
  nombreNegocio: string;
  onClose: () => void;
}

const ANCHO_TICKET = 32; // caracteres por linea en papel de 58mm

function centrar(texto: string): string {
  const espacios = Math.max(0, Math.floor((ANCHO_TICKET - texto.length) / 2));
  return " ".repeat(espacios) + texto;
}

function encabezado(pedido: Pedido, nombreNegocio: string): string {
  const linea = "-".repeat(ANCHO_TICKET);
  let t = "";
  t += centrar("COMANDA") + "\n";
  t += centrar(nombreNegocio) + "\n";
  t += linea + "\n";
  t += `Folio: #${pedido.folio}\n`;
  t += `Cliente: ${pedido.cliente}\n`;
  t += `Tel: ....${pedido.telefono}\n`;
  t += linea + "\n";
  return t;
}

function construirTicketCaja(pedido: Pedido, nombreNegocio: string): string {
  const linea = "-".repeat(ANCHO_TICKET);
  let t = encabezado(pedido, nombreNegocio);
  for (const i of pedido.items) {
    t += `${i.cantidad}x ${i.producto}\n`;
    if (i.mods) t += `   ${i.mods}\n`;
  }
  t += linea + "\n";
  t += `TOTAL: $${pedido.total}\n`;
  t += linea + "\n";
  if (pedido.direccion) t += `${pedido.direccion}\n`;
  if (pedido.nota) t += `Nota: ${pedido.nota}\n`;
  t += "\n\n\n";
  return t;
}

function construirTicketEstacion(
  pedido: Pedido,
  nombreNegocio: string,
  nombreEstacion: string,
  items: Pedido["items"]
): string {
  const linea = "-".repeat(ANCHO_TICKET);
  let t = encabezado(pedido, nombreNegocio);
  t += centrar(nombreEstacion.toUpperCase()) + "\n";
  t += linea + "\n";
  for (const i of items) {
    t += `${i.cantidad}x ${i.producto}\n`;
    if (i.mods) t += `   >> ${i.mods}\n`;
  }
  if (pedido.nota) t += `\nNota: ${pedido.nota}\n`;
  t += "\n\n\n";
  return t;
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

    const estaciones = obtenerEstaciones();

    if (estaciones.length === 0) {
      // Sin estaciones configuradas: comportamiento simple de antes (una sola impresora).
      setImprimiendo(true);
      try {
        await imprimirTexto(construirTicketCaja(pedido!, nombreNegocio));
      } catch (e) {
        if (e instanceof Error && e.message === "NO_PRINTER_CONFIGURED") {
          setErrorImpresion(
            "No hay impresora configurada. Ve a Configurar impresora primero."
          );
        } else {
          setErrorImpresion("No se pudo imprimir. Revisa el Bluetooth de la impresora.");
        }
      } finally {
        setImprimiendo(false);
      }
      return;
    }

    // Con estaciones configuradas: repartir productos por estacion.
    setImprimiendo(true);
    const mapa = obtenerMapaProductos();
    const fallas: string[] = [];
    let huboSinAsignar = false;

    try {
      const porEstacion = new Map<string, Pedido["items"]>();
      for (const item of pedido!.items) {
        const estId = mapa[item.producto];
        if (!estId) {
          huboSinAsignar = true;
          continue;
        }
        if (!porEstacion.has(estId)) porEstacion.set(estId, []);
        porEstacion.get(estId)!.push(item);
      }

      for (const est of estaciones.filter((e) => !e.esCaja)) {
        const items = porEstacion.get(est.id);
        if (!items || items.length === 0 || !est.impresora) continue;
        try {
          await imprimirEnDireccion(
            est.impresora,
            construirTicketEstacion(pedido!, nombreNegocio, est.nombre, items)
          );
        } catch {
          fallas.push(est.nombre);
        }
      }

      const caja = estaciones.find((e) => e.esCaja && e.impresora);
      if (caja) {
        try {
          await imprimirEnDireccion(caja.impresora, construirTicketCaja(pedido!, nombreNegocio));
        } catch {
          fallas.push(caja.nombre);
        }
      }

      if (fallas.length > 0) {
        setErrorImpresion(`No se pudo imprimir en: ${fallas.join(", ")}.`);
      } else if (huboSinAsignar) {
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
