"use client";

import { useState } from "react";
import { Pedido } from "@/types/pedido";
import {
  elapsedLabel,
  elapsedMinutes,
  UMBRAL_NUEVO_MIN,
  UMBRAL_PREP_MIN,
} from "@/lib/timers";

type Columna = "nuevo" | "en_preparacion" | "listo";

const CHIP: Record<Columna, { c: string; t: string }> = {
  nuevo: { c: "nuevo", t: "Nuevo" },
  en_preparacion: { c: "prep", t: "Preparando" },
  listo: { c: "listo", t: "Listo" },
};

interface Props {
  pedido: Pedido;
  columna: Columna;
  now: number;
  busy: boolean;
  onAccept: (id: number) => void;
  onReject: (id: number) => Promise<void>;
  onReady: (id: number) => void;
  onDone: (id: number) => void;
  onPrint: (id: number) => void;
  onSaveNota: (id: number, nota: string) => void;
  onAsignarRepartidor?: (id: number) => void;
}

export function TicketCard({
  pedido,
  columna,
  now,
  busy,
  onAccept,
  onReject,
  onReady,
  onDone,
  onPrint,
  onSaveNota,
  onAsignarRepartidor,
}: Props) {
  const [rechazando, setRechazando] = useState(false);
  const [editandoNota, setEditandoNota] = useState(false);
  const [borradorNota, setBorradorNota] = useState(pedido.nota);

  const timerFrom =
    columna === "nuevo"
      ? pedido.creado
      : columna === "en_preparacion"
      ? pedido.aceptadoEn || pedido.creado
      : pedido.listoEn || pedido.creado;
  const timerLabel =
    columna === "nuevo"
      ? "esperando"
      : columna === "en_preparacion"
      ? "preparando"
      : "listo hace";

  const mins = elapsedMinutes(timerFrom, now);
  const urgente =
    (columna === "nuevo" && mins >= UMBRAL_NUEVO_MIN) ||
    (columna === "en_preparacion" && mins >= UMBRAL_PREP_MIN);

  const chip = CHIP[columna];

  function handleReject() {
    setRechazando(true);
    setTimeout(async () => {
      try {
        await onReject(pedido.id);
        // Si tuvo éxito, el pedido desaparece de la lista solo (ya no
        // está en nuevo/preparacion/listo) — no hace falta hacer nada más.
      } catch {
        // Falló la actualización en Supabase: revertimos la animación
        // para no dejar la tarjeta congelada como "rechazada".
        setRechazando(false);
      }
    }, 260);
  }

  function guardarNota() {
    onSaveNota(pedido.id, borradorNota.trim());
    setEditandoNota(false);
  }

  return (
    <div
      className={`ticket ${urgente ? "urgent" : ""} ${
        rechazando ? "rejected" : ""
      }`}
    >
      <div className="perf" />
      <div className="ticket-body">
        <div className="ticket-top">
          <div>
            <div className="order-no">#{pedido.folio}</div>
            <div className="timer-row">
              {timerLabel}{" "}
              <span className="timer">{elapsedLabel(timerFrom, now)}</span>
            </div>
          </div>
          <div className="ticket-top-right">
            <button
              className="icon-btn"
              title="Imprimir comanda"
              onClick={() => onPrint(pedido.id)}
            >
              🖨️
            </button>
            <span className={`status-chip ${chip.c}`}>{chip.t}</span>
          </div>
        </div>

        <div className="customer">
          {pedido.cliente}
          <span className="phone">•••• {pedido.telefono}</span>
        </div>

        <hr className="divider" />

        <ul className="items">
          {pedido.items.map((i, idx) => (
            <li key={idx}>
              <span>
                <span className="qty">{i.cantidad}×</span>
                {i.producto}
                {i.mods ? <span className="mods">{i.mods}</span> : null}
              </span>
            </li>
          ))}
        </ul>

        <div className="ticket-total">
          <span className="lbl">Total</span>
          <span className="amt">${pedido.total}</span>
        </div>

        <div className="ticket-meta">
          <span>📍 {pedido.direccion}</span>
          {pedido.repartidorNombre ? (
            <span>🛵 {pedido.repartidorNombre}</span>
          ) : null}
        </div>

        {editandoNota ? (
          <div className="nota-form">
            <textarea
              autoFocus
              value={borradorNota}
              onChange={(e) => setBorradorNota(e.target.value)}
              placeholder="Ej. sin cebolla, alergia a maní, tocar timbre azul…"
            />
            <div className="nota-form-actions">
              <button
                type="button"
                className="nota-cancelar"
                onClick={() => {
                  setBorradorNota(pedido.nota);
                  setEditandoNota(false);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="nota-guardar"
                onClick={guardarNota}
              >
                Guardar nota
              </button>
            </div>
          </div>
        ) : pedido.nota ? (
          <div className="nota">
            <span>📌 {pedido.nota}</span>
            <button
              type="button"
              className="edit-nota"
              onClick={() => setEditandoNota(true)}
            >
              ✎
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="nota-add"
            onClick={() => setEditandoNota(true)}
          >
            + Agregar nota
          </button>
        )}

        <div className="ticket-actions">
          {columna === "nuevo" && (
            <>
              <button
                className="taction reject"
                disabled={busy}
                onClick={handleReject}
              >
                Rechazar
              </button>
              <button
                className="taction accept"
                disabled={busy}
                onClick={() => onAccept(pedido.id)}
              >
                Aceptar
              </button>
            </>
          )}
          {columna === "en_preparacion" && (
            <button
              className="taction ready"
              disabled={busy}
              onClick={() => onReady(pedido.id)}
            >
              Marcar listo
            </button>
          )}
          {columna === "listo" && (
            <>
              {onAsignarRepartidor ? (
                <button
                  className="taction ready"
                  disabled={busy}
                  onClick={() => onAsignarRepartidor(pedido.id)}
                >
                  {pedido.repartidorNombre ? "Cambiar repartidor" : "Asignar repartidor"}
                </button>
              ) : null}
              <button
                className="taction done"
                disabled={busy}
                onClick={() => onDone(pedido.id)}
              >
                Entregado
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
