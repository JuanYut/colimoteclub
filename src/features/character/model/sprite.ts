import { WORLD_DEFAULTS, type CharacterState } from "./physics";

// Que animacion toca y en que cuadro va. Puro: se decide desde el estado de la
// fisica y el tiempo, sin tocar el DOM.

export type AnimationName = "idle" | "run" | "jump" | "emote";

export interface AnimationSpec {
  frames: number;
  fps: number; // 0 = no avanza con el reloj (ver getFrame)
  loop: boolean; // false = se queda en el ultimo cuadro en vez de repetir
}

// Cuadros reales del pack, medidos del PNG: la descripcion del autor no cuadra.
export const ANIMATIONS: Record<AnimationName, AnimationSpec> = {
  idle: { frames: 7, fps: 8, loop: true },
  run: { frames: 8, fps: 12, loop: true },
  jump: { frames: 5, fps: 0, loop: false },
  // Provisional: es el ataque 3 del pack. Cuando haya sprites de reacciones se
  // cambia aqui y en SHEETS, el resto no se entera.
  emote: { frames: 6, fps: 12, loop: false },
};

/** Cuanto dura la reaccion completa, para saber cuando soltarla. */
export const EMOTE_MS = (ANIMATIONS.emote.frames / ANIMATIONS.emote.fps) * 1000;

export interface SpriteFrame {
  animation: AnimationName;
  frame: number;
}

/**
 * Prioridad: lo que manda la fisica gana. Moverse o brincar cancela la
 * reaccion, no la tapa, para que no reaparezca al caer.
 */
export function getAnimation(
  state: CharacterState,
  emoting = false,
): AnimationName {
  if (!state.grounded) return "jump";
  if (state.moving) return "run";
  return emoting ? "emote" : "idle";
}

/**
 * `elapsedMs` es el tiempo que lleva corriendo *esta* animacion, no el reloj
 * global: asi el ciclo de carrera siempre arranca en el primer cuadro.
 */
export function getFrame(
  animation: AnimationName,
  state: CharacterState,
  elapsedMs: number,
): number {
  // El brinco no corre en bucle: el cuadro sale de la fisica, como en Mega Man.
  // Asi la pose siempre coincide con lo que hace el personaje en pantalla.
  if (animation === "jump") {
    const threshold = WORLD_DEFAULTS.jumpVelocity / 3;
    if (state.vy > threshold) return 1; // despegando
    if (state.vy < -threshold) return 3; // cayendo
    return 2; // cumbre
  }

  const { frames, fps, loop } = ANIMATIONS[animation];
  const index = Math.floor((Math.max(elapsedMs, 0) / 1000) * fps);
  // Las de un solo tiro (la reaccion) se congelan en el ultimo cuadro.
  return loop ? index % frames : Math.min(index, frames - 1);
}
