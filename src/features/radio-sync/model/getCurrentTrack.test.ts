import { describe, it, expect } from 'vitest';
import { getCurrentTrack } from './getCurrentTrack';
import type { Track } from '@/entities/track';

const track = (id: string, duration: number): Track => ({
  id, title: id, artistId: 'a', url: `${id}.mp3`, duration,
});

describe('getCurrentTrack', () => {
  const epoch = 0;
  const playlist = [track('t1', 100), track('t2', 200)]; // total 300s

  it('devuelve null si la playlist esta vacia', () => {
    expect(getCurrentTrack([], 1000, epoch)).toBeNull();
  });
  it('ubica la primera pista al inicio', () => {
    const pos = getCurrentTrack(playlist, 10_000, epoch);
    expect(pos?.track.id).toBe('t1');
    expect(pos?.offset).toBe(10);
  });
  it('cruza a la segunda pista', () => {
    const pos = getCurrentTrack(playlist, 150_000, epoch);
    expect(pos?.track.id).toBe('t2');
    expect(pos?.offset).toBe(50);
  });
  it('hace loop al completar la vuelta', () => {
    const pos = getCurrentTrack(playlist, 310_000, epoch);
    expect(pos?.track.id).toBe('t1');
    expect(pos?.offset).toBe(10);
  });
});
