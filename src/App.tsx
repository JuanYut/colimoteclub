import { useRef } from "react";
import { Character } from "@/features/character";
import { Hero } from "@/widgets/hero";

function App() {
  // La pagina es quien conoce a los dos, asi que aqui se conectan: el hero
  // observa al monito sin importar ninguna de las dos features a la otra.
  const characterRef = useRef<HTMLDivElement>(null);

  return (
    <section id="center">
      {/* El borde inferior del stage es el suelo: ahi se paran el titulo y el
          monito. El titulo es decorado; solo el monito se mueve. */}
      <div id="stage">
        <Character nodeRef={characterRef} />
        <Hero crossedBy={characterRef} />
      </div>
    </section>
  );
}

export default App;
