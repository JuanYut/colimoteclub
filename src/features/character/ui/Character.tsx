import { motion } from 'motion/react';
import { useCharacterControls } from '../model/useCharacterControls';

const SIZE = 48;

// Monito jugable: arranca parado junto al titulo y camina/brinca desde ahi.
export function Character() {
  const { ref, x, y, facing } = useCharacterControls(SIZE);

  return (
    <motion.img
      ref={ref}
      src="/character.svg"
      alt="Tu monito"
      width={SIZE}
      height={SIZE}
      draggable={false}
      style={{
        x,
        y,
        scaleX: facing,
        imageRendering: 'pixelated',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    />
  );
}
