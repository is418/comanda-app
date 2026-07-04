import { createClient } from "@/lib/supabase/client";
import { EstadoPedido, PedidoRow, mapPedidoRow } from "@/types/pedido";

const COLUMNAS: EstadoPedido[] = ["nuevo", "en_preparacion", "listo"];

/** Trae los pedidos activos (nuevo / preparacion / listo) más recientes. */
export async function fetchPedidosActivos() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .in("estado", COLUMNAS)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) throw error;
  return (data as PedidoRow[]).map(mapPedidoRow);
}

/**
 * Cambia el estado de un pedido y sella el timestamp correspondiente
 * (hora_tomado / hora_listo / hora_entregado), igual que hacía la demo
 * original en memoria.
 */
export async function actualizarEstadoPedido(
  id: number,
  destino: EstadoPedido
) {
  const supabase = createClient();
  const ahora = new Date().toISOString();

  const patch: Partial<PedidoRow> = { estado: destino };
  if (destino === "en_preparacion") patch.hora_tomado = ahora;
  if (destino === "listo") patch.hora_listo = ahora;
  if (destino === "entregado") patch.hora_entregado = ahora;

  const { error } = await supabase.from("pedidos").update(patch).eq("id", id);
  if (error) throw error;
}

/** Guarda la nota de un pedido en la columna `notas`. */
export async function actualizarNotaPedido(id: number, nota: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("pedidos")
    .update({ notas: nota })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Se suscribe a cambios en tiempo real de la tabla `pedidos`
 * (INSERT/UPDATE/DELETE) vía Supabase Realtime. Devuelve una función
 * para cancelar la suscripción.
 */
export function suscribirsePedidos(onChange: () => void) {
  const supabase = createClient();
  const channel = supabase
    .channel("pedidos-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "pedidos" },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
