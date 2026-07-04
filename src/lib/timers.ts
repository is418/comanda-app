export const UMBRAL_NUEVO_MIN = 5; // minutos antes de marcar un pedido nuevo como urgente
export const UMBRAL_PREP_MIN = 15; // minutos antes de marcar una preparación como fuera de tiempo

export function fmtMinSec(mins: number) {
  const m = Math.floor(mins);
  const s = Math.round((mins - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function elapsedLabel(fromISO: string, nowMs: number) {
  const ms = Math.max(0, nowMs - new Date(fromISO).getTime());
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function elapsedMinutes(fromISO: string, nowMs: number) {
  return Math.max(0, nowMs - new Date(fromISO).getTime()) / 60000;
}

export function promedioPrep(temposMin: number[]) {
  if (temposMin.length === 0) return "—";
  const avg = temposMin.reduce((a, b) => a + b, 0) / temposMin.length;
  return fmtMinSec(avg) + " min";
}
