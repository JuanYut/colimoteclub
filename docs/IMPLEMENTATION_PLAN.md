# Plan de implementación — Colimote Club (v1 / MVP scaffold)

> **Para el agente:** Este documento describe el andamiaje inicial del proyecto.
> Ejecuta las fases **en orden**. Después de cada fase corre su bloque de
> verificación y **no avances si falla**. No agregues dependencias ni archivos
> que no estén aquí. Cuando termines, reporta el resultado de la Fase 6.

---

## 1. Contexto del proyecto

**Colimote Club** (`colimote.club`) es una radio web de lofi 24/7 con música
donada por artistas de Colima, México, más una capa lúdica: al entrar te toca un
monito y (más adelante) puedes moverte y reaccionar sobre un mapa de los
volcanes de Colima.

Puntos clave que afectan la arquitectura:

- **No hay servidor de streaming.** El audio vive en Cloudflare R2 y el cliente
  calcula un offset desde una fecha fija (`RADIO_EPOCH`) para saber qué suena
  ahora. Así todos escuchan lo mismo al mismo segundo y el CDN cachea.
- **Créditos no negociables:** debe mostrarse "ahora suena X" y una sección de
  artistas con sus redes.
- **Infra:** Cloudflare (Pages, R2, Workers). Objetivo de costo < $30 USD/mes.

**Este plan cubre solo el scaffold del MVP.** No implementa el mapa, el
multiplayer (v2) ni el Worker de conteo — solo deja la estructura lista.

### Estado actual real

- **Aún no hay archivos de audio.** Los manifiestos arrancan vacíos (`[]`).
- **El personaje es un asset estático** (`.png`/`.svg`), sin movimiento todavía.

---

## 2. Stack y decisiones (respétalas, no las cambies)

| Área         | Elección                        | Nota                                                                             |
| ------------ | ------------------------------- | -------------------------------------------------------------------------------- |
| Base         | React + Vite + TypeScript       | Gestor de paquetes: **pnpm**                                                     |
| Arquitectura | **Feature-Sliced Design (FSD)** | Ver reglas en §3                                                                 |
| HTTP         | **axios**                       | Instancia única en `shared/api`                                                  |
| Animación    | **`motion`** (Framer Motion)    | ⚠️ paquete `motion`, import `motion/react` — **no** `framer-motion`, **no** GSAP |
| Tests        | **Vitest + Testing Library**    | Nativo de Vite; no usar Jest                                                     |

**No agregar** (fuera de alcance del MVP): Next.js, Redux/Zustand, react-router,
Howler.js, GSAP, framer-motion, Lenis, ni ninguna otra lib no listada arriba.

---

## 3. Reglas de FSD (el agente debe cumplirlas siempre)

1. **Dirección de imports (solo hacia abajo):**
   `app → pages → widgets → features → entities → shared`.
   Una capa solo importa de capas inferiores. Nunca al revés.
2. **Sin imports cruzados en el mismo nivel:** un slice no importa de otro slice
   hermano (`features/character` **no** importa de `features/reactions`). Si algo
   se comparte, baja a `entities` o `shared`.
3. **API pública por slice:** importa siempre desde el `index.ts` del slice
   (`@/features/radio-sync`), nunca desde sus internos
   (`@/features/radio-sync/model/useRadioSync`).
4. **Alias `@` → `src`** en todos los imports internos.

Nota: al ser una sola página, varios slices arrancan casi vacíos. Es esperado;
no los infles.

---

## 4. Fases de ejecución

### Fase 0 — Inicializar Vite (solo si no existe el proyecto)

> **Estado confirmado:** el proyecto YA está inicializado (Vite + React + TS +
> pnpm, con tooling de Cloudflare/Wrangler presente: `.wrangler/`, `dist/`).
> **Salta esta fase** y ve directo a la Fase 1.

Si **no** existe `package.json` en el directorio actual, inicializa:

```bash
pnpm create vite . --template react-ts
pnpm install
```

Si ya existe `package.json` con React + Vite, **omite esta fase**.

**Verificación:**

```bash
test -f package.json && test -d src && echo "OK Fase 0"
```

---

### Fase 1 — Dependencias

```bash
# Limpieza defensiva por si quedó GSAP de un intento previo
pnpm remove gsap @gsap/react 2>/dev/null || true

# Runtime
pnpm add motion axios

# Tests
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Script de test
pnpm pkg set scripts.test=vitest
```

**Verificación:**

```bash
node -e "const p=require('./package.json');['motion','axios'].forEach(d=>{if(!p.dependencies?.[d])throw new Error('falta '+d)});if(!p.scripts?.test)throw new Error('falta script test');console.log('OK Fase 1')"
```

---

### Fase 2 — Configuración (alias + tests)

**2.1 — Fusiona (NO sobrescribas) `vite.config.ts`.** Ya existe un
`vite.config.ts` configurado con tooling de Cloudflare. **Consérvalo tal cual**
(plugins y toda config de Cloudflare incluidos) y solo **añade** tres cosas:

1. Como primera línea del archivo: `/// <reference types="vitest/config" />`
2. El import: `import path from 'node:path';`
3. Dentro de `defineConfig({ ... })`, sin borrar nada existente, agrega los
   bloques `resolve.alias` y `test`.

Debe quedar con esta forma (fusiónalo con tus plugins actuales, **no los quites**;
si el plugin de React es la variante SWC, déjalo como está):

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // conserva el/los plugin(s) que ya tengas
import path from "node:path";

export default defineConfig({
  plugins: [react()], // <- DEJA aquí tus plugins existentes (incl. Cloudflare)
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

> **Nota Cloudflare:** si usas `@cloudflare/vite-plugin` y `pnpm test` falla
> intentando arrancar el runtime de Worker, mueve **solo** el bloque `test` a un
> `vitest.config.ts` aparte (sin el plugin de Cloudflare) y deja
> `vite.config.ts` intacto. Estos tests son unitarios de frontend (jsdom),
> independientes de cualquier test de Worker que agregues después.

**2.2** Agrega el alias de TypeScript. En `tsconfig.app.json` (el que incluye
`src`), dentro de `compilerOptions`, añade:

```json
"baseUrl": ".",
"paths": { "@/*": ["src/*"] }
```

> Los tests resuelven `@` vía la config de Vite; TS lo necesita para el
> type-check y el editor.

**Verificación:**

```bash
grep -q "'@'" vite.config.ts && grep -q '"@/\*"' tsconfig.app.json && echo "OK Fase 2"
```

---

### Fase 3 — Estructura de carpetas y archivos

Ejecuta este bloque completo. Crea el árbol FSD y escribe los archivos base.

```bash
mkdir -p \
  src/app/providers src/app/styles \
  src/pages/home/ui \
  src/widgets/enter-screen/ui src/widgets/hero/ui src/widgets/now-playing/ui \
  src/widgets/artists/ui src/widgets/donations/ui src/widgets/listener-count/ui \
  src/features/radio-sync/model \
  src/features/character/ui src/features/character/model \
  src/features/reactions/ui src/features/reactions/model \
  src/entities/track/model src/entities/track/api \
  src/entities/artist/model src/entities/artist/api src/entities/artist/ui \
  src/shared/api src/shared/config src/shared/ui src/shared/lib \
  src/test \
  public workers/listener-count

# ---- test setup ----
cat > src/test/setup.ts << 'EOF'
import '@testing-library/jest-dom';
EOF

# ---- shared: config ----
cat > src/shared/config/constants.ts << 'EOF'
// MVP: datos como JSON estatico servido por Cloudflare Pages.
// Cuando haya API/Worker, solo cambias estas constantes.
export const API_BASE = '/';
export const R2_AUDIO_BASE = 'https://TU-BUCKET.r2.dev';
export const RADIO_EPOCH = '2025-01-01T00:00:00Z';
EOF
echo "export * from './constants';" > src/shared/config/index.ts

# ---- shared: cliente axios ----
cat > src/shared/api/client.ts << 'EOF'
import axios from 'axios';
import { API_BASE } from '@/shared/config';

export const client = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
});
EOF
echo "export * from './client';" > src/shared/api/index.ts

# ---- entities: track ----
cat > src/entities/track/model/types.ts << 'EOF'
export interface Track {
  id: string;
  title: string;
  artistId: string;
  url: string;      // URL del audio en R2 (cuando exista)
  duration: number; // segundos
}
EOF
cat > src/entities/track/api/getPlaylist.ts << 'EOF'
import { client } from '@/shared/api';
import type { Track } from '../model/types';

export async function getPlaylist(): Promise<Track[]> {
  const { data } = await client.get<Track[]>('playlist.json');
  return data;
}
EOF
cat > src/entities/track/index.ts << 'EOF'
export type { Track } from './model/types';
export { getPlaylist } from './api/getPlaylist';
EOF

# ---- entities: artist ----
cat > src/entities/artist/model/types.ts << 'EOF'
export interface Artist {
  id: string;
  name: string;
  socials: { label: string; url: string }[];
}
EOF
cat > src/entities/artist/api/getArtists.ts << 'EOF'
import { client } from '@/shared/api';
import type { Artist } from '../model/types';

export async function getArtists(): Promise<Artist[]> {
  const { data } = await client.get<Artist[]>('artists.json');
  return data;
}
EOF
cat > src/entities/artist/index.ts << 'EOF'
export type { Artist } from './model/types';
export { getArtists } from './api/getArtists';
EOF

# ---- feature: radio-sync (logica pura + hook + test) ----
cat > src/features/radio-sync/model/getCurrentTrack.ts << 'EOF'
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
EOF
cat > src/features/radio-sync/model/getCurrentTrack.test.ts << 'EOF'
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
EOF
cat > src/features/radio-sync/model/useRadioSync.ts << 'EOF'
import { useEffect, useRef, useState } from 'react';
import type { Track } from '@/entities/track';
import { RADIO_EPOCH } from '@/shared/config';
import { getCurrentTrack } from './getCurrentTrack';

const EPOCH = new Date(RADIO_EPOCH).getTime();

export function useRadioSync(playlist: Track[]) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<Track | null>(null);

  useEffect(() => {
    const pos = getCurrentTrack(playlist, Date.now(), EPOCH);
    if (!pos) { setCurrent(null); return; }
    setCurrent(pos.track);
    if (audioRef.current) {
      audioRef.current.src = pos.track.url;
      audioRef.current.currentTime = pos.offset;
    }
  }, [playlist]);

  return { audioRef, current };
}
EOF
cat > src/features/radio-sync/index.ts << 'EOF'
export { useRadioSync } from './model/useRadioSync';
export { getCurrentTrack } from './model/getCurrentTrack';
EOF

# ---- feature: character (estatico, con Framer Motion) ----
cat > src/features/character/ui/Character.tsx << 'EOF'
import { motion } from 'motion/react';

// Monito estatico por ahora. Movimiento/brinco llega despues.
// Coloca tu archivo en public/ (ej. public/character.svg) y ajusta el src.
export function Character() {
  return (
    <motion.img
      src="/character.svg"
      alt="Tu monito"
      width={64}
      height={64}
      draggable={false}
      style={{ imageRendering: 'pixelated', cursor: 'pointer' }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.9 }}
    />
  );
}
EOF
echo "export { Character } from './ui/Character';" > src/features/character/index.ts

# ---- stubs de API publica del resto de slices ----
for f in \
  src/pages/home/index.ts \
  src/widgets/enter-screen/index.ts src/widgets/hero/index.ts \
  src/widgets/now-playing/index.ts src/widgets/artists/index.ts \
  src/widgets/donations/index.ts src/widgets/listener-count/index.ts \
  src/features/reactions/index.ts \
  src/shared/ui/index.ts src/shared/lib/index.ts
do
  echo "// API publica del slice. Exporta solo lo que otras capas pueden usar." > "$f"
done

# ---- manifiestos vacios (aun sin audio ni artistas) ----
echo "[]" > public/playlist.json
echo "[]" > public/artists.json
```

**Verificación:**

```bash
test -f src/features/radio-sync/model/getCurrentTrack.ts \
  && test -f src/features/character/ui/Character.tsx \
  && test "$(cat public/playlist.json)" = "[]" \
  && echo "OK Fase 3"
```

---

### Fase 4 — Registrar la app (opcional pero recomendado)

Deja al menos un uso real para que el type-check y el build no marquen código
muerto. Si el template generó `src/App.tsx`, reemplázalo por un placeholder
mínimo que use la feature `character`:

```bash
cat > src/App.tsx << 'EOF'
import { Character } from '@/features/character';

export default function App() {
  return (
    <main>
      <h1>Colimote Club</h1>
      <Character />
    </main>
  );
}
EOF
```

> No implementes aquí el hero, la pantalla de "entrar" ni las secciones. Eso
> es trabajo posterior; este placeholder solo valida que el andamiaje compila.

---

### Fase 5 — Verificación de tests

```bash
pnpm test -- --run
```

**Esperado:** 1 archivo de test, **4 tests en verde**
(`getCurrentTrack.test.ts`).

---

### Fase 6 — Verificación final (build + typecheck)

```bash
pnpm build
```

**Esperado:** `tsc` sin errores de tipo y `vite build` exitoso.

Al terminar, reporta:

- Resultado de `pnpm test` (nº de tests en verde).
- Resultado de `pnpm build` (éxito / errores).
- Árbol generado: `find src public workers -type f | sort`.

---

## 5. Definición de "hecho" (Definition of Done)

- [ ] Fase 0–6 ejecutadas sin errores.
- [ ] `pnpm test` → 4 tests en verde.
- [ ] `pnpm build` exitoso (sin errores de TS).
- [ ] `pnpm dev` levanta la app y renderiza el placeholder.
- [ ] Estructura FSD creada con `index.ts` (API pública) en cada slice.
- [ ] `motion` y `axios` en `dependencies`; sin `gsap`/`framer-motion`.
- [ ] Manifiestos `public/playlist.json` y `public/artists.json` como `[]`.

---

## 6. Fuera de alcance (NO hacer en este plan)

- Mapa de volcanes, movimiento/brinco del monito, reacciones con `AnimatePresence`.
- Pantalla de "entrar" (gate de autoplay), hero, now-playing, secciones de
  artistas/donaciones (los slides existen como carpetas vacías, sin implementar).
- Worker de conteo de oyentes (GA4 realtime).
- Multiplayer / WebSockets / Durable Objects (v2).
- Subida de audio a R2 y llenado de los manifiestos.

Estas piezas se implementarán en iteraciones posteriores sobre esta base.
