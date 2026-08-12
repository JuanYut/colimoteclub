import { client } from '@/shared/api';
import type { Artist } from '../model/types';

export async function getArtists(): Promise<Artist[]> {
  const { data } = await client.get<Artist[]>('artists.json');
  return data;
}
