import type { Track } from '@/entities/track';

export interface RadioPosition {
  track: Track;
  offset: number; // segundos dentro de la pista
}

// Logica pura: dada la playlist y el tiempo, calcula que suena AHORA.
export function getCurrentTrack(
  playlist: Track[],
  nowMs: number,
  epochMs: number,
): RadioPosition | null {
  if (!playlist.length) return null;
  const total = playlist.reduce((s, t) => s + t.duration, 0);
  if (total <= 0) return null;

  // % seguro ante now < epoch
  const elapsed = ((((nowMs - epochMs) / 1000) % total) + total) % total;

  let acc = 0;
  for (const track of playlist) {
    if (elapsed < acc + track.duration) {
      return { track, offset: elapsed - acc };
    }
    acc += track.duration;
  }
  return null;
}
