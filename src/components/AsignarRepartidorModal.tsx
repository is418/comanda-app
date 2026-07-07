"use client";

import { useEffect, useState } from "react";
import { Pedido, Repartidor } from "@/types/pedido";
import {
  fetchRepartidores,
  crearRepartidor,
  asignarRepartidorAPedido,
} from "@/lib/repartidores";

interface Props {
  pedido: Pedido | null;
  onClose: () => void;
  onAsignado: () => void;
}

export function AsignarRepartidorModal({ pedido, onClose, onAsignado }: Props) {
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [telefonoNuevo, setTelefonoNuevo] = useState("");

  useEffect(() => {
    if (!pedido) return;
    setCargando(true);
    fetchRepartidores()
      .then(setRepartidores)
      .catch(() => setError("No se pudo cargar la lista de repartidores."))
      .finally(() => setCargando(false));
  }, [pedido]);

  if (!pedido) return null;

  async function agregarRepartidor() {
    if (!nombreNuevo.trim() || !telefonoNuevo.trim()) return;
    try {
      await crearRepartidor(nombreNuevo.trim(), telefonoNuevo.trim());
      setNombreNuevo("");
      setTelefonoNuevo("");
      const lista = await fetchRepartidores();
      setRepartidores(lista);
    } catch {
      setError("No se pudo agregar el repartidor.");
    }
  }

  async function elegir(rep: Repartidor) {
    setEnviando(true);
    setError("");
    try {
      await asignarRepartidorAPedido(pedido!.id, rep, {
        folio: pedido!.folio,
        cliente: pedido!.cliente,
        telefonoCliente: pedido!.telefonoCompleto,
        items: pedido!.items,
        total: pedido!.total,
        direccion: pedido!.direccion,
        ubicacionLat: pedido!.ubicacionLat,
        ubicacionLng: pedido!.ubicacionLng,
        nota: pedido!.nota,
      });
      onAsignado();
      onClose();
    } catch {
      setError("No se pudo asignar el repartidor. Revisa tu conexion e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="print-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="receipt-wrap" style={{ width: 360 }}>
        <div className="receipt">
          <div className="r-title">Asignar repartidor</div>
          <div className="r-sub">Pedido #{pedido.folio}</div>
          <hr />

          {cargando ? (
            <div style={{ fontSize: 12 }}>Cargando...</div>
          ) : repartidores.length === 0 ? (
            <div style={{ fontSize: 11, color: "#8a5a1e", marginBottom: 10 }}>
              Todavia no tienes repartidores registrados. Agrega uno abajo.
            </div>
          ) : (
            repartidores.map((r) => (
              <button
                key={r.id}
                className="btn btn-ghost"
                onClick={() => elegir(r)}
                disabled={enviando}
                style={{
                  width: "100%",
                  marginBottom: 6,
                  justifyContent: "space-between",
                }}
              >
                <span>{r.nombre}</span>
                <span style={{ color: "#8b8570", fontSize: 11 }}>{r.telefono}</span>
              </button>
            ))
          )}

          {error && (
            <div style={{ color: "#b23a2b", fontSize: 11, marginTop: 8 }}>{error}</div>
          )}

          <hr />
          <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>
            Agregar nuevo repartidor
          </div>
          <input
            placeholder="Nombre"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            style={{
              width: "100%",
              fontSize: 12,
              padding: "8px 10px",
              border: "1.5px solid var(--line)",
              borderRadius: 7,
              marginBottom: 6,
            }}
          />
          <input
            placeholder="Telefono (con lada, ej. 5217771234567)"
            value={telefonoNuevo}
            onChange={(e) => setTelefonoNuevo(e.target.value)}
            style={{
              width: "100%",
              fontSize: 12,
              padding: "8px 10px",
              border: "1.5px solid var(--line)",
              borderRadius: 7,
              marginBottom: 8,
            }}
          />
          <button className="btn btn-primary" onClick={agregarRepartidor} style={{ width: "100%" }}>
            + Agregar a la lista
          </button>
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
