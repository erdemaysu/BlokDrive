import { EthProvider } from "./contexts/EthContext";
import Setup from "./components/Setup";

function App() {
  return (
    <EthProvider>
      <div id="App">
        <Setup/>       
      </div>
    </EthProvider>
  );
}

export default App;
