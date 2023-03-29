import './App.css';
import RoutesPath from './Components/RoutesPath';
import { WagmiProvider } from "./Components/WagmiContext";

function App() {
  return (
    <div className="App">
      <WagmiProvider>
        <RoutesPath />
      </WagmiProvider>
    </div>
  );
}

export default App;
