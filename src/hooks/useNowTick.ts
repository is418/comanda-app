"use client";

import { useEffect, useState } from "react";

/** Devuelve la hora actual (ms) y se actualiza cada segundo. Un solo
 * interval compartido por todo el dashboard en vez de uno por ticket. */
export function useNowTick() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}
