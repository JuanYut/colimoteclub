import { describe, it, expect } from "vitest";
import {
  HIDDEN,
  REACTIONS,
  hide,
  showReaction,
  toggleMenu,
  type ReactionsState,
} from "./reactions";

describe("REACTIONS", () => {
  it("no repite ids ni emojis", () => {
    expect(new Set(REACTIONS.map((r) => r.id)).size).toBe(REACTIONS.length);
    expect(new Set(REACTIONS.map((r) => r.emoji)).size).toBe(REACTIONS.length);
  });

  it("todas tienen nombre accesible", () => {
    for (const reaction of REACTIONS) {
      expect(reaction.label.length).toBeGreaterThan(0);
    }
  });
});

describe("toggleMenu", () => {
  it("abre el menu cuando no hay nada", () => {
    expect(toggleMenu(HIDDEN)).toEqual({ mode: "menu", reaction: null });
  });

  it("lo cierra si ya estaba abierto", () => {
    expect(toggleMenu({ mode: "menu", reaction: null })).toEqual(HIDDEN);
  });

  it("desde una reaccion mostrandose vuelve a abrir el menu", () => {
    const picked: ReactionsState = { mode: "picked", reaction: REACTIONS[0] };
    expect(toggleMenu(picked)).toEqual({ mode: "menu", reaction: null });
  });
});

describe("showReaction", () => {
  it("deja solo la elegida", () => {
    const state = showReaction(REACTIONS[2]);
    expect(state.mode).toBe("picked");
    expect(state.reaction).toBe(REACTIONS[2]);
  });
});

describe("hide", () => {
  it("regresa a no mostrar nada", () => {
    expect(hide()).toEqual(HIDDEN);
  });
});
