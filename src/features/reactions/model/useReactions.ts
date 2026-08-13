import { useCallback, useEffect, useRef, useState } from "react";
import {
  HIDDEN,
  hide,
  showReaction,
  toggleMenu,
  type Reaction,
  type ReactionsState,
} from "./reactions";

// Tecla que abre el menu. Se puede cambiar sin tocar nada mas.
const OPEN_KEY = "r";

// Cuanto se queda flotando la reaccion elegida antes de irse sola.
const PICKED_MS = 3500;

/**
 * Reacciones del monito: `R` abre el menu, el clic elige, `Escape` cierra.
 *
 * `emoteKey` cambia con cada eleccion. Es la senal para que quien dibuje al
 * personaje anime; asi esta feature no necesita conocerlo (regla de FSD: dos
 * slices hermanos no se importan entre si).
 */
export function useReactions() {
  const [state, setState] = useState<ReactionsState>(HIDDEN);
  const [emoteKey, setEmoteKey] = useState(0);
  const timer = useRef(0);

  const pick = useCallback((reaction: Reaction) => {
    window.clearTimeout(timer.current);
    setState(showReaction(reaction));
    setEmoteKey((key) => key + 1);
    timer.current = window.setTimeout(() => setState(hide), PICKED_MS);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Sin esto, Ctrl+R / Cmd+R abriria el menu en vez de recargar.
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "Escape") {
        window.clearTimeout(timer.current);
        setState(hide);
        return;
      }

      if (event.key.toLowerCase() !== OPEN_KEY || event.repeat) return;
      window.clearTimeout(timer.current);
      setState(toggleMenu);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer.current);
    };
  }, []);

  return { mode: state.mode, reaction: state.reaction, emoteKey, pick };
}
