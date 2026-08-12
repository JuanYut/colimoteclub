import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { Track } from '@/entities/track';
import { RADIO_EPOCH } from '@/shared/config';
import { getCurrentTrack } from './getCurrentTrack';

const EPOCH = new Date(RADIO_EPOCH).getTime();
const TICK_MS = 1000;

// El reloj es un origen externo mutable: no se puede leer durante el render.
function subscribeToClock(onChange: () => void) {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
}

// Cuantizado al segundo para que el snapshot sea estable entre renders.
const getClockSnapshot = () => Math.floor(Date.now() / TICK_MS) * TICK_MS;

export function useRadioSync(playlist: Track[]) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const nowMs = useSyncExternalStore(subscribeToClock, getClockSnapshot, getClockSnapshot);

  const position = useMemo(
    () => getCurrentTrack(playlist, nowMs, EPOCH),
    [playlist, nowMs],
  );
  const current = position?.track ?? null;

  // Solo re-sincroniza el <audio> al cambiar de pista, no cada segundo.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    const pos = getCurrentTrack(playlist, Date.now(), EPOCH);
    if (!pos) return;
    audio.src = pos.track.url;
    audio.currentTime = pos.offset;
  }, [playlist, current]);

  return { audioRef, current };
}
