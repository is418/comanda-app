/** Estados válidos según el constraint `pedidos_estado_check` en Supabase. */
export type EstadoPedido =
  | "nuevo"
  | "en_preparacion"
  | "listo"
  | "entregado"
  | "cancelado";

/** Forma de cada elemento dentro de la columna jsonb `items`. */
export interface ItemPedidoDB {
  cantidad: number;
  producto: string;
  modificadores?: string[];
}

/**
 * Fila cruda tal como vive en la tabla `pedidos` de Supabase.
 * Refleja exactamente las columnas que existen hoy en tu base de datos.
 */
export interface PedidoRow {
  id: number;
  numero_pedido: string;
  telefono_cliente: string;
  nombre_cliente: string | null;
  items: ItemPedidoDB[];
  subtotal: number;
  costo_envio: number | null;
  total: number;
  metodo_pago: string | null;
  paga_con: number | null;
  direccion_texto: string | null;
  ubicacion_lat: number | null;
  ubicacion_lng: number | null;
  ubicacion_link: string | null;
  estado: EstadoPedido;
  loyverse_receipt_id: string | null;
  hora_pedido: string | null;
  hora_tomado: string | null;
  hora_listo: string | null;
  hora_entregado: string | null;
  notas: string | null;
  repartidor_nombre: string | null;
  repartidor_telefono: string | null;
  repartidor_asignado_en: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Repartidor {
  id: number;
  nombre: string;
  telefono: string;
  activo: boolean;
}

/** Forma que usan los componentes de UI (misma que ya usaba el HTML original). */
export interface Pedido {
  id: number;
  folio: string;
  estado: EstadoPedido;
  creado: string;
  aceptadoEn: string | null;
  listoEn: string | null;
  entregadoEn: string | null;
  cliente: string;
  telefono: string;
  telefonoCompleto: string;
  items: { cantidad: number; producto: string; mods: string }[];
  total: number;
  direccion: string;
  nota: string;
  ubicacionLat: number | null;
  ubicacionLng: number | null;
  repartidorNombre: string | null;
  repartidorTelefono: string | null;
}

export function mapPedidoRow(row: PedidoRow): Pedido {
  return {
    id: row.id,
    folio: row.numero_pedido || `PED-${row.id}`,
    estado: row.estado,
    creado: row.hora_pedido || row.created_at,
    aceptadoEn: row.hora_tomado,
    listoEn: row.hora_listo,
    entregadoEn: row.hora_entregado,
    cliente: row.nombre_cliente || `Cliente ${row.telefono_cliente.slice(-4)}`,
    telefono: row.telefono_cliente.slice(-4),
    telefonoCompleto: row.telefono_cliente,
    items: (row.items || []).map((i) => ({
      cantidad: i.cantidad,
      producto: i.producto,
      mods: (i.modificadores || []).join(", "),
    })),
    total: row.total,
    direccion:
      row.direccion_texto ||
      (row.ubicacion_lat ? "Ubicación compartida en mapa" : "Sin dirección"),
    nota: row.notas || "",
    ubicacionLat: row.ubicacion_lat,
    ubicacionLng: row.ubicacion_lng,
    repartidorNombre: row.repartidor_nombre,
    repartidorTelefono: row.repartidor_telefono,
  };
}
