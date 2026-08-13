# Colimote Club 🌋

Radio web de **lofi 24/7** con música donada por artistas de Colima, México, más
una capa lúdica: al entrar te toca un monito que puedes mover por la página.

> **Estado:** scaffold del MVP funcionando y jugable. **Todavía no suena nada** —
> no hay archivos de audio ni artistas cargados.
> _Última actualización: 2026-08-12._

---

## Arranque rápido

```bash
pnpm install
pnpm dev
```

| Comando           | Qué hace                                     |
| ----------------- | -------------------------------------------- |
| `pnpm dev`        | Servidor de desarrollo (Vite)                |
| `pnpm build`      | `tsc -b` + build de producción a `dist/`     |
| `pnpm test`       | Tests una vez (Vitest)                       |
| `pnpm test:watch` | Tests en modo watch                          |
| `pnpm lint`       | ESLint                                       |
| `pnpm preview`    | Sirve el `dist/` ya construido               |

Requisitos: Node 24, pnpm 11.

---

## Stack

| Área         | Elección                    | Nota                                             |
| ------------ | --------------------------- | ------------------------------------------------ |
| Base         | React 19 + Vite 8 + TS 6    | Gestor de paquetes: **pnpm**                     |
| Arquitectura | **Feature-Sliced Design**   | Ver reglas abajo                                 |
| HTTP         | **axios**                   | Instancia única en `shared/api`                  |
| Animación    | **`motion`** v13            | Import `motion/react` — **no** `framer-motion`   |
| Tests        | **Vitest + Testing Library**| jsdom; no Jest                                   |
| Infra        | Cloudflare (Pages, R2)      | Objetivo < $30 USD/mes                           |

**Fuera del stack a propósito:** Next.js, Redux/Zustand, react-router, Howler.js,
GSAP, Lenis. Es una sola página; no hacen falta.

---

## Arquitectura

Feature-Sliced Design. Los imports van **solo hacia abajo**:

```
app → pages → widgets → features → entities → shared
```

Reglas que hay que respetar:

1. Una capa solo importa de capas **inferiores**, nunca al revés.
2. **Sin imports cruzados entre hermanos**: `features/character` no importa de
   `features/reactions`. Si algo se comparte, baja a `entities` o `shared`.
3. **API pública por slice**: importa desde `@/features/radio-sync`, nunca desde
   `@/features/radio-sync/model/useRadioSync`.
4. Alias `@` → `src` en todos los imports internos.

```
src/
├─ App.tsx                    # placeholder: título + monito
├─ features/
│  ├─ character/              # ✅ el monito jugable
│  │  ├─ model/physics.ts             # física pura (testeada)
│  │  ├─ model/useCharacterControls.ts# teclado + loop de rAF
│  │  └─ ui/Character.tsx
│  ├─ radio-sync/             # 🟡 escrito, sin usar todavía
│  │  ├─ model/getCurrentTrack.ts     # lógica pura (testeada)
│  │  └─ model/useRadioSync.ts
│  └─ reactions/              # ✅ el globo de emojis (MVP)
│     ├─ model/reactions.ts           # catálogo + estados (testeado)
│     ├─ model/useReactions.ts        # tecla R, elección, auto-cierre
│     └─ ui/ReactionBubble.tsx
├─ entities/
│  ├─ track/                  # 🟡 tipo Track + getPlaylist()
│  └─ artist/                 # 🟡 tipo Artist + getArtists()
├─ shared/
│  ├─ api/client.ts           # instancia de axios
│  └─ config/constants.ts     # API_BASE, R2_AUDIO_BASE, RADIO_EPOCH
├─ widgets/
│  ├─ hero/                   # ✅ el título: barrido de luz + scramble
│  └─ ...                     # ⬜ 5 slices vacíos (ver siguientes pasos)
└─ pages/home/                # ⬜ vacío
```

El plan original del scaffold está en [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)
(histórico: describe el arranque, no el estado de hoy).

Las **reglas de trabajo** (qué hacer y qué no en cada sesión: idioma, commits,
patrones, dependencias prohibidas) están en [`CLAUDE.md`](CLAUDE.md).

---

## Estado actual, en detalle

### ✅ Funciona hoy

- **El monito se mueve.** Plataformero 2D estilo Mario: `←`/`A` y `→`/`D` para
  correr, `Espacio`/`↑`/`W` para brincar. Gravedad, un solo salto (sin doble),
  clamp a los bordes de la ventana y volteo del sprite según la dirección.
- **Está animado con sprites.** Pixel art de un caballero, con ciclos de `idle`,
  `run` y `jump`. La pose del salto sale de la física (subiendo / cumbre /
  cayendo), no de un temporizador.
- **El monito reacciona.** `R` abre un globo blanco arriba de él con
  [❤️ 👍 😈 🎵 👻 👋]; al hacer clic en uno, el globo se queda solo con ese
  emoji ~3.5 s y el personaje hace una animación. `Escape` o `R` otra vez
  cierran. ⚠️ MVP: la animación es prestada del *ataque 3* del pack, no es la
  definitiva.
- **El texto es el suelo.** El monito vive en el flujo del layout junto al `h1`,
  así que arranca a su lado y corre sobre esa línea.
- **El título tiene un barrido de luz** que recorre las letras con un gradiente
  animado, en los verdes del logo.
- **El título se revuelve** (efecto scramble) al cargar la página y cada vez que
  el monito le pasa por encima, corriendo o brincando.
- **Respeta `prefers-reduced-motion`**: sin barrido ni scramble para quien lo
  tenga activado.
- **Firma al pie**: `© 2026 juanyutdev - building stuff, no reason`, fija al
  fondo y fuera del centrado para no mover al monito.
- **50 tests en verde** (`pnpm test`): 4 de la radio, 7 de la física, 9 de la
  animación, 6 del scramble, 5 del cruce, 3 del hero, 12 de las reacciones y 4
  del globo.
- **Build y lint limpios.** Bundle: 333 kB (111 kB gzip).

### 🟡 Escrito pero sin conectar

Existe el código, compila, pero **nadie lo llama todavía**:

- `useRadioSync` — calcula qué pista debería sonar y prepara el `<audio>`, pero
  no hay ningún `<audio>` montado en la app.
- `getPlaylist()` / `getArtists()` — leen `public/playlist.json` y
  `public/artists.json`, que hoy son `[]`.
- `R2_AUDIO_BASE` sigue siendo el placeholder `https://TU-BUCKET.r2.dev`.

### ⬜ Carpetas vacías (solo `index.ts` con un comentario)

`widgets/enter-screen`, `widgets/now-playing`, `widgets/artists`,
`widgets/donations`, `widgets/listener-count`, `pages/home`, `shared/ui`.

Es intencional: la estructura está lista, el contenido no.

---

## Cómo funciona la radio (sin servidor de streaming)

Esta es **la decisión de arquitectura más importante del proyecto**, porque es lo
que mantiene el costo casi en cero:

No hay servidor de streaming. Los MP3 viven en Cloudflare R2 como archivos
estáticos y **el cliente calcula solo qué debería estar sonando**:

1. Se define una fecha fija, `RADIO_EPOCH`.
2. `getCurrentTrack(playlist, ahora, epoch)` suma la duración de todas las
   pistas, saca `(ahora − epoch) % duraciónTotal` y recorre la lista para ubicar
   pista y segundo exacto.
3. El navegador pide ese archivo y hace `audio.currentTime = offset`.

Resultado: todos escuchan lo mismo al mismo segundo, el CDN cachea todo y no se
paga cómputo por oyente. El módulo maneja `now < epoch` y el loop al completar
la vuelta.

⚠️ **`RADIO_EPOCH` hay que fijarlo antes de publicar.** Cambiarlo después
reordena qué suena para todo el mundo.

---

## Cómo funciona el monito

- **`model/physics.ts`** es una función pura `step(estado, input, mundo, dt)`:
  sin DOM, sin reloj. Por eso se puede testear a fondo.
  Gravedad 2400 px/s², caminata 260 px/s, impulso 780 px/s → salto de ~127 px que
  dura ~0.65 s. Para cambiar el tacto, mueve `WORLD_DEFAULTS`.
- **`model/useCharacterControls.ts`** conecta esa física al navegador con un loop
  de `requestAnimationFrame` que escribe en **motion values**, no en estado de
  React: cero re-renders por cuadro.
  - El brinco es un evento de un frame (ignora el auto-repeat del teclado), así
    que mantener la tecla da **un** salto.
  - `dt` topado a 1/30 s para que volver de una pestaña inactiva no simule 30 s
    de golpe.
  - `blur` de la ventana suelta las teclas (si no, se queda caminando solo).
  - Los límites se calculan desde `offsetLeft`, que el `transform` no altera, y
    se re-miden en `resize` y con un `ResizeObserver`.
- **Las reacciones no lo conocen.** `features/reactions` y `features/character`
  son hermanos y por FSD no se importan: `useReactions` expone `emoteKey`, un
  contador que sube con cada elección, y `App` se lo pasa al monito. El globo
  viaja como `children` del personaje, así lo sigue al caminar sin que la
  feature del monito sepa qué está dibujando.
  - La animación de reacción es de **un solo tiro**: se congela en el último
    cuadro y se cancela si el jugador se mueve o brinca (la física manda).
  - `emoteKey` se lee por `ref` dentro del loop: si fuera dependencia del
    `useEffect`, cada reacción reiniciaría la física.

---

## Siguientes pasos

En orden de lo que realmente desbloquea el proyecto.

### 1. Conseguir audio 🔴 bloqueante

Sin esto nada de la radio se puede probar de verdad.

- [ ] Conseguir 3–5 tracks donados **con permiso por escrito**.
- [ ] Crear el bucket R2 y subirlos.
- [ ] Poner la URL pública real en `R2_AUDIO_BASE`.
- [ ] Llenar `public/playlist.json` (`id`, `title`, `artistId`, `url`,
      `duration` en segundos) y `public/artists.json`.
- [ ] Decidir y congelar el `RADIO_EPOCH` definitivo.

### 2. Que suene: `enter-screen` + `<audio>`

Los navegadores **bloquean el autoplay**, así que hace falta un gesto del
usuario. Ese es el propósito del widget `enter-screen`.

- [ ] Pantalla de "entrar" que al hacer clic monte el `<audio>` y llame `play()`.
- [ ] Conectar `useRadioSync` a ese `<audio>`.
- [ ] **Manejar el drift**: el hook actual pone `currentTime` al montar y al
      cambiar de pista, pero si el navegador tarda en bufferear se desfasa. Hay
      que re-sincronizar cada cierto tiempo y al evento `ended`.
- [ ] Control de volumen / mute.

### 3. Créditos (no negociables)

- [ ] `widgets/now-playing`: "ahora suena X de Y".
- [ ] `widgets/artists`: sección con los artistas y sus redes.

### 4. Publicar

El deploy **ya funciona**: `pnpm build` y `wrangler pages deploy dist`. Los
detalles, la checklist previa y el rollback están en
[`docs/DEPLOY.md`](docs/DEPLOY.md).

- [ ] Apuntar el dominio `colimote.club` en Pages → *Custom domains*.
- [ ] Configurar CORS del bucket R2 para que el `<audio>` pueda leerlo.

### 5. Pulir el juego

- [ ] **Controles táctiles**: en móvil el monito no se puede mover, y sin
      teclado tampoco puede abrir el menú de reacciones (falta un botón).
- [ ] **Sprites propios de reacción**: hoy las 6 usan prestado el *ataque 3*.
      Lo natural sería una por emoji (saludo, baile, susto…). Se cambia en
      `ANIMATIONS.emote` y `SHEETS` de `features/character`.
- [ ] El recorte (`CROP`) está medido para idle/run/jump: al ataque le corta la
      espada. Habrá que re-medirlo cuando existan los sprites buenos.
- [ ] Suelo visible / decorado.

### 6. v2 (después del MVP)

Mapa de los volcanes de Colima · conteo de oyentes (Worker + GA4 realtime) ·
multiplayer con Durable Objects (ver la reacción de los demás) · sección de
donaciones.

---

## Deuda conocida

| Tema | Detalle |
| ---- | ------- |
| Drift de audio | Ver paso 2 arriba. |
| Pocos tests de componentes | Solo el hero tiene test de render; el resto son de lógica pura. |
| Hueco del monito | Al caminar deja reservado su espacio de 48 px junto al título (el `transform` no reflowea). Sacarlo del flujo lo arregla, pero habría que calcular su posición inicial a mano. |
| Peso del bundle | 99 kB gzip, casi todo `motion`. Aceptable por ahora. |
