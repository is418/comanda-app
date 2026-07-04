interface Props {
  filtro: string;
  onFiltroChange: (v: string) => void;
}

export function Toolbar({ filtro, onFiltroChange }: Props) {
  return (
    <div className="toolbar">
      <div>
        <h1>Pedidos en curso</h1>
        <div className="hint">
          Aceptar, rechazar y mover de columna actualiza la base de datos en
          tiempo real.
        </div>
      </div>
      <div className="toolbar-actions">
        <div className="search-wrap">
          <span className="icon">🔍</span>
          <input
            type="search"
            placeholder="Buscar cliente, teléfono o folio…"
            value={filtro}
            onChange={(e) => onFiltroChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
