# CLAUDE.md

Guía para agentes que trabajen en este repo. El **README es el estado del
proyecto** (qué funciona hoy, qué sigue); este archivo son **las reglas de cómo
se trabaja aquí**. Si los dos se contradicen, gana este archivo y hay que
arreglar el README.

---

## Qué es esto

**Colimote Club** (`colimote.club`): radio web de lofi 24/7 con música donada por
artistas de Colima, México, más una capa lúdica — un monito jugable que corre,
brinca y reacciona sobre la página.

Es **una sola página**, sin backend propio y con presupuesto de infra casi cero.
Casi todas las decisiones de arquitectura salen de ahí.

---

## Comandos

| Comando           | Cuándo                                             |
| ----------------- | -------------------------------------------------- |
| `pnpm dev`        | Servidor de desarrollo                             |
| `pnpm test`       | Tests una vez (Vitest). **Antes de decir "listo"** |
| `pnpm test:watch` | Tests en watch                                     |
| `pnpm lint`       | ESLint. **Antes de decir "listo"**                 |
| `pnpm build`      | `tsc -b` + build. **Antes de decir "listo"**       |

El gestor es **pnpm**, no npm ni yarn. Node 24.

---

## Reglas de oro (lo que no se negocia)

1. **No agregues dependencias.** El stack está cerrado: React 19, Vite 8, TS 6,
   `motion` v13, axios, Vitest + Testing Library. Si de verdad hace falta algo,
   **pregunta antes**, no lo instales.
   Prohibidos a propósito: Next.js, Redux/Zustand, react-router, `framer-motion`
   (el paquete es `motion`, se importa de `motion/react`), Howler.js, GSAP,
   Lenis, Tailwind y cualquier framework de CSS.
2. **No toques `RADIO_EPOCH`** (`shared/config/constants.ts`). Cambiarlo
   reordena qué suena para todo el mundo. Solo se fija una vez, antes de
   publicar, y lo decide el humano.
3. **No inventes datos.** `public/playlist.json` y `public/artists.json` están
   vacíos porque **no hay audio con permiso todavía**. No los llenes con música
   de ejemplo ni con artistas ficticios: es un proyecto real con créditos reales.
4. **Los créditos no son negociables.** "Ahora suena X de Y" y la sección de
   artistas con sus redes son requisito del proyecto, no una feature opcional.
5. **No reformatees archivos que no estás tocando.** Nada de arreglar comillas o
   sangría de paso: ensucia el diff.
6. **No implementes slices vacíos por iniciativa propia.** Las carpetas con solo
   un `index.ts` comentado están vacías **a propósito** (ver README). Se llenan
   cuando toca, no "ya que estoy aquí".
7. **No borres ni relajes tests para que pase la suite.** Si un test estorba,
   dilo y explica por qué.

---

## Arquitectura: Feature-Sliced Design

Los imports van **solo hacia abajo**:

```
app → pages → widgets → features → entities → shared
```

Reglas que se rompen fácil y hay que cuidar:

1. Una capa solo importa de capas **inferiores**. Nunca al revés.
2. **Sin imports entre hermanos.** `features/character` no puede importar de
   `features/reactions` ni al revés. Si dos features se necesitan, **las conecta
   `App.tsx`** pasando props, o lo compartido baja a `entities`/`shared`.
3. **API pública por slice.** Importa `@/features/radio-sync`, nunca
   `@/features/radio-sync/model/useRadioSync`. Todo lo público sale del
   `index.ts` del slice.
4. Alias **`@` → `src`** en todo import interno.

Dentro de un slice:

| Carpeta   | Qué va                                                                        |
| --------- | ----------------------------------------------------------------------------- |
| `model/`  | Lógica. **Lo puro va en su propio archivo** y se testea; los hooks van aparte |
| `ui/`     | Componentes React                                                             |
| `api/`    | Llamadas HTTP (solo `entities`)                                               |
| `assets/` | Imágenes del slice                                                            |

**El patrón que se repite y hay que respetar:** la lógica pura (`physics.ts`,
`sprite.ts`, `getCurrentTrack.ts`, `scramble.ts`, `crossing.ts`, `reactions.ts`)
no toca DOM, ni reloj, ni React. El hook de al lado la conecta al navegador. Así
lo interesante se testea sin montar nada. Si estás por meter `Date.now()` o
`document` en un archivo puro, párate: va en el hook.

---

## Cómo se escribe aquí

### Idioma

- **Identificadores en inglés**: `getCurrentTrack`, `emoteKey`, `REACTIONS`.
- **Comentarios, commits y texto de UI en español.**
- **Comentarios sin acentos ni eñes** (`fisica`, `animacion`, `cuadro`). Es la
  convención del repo: `src/` es ASCII puro en comentarios.
  Excepción: el **texto que ve o escucha el usuario** (labels, `aria-label`,
  copy) sí lleva acentos correctos — es español de verdad, no un comentario.
- El README y `docs/` sí van con acentos completos.

### Comentarios

Los comentarios de este repo explican **por qué**, nunca **qué**. Cero
`// incrementa el contador`. Los buenos ejemplos ya están en el código: explican
una decisión, una trampa del navegador o una medición.

```ts
// offsetLeft es posicion de layout: el transform que le aplicamos no la altera.
```

Si un comentario se puede borrar sin perder información, bórralo.

### Commits

Conventional commits, en español, minúsculas, sin acentos:

```
feat: agrega el monito jugable
docs: actualiza el estado del proyecto
chore: configura tooling, alias y entorno de tests
```

Commitea **solo si te lo piden**.

---

## Patrones específicos del proyecto

### Animación y rendimiento

- **60 fps sin re-renders.** El loop del monito corre en `requestAnimationFrame`
  y escribe en **motion values** (`x`, `y`, `facing`), no en estado de React.
  Estado de React solo cuando cambia algo discreto (el cuadro del sprite, ~12
  veces por segundo).
- **Nada de props reactivas dentro del loop.** Si un valor externo tiene que
  llegar al `requestAnimationFrame`, se lee por `ref` (ver `emoteKey` en
  `useCharacterControls`). Meterlo en las deps del `useEffect` reinicia el loop
  y con él la física.
- **`AnimatePresence`** para lo que aparece y desaparece.
- **`layout` de motion está prohibido dentro del monito**: mide contra el
  viewport y el personaje se mueve cada cuadro, así que la proyección pelea con
  el movimiento.
- **Respeta `prefers-reduced-motion`** (`useReducedMotion`) en todo efecto
  decorativo. Ya hay gente que se marea con el barrido del título.

### Pixel art

- `SCALE` **entero siempre**. Una fracción deja unos píxeles de 1px y otros de
  2px.
- `imageRendering: "pixelated"`, sin excepción.
- Las medidas (`CELL`, `CROP`, número de cuadros) se **miden del PNG**, no se
  copian de la descripción del pack — no cuadra. Si agregas una animación,
  verifica el ancho del sheet y divide entre 96.

### Estilos

Estilos **inline** en el componente. `src/index.css` es solo para lo global y lo
que inline no puede (layout del `#stage`, `:root`). No hay CSS modules ni
librería de estilos y no se va a agregar.

### Accesibilidad

- Emoji o texto decorativo → `aria-label` con el nombre real y `aria-hidden` en
  lo que es ruido visual (ver `Hero` con el scramble y `ReactionBubble`).
- Los tests buscan por **rol y nombre accesible** (`getByRole("button", { name })`).
  Si un componente no se puede testear así, probablemente le falta accesibilidad.

---

## Tests

- **Vitest + Testing Library**, jsdom, `globals: true`. No Jest.
- Archivo `*.test.ts(x)` **junto al archivo que prueba**.
- Descripciones **en español, sin acentos**, describiendo comportamiento, no
  implementación: `it("en el aire siempre es jump, aunque se mueva")`.
- **Toda lógica pura nueva va con test.** Es barata de testear, por eso está
  separada.
- Componentes: prueba lo que el usuario percibe (qué se ve, qué pasa al hacer
  clic), no la estructura del DOM.

---

## Antes de decir que terminaste

1. `pnpm test` en verde.
2. `pnpm lint` sin salida.
3. `pnpm build` sin errores de TS.
4. **Actualiza el README** si cambió el estado: la sección "Funciona hoy", el
   número de tests, el tamaño del bundle y los "Siguientes pasos".
5. Di explícitamente **qué no pudiste verificar**. Este proyecto es visual y la
   suite no ve nada: si no abriste el navegador, dilo y señala qué revisar a
   mano.

---

## Dónde está cada verdad

| Archivo                       | Qué es                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `README.md`                   | **Estado actual**, cómo funciona cada pieza, siguientes pasos y deuda conocida                       |
| `CLAUDE.md`                   | Estas reglas                                                                                         |
| `docs/DEPLOY.md`              | Cómo publicar a Cloudflare Pages, qué revisar antes y cómo hacer rollback                            |
| `docs/IMPLEMENTATION_PLAN.md` | **Histórico**: el plan del scaffold inicial. No es la verdad de hoy — no lo sigas como instrucciones |

Empieza leyendo el README: la sección "Estado actual, en detalle" dice qué
funciona, qué está escrito pero sin conectar y qué está vacío a propósito.
