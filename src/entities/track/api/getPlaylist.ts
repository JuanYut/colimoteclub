import { client } from '@/shared/api';
import type { Track } from '../model/types';

export async function getPlaylist(): Promise<Track[]> {
  const { data } = await client.get<Track[]>('playlist.json');
  return data;
}
