import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './components/Homepage';
import Configuration from './components/Configuration';
import Auction from './components/Auction';
import PreviousAuctions from './components/PreviousAuctions'
function App() {
  const [poolSize, setPoolSize] = useState(8);
  const [configTime, setConfigTime] = useState(10);
  const [players, setPlayers] = useState([]);

  // Fetch players data from the API when the component mounts
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/getAllPlayers'); // Updated endpoint
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };

    fetchPlayers();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage poolSize={poolSize} configTime={configTime} />} />
        <Route path="/config" element={<Configuration players={players} poolSize={poolSize} setPoolSize={setPoolSize} configTime={configTime} setConfigTime={setConfigTime} />} />
        <Route path="/auction" element={<Auction players={players} poolSize={poolSize} configTime={configTime} />} />
        <Route path="/previousAuctions" element={<PreviousAuctions players={players} poolSize={poolSize} configTime={configTime} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;