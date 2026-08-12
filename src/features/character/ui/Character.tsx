import { useCallback, useEffect, type RefObject } from "react";
import { motion } from "motion/react";
import { useCharacterControls } from "../model/useCharacterControls";
import { ANIMATIONS, type AnimationName } from "../model/sprite";
import idleSheet from "../assets/character_sprites/IDLE.png";
import runSheet from "../assets/character_sprites/RUN.png";
import jumpSheet from "../assets/character_sprites/JUMP.png";

// Geometria medida de los PNG, no la que dice la descripcion del pack.
// Cada cuadro del sheet mide 96x84, pero el caballero solo ocupa una parte:
// recortamos la caja util comun a idle/run/jump para no reservar 96px de
// layout puro aire transparente. El recorte es identico en las tres
// animaciones, asi que el personaje no salta al cambiar de una a otra.
const CELL = { w: 96, h: 84 };
const CROP = { x: 26, y: 16, w: 41, h: 46 };

// Escala entera: con pixel art cualquier fraccion deja unos pixeles de 1px y
// otros de 2px. Ponlo en 1 si lo quieres a la mitad de grande.
const SCALE = 2;

const SHEETS: Record<AnimationName, string> = {
  idle: idleSheet,
  run: runSheet,
  jump: jumpSheet,
};

interface CharacterProps {
  // Opcional: deja que la pagina siga por donde va el monito, por ejemplo para
  // reaccionar cuando pasa por encima de algo.
  nodeRef?: RefObject<HTMLDivElement | null>;
}

export function Character({ nodeRef }: CharacterProps) {
  const { ref, x, y, facing, sprite } = useCharacterControls(CROP.w * SCALE);

  // El nodo lo ocupan dos partes: la fisica, que mide su posicion de layout, y
  // quien lo quiera observar desde fuera.
  const setNode = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node;
      if (nodeRef) nodeRef.current = node;
    },
    [ref, nodeRef],
  );

  // Sin esto, el primer brinco parpadea mientras baja JUMP.png.
  useEffect(() => {
    for (const src of Object.values(SHEETS)) {
      const img = new Image();
      img.src = src;
    }
  }, []);

  const { animation, frame } = sprite;

  return (
    <motion.div
      ref={setNode}
      id="character"
      role="img"
      aria-label="Tu monito"
      style={{
        width: CROP.w * SCALE,
        height: CROP.h * SCALE,
        flexShrink: 0,
        x,
        y,
        scaleX: facing,
        backgroundImage: `url(${SHEETS[animation]})`,
        backgroundSize: `${ANIMATIONS[animation].frames * CELL.w * SCALE}px ${CELL.h * SCALE}px`,
        backgroundPosition: `${-(frame * CELL.w + CROP.x) * SCALE}px ${-CROP.y * SCALE}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        pointerEvents: "none",
      }}
    />
  );
}
