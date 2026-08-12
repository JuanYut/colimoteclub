import { useEffect, useRef, useState } from 'react';
import { useMotionValue } from 'motion/react';
import {
  createCharacterState,
  step,
  WORLD_DEFAULTS,
  type CharacterInput,
  type CharacterState,
} from './physics';
import { getAnimation, getFrame, type SpriteFrame } from './sprite';

// Si la pestana estuvo inactiva, no queremos simular un salto gigante de golpe.
const MAX_DT = 1 / 30;

type Action = keyof CharacterInput;

function actionFor(key: string): Action | null {
  switch (key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'left';
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'right';
    case 'ArrowUp':
    case 'w':
    case 'W':
    case ' ':
      return 'jump';
    default:
      return null;
  }
}

/**
 * Controles de plataformas: flechas o A/D para correr, espacio/W/arriba para
 * brincar. La simulacion corre en requestAnimationFrame y escribe en motion
 * values, asi que no dispara un render de React por cuadro.
 *
 * El personaje vive en el flujo del layout: su posicion natural (junto al
 * titulo) es el origen, y todo el movimiento son transforms relativos a ella.
 */
export function useCharacterControls(size: number) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const facing = useMotionValue(1);
  // El sprite si vive en estado de React, pero solo se actualiza cuando cambia
  // de cuadro (12 veces por segundo como mucho), no en cada frame.
  const [sprite, setSprite] = useState<SpriteFrame>({ animation: 'idle', frame: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // offsetLeft es posicion de layout: el transform que le aplicamos no la altera.
    let homeX = el.offsetLeft;
    const measure = () => {
      homeX = el.offsetLeft;
    };

    // Limites relativos a la casa, por eso minX suele ser negativo.
    const bounds = () => ({
      minX: -homeX,
      maxX: Math.max(-homeX, window.innerWidth - homeX - size),
    });

    const input: CharacterInput = { left: false, right: false, jump: false };
    let state: CharacterState = createCharacterState(0);

    const onKeyDown = (event: KeyboardEvent) => {
      const action = actionFor(event.key);
      if (!action) return;
      event.preventDefault(); // que no se scrollee la pagina con flechas/espacio
      // El brinco es un evento: mantener la tecla no encadena saltos.
      if (action === 'jump' && event.repeat) return;
      input[action] = true;
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const action = actionFor(event.key);
      if (action && action !== 'jump') input[action] = false;
    };

    // Si la ventana pierde el foco, soltamos todo para que no se quede corriendo.
    const onBlur = () => {
      input.left = false;
      input.right = false;
      input.jump = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', measure);

    // El titulo puede cambiar de ancho (fuentes, texto) y mover la casa.
    const stage = el.parentElement;
    const observer = new ResizeObserver(measure);
    if (stage) observer.observe(stage);

    let raf = 0;
    let last = performance.now();

    // Cuadro que ya esta pintado, para no re-renderizar si no cambio nada.
    let shown: SpriteFrame = { animation: 'idle', frame: 0 };
    // El reloj se reinicia con cada animacion: la carrera siempre empieza en 0.
    let animationStart = last;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, MAX_DT);
      last = now;

      state = step(state, input, { ...WORLD_DEFAULTS, ...bounds() }, dt);
      input.jump = false; // consumido: se necesita volver a presionar

      x.set(state.x);
      y.set(-state.y); // en CSS el eje Y crece hacia abajo
      facing.set(state.facing);

      const animation = getAnimation(state);
      if (animation !== shown.animation) animationStart = now;
      const frame = getFrame(animation, state, now - animationStart);
      if (animation !== shown.animation || frame !== shown.frame) {
        shown = { animation, frame };
        setSprite(shown);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', measure);
    };
  }, [size, x, y, facing]);

  return { ref, x, y, facing, sprite };
}
