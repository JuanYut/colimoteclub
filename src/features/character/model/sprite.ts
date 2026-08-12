import { WORLD_DEFAULTS, type CharacterState } from "./physics";

// Que animacion toca y en que cuadro va. Puro: se decide desde el estado de la
// fisica y el tiempo, sin tocar el DOM.

export type AnimationName = "idle" | "run" | "jump";

export interface AnimationSpec {
  frames: number;
  fps: number; // 0 = no avanza con el reloj (ver getFrame)
}

// Cuadros reales del pack, medidos del PNG: la descripcion del autor no cuadra.
export const ANIMATIONS: Record<AnimationName, AnimationSpec> = {
  idle: { frames: 7, fps: 8 },
  run: { frames: 8, fps: 12 },
  jump: { frames: 5, fps: 0 },
};

export interface SpriteFrame {
  animation: AnimationName;
  frame: number;
}

export function getAnimation(state: CharacterState): AnimationName {
  if (!state.grounded) return "jump";
  return state.moving ? "run" : "idle";
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

  const { frames, fps } = ANIMATIONS[animation];
  return Math.floor((Math.max(elapsedMs, 0) / 1000) * fps) % frames;
}
