// Fisica 2D estilo plataformas: solo izquierda, derecha y brinco.
// Todo aqui es puro: mismas entradas -> mismas salidas, sin DOM ni reloj.

export interface CharacterState {
  x: number; // px desde el borde izquierdo del mundo
  y: number; // px de altura sobre el suelo (0 = pisando)
  vy: number; // velocidad vertical en px/s (positiva = subiendo)
  facing: 1 | -1; // hacia donde mira: 1 derecha, -1 izquierda
  grounded: boolean;
}

export interface CharacterInput {
  left: boolean;
  right: boolean;
  jump: boolean; // evento de un solo frame, no una tecla sostenida
}

export interface WorldConfig {
  gravity: number; // px/s^2
  moveSpeed: number; // px/s
  jumpVelocity: number; // px/s, impulso inicial del brinco
  minX: number;
  maxX: number;
}

// Altura del brinco = v^2 / (2g) ~= 127px, dura ~0.65s. Se siente "Mario".
export const WORLD_DEFAULTS = {
  gravity: 2400,
  moveSpeed: 260,
  jumpVelocity: 780,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function createCharacterState(x: number): CharacterState {
  return { x, y: 0, vy: 0, facing: 1, grounded: true };
}

/** Avanza la simulacion `dt` segundos. */
export function step(
  state: CharacterState,
  input: CharacterInput,
  world: WorldConfig,
  dt: number,
): CharacterState {
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);

  let vy = state.vy;
  let grounded = state.grounded;

  // Solo se brinca pisando suelo: nada de doble salto.
  if (input.jump && grounded) {
    vy = world.jumpVelocity;
    grounded = false;
  }

  vy -= world.gravity * dt;
  let y = state.y + vy * dt;

  if (y <= 0) {
    y = 0;
    vy = 0;
    grounded = true;
  }

  return {
    x: clamp(state.x + dir * world.moveSpeed * dt, world.minX, world.maxX),
    y,
    vy,
    // Sin input horizontal conserva hacia donde venia mirando.
    facing: dir === 0 ? state.facing : (dir as 1 | -1),
    grounded,
  };
}
