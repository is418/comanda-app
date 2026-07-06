import { Pedido } from "@/types/pedido";
import { imprimirTexto, imprimirEnDireccion } from "@/lib/printer";
import { obtenerEstaciones, obtenerMapaProductos } from "@/lib/estaciones";

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

export function construirTicketCaja(pedido: Pedido, nombreNegocio: string): string {
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

export function construirTicketEstacion(
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

function agruparPorEstacion(pedido: Pedido): { porEstacion: Map<string, Pedido["items"]>; sinAsignar: boolean } {
  const mapa = obtenerMapaProductos();
  const porEstacion = new Map<string, Pedido["items"]>();
  let sinAsignar = false;
  for (const item of pedido.items) {
    const estId = mapa[item.producto];
    if (!estId) {
      sinAsignar = true;
      continue;
    }
    if (!porEstacion.has(estId)) porEstacion.set(estId, []);
    porEstacion.get(estId)!.push(item);
  }
  return { porEstacion, sinAsignar };
}

/** Imprime solo en las estaciones de cocina (todas menos la marcada como Caja). */
export async function imprimirEnCocina(
  pedido: Pedido,
  nombreNegocio: string
): Promise<{ fallas: string[]; sinAsignar: boolean; huboEstaciones: boolean }> {
  const estaciones = obtenerEstaciones();
  const cocinaEstaciones = estaciones.filter((e) => !e.esCaja && e.impresora);
  if (cocinaEstaciones.length === 0) {
    return { fallas: [], sinAsignar: false, huboEstaciones: false };
  }

  const { porEstacion, sinAsignar } = agruparPorEstacion(pedido);
  const fallas: string[] = [];

  for (const est of cocinaEstaciones) {
    const items = porEstacion.get(est.id);
    if (!items || items.length === 0) continue;
    try {
      await imprimirEnDireccion(
        est.impresora,
        construirTicketEstacion(pedido, nombreNegocio, est.nombre, items)
      );
    } catch {
      fallas.push(est.nombre);
    }
  }

  return { fallas, sinAsignar, huboEstaciones: true };
}

/** Imprime solo el ticket de Caja (total + productos, para el cliente). */
export async function imprimirEnCaja(
  pedido: Pedido,
  nombreNegocio: string
): Promise<{ ok: boolean; huboImpresoraCaja: boolean }> {
  const estaciones = obtenerEstaciones();
  const caja = estaciones.find((e) => e.esCaja && e.impresora);

  if (caja) {
    try {
      await imprimirEnDireccion(caja.impresora, construirTicketCaja(pedido, nombreNegocio));
      return { ok: true, huboImpresoraCaja: true };
    } catch {
      return { ok: false, huboImpresoraCaja: true };
    }
  }

  // Sin estaciones configuradas todavia: usar la impresora simple guardada (compatibilidad).
  if (estaciones.length === 0) {
    try {
      await imprimirTexto(construirTicketCaja(pedido, nombreNegocio));
      return { ok: true, huboImpresoraCaja: true };
    } catch {
      return { ok: false, huboImpresoraCaja: true };
    }
  }

  return { ok: false, huboImpresoraCaja: false };
}
