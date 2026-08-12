import { useEffect, type RefObject } from "react";
import { isOverCenter } from "./crossing";

// No hace falta revisar a 60fps: medir fuerza un reflow y el monito tarda
// decimas de segundo en cruzar, asi que no hay forma de perderselo.
const CHECK_MS = 50;

/**
 * Llama a `onCross` cuando `mover` pasa por encima de `target`.
 *
 * Solo dispara en el flanco de entrada: quedarse parado encima no lo repite,
 * hay que salir y volver a entrar.
 */
export function useCrossing(
  mover: RefObject<HTMLElement | null>,
  target: RefObject<HTMLElement | null>,
  onCross: () => void,
): void {
  useEffect(() => {
    let wasOver = false;

    const id = setInterval(() => {
      const moverNode = mover.current;
      const targetNode = target.current;
      if (!moverNode || !targetNode) return;

      const isOver = isOverCenter(
        moverNode.getBoundingClientRect(),
        targetNode.getBoundingClientRect(),
      );

      if (isOver && !wasOver) onCross();
      wasOver = isOver;
    }, CHECK_MS);

    return () => clearInterval(id);
  }, [mover, target, onCross]);
}
