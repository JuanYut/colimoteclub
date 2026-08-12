import { useRef, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useCrossing } from "@/shared/lib";
import { useScrambleText } from "../model/useScrambleText";

const TITLE = "colimote.club";

// Construida alrededor del verde del logo (#78FF75, el de en medio): lima ->
// verde marca -> menta. Son tonos vecinos (~60 grados de rango) y por eso se
// lee como un color respirando y no como un arcoiris. Todos son claros y
// saturados, asi que sobre el fondo #08060d el titulo siempre se lee.
const PALETTE = ["#b8ff8a", "#78ff75", "#3ee6a0"];

// El gradiente mide el doble del ancho del texto y repite la paleta dos veces
// mas el primer color al final. Asi su periodo es exactamente un ancho: al
// desplazarlo de 0% a 100% el ciclo cierra sin salto visible.
const GRADIENT = `linear-gradient(90deg, ${[...PALETTE, ...PALETTE, PALETTE[0]].join(", ")})`;

const SWEEP_SECONDS = 3;
const SCRAMBLE_MS = 1200;

interface HeroProps {
  // Cuando este elemento pasa por encima del titulo, el texto se revuelve.
  // El hero no sabe que es el monito: solo observa un elemento cualquiera.
  crossedBy?: RefObject<HTMLElement | null>;
}

export function Hero({ crossedBy }: HeroProps) {
  // Hay gente a la que el parpadeo de color le provoca mareo o migrana.
  const reduceMotion = useReducedMotion();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const nobody = useRef<HTMLElement>(null);
  const { display, restart } = useScrambleText(TITLE, SCRAMBLE_MS);

  useCrossing(crossedBy ?? nobody, titleRef, restart);

  return (
    <motion.h1
      ref={titleRef}
      // El texto visible es ruido mientras dura el efecto, asi que el nombre
      // accesible se declara aparte y el span se oculta para lectores.
      aria-label={TITLE}
      style={{
        backgroundImage: GRADIENT,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
      animate={
        reduceMotion
          ? undefined
          : { backgroundPosition: ["0% 50%", "100% 50%"] }
      }
      transition={{
        duration: SWEEP_SECONDS,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <span aria-hidden="true">{display}</span>
    </motion.h1>
  );
}
