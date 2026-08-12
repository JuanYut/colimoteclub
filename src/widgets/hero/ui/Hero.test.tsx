import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./Hero";

describe("Hero", () => {
  // Timers falsos para que el scramble no corra solo durante los tests.
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("muestra el titulo como encabezado", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", { name: "colimote.club" }),
    ).toBeInTheDocument();
  });

  it("conserva el nombre accesible aunque el texto visible este revuelto", () => {
    render(<Hero />);
    const title = screen.getByRole("heading");
    // El span visible se oculta a lectores de pantalla: el nombre sale del
    // aria-label, asi nadie escucha el galimatias del efecto.
    expect(title).toHaveAttribute("aria-label", "colimote.club");
    expect(title.querySelector("span")).toHaveAttribute("aria-hidden", "true");
  });

  it("pinta el texto con el gradiente recortado, no con color plano", () => {
    // Si background-clip dejara de aplicarse, el color transparente volveria
    // el titulo invisible: por eso los dos van juntos.
    render(<Hero />);
    const title = screen.getByRole("heading");
    // jsdom normaliza "transparent" a su forma rgba.
    expect(title).toHaveStyle({ color: "rgba(0, 0, 0, 0)" });
    expect(title.style.backgroundImage).toContain("linear-gradient");
  });
});
