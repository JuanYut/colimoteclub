export interface Track {
  id: string;
  title: string;
  artistId: string;
  url: string;      // URL del audio en R2 (cuando exista)
  duration: number; // segundos
}
