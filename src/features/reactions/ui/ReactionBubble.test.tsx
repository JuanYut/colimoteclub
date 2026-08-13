import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactionBubble } from "./ReactionBubble";
import { REACTIONS } from "../model/reactions";

describe("ReactionBubble", () => {
  it("no muestra nada mientras esta escondido", () => {
    render(<ReactionBubble mode="hidden" reaction={null} onPick={vi.fn()} />);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("abre el menu con todas las opciones", () => {
    render(<ReactionBubble mode="menu" reaction={null} onPick={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(REACTIONS.length);
    // Cada emoji se anuncia con su nombre, no con el caracter suelto.
    for (const reaction of REACTIONS) {
      expect(screen.getByRole("button", { name: reaction.label })).toBeInTheDocument();
    }
  });

  it("avisa cual se eligio al hacer clic", async () => {
    const onPick = vi.fn();
    render(<ReactionBubble mode="menu" reaction={null} onPick={onPick} />);

    await userEvent.click(screen.getByRole("button", { name: REACTIONS[0].label }));

    expect(onPick).toHaveBeenCalledWith(REACTIONS[0]);
  });

  it("ya elegida, deja solo esa y sin botones", () => {
    render(
      <ReactionBubble mode="picked" reaction={REACTIONS[1]} onPick={vi.fn()} />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: REACTIONS[1].label })).toHaveTextContent(
      REACTIONS[1].emoji,
    );
  });
});
