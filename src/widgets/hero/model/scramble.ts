// Efecto de texto revuelto que se va resolviendo. Puro: mismas entradas, misma
// salida. El azar se inyecta para poder testearlo.

// Solo ASCII, para que cualquier fuente monoespaciada tenga estos glifos y el
// ancho del titulo no cambie mientras corre el efecto.
const CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789#$%&*+-/<>_";

// Los signos no se revuelven: el punto se queda fijo y el titulo se sigue
// leyendo como un dominio durante todo el efecto.
const SCRAMBLEABLE = /[a-z0-9]/i;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * `progress` va de 0 (todo revuelto) a 1 (texto final). Las letras se resuelven
 * de izquierda a derecha, y el largo nunca cambia.
 */
export function scramble(
  text: string,
  progress: number,
  random: () => number = Math.random,
): string {
  const revealed = Math.floor(text.length * clamp(progress, 0, 1));

  let out = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (i < revealed || !SCRAMBLEABLE.test(char)) {
      out += char;
    } else {
      out += CHARSET[Math.floor(random() * CHARSET.length)];
    }
  }
  return out;
}
