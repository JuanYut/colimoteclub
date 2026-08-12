import { Character } from "@/features/character";

function App() {
  return (
    <section id="center">
      {/* El borde inferior del stage es el suelo: ahi se para el monito. */}
      <div id="stage">
        <Character />
        <h1>colimote.club</h1>
      </div>
    </section>
  );
}

export default App;
