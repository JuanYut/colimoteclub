import { describe, it, expect } from "vitest";
import { isOverCenter } from "./crossing";

const box = (left: number, width: number) => ({
  left,
  width,
  right: left + width,
});

// El titulo ocupa de 100 a 300.
const title = box(100, 200);

describe("isOverCenter", () => {
  it("no cuenta cuando solo se rozan los bordes", () => {
    // Termina justo donde empieza el titulo: su centro sigue fuera.
    expect(isOverCenter(box(20, 80), title)).toBe(false);
  });

  it("cuenta cuando el centro entra al ancho del titulo", () => {
    expect(isOverCenter(box(80, 80), title)).toBe(true); // centro en 120
  });

  it("cuenta estando encima por completo", () => {
    expect(isOverCenter(box(150, 60), title)).toBe(true);
  });

  it("deja de contar al salir por el otro lado", () => {
    expect(isOverCenter(box(280, 80), title)).toBe(false); // centro en 320
  });

  it("ignora el eje vertical: brincar tambien cuenta", () => {
    // Las medidas no incluyen alto a proposito, asi que la misma X aplica.
    expect(isOverCenter(box(190, 20), title)).toBe(true);
  });
});
