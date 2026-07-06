"use client";

import { useState } from "react";
import type { BluetoothDevice } from "@kduma-autoid/capacitor-bluetooth-printer";
import { listarDispositivos, guardarImpresora, obtenerImpresoraGuardada } from "@/lib/printer";

interface Props {
  onClose: () => void;
}

export function PrinterSettingsModal({ onClose }: Props) {
  const [dispositivos, setDispositivos] = useState<BluetoothDevice[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [seleccionada, setSeleccionada] = useState(obtenerImpresoraGuardada());

  async function buscar() {
    setCargando(true);
    setError("");
    try {
      const devices = await listarDispositivos();
      setDispositivos(devices);
      if (devices.length === 0) {
        setError("No se encontraron impresoras emparejadas. Empareja la impresora en Ajustes > Bluetooth primero.");
      }
    } catch {
      setError("No se pudo buscar dispositivos. Revisa que el Bluetooth este activado.");
    } finally {
      setCargando(false);
    }
  }

  function elegir(address: string) {
    guardarImpresora(address);
    setSeleccionada(address);
  }

  return (
    <div
      className="print-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="receipt-wrap" style={{ width: 340 }}>
        <div className="receipt">
          <div className="r-title">Configurar impresora</div>
          <hr />
          {seleccionada ? (
            <div style={{ fontSize: 11, marginBottom: 10 }}>
              Impresora guardada: <b>{seleccionada}</b>
            </div>
          ) : (
            <div style={{ fontSize: 11, marginBottom: 10, color: "#8a5a1e" }}>
              Todavia no hay impresora configurada.
            </div>
          )}
          <button
            className="btn btn-primary"
            onClick={buscar}
            disabled={cargando}
            style={{ width: "100%", marginBottom: 10 }}
          >
            {cargando ? "Buscando..." : "Buscar impresoras emparejadas"}
          </button>
          {error && (
            <div style={{ color: "#b23a2b", fontSize: 11, marginBottom: 10 }}>
              {error}
            </div>
          )}
          {dispositivos.map((d) => (
            <button
              key={d.address}
              onClick={() => elegir(d.address)}
              className="btn btn-ghost"
              style={{
                width: "100%",
                marginBottom: 6,
                justifyContent: "space-between",
              }}
            >
              <span>{d.name || "Sin nombre"}</span>
              {seleccionada === d.address ? "✓" : ""}
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <button className="modal-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
