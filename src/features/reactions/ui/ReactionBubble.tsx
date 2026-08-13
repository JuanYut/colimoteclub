import { AnimatePresence, motion } from "motion/react";
import { REACTIONS, type Reaction, type ReactionMode } from "../model/reactions";

// Globo blanco tipo comic: la punta de abajo apunta al monito.
const BUBBLE_STYLE = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: 2,
  padding: "4px 8px",
  borderRadius: 999,
  background: "#ffffff",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
  lineHeight: 1,
  whiteSpace: "nowrap",
} as const;

const TAIL_STYLE = {
  position: "absolute",
  top: "100%",
  left: "50%",
  width: 8,
  height: 8,
  background: "#ffffff",
  // Un cuadrado girado 45 grados: la mitad queda fuera del globo y hace la punta.
  transform: "translate(-50%, -60%) rotate(45deg)",
  borderRadius: 1,
} as const;

const OPTION_STYLE = {
  border: "none",
  background: "transparent",
  padding: 3,
  borderRadius: 8,
  fontSize: 20,
  lineHeight: 1,
  cursor: "pointer",
} as const;

// Aparece desde abajo, como si saliera del personaje.
const TRANSITION = { duration: 0.16, ease: "easeOut" } as const;

interface ReactionBubbleProps {
  mode: ReactionMode;
  reaction: Reaction | null;
  onPick: (reaction: Reaction) => void;
}

export function ReactionBubble({ mode, reaction, onPick }: ReactionBubbleProps) {
  return (
    <AnimatePresence>
      {mode !== "hidden" && (
        <motion.div
          // La misma llave para los dos modos: al elegir no se remonta el
          // globo, solo cambia lo de adentro. Sin `layout` a proposito: el
          // padre se mueve cada cuadro y la proyeccion pelearia con el.
          key="bubble"
          initial={{ opacity: 0, y: 6, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.85 }}
          transition={TRANSITION}
          style={BUBBLE_STYLE}
        >
          {mode === "menu" ? (
            <div role="group" aria-label="Reacciones" style={{ display: "flex", gap: 2 }}>
              {REACTIONS.map((option) => (
                <motion.button
                  key={option.id}
                  type="button"
                  aria-label={option.label}
                  onClick={() => onPick(option)}
                  whileHover={{ scale: 1.25 }}
                  whileTap={{ scale: 0.9 }}
                  style={OPTION_STYLE}
                >
                  {option.emoji}
                </motion.button>
              ))}
            </div>
          ) : (
            <span
              role="img"
              aria-label={reaction?.label}
              style={{ fontSize: 22, padding: 3 }}
            >
              {reaction?.emoji}
            </span>
          )}
          <span aria-hidden="true" style={TAIL_STYLE} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
