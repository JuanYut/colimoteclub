import { useRef } from "react";
import { Character } from "@/features/character";
import { ReactionBubble, useReactions } from "@/features/reactions";
import { Hero } from "@/widgets/hero";

function App() {
  // La pagina es quien conoce a los dos, asi que aqui se conectan: el hero
  // observa al monito sin importar ninguna de las dos features a la otra.
  const characterRef = useRef<HTMLDivElement>(null);
  const { mode, reaction, emoteKey, pick } = useReactions();

  return (
    <>
      <section id="center">
        {/* El borde inferior del stage es el suelo: ahi se paran el titulo y el
            monito. El titulo es decorado; solo el monito se mueve. */}
        <div id="stage">
          {/* El globo va dentro del monito para que lo siga al caminar; la
              reaccion elegida le dispara la animacion por `emoteKey`. */}
          <Character nodeRef={characterRef} emoteKey={emoteKey}>
            <ReactionBubble mode={mode} reaction={reaction} onPick={pick} />
          </Character>
          <Hero crossedBy={characterRef} />
        </div>
      </section>

      {/* Fija al fondo y fuera del #center: asi la firma no entra en el
          centrado vertical ni empuja al monito de su linea de piso. */}
      <footer
        style={{
          position: "fixed",
          bottom: "1rem",
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#ffffff",
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          letterSpacing: "0.02em",
        }}
      >
        © 2026 juanyutdev - building stuff, no reason
      </footer>
    </>
  );
}

export default App;
