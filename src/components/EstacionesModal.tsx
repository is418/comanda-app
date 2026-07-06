"use client";

import { useState } from "react";
import type { BluetoothDevice } from "@kduma-autoid/capacitor-bluetooth-printer";
import { listarDispositivos, imprimirEnDireccion } from "@/lib/printer";
import {
  obtenerEstaciones,
  guardarEstaciones,
  obtenerMapaProductos,
  guardarMapaProductos,
  nuevoIdEstacion,
} from "@/lib/estaciones";
import { Estacion } from "@/types/estacion";

interface Props {
  productos: string[];
  onClose: () => void;
}

export function EstacionesModal({ productos, onClose }: Props) {
  const [estaciones, setEstaciones] = useState<Estacion[]>(obtenerEstaciones());
  const [mapa, setMapa] = useState<Record<string, string>>(obtenerMapaProductos());
  const [dispositivos, setDispositivos] = useState<BluetoothDevice[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const [nombreNueva, setNombreNueva] = useState("");
  const [probando, setProbando] = useState<string | null>(null);
  const [resultadoPrueba, setResultadoPrueba] = useState<Record<string, string>>({});

  async function buscarImpresoras() {
    setBuscando(true);
    setError("");
    try {
      const devices = await listarDispositivos();
      setDispositivos(devices);
      if (devices.length === 0) {
        setError("No se encontraron impresoras emparejadas.");
      }
    } catch {
      setError("No se pudo buscar dispositivos. Revisa que el Bluetooth este activado.");
    } finally {
      setBuscando(false);
    }
  }

  function agregarEstacion() {
    if (!nombreNueva.trim()) return;
    const nueva: Estacion = {
      id: nuevoIdEstacion(),
      nombre: nombreNueva.trim(),
      impresora: "",
      esCaja: estaciones.length === 0,
    };
    const actualizadas = [...estaciones, nueva];
    setEstaciones(actualizadas);
    guardarEstaciones(actualizadas);
    setNombreNueva("");
  }

  function actualizarEstacion(id: string, cambios: Partial<Estacion>) {
    const actualizadas = estaciones.map((e) => (e.id === id ? { ...e, ...cambios } : e));
    setEstaciones(actualizadas);
    guardarEstaciones(actualizadas);
  }

  function eliminarEstacion(id: string) {
    const actualizadas = estaciones.filter((e) => e.id !== id);
    setEstaciones(actualizadas);
    guardarEstaciones(actualizadas);
  }

  function asignarProducto(producto: string, estacionId: string) {
    const actualizado = { ...mapa, [producto]: estacionId };
    setMapa(actualizado);
    guardarMapaProductos(actualizado);
  }

  async function probarImpresora(est: Estacion) {
    if (!est.impresora) return;
    setProbando(est.id);
    setResultadoPrueba((prev) => ({ ...prev, [est.id]: "" }));
    const hora = new Date().toLocaleTimeString("es-MX");
    const texto = `\n*** PRUEBA DE IMPRESION ***\n\nEstacion: ${est.nombre}\nHora: ${hora}\n\nSi ves esto, esta impresora\nes la de "${est.nombre}".\n\n\n`;
    try {
      await imprimirEnDireccion(est.impresora, texto);
      setResultadoPrueba((prev) => ({ ...prev, [est.id]: "ok" }));
    } catch {
      setResultadoPrueba((prev) => ({ ...prev, [est.id]: "error" }));
    } finally {
      setProbando(null);
    }
  }

  return (
    <div
      className="print-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="receipt-wrap" style={{ width: 420, maxHeight: "85vh", overflowY: "auto" }}>
        <div className="receipt">
          <div className="r-title">Estaciones de impresion</div>
          <hr />

          <button
            className="btn btn-primary"
            onClick={buscarImpresoras}
            disabled={buscando}
            style={{ width: "100%", marginBottom: 10 }}
          >
            {buscando ? "Buscando..." : "Buscar impresoras Bluetooth"}
          </button>
          {error && (
            <div style={{ color: "#b23a2b", fontSize: 11, marginBottom: 10 }}>{error}</div>
          )}

          <div style={{ fontSize: 12, fontWeight: 700, margin: "10px 0 6px" }}>
            Tus estaciones
          </div>
          {estaciones.length === 0 ? (
            <div style={{ fontSize: 11, color: "#8a5a1e", marginBottom: 10 }}>
              Todavia no tienes estaciones. Agrega una abajo (ej. Cocina, Parrilla, Caja).
            </div>
          ) : null}

          {estaciones.map((est) => (
            <div
              key={est.id}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <input
                  value={est.nombre}
                  onChange={(e) => actualizarEstacion(est.id, { nombre: e.target.value })}
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    border: "none",
                    outline: "none",
                    flex: 1,
                  }}
                />
                <button
                  onClick={() => eliminarEstacion(est.id)}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#b23a2b",
                    cursor: "pointer",
                    fontSize: 11,
                  }}
                >
                  Eliminar
                </button>
              </div>

              <label style={{ fontSize: 10.5, color: "#8b8570", display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={est.esCaja}
                  onChange={(e) => actualizarEstacion(est.id, { esCaja: e.target.checked })}
                />
                Es la Caja (imprime el ticket completo con el total)
              </label>

              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <select
                  value={est.impresora}
                  onChange={(e) => actualizarEstacion(est.id, { impresora: e.target.value })}
                  style={{ flex: 1, fontSize: 11.5, padding: "6px 8px" }}
                >
                  <option value="">-- Elegir impresora --</option>
                  {dispositivos.map((d) => (
                    <option key={d.address} value={d.address}>
                      {d.name || d.address}
                    </option>
                  ))}
                  {est.impresora && !dispositivos.find((d) => d.address === est.impresora) ? (
                    <option value={est.impresora}>{est.impresora} (guardada)</option>
                  ) : null}
                </select>
                <button
                  className="btn btn-ghost"
                  onClick={() => probarImpresora(est)}
                  disabled={!est.impresora || probando === est.id}
                  style={{ fontSize: 11, padding: "6px 10px", whiteSpace: "nowrap" }}
                >
                  {probando === est.id ? "..." : "🖨️ Probar"}
                </button>
              </div>
              {resultadoPrueba[est.id] === "ok" ? (
                <div style={{ fontSize: 10.5, color: "var(--green)", marginTop: 4 }}>
                  Enviado — revisa cual impresora imprimio.
                </div>
              ) : null}
              {resultadoPrueba[est.id] === "error" ? (
                <div style={{ fontSize: 10.5, color: "#b23a2b", marginTop: 4 }}>
                  No se pudo imprimir en esta direccion.
                </div>
              ) : null}
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 16 }}>
            <input
              placeholder="Nombre de estacion nueva"
              value={nombreNueva}
              onChange={(e) => setNombreNueva(e.target.value)}
              style={{ flex: 1, fontSize: 12, padding: "8px 10px", border: "1.5px solid var(--line)", borderRadius: 7 }}
            />
            <button className="btn btn-ghost" onClick={agregarEstacion}>
              + Agregar
            </button>
          </div>

          {estaciones.length > 0 && productos.length > 0 ? (
            <>
              <hr />
              <div style={{ fontSize: 12, fontWeight: 700, margin: "10px 0 6px" }}>
                Asignar productos a estaciones
              </div>
              {productos.map((prod) => (
                <div
                  key={prod}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                    marginBottom: 6,
                    gap: 8,
                  }}
                >
                  <span style={{ flex: 1 }}>{prod}</span>
                  <select
                    value={mapa[prod] || ""}
                    onChange={(e) => asignarProducto(prod, e.target.value)}
                    style={{ fontSize: 11.5, padding: "4px 6px" }}
                  >
                    <option value="">Sin asignar</option>
                    {estaciones
                      .filter((e) => !e.esCaja)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </>
          ) : null}
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
