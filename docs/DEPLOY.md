# Cómo publicar Colimote Club

Deploy manual a **Cloudflare Pages** desde tu máquina. No hay CI: publicas tú,
cuando quieres.

---

## El deploy, en dos comandos

```bash
pnpm build
pnpm dlx wrangler pages deploy dist --project-name=colimoteclub
```

Eso es todo. El resto de este documento es **por qué funciona así** y **qué
revisar antes de correrlo**.

---

## Qué está pasando

| Paso                         | Qué hace                                                           |
| ---------------------------- | ------------------------------------------------------------------ |
| `pnpm build`                 | `tsc -b` (falla si hay error de tipos) y luego Vite genera `dist/` |
| `wrangler pages deploy dist` | Sube el contenido de `dist/` al proyecto Pages `colimoteclub`      |

Puntos que suelen confundir:

- **No hay `wrangler.toml` y no hace falta.** Ese archivo es para Workers y para
  configuración persistente. Aquí el sitio es **estático** y todo lo que wrangler
  necesita se lo pasas en la línea de comandos: la carpeta y el nombre del
  proyecto.
- **El proyecto `colimoteclub` ya existe** en la cuenta de Cloudflare. El comando
  sube a un proyecto creado, no lo crea.
- **`pnpm dlx` descarga wrangler al vuelo.** Por eso no está en
  `devDependencies` y por eso el primer deploy de cada rato tarda más.
- **`dist/` y `.wrangler/` están en `.gitignore`.** Son temporales; nunca se
  commitean.
- **Vite limpia `dist/` en cada build**, así que no arrastras archivos viejos.

---

## Antes de publicar

```bash
pnpm test    # en verde
pnpm lint    # sin salida
pnpm build   # sin errores de TS
```

Y revisa a ojo:

- [ ] **Abriste la página en el navegador.** La suite de tests no ve nada: el
      monito, el globo de reacciones y el título son visuales. Un `pnpm dev` y
      dos minutos de jugar atrapan lo que los tests no.
- [ ] **`RADIO_EPOCH` está congelado.** Ver la advertencia de abajo.
- [ ] **`R2_AUDIO_BASE` no es el placeholder** `https://TU-BUCKET.r2.dev`, si ya
      hay audio.
- [ ] **Los créditos se ven**: "ahora suena X de Y" y la sección de artistas.
      Es un requisito del proyecto, no una feature opcional.

---

## ⚠️ `RADIO_EPOCH` solo se fija una vez

Está en `src/shared/config/constants.ts` y es **la fecha desde la que se calcula
qué canción suena**. Todos los oyentes la usan para llegar al mismo segundo sin
servidor de streaming.

Si la cambias después de publicar, **la programación se reordena para todo el
mundo**: quien estaba a la mitad de una canción salta a otra. Se decide una vez,
antes del primer deploy con audio real, y ya no se toca.

---

## Producción vs. preview

Wrangler deduce la rama de git en la que estás:

- En la **rama de producción** del proyecto Pages (`main`) → el deploy va a
  **producción**.
- En **cualquier otra rama** → Cloudflare genera un **preview** con su propia
  URL, y producción no se mueve.

Eso hace que probar en preview sea gratis: trabaja en una rama, deploya, y
comparte la URL de preview que imprime wrangler al terminar.

Para forzarlo explícitamente:

```bash
pnpm dlx wrangler pages deploy dist --project-name=colimoteclub --branch=mi-rama
```

---

## Si algo sale mal

**Rollback:** dashboard de Cloudflare → Workers & Pages → `colimoteclub` →
Deployments → el deploy anterior → _Rollback_. Es instantáneo y no necesita
volver a buildear.

**"Se ve la versión vieja":** Pages cachea en el CDN. Prueba con recarga forzada
(`Ctrl+Shift+R`) antes de asumir que el deploy falló.

**"La página sale en blanco":** abre la consola del navegador. Casi siempre es un
error de JS en tiempo de ejecución, no del deploy — el HTML sí llegó.

**No verifiques el deploy con `curl` ni con un fetch.** La app se renderiza en el
cliente: el HTML que sirve Pages es un `<div id="root">` vacío. Cualquier
herramienta que no ejecute JavaScript va a reportar una página sin contenido
aunque el deploy esté perfecto. Se verifica **en un navegador**.

---

## Dominio

El sitio vive en `colimoteclub.pages.dev`. El dominio real, `colimote.club`, se
conecta desde el dashboard: proyecto → _Custom domains_ → _Set up a domain_.
Cloudflare crea el registro DNS y emite el certificado solo. No hay nada que
configurar en el código.

---

## Lo que Pages **no** sirve

- **El audio.** Los MP3 viven en **R2**, no en `dist/`. El bucket necesita acceso
  público (o un dominio propio) y **CORS que permita el origen del sitio**, o el
  `<audio>` va a fallar en producción aunque en local funcione.
- **Secretos.** Todo lo que entra al bundle es público: cualquiera puede leerlo
  con ver-fuente. Si algún día hace falta una llave, va en un Worker, nunca en
  `src/`.

---

## Límites que importan

Cloudflare Pages: **20 000 archivos** por deploy y **25 MiB por archivo**. Hoy el
sitio son unos pocos archivos y ~330 kB; el techo real va a ser el audio, y ese
va en R2, que se cobra aparte. El objetivo de costo del proyecto es **< $30
USD/mes**.

---

## Automatizarlo (opcional, todavía no)

Dos caminos cuando el deploy manual estorbe:

1. **Conectar el repo a Pages** desde el dashboard: Cloudflare buildea y publica
   en cada push. Cero configuración local, pero pierdes el control de _cuándo_
   sale algo.
2. **GitHub Actions** con `wrangler pages deploy`: más control (puedes exigir que
   los tests pasen antes de publicar), a cambio de mantener un workflow.

Mientras el proyecto sea de una persona, el deploy manual está bien y evita
sorpresas. Un atajo intermedio: agregar un script a `package.json`.

```json
"deploy": "pnpm build && wrangler pages deploy dist --project-name=colimoteclub"
```
