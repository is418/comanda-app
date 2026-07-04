"use client";

import { Pedido } from "@/types/pedido";

interface Props {
  pedido: Pedido | null;
  nombreNegocio: string;
  onClose: () => void;
}

export function PrintModal({ pedido, nombreNegocio, onClose }: Props) {
  if (!pedido) return null;

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
        <div className="modal-actions">
          <button className="modal-close" onClick={onClose}>
            Cerrar
          </button>
          <button className="modal-print" onClick={() => window.print()}>
            🖨️ Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
