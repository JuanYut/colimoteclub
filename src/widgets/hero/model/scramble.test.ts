import { describe, it, expect } from "vitest";
import { scramble } from "./scramble";

const TEXT = "colimote.club";

// Azar fijo: siempre cae en el primer caracter del charset, la "a".
const always = () => 0;

describe("scramble", () => {
  it("con progreso 1 devuelve el texto original", () => {
    expect(scramble(TEXT, 1, always)).toBe(TEXT);
  });

  it("con progreso 0 revuelve todas las letras", () => {
    expect(scramble(TEXT, 0, always)).toBe("aaaaaaaa.aaaa");
  });

  it("resuelve de izquierda a derecha", () => {
    // 13 caracteres * 0.5 -> los primeros 6 ya son reales.
    expect(scramble(TEXT, 0.5, always)).toBe("colimoaa.aaaa");
  });

  it("nunca cambia el largo del texto", () => {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      expect(scramble(TEXT, p, always)).toHaveLength(TEXT.length);
    }
  });

  it("deja intactos los signos, solo revuelve letras y numeros", () => {
    // El punto se queda en su lugar en cualquier momento del efecto.
    for (const p of [0, 0.3, 0.9]) {
      expect(scramble(TEXT, p, always)[8]).toBe(".");
    }
    expect(scramble("a b-c", 0, always)).toBe("a a-a");
  });

  it("acota el progreso fuera de rango", () => {
    expect(scramble(TEXT, -5, always)).toBe(scramble(TEXT, 0, always));
    expect(scramble(TEXT, 99, always)).toBe(TEXT);
  });
});
