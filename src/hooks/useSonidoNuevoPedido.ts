"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Beep de dos tonos generado con Web Audio API, igual que en el original
 * (no usa ningún archivo de audio).
 *
 * `reproducir` es referencialmente estable (no cambia de identidad al
 * togglear el sonido) y siempre consulta el valor más reciente de
 * `activo` a través de un ref — así funciona bien incluso llamado desde
 * closures creados una sola vez, como la suscripción de Realtime. */
export function useSonidoNuevoPedido() {
  const [activo, setActivo] = useState(true);
  const activoRef = useRef(activo);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    activoRef.current = activo;
  }, [activo]);

  const reproducir = useCallback(() => {
    if (!activoRef.current) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = ctxRef.current ?? new AudioCtx();
      ctxRef.current = ctx;
      const t = ctx.currentTime;
      [880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t + i * 0.13);
        gain.gain.exponentialRampToValueAtTime(0.16, t + i * 0.13 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.13 + 0.32);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + i * 0.13);
        osc.stop(t + i * 0.13 + 0.34);
      });
    } catch {
      // Si el navegador bloquea AudioContext (falta interacción del usuario), lo ignoramos.
    }
  }, []);

  return { activo, setActivo, reproducir };
}
