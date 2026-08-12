// Regla de cruce entre dos elementos. Pura: recibe medidas, no toca el DOM.

type Bounds = Pick<DOMRect, "left" | "right" | "width">;

/**
 * El centro horizontal de `mover` cae dentro del ancho de `target`.
 *
 * Se usa el centro y no el solape de cajas porque el sprite trae aire
 * transparente a los lados: con solape simple el efecto dispararia desde que se
 * rozan, y lo que queremos es que el monito este de verdad encima del texto.
 * Tampoco se mira el eje vertical, asi que tambien cuenta si pasa brincando.
 */
export function isOverCenter(mover: Bounds, target: Bounds): boolean {
  const center = mover.left + mover.width / 2;
  return center >= target.left && center <= target.right;
}
