import { Estacion } from "@/types/estacion";

const KEY_ESTACIONES = "comanda_estaciones";
const KEY_MAPA_PRODUCTOS = "comanda_producto_estacion";

export function obtenerEstaciones(): Estacion[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY_ESTACIONES);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function guardarEstaciones(estaciones: Estacion[]) {
  localStorage.setItem(KEY_ESTACIONES, JSON.stringify(estaciones));
}

export function obtenerMapaProductos(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(KEY_MAPA_PRODUCTOS);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function guardarMapaProductos(mapa: Record<string, string>) {
  localStorage.setItem(KEY_MAPA_PRODUCTOS, JSON.stringify(mapa));
}

export function nuevoIdEstacion(): string {
  return `est_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
