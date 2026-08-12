import { describe, it, expect } from 'vitest';
import {
  createCharacterState,
  step,
  WORLD_DEFAULTS,
  type CharacterInput,
  type CharacterState,
  type WorldConfig,
} from './physics';

const world: WorldConfig = { ...WORLD_DEFAULTS, minX: 0, maxX: 200 };
const dt = 1 / 60;

const input = (over: Partial<CharacterInput> = {}): CharacterInput => ({
  left: false,
  right: false,
  jump: false,
  ...over,
});

/** Corre `frames` cuadros con el mismo input. */
const run = (state: CharacterState, frames: number, i = input()) => {
  let next = state;
  for (let f = 0; f < frames; f++) next = step(next, i, world, dt);
  return next;
};

describe('step', () => {
  it('camina a la derecha y a la izquierda', () => {
    const start = createCharacterState(100);
    expect(step(start, input({ right: true }), world, dt).x).toBeGreaterThan(100);
    expect(step(start, input({ left: true }), world, dt).x).toBeLessThan(100);
  });

  it('voltea al personaje y conserva la direccion al soltar', () => {
    const left = step(createCharacterState(100), input({ left: true }), world, dt);
    expect(left.facing).toBe(-1);
    expect(step(left, input(), world, dt).facing).toBe(-1);
  });

  it('no se sale de los limites del mundo', () => {
    expect(run(createCharacterState(5), 120, input({ left: true })).x).toBe(0);
    expect(run(createCharacterState(195), 120, input({ right: true })).x).toBe(200);
  });

  it('brinca desde el suelo y despega', () => {
    const jumped = step(createCharacterState(100), input({ jump: true }), world, dt);
    expect(jumped.grounded).toBe(false);
    expect(jumped.y).toBeGreaterThan(0);
  });

  it('no permite doble salto en el aire', () => {
    const jumped = step(createCharacterState(100), input({ jump: true }), world, dt);
    const airborne = run(jumped, 10);
    const retry = step(airborne, input({ jump: true }), world, dt);
    // El segundo brinco no reinicia el impulso: sigue cayendo por gravedad.
    expect(retry.vy).toBeLessThan(world.jumpVelocity);
  });

  it('la gravedad lo regresa al suelo', () => {
    const jumped = step(createCharacterState(100), input({ jump: true }), world, dt);
    const landed = run(jumped, 60); // 1s > los ~0.65s que dura el brinco
    expect(landed.grounded).toBe(true);
    expect(landed.y).toBe(0);
    expect(landed.vy).toBe(0);
  });

  it('puede brincar y moverse al mismo tiempo', () => {
    const start = createCharacterState(100);
    const jumped = step(start, input({ jump: true, right: true }), world, dt);
    expect(jumped.y).toBeGreaterThan(0);
    expect(jumped.x).toBeGreaterThan(100);
  });
});
