import React, { useState, useEffect } from "react";
import "../styles/PlayerConfig.css";

const PlayerConfig = ({ setSlabsConfig, totalOwners }) => {
  const [editablePlayer, setEditablePlayer] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [playerToSwapWith, setPlayerToSwapWith] = useState(null);
  const [slabsConfig, setSlabsConfigState] = useState([]);
  const [auctionData, setAuctionData] = useState({});

  // Initialize slabsConfig with randomized players assignment
  const initializeSlabsConfig = () => {
    
    const slabNames = ["Fastest", "Cutie1", "Cutie2", "Cutie3"]; // Update as needed
    const slabs = slabNames.map((name) => ({ name, players: [] }));

    // Parse players from localStorage
    const players = JSON.parse(localStorage.getItem("players") || "[]");

    // Shuffle the players array to randomize the assignment
    const shuffledPlayers = players.sort(() => Math.random() - 0.5);

    let currentSlab = 0;

    // Distribute players across slabs, cycling through each slab
    for (let i = 0; i < shuffledPlayers.length; i++) {
      slabs[currentSlab].players.push({
        ...shuffledPlayers[i],
        PSlab: slabs[currentSlab].name,
      });
      // Move to the next slab and ensure even distribution across all slabs
      currentSlab = (currentSlab + 1) % slabNames.length;
    }

    setSlabsConfigState(slabs);
    setSlabsConfig(slabs); // Update parent state if necessary
  };

  // Load slabsConfig, AuctionData, and Players from local storage
  useEffect(() => {
    const savedSlabsConfig = localStorage.getItem("slabsConfig");
    const savedAuctionData = localStorage.getItem("AuctionData");
    const savedPlayers = localStorage.getItem("players");

    if (savedSlabsConfig) {
      setSlabsConfigState(JSON.parse(savedSlabsConfig));
    } else {
      initializeSlabsConfig();
    }

    if (savedAuctionData) {
      setAuctionData(JSON.parse(savedAuctionData));
    }

    if (savedPlayers) {
      try {
        const parsedPlayers = JSON.parse(savedPlayers);
        console.log("Parsed players data:", parsedPlayers); // Debugging log
        setAvailablePlayers(parsedPlayers);
      } catch (error) {
        console.error("Error parsing players data from localStorage:", error);
      }
    } else {
      console.warn("No players data found in localStorage.");
    }
  }, []);

  const handleEdit = (player) => {
    setEditablePlayer(player);
  };

  const handleSwapChange = (e) => {
    const selectedPlayerId = e.target.value;
    const player = availablePlayers.find((p) => p.PID === selectedPlayerId);
    setPlayerToSwapWith(player);
  };

  const handleSaveSwap = () => {
    if (editablePlayer && playerToSwapWith) {
      const updatedPlayers = availablePlayers.map((player) => {
        if (player.PID === editablePlayer.PID) {
          return { ...player, PSlab: playerToSwapWith.PSlab };
        } else if (player.PID === playerToSwapWith.PID) {
          return { ...player, PSlab: editablePlayer.PSlab };
        }
        return player;
      });

      setAvailablePlayers(updatedPlayers);
      setSlabsConfigState((prevSlabsConfig) =>
        prevSlabsConfig.map((slab) => ({
          ...slab,
          players: updatedPlayers.filter((player) => player.PSlab === slab.name),
        }))
      );
      setEditablePlayer(null);
      setPlayerToSwapWith(null);
    }
  };

  return (
    <div>
      <h2>Player Configuration</h2>

      <div className="AuctionData">
        <h3>Auction Settings</h3>
        <p>Config Time: {auctionData.configTime}</p>
        <p>Total Owners: {auctionData.totalOwners}</p>
        <p>Pool Size: {auctionData.poolSize}</p>
        <p>Units: {auctionData.units}</p>
      </div>

      {slabsConfig.map((slab, index) => (
        <div key={index} className="slab-section">
          <h3>{slab.name}</h3>
          <table>
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {availablePlayers
                .filter((player) => player.PSlab === slab.name)
                .map((player) => (
                  <tr key={player.PID}>
                    <td>{player.PName}</td>
                    <td>
                      {editablePlayer && editablePlayer.PID === player.PID ? (
                        <>
                          <select onChange={handleSwapChange} value={playerToSwapWith?.PID || ""}>
                            <option value="">Select Player to Swap</option>
                            {availablePlayers
                              .filter((p) => p.PID !== player.PID)
                              .map((p) => (
                                <option key={p.PID} value={p.PID}>
                                  {p.PName} ({p.PSlab})
                                </option>
                              ))}
                          </select>
                          <button onClick={handleSaveSwap}>Save</button>
                        </>
                      ) : (
                        <button onClick={() => handleEdit(player)}>Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default PlayerConfig;
