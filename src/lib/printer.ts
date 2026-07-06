import { Capacitor } from "@capacitor/core";
import { BluetoothPrinter } from "@kduma-autoid/capacitor-bluetooth-printer";

const STORAGE_KEY = "comanda_printer_address";

export function esAppNativa(): boolean {
  return Capacitor.isNativePlatform();
}

export function obtenerImpresoraGuardada(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function guardarImpresora(address: string) {
  localStorage.setItem(STORAGE_KEY, address);
}

export async function listarDispositivos() {
  const { devices } = await BluetoothPrinter.list();
  return devices;
}

export async function imprimirTexto(texto: string) {
  const address = obtenerImpresoraGuardada();
  if (!address) {
    throw new Error("NO_PRINTER_CONFIGURED");
  }
  await BluetoothPrinter.connectAndPrint({ address, data: texto });
}

export async function imprimirEnDireccion(address: string, texto: string) {
  await BluetoothPrinter.connectAndPrint({ address, data: texto });
}
