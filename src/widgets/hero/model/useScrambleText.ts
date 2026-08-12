import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { scramble } from "./scramble";

// A 60fps el efecto se ve nervioso; entrecortado se lee mucho mejor.
const FPS = 24;

/**
 * Corre el scramble al montar y cada vez que se llama `restart`.
 * Con `prefers-reduced-motion` activo nunca revuelve: devuelve el texto tal cual.
 */
export function useScrambleText(text: string, durationMs: number) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(text);
  // Cambiar este contador es lo que vuelve a disparar el efecto.
  const [runId, setRunId] = useState(0);

  const restart = useCallback(() => setRunId((n) => n + 1), []);

  useEffect(() => {
    if (reduceMotion) return;

    const startedAt = performance.now();
    const id = setInterval(() => {
      const progress = (performance.now() - startedAt) / durationMs;
      if (progress >= 1) {
        clearInterval(id);
        setDisplay(text);
        return;
      }
      setDisplay(scramble(text, progress));
    }, 1000 / FPS);

    return () => clearInterval(id);
  }, [text, durationMs, runId, reduceMotion]);

  return { display: reduceMotion ? text : display, restart };
}
