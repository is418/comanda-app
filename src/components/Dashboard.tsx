"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  actualizarEstadoPedido,
  actualizarNotaPedido,
  fetchPedidosActivos,
  suscribirsePedidos,
} from "@/lib/pedidos";
import { Pedido } from "@/types/pedido";
import { useNowTick } from "@/hooks/useNowTick";
import { useSonidoNuevoPedido } from "@/hooks/useSonidoNuevoPedido";
import { Topbar } from "./Topbar";
import { StatsStrip } from "./StatsStrip";
import { Toolbar } from "./Toolbar";
import { Column } from "./Column";
import { PrintModal } from "./PrintModal";

const NOMBRE_NEGOCIO = "Taquería México Lindo";

export function Dashboard() {
  const router = useRouter();
  const now = useNowTick();
  const { activo: sonidoActivo, setActivo: setSonidoActivo, reproducir } =
    useSonidoNuevoPedido();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [printId, setPrintId] = useState<number | null>(null);
  const [conectado, setConectado] = useState(false);

  const idsConocidos = useRef<Set<number>>(new Set());
  const primeraCarga = useRef(true);

  const cargar = useCallback(async () => {
    try {
      const data = await fetchPedidosActivos();

      if (!primeraCarga.current) {
        const nuevos = data.filter(
          (p) => p.estado === "nuevo" && !idsConocidos.current.has(p.id)
        );
        if (nuevos.length > 0) reproducir();
      }
      primeraCarga.current = false;
      data.forEach((p) => idsConocidos.current.add(p.id));

      setPedidos(data);
      setError(null);
      setConectado(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar los pedidos."
      );
    } finally {
      setCargando(false);
    }
  }, [reproducir]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial estándar
    cargar();
    const unsubscribe = suscribirsePedidos(() => cargar());
    // Respaldo por si el websocket de Realtime no conecta (pasa en algunos
    // Supabase auto-hospedados) — sin esto, los pedidos nuevos solo se ven
    // al recargar la página manualmente.
    const intervalo = setInterval(cargar, 5000);
    return () => {
      unsubscribe();
      clearInterval(intervalo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function withBusy(id: number, fn: () => Promise<void>) {
    setBusyIds((prev) => new Set(prev).add(id));
    return fn()
      .then(() => {
        // No dependemos solo del aviso de Realtime para reflejar nuestra
        // propia acción — si el websocket de Realtime falla o tarda (pasa
        // en algunos Supabase auto-hospedados), igual queremos ver el
        // resultado de inmediato.
        return cargar();
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Ocurrió un error.");
        throw e; // se re-lanza para que quien llamó (ej. la animación de
        // rechazo en TicketCard) sepa que falló y pueda revertirse.
      })
      .finally(() => {
        setBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
  }

  const onAccept = (id: number) =>
    withBusy(id, () => actualizarEstadoPedido(id, "en_preparacion"));
  const onReject = (id: number) =>
    withBusy(id, () => actualizarEstadoPedido(id, "cancelado"));
  const onReady = (id: number) =>
    withBusy(id, () => actualizarEstadoPedido(id, "listo"));
  const onDone = (id: number) =>
    withBusy(id, () => actualizarEstadoPedido(id, "entregado"));
  const onSaveNota = (id: number, nota: string) =>
    withBusy(id, () => actualizarNotaPedido(id, nota));

  async function onSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const coincideFiltro = useCallback(
    (p: Pedido) => {
      if (!filtro.trim()) return true;
      const f = filtro.trim().toLowerCase();
      return (
        p.cliente.toLowerCase().includes(f) ||
        p.folio.toLowerCase().includes(f) ||
        p.telefono.includes(f)
      );
    },
    [filtro]
  );

  const porColumna = useMemo(() => {
    const nuevo = pedidos.filter((p) => p.estado === "nuevo");
    const preparacion = pedidos.filter((p) => p.estado === "en_preparacion");
    const listo = pedidos.filter((p) => p.estado === "listo");
    return { nuevo, preparacion, listo };
  }, [pedidos]);

  const filtrados = useMemo(
    () => ({
      nuevo: porColumna.nuevo.filter(coincideFiltro),
      preparacion: porColumna.preparacion.filter(coincideFiltro),
      listo: porColumna.listo.filter(coincideFiltro),
    }),
    [porColumna, coincideFiltro]
  );

  const temposPrepMin = useMemo(() => {
    return pedidos
      .filter((p) => p.aceptadoEn && p.listoEn)
      .map(
        (p) =>
          (new Date(p.listoEn as string).getTime() -
            new Date(p.aceptadoEn as string).getTime()) /
          60000
      );
  }, [pedidos]);

  const ventaTotal = pedidos.reduce((s, p) => s + (p.total || 0), 0);
  const pedidoImprimir = pedidos.find((p) => p.id === printId) || null;

  return (
    <>
      <Topbar
        nombreNegocio={NOMBRE_NEGOCIO}
        esRealtime={conectado}
        sonidoActivo={sonidoActivo}
        onToggleSonido={() => setSonidoActivo((v) => !v)}
        onSignOut={onSignOut}
      />

      <StatsStrip
        totalPedidos={pedidos.length}
        ventaTotal={ventaTotal}
        enPreparacion={porColumna.preparacion.length}
        temposPrepMin={temposPrepMin}
      />

      <Toolbar filtro={filtro} onFiltroChange={setFiltro} />

      {error && (
        <div
          style={{
            margin: "0 28px",
            padding: "10px 14px",
            borderRadius: 8,
            background: "var(--red-bg)",
            color: "var(--red)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {cargando ? (
        <div style={{ padding: "40px 28px", color: "#7C7460" }}>
          Cargando pedidos…
        </div>
      ) : (
        <div className="board">
          <Column
            columna="nuevo"
            claseColumna="col-nuevo"
            titulo="Nuevos"
            pedidos={filtrados.nuevo}
            totalSinFiltrar={porColumna.nuevo.length}
            now={now}
            busyIds={busyIds}
            onAccept={onAccept}
            onReject={onReject}
            onReady={onReady}
            onDone={onDone}
            onPrint={setPrintId}
            onSaveNota={onSaveNota}
          />
          <Column
            columna="en_preparacion"
            claseColumna="col-prep"
            titulo="En preparación"
            pedidos={filtrados.preparacion}
            totalSinFiltrar={porColumna.preparacion.length}
            now={now}
            busyIds={busyIds}
            onAccept={onAccept}
            onReject={onReject}
            onReady={onReady}
            onDone={onDone}
            onPrint={setPrintId}
            onSaveNota={onSaveNota}
          />
          <Column
            columna="listo"
            claseColumna="col-listo"
            titulo="Listos para entregar"
            pedidos={filtrados.listo}
            totalSinFiltrar={porColumna.listo.length}
            now={now}
            busyIds={busyIds}
            onAccept={onAccept}
            onReject={onReject}
            onReady={onReady}
            onDone={onDone}
            onPrint={setPrintId}
            onSaveNota={onSaveNota}
          />
        </div>
      )}

      <footer>
        <b>COMANDA</b> — panel de pedidos para negocios que venden por
        WhatsApp
      </footer>

      <PrintModal
        pedido={pedidoImprimir}
        nombreNegocio={NOMBRE_NEGOCIO}
        onClose={() => setPrintId(null)}
      />
    </>
  );
}
