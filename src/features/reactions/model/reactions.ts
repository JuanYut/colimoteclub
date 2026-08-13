// Catalogo de reacciones y la maquina de estados del globo. Todo puro: sin DOM
// ni temporizadores, para poder testearlo sin montar nada.

export interface Reaction {
  id: string;
  emoji: string;
  label: string; // nombre accesible: el emoji solo no le dice nada a un lector
}

export const REACTIONS: readonly Reaction[] = [
  { id: "love", emoji: "❤️", label: "Me encanta" },
  { id: "like", emoji: "👍", label: "Me gusta" },
  { id: "evil", emoji: "😈", label: "Travieso" },
  { id: "music", emoji: "🎵", label: "Qué buena rola" },
  { id: "ghost", emoji: "👻", label: "Buuu" },
  { id: "wave", emoji: "👋", label: "Hola" },
];

// hidden = nada arriba del monito; menu = las opciones; picked = solo la elegida.
export type ReactionMode = "hidden" | "menu" | "picked";

export interface ReactionsState {
  mode: ReactionMode;
  reaction: Reaction | null;
}

export const HIDDEN: ReactionsState = { mode: "hidden", reaction: null };

/** La tecla de reacciones abre el menu y, si ya estaba abierto, lo cierra. */
export function toggleMenu(state: ReactionsState): ReactionsState {
  return state.mode === "menu" ? HIDDEN : { mode: "menu", reaction: null };
}

/** Al elegir, el menu se reemplaza por la reaccion sola. */
export function showReaction(reaction: Reaction): ReactionsState {
  return { mode: "picked", reaction };
}

export function hide(): ReactionsState {
  return HIDDEN;
}
