import { describe, it, expect } from "vitest";
import {
  createCharacterState,
  WORLD_DEFAULTS,
  type CharacterState,
} from "./physics";
import { ANIMATIONS, EMOTE_MS, getAnimation, getFrame } from "./sprite";

const makeState = (over: Partial<CharacterState> = {}): CharacterState => ({
  ...createCharacterState(0),
  ...over,
});

describe("getAnimation", () => {
  it("quieto en el suelo es idle", () => {
    expect(getAnimation(makeState())).toBe("idle");
  });

  it("moviendose en el suelo es run", () => {
    expect(getAnimation(makeState({ moving: true }))).toBe("run");
  });

  it("en el aire siempre es jump, aunque se mueva", () => {
    expect(getAnimation(makeState({ grounded: false }))).toBe("jump");
    expect(getAnimation(makeState({ grounded: false, moving: true }))).toBe(
      "jump",
    );
  });

  it("reacciona solo quieto en el suelo: la fisica manda", () => {
    expect(getAnimation(makeState(), true)).toBe("emote");
    expect(getAnimation(makeState({ moving: true }), true)).toBe("run");
    expect(getAnimation(makeState({ grounded: false }), true)).toBe("jump");
  });
});

describe("getFrame", () => {
  it("avanza el ciclo de carrera con el tiempo", () => {
    const s = makeState({ moving: true });
    expect(getFrame("run", s, 0)).toBe(0);
    // 12 fps -> un cuadro cada ~83ms
    expect(getFrame("run", s, 84)).toBe(1);
    expect(getFrame("run", s, 250)).toBe(3);
  });

  it("el ciclo de carrera hace loop", () => {
    const s = makeState({ moving: true });
    const cycleMs = (ANIMATIONS.run.frames / ANIMATIONS.run.fps) * 1000;
    expect(getFrame("run", s, cycleMs)).toBe(0);
  });

  it("nunca se sale del rango de cuadros", () => {
    const s = makeState();
    for (const ms of [0, 500, 5_000, 120_000]) {
      expect(getFrame("idle", s, ms)).toBeLessThan(ANIMATIONS.idle.frames);
      expect(getFrame("idle", s, ms)).toBeGreaterThanOrEqual(0);
    }
  });

  it("la reaccion no hace loop: se queda en el ultimo cuadro", () => {
    const s = makeState();
    expect(getFrame("emote", s, 0)).toBe(0);
    expect(getFrame("emote", s, EMOTE_MS)).toBe(ANIMATIONS.emote.frames - 1);
    // Aunque se pase de largo, no vuelve a empezar.
    expect(getFrame("emote", s, EMOTE_MS * 3)).toBe(
      ANIMATIONS.emote.frames - 1,
    );
  });

  it("el brinco elige la pose segun la velocidad vertical, no el reloj", () => {
    const rising = makeState({
      grounded: false,
      vy: WORLD_DEFAULTS.jumpVelocity,
    });
    const apex = makeState({ grounded: false, vy: 0 });
    const falling = makeState({
      grounded: false,
      vy: -WORLD_DEFAULTS.jumpVelocity,
    });

    expect(getFrame("jump", rising, 0)).toBe(1);
    expect(getFrame("jump", apex, 0)).toBe(2);
    expect(getFrame("jump", falling, 0)).toBe(3);

    // El tiempo no influye: la pose depende solo de la fisica.
    expect(getFrame("jump", apex, 9_999)).toBe(2);
  });
});
