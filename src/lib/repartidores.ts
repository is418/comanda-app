import { createClient } from "@/lib/supabase/client";
import { Repartidor } from "@/types/pedido";

const URL_WEBHOOK_REPARTIDOR =
  "https://n8n-n8n.ozxdks.easypanel.host/webhook/enviar-repartidor";

export async function fetchRepartidores(): Promise<Repartidor[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("repartidores")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });
  if (error) throw error;
  return data as Repartidor[];
}

export async function crearRepartidor(nombre: string, telefono: string) {
  const supabase = createClient();
  const { error } = await supabase.from("repartidores").insert({ nombre, telefono });
  if (error) throw error;
}

export async function desactivarRepartidor(id: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("repartidores")
    .update({ activo: false })
    .eq("id", id);
  if (error) throw error;
}

interface DatosPedidoParaRepartidor {
  folio: string;
  cliente: string;
  telefonoCliente: string;
  items: { cantidad: number; producto: string; mods: string }[];
  total: number;
  direccion: string;
  ubicacionLat: number | null;
  ubicacionLng: number | null;
  nota: string;
}

/** Guarda el repartidor asignado en el pedido y le manda el resumen por WhatsApp. */
export async function asignarRepartidorAPedido(
  pedidoId: number,
  repartidor: Repartidor,
  datosPedido: DatosPedidoParaRepartidor
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("pedidos")
    .update({
      repartidor_nombre: repartidor.nombre,
      repartidor_telefono: repartidor.telefono,
      repartidor_asignado_en: new Date().toISOString(),
    })
    .eq("id", pedidoId);
  if (error) throw error;

  await fetch(URL_WEBHOOK_REPARTIDOR, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telefono_repartidor: repartidor.telefono,
      folio: datosPedido.folio,
      cliente: datosPedido.cliente,
      telefono_cliente: datosPedido.telefonoCliente,
      items: datosPedido.items,
      total: datosPedido.total,
      direccion: datosPedido.direccion,
      lat: datosPedido.ubicacionLat,
      lng: datosPedido.ubicacionLng,
      nota: datosPedido.nota,
    }),
  });
}
