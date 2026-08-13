import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useReactions } from "./useReactions";
import { REACTIONS } from "./reactions";

// Simula una tecla real: el hook escucha en window.
const press = (key: string, init: KeyboardEventInit = {}) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, ...init }));
  });

describe("useReactions", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("la R abre el menu y vuelve a cerrarlo", () => {
    const { result } = renderHook(() => useReactions());
    expect(result.current.mode).toBe("hidden");

    press("r");
    expect(result.current.mode).toBe("menu");

    press("R"); // mayuscula: el shift no deberia importar
    expect(result.current.mode).toBe("hidden");
  });

  it("no se mete con Ctrl+R ni Cmd+R", () => {
    const { result } = renderHook(() => useReactions());

    press("r", { ctrlKey: true });
    press("r", { metaKey: true });

    expect(result.current.mode).toBe("hidden");
  });

  it("Escape cierra", () => {
    const { result } = renderHook(() => useReactions());
    press("r");
    press("Escape");
    expect(result.current.mode).toBe("hidden");
  });

  it("al elegir deja solo esa reaccion y avisa al monito", () => {
    const { result } = renderHook(() => useReactions());
    const before = result.current.emoteKey;

    act(() => result.current.pick(REACTIONS[3]));

    expect(result.current.mode).toBe("picked");
    expect(result.current.reaction).toBe(REACTIONS[3]);
    // El contador cambia aunque se elija lo mismo dos veces seguidas.
    expect(result.current.emoteKey).toBe(before + 1);

    act(() => result.current.pick(REACTIONS[3]));
    expect(result.current.emoteKey).toBe(before + 2);
  });

  it("la reaccion elegida se va sola", () => {
    const { result } = renderHook(() => useReactions());

    act(() => result.current.pick(REACTIONS[0]));
    expect(result.current.mode).toBe("picked");

    act(() => vi.advanceTimersByTime(5_000));
    expect(result.current.mode).toBe("hidden");
  });
});
