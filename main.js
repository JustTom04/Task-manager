const greetBtn = document.getElementById("greetBtn");
const nameInput = document.getElementById("nameInput");
const output = document.getElementById("output");

greetBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if(name) {
    output.textContent = `Hello, ${name}!`;
  } else {
    output.textContent = "Please enter a name.";
  }
});

import { useState } from "react";

function App() {
  // Állapot létrehozása
  const [number, setNumber] = useState(0);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Counter Example</h1>

      {/* Számláló gomb */}
      <button onClick={() => setNumber(number + 1)}>
        Count
      </button>

      {/* Számláló érték kiírása */}
      <div style={{ marginTop: "20px", fontSize: "20px", fontWeight: "bold" }}>
        {number}
      </div>
    </div>
  );
}

export default App;
