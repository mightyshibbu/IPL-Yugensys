import React, { useState, useEffect } from "react";
import "../styles/PlayerConfig.css";
import { useNavigate, Link, useLocation } from "react-router-dom";

const PlayerConfig = ({ setSlabsConfig, totalOwners, numSlabs, poolSize }) => {
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [slabsConfig, setSlabsConfigState] = useState([]);
  const [auctionData, setAuctionData] = useState({});
  const [isBalanced, setIsBalanced] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to fetch latest player data from database
  const fetchLatestPlayers = async () => {
    try {
      console.log("Fetching latest player data from database...");
      const response = await fetch('http://localhost:3000/api/getAllPlayers');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log("Received fresh player data from database:", data);
      
      // Get current player assignments before updating
      const savedPlayerData = localStorage.getItem("PlayerData");
      const currentAssignments = savedPlayerData ? JSON.parse(savedPlayerData) : {};
      console.log("Current player assignments:", currentAssignments);
      
      // Update the players list with fresh data while maintaining assignments
      const updatedPlayers = data.map(player => {
        // Find which slab this player belongs to
        for (const [slabName, players] of Object.entries(currentAssignments)) {
          const assignedPlayer = players.find(p => p.PID === player.PID);
          if (assignedPlayer) {
            return { ...player, PSlab: slabName };
          }
        }
        return player;
      });
      
      // Save updated players list
      localStorage.setItem("players", JSON.stringify(updatedPlayers));
      setAvailablePlayers(updatedPlayers);
      
      // Load existing slab configurations
      const savedSlabsConfig = localStorage.getItem("slabsConfig");
      if (savedSlabsConfig) {
        const slabs = JSON.parse(savedSlabsConfig);
        console.log("Loaded existing slab configurations:", slabs);
        
        // Create updated slabs with maintained assignments
        const updatedSlabs = slabs.map(slab => {
          const slabPlayers = currentAssignments[slab.name] || [];
          console.log(`Current players in slab ${slab.name}:`, slabPlayers);
          
          // Update each player with fresh data while maintaining their assignment
          const updatedSlabPlayers = slabPlayers.map(player => {
            const freshPlayer = updatedPlayers.find(p => p.PID === player.PID);
            if (freshPlayer) {
              console.log(`Updating player ${player.PID} in slab ${slab.name}:`, freshPlayer);
              return { ...freshPlayer, PSlab: slab.name };
            }
            return player;
          });
          
          console.log(`Updated players for slab ${slab.name}:`, updatedSlabPlayers);
          
          return {
            ...slab,
            players: updatedSlabPlayers
          };
        });
        
        console.log("Final updated slabs:", updatedSlabs);
        setSlabsConfigState(updatedSlabs);
        
        // Update localStorage with the latest player data
        const updatedPlayerData = updatedSlabs.reduce((acc, slab) => {
          acc[slab.name] = slab.players;
          return acc;
        }, {});
        localStorage.setItem("PlayerData", JSON.stringify(updatedPlayerData));
      } else {
        console.warn("No slab configurations found");
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  // Load initial data and fetch latest player data when component mounts
  useEffect(() => {
    console.log("Component mounted, loading initial data...");
    
    // Load existing configurations
    const savedSlabsConfig = localStorage.getItem("slabsConfig");
    const savedPlayerData = localStorage.getItem("PlayerData");
    
    if (savedSlabsConfig) {
      const slabs = JSON.parse(savedSlabsConfig);
      console.log("Loading saved slab configurations:", slabs);
      
      if (savedPlayerData) {
        const playerData = JSON.parse(savedPlayerData);
        console.log("Loading saved player data:", playerData);
        
        // Check if any players are assigned
        const hasAssignedPlayers = Object.values(playerData).some(players => players.length > 0);
        
        if (hasAssignedPlayers) {
          // Initialize slabs with existing player assignments
          const initializedSlabs = slabs.map(slab => ({
            ...slab,
            players: playerData[slab.name] || []
          }));
          console.log("Initialized slabs with saved data:", initializedSlabs);
          setSlabsConfigState(initializedSlabs);
        } else {
          // If no players are assigned, distribute them automatically
          console.log("No players assigned, distributing automatically...");
          distributePlayersSmartly();
        }
      } else {
        // If no player data, distribute players automatically
        console.log("No player data found, distributing automatically...");
        distributePlayersSmartly();
      }
    }
    
    // Then fetch fresh player data
    fetchLatestPlayers();
  }, []); // Empty dependency array means this runs once on component mount

  // Fetch latest data when location changes (i.e., when returning to this page)
  useEffect(() => {
    console.log("Location changed, fetching fresh data...");
    // Always fetch fresh data when returning to the page
    fetchLatestPlayers();
  }, [location.key]); // This will run whenever we navigate to this page

  // Function to distribute players randomly
  const distributePlayersSmartly = () => {
    console.log("Distributing players randomly");
    
    if (numSlabs < 1) {
      console.error("Number of slabs must be greater than 0.");
      return;
    }

    const players = JSON.parse(localStorage.getItem("players") || "[]");
    if (players.length === 0) {
      console.warn("No players found in local storage.");
      return;
    }

    // Fetch slab configurations from localStorage
    const savedSlabsConfig = JSON.parse(localStorage.getItem("slabsConfig") || "[]");
    console.log("Distributing players to slabs:", savedSlabsConfig);

    // Initialize slabs with names and players
    const slabs = savedSlabsConfig.map((slab) => ({ 
      name: slab.name, 
      numPlayers: slab.numPlayers, 
      players: [] 
    }));

    // Shuffle players to randomize distribution
    const shuffledPlayers = players.sort(() => Math.random() - 0.5);

    let playerIndex = 0;

    // Distribute players according to numPlayers for each slab
    for (let slab of slabs) {
      for (let i = 0; i < slab.numPlayers; i++) {
        if (playerIndex < shuffledPlayers.length) {
          slab.players.push({
            ...shuffledPlayers[playerIndex],
            PSlab: slab.name,
          });
          playerIndex++;
        } else {
          console.warn("Not enough players to fully populate all slabs according to numPlayers.");
          break;
        }
      }
    }

    // Save the new distribution
    setSlabsConfigState(slabs);
    const playerData = slabs.reduce((acc, slab) => {
      acc[slab.name] = slab.players;
      return acc;
    }, {});

    localStorage.setItem("PlayerData", JSON.stringify(playerData));
  };

  // Check if slabs are balanced whenever slabsConfig changes
  useEffect(() => {
    if (!slabsConfig || slabsConfig.length === 0) {
      setIsBalanced(false);
      return;
    }

    let allBalanced = true;
    slabsConfig.forEach((slab) => {
      if (slab.players.length !== slab.numPlayers) {
        allBalanced = false;
      }
    });

    setIsBalanced(allBalanced);
  }, [slabsConfig]);

  const handleAddPlayerToSlab = (player, slabName) => {
    console.log("inside handleAddPlayerToSlab, slabsConfig=", slabsConfig);
    console.log("inside handleAddPlayerToSlab, slabName=", slabName);
    console.log("inside handleAddPlayerToSlab, player=", player);
    // Check if the player is already in another slab
    let playerInOtherSlab = null;
    const updatedSlabsConfig = slabsConfig.map((slab) => {
    // If the player is in the current slab and it's not the selected one, remove the player
    if (
        slab.name !== slabName &&
        slab.players.some((p) => p.PID === player.PID)
    ) {
        playerInOtherSlab = slab.name; // Keep track of the slab where the player exists
        return {
        ...slab,
        players: slab.players.filter((p) => p.PID !== player.PID),
        };
    }
    // If the player is being added to the selected slab, update that slab
    if (
        slab.name === slabName &&
        !slab.players.some((p) => p.PID === player.PID)
    ) {
        return {
        ...slab,
        players: [...slab.players, { ...player, PSlab: slabName }],
        };
    }
    return slab;
    });

    // Update the state after modifying slabs
    setSlabsConfigState(updatedSlabsConfig);
    // Show alert if player was in another slab
    if (playerInOtherSlab) {
    alert(
        `Player has been removed from ${playerInOtherSlab} and added to ${slabName}`
    );
    }

    // Save updated data to localStorage
    const updatedPlayerData = updatedSlabsConfig.reduce((acc, slab) => {
    acc[slab.name] = slab.players;
    return acc;
    }, {});
    localStorage.setItem("PlayerData", JSON.stringify(updatedPlayerData));
  };
  const handleBack = () => {
    navigate("/slabConfig", { replace: true })
  };
  // Handle when OK is clicked
  const handleOk = () => {
    if (isBalanced) {
      navigate("/preAuction", { replace: true });
    } else {
      alert("Please balance all slabs before proceeding.");
    }
  };
  const handleRemovePlayerFromSlab = (player, slabName) => {
    const updatedSlabsConfig = slabsConfig.map((slab) => {
    if (slab.name === slabName) {
        return {
        ...slab,
        players: slab.players.filter((p) => p.PID !== player.PID),
        };
    }
    return slab;
    });
    setSlabsConfigState(updatedSlabsConfig);
    const updatedPlayerData = updatedSlabsConfig.reduce((acc, slab) => {
    acc[slab.name] = slab.players;
    return acc;
    }, {});
    localStorage.setItem("PlayerData", JSON.stringify(updatedPlayerData));
  };

  return (
    <div>
      <h2>Player Configuration</h2>
      
      {/* Add Shuffle button */}
      <button 
        className="shuffle-btn" 
        onClick={distributePlayersSmartly}
        style={{ marginBottom: '20px' }}
      >
        Shuffle Players
      </button>

      {slabsConfig.map((slab) => {
        const slabIsBalanced = slab.players.length === slab.numPlayers;
        return (
          <div key={slab.name} className={`slab-section ${slabIsBalanced ? "balanced" : "unbalanced"}`}>
            <h1>{slab.name} Players</h1> 
            <h3>{slab.numPlayers} Players Required</h3>

            <table>
              <thead>
                <tr>
                  <th>Player Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slab.players.map((player) => (
                  <tr key={player.PID}>
                    <td>{player.PName}</td>
                    <td>
                      <button onClick={() => handleRemovePlayerFromSlab(player, slab.name)}>
                        Remove
                      </button>
                      <button style={{color:"white"}}><Link to={`/edit-player/${player.PID}`}>Edit</Link></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>Add Player to {slab.name}</h4>
            <select
              onChange={(e) =>
                handleAddPlayerToSlab(
                  availablePlayers.find((p) => String(p.PID) === e.target.value),
                  slab.name
                )
              }
            >
              <option value="">Select Player</option>
              {availablePlayers
                .filter((player) => !slab.players.some((p) => p.PID === player.PID))
                .map((player) => (
                  <option key={player.PID} value={player.PID}>
                    {player.PName}
                  </option>
                ))}
            </select>
          </div>
        );
      })}

      <button className="ok-btn" onClick={handleOk}>
        OK
      </button>
      <button className="ok-btn" onClick={handleBack}>
        Back
      </button>
    </div>
  );
};
export default PlayerConfig;
