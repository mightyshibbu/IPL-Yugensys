import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './components/Homepage';
import Configuration from './components/Configuration';
import Auction from './components/Auction';
import EditPlayer from './components/EditPlayer';
import PreviousAuctions from './components/PreviousAuctions'
import AuctionConfig from './components/AuctionConfig'
import SlabConfig from './components/SlabConfig'
import PlayerConfig from './components/PlayerConfig'
// import PreAuction from './components/PreAuction'
function App() {
  const [poolSize, setPoolSize] = useState(35);
  const [configTime, setConfigTime] = useState(180);
  const [players, setPlayers] = useState([]);
  const [totalOwners, setTotalOwners] = useState(3);
  const [numSlabs, setNumSlabs] = useState(2); // Default number of slabs
  const [slabs, setSlabs] = useState([]); // Holds dynamically configured slab data
  const [units,setUnits] = useState(20000);
  const [slabData,setSlabData] = ([])
  const [kitty,setKitty] = ([])
  const [playersInSlab,setPlayersInSlab] = useState([])
  const [sequenceOfSlabs,setSequenceOfSlabs] = useState([])
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
        localStorage.setItem("players", JSON.stringify(data));
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };
    // localStorage.getItem("poolSize")?setPoolSize(localStorage.getItem("poolSize")): localStorage.setItem("poolSize",poolSize);
    // localStorage.getItem("configTime")?setPoolSize(localStorage.getItem("configTime")): localStorage.setItem("configTime",configTime);
    fetchPlayers();
  },[]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage poolSize={poolSize} configTime={configTime} totalOwners={totalOwners} numSlabs={numSlabs} />} />
        <Route path="/config" element={<Configuration players={players} numSlabs={numSlabs} setNumSlabs={setNumSlabs} poolSize={poolSize} totalOwners={totalOwners} setTotalOwners={setTotalOwners} setPoolSize={setPoolSize} configTime={configTime} setConfigTime={setConfigTime} setSlabs={setSlabs} slabs={slabs}  />} />
        <Route path="/auction" element={<Auction players={players} setPoolSize={setPoolSize} poolSize={poolSize} configTime={configTime} slabs={slabs} totalOwners={totalOwners} numSlabs={numSlabs}/>} />
        <Route path="/previousAuctions" element={<PreviousAuctions players={players} poolSize={poolSize} configTime={configTime} />} />
        <Route path="/edit-player/:id" element={<EditPlayer />} />
        <Route path="/auctionConfig" element={<AuctionConfig players={players} kitty={kitty} slabData={slabData} setSlabData={setSlabData} units={units} setUnits={setUnits} setKitty={setKitty} playersInSlab={playersInSlab} setPlayersInSlab={setPlayersInSlab} sequenceOfSlabs={sequenceOfSlabs} setSequenceOfSlabs={setSequenceOfSlabs} numSlabs={numSlabs} setNumSlabs={setNumSlabs} poolSize={poolSize} totalOwners={totalOwners} setTotalOwners={setTotalOwners} setPoolSize={setPoolSize} configTime={configTime} setConfigTime={setConfigTime} setSlabs={setSlabs} slabs={slabs}  />} />
        <Route path="/slabConfig" element={<SlabConfig players={players} kitty={kitty} slabData={slabData} setSlabData={setSlabData} units={units} setUnits={setUnits} setKitty={setKitty} playersInSlab={playersInSlab} setPlayersInSlab={setPlayersInSlab} sequenceOfSlabs={sequenceOfSlabs} setSequenceOfSlabs={setSequenceOfSlabs} numSlabs={numSlabs} setNumSlabs={setNumSlabs} poolSize={poolSize} totalOwners={totalOwners} setTotalOwners={setTotalOwners} setPoolSize={setPoolSize} configTime={configTime} setConfigTime={setConfigTime} setSlabs={setSlabs} slabs={slabs}  />} />
        <Route path="/playerConfig" element={<PlayerConfig players={players} kitty={kitty} slabData={slabData} setSlabData={setSlabData} units={units} setUnits={setUnits} setKitty={setKitty} playersInSlab={playersInSlab} setPlayersInSlab={setPlayersInSlab} sequenceOfSlabs={sequenceOfSlabs} setSequenceOfSlabs={setSequenceOfSlabs} numSlabs={numSlabs} setNumSlabs={setNumSlabs} poolSize={poolSize} totalOwners={totalOwners} setTotalOwners={setTotalOwners} setPoolSize={setPoolSize} configTime={configTime} setConfigTime={setConfigTime} setSlabs={setSlabs} slabs={slabs}  />} />
        {/* <Route path="/preAuction" element={<PreAuction players={players} kitty={kitty} slabData={slabData} setSlabData={setSlabData} units={units} setUnits={setUnits} setKitty={setKitty} playersInSlab={playersInSlab} setPlayersInSlab={setPlayersInSlab} sequenceOfSlabs={sequenceOfSlabs} setSequenceOfSlabs={setSequenceOfSlabs} numSlabs={numSlabs} setNumSlabs={setNumSlabs} poolSize={poolSize} totalOwners={totalOwners} setTotalOwners={setTotalOwners} setPoolSize={setPoolSize} configTime={configTime} setConfigTime={setConfigTime} setSlabs={setSlabs} slabs={slabs}  />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;