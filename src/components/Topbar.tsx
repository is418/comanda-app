"use client";

import { useEffect, useState } from "react";

interface Props {
  nombreNegocio: string;
  esRealtime: boolean;
  sonidoActivo: boolean;
  onToggleSonido: () => void;
  onSignOut: () => void;
  onConfigurarImpresora?: () => void;
}

export function Topbar({
  nombreNegocio,
  esRealtime,
  sonidoActivo,
  onToggleSonido,
  onSignOut,
  onConfigurarImpresora,
}: Props) {
  const [hora, setHora] = useState("--:--:--");

  useEffect(() => {
    function tick() {
      setHora(
        new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark display">C</div>
        <div className="brand-text">
          <div className="name">COMANDA</div>
          <div className="sub">Panel de pedidos · {nombreNegocio}</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="source-badge">
          <span className={`dot ${esRealtime ? "live" : "demo"}`} />
          <span>{esRealtime ? "Datos en vivo" : "Conectando…"}</span>
        </div>
        <button
          className="sound-toggle"
          title="Silenciar/activar aviso sonoro"
          onClick={onToggleSonido}
        >
          {sonidoActivo ? "🔔" : "🔕"}
        </button>
        {onConfigurarImpresora ? (
          <button
            className="sound-toggle"
            title="Configurar estaciones de impresion"
            onClick={onConfigurarImpresora}
          >
            🖨️
          </button>
        ) : null}
        <div className="clock">{hora}</div>
        <button className="signout-btn" onClick={onSignOut}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
