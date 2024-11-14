import React, { useState, useEffect } from "react";
import "../styles/PlayerConfig.css";
import { useNavigate,Link } from "react-router-dom";
const PlayerConfig = ({ setSlabsConfig, totalOwners, numSlabs, poolSize }) => {
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [slabsConfig, setSlabsConfigState] = useState([]);
  const [auctionData, setAuctionData] = useState({});
  const [isBalanced, setIsBalanced] = useState(false);
  const navigate = useNavigate();

    const distributePlayersSmartly = () => {
        console.log("INSIDE distributePlayersSmartly");
    
        if (numSlabs < 1) {
            console.error("Number of slabs must be greater than 0.");
            return;
        }
    
        const players = JSON.parse(localStorage.getItem("players") || "[]");
        if (players.length === 0) {
            console.warn("No players found in local storage.");
            return;
        }
    
        // Fetch slab configurations dynamically from localStorage
        const savedSlabsConfig = JSON.parse(localStorage.getItem("slabsConfig") || "[]");
        console.log("inside distribute() , savedSlabsConfig: ", savedSlabsConfig);
    
        // Initialize slabs with names and players
        const slabs = savedSlabsConfig.map((slab) => ({ name: slab.name, numPlayers: slab.numPlayers, players: [] }));
    
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
    
        // Save slabsConfig and PlayerData in local storage
        setSlabsConfigState(slabs);
        const playerData = slabs.reduce((acc, slab) => {
            acc[slab.name] = slab.players;
            return acc;
        }, {});
    
        console.log("TESTING, PlayerData:", playerData);
        localStorage.setItem("PlayerData", JSON.stringify(playerData));
    };
    useEffect(() => {
        const fetchPlayers = async () => {
          try {
            const response = await fetch('http://localhost:3000/api/getAllPlayers'); // Updated endpoint
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            const data = await response.json();
            localStorage.setItem("players", JSON.stringify(data));
          } catch (error) {
            console.error('Error fetching players:', error);
          }
        };
        // localStorage.getItem("poolSize")?setPoolSize(localStorage.getItem("poolSize")): localStorage.setItem("poolSize",poolSize);
        // localStorage.getItem("configTime")?setPoolSize(localStorage.getItem("configTime")): localStorage.setItem("configTime",configTime);
        fetchPlayers();
        
      },[]);
    useEffect(() => {
        // Retrieve saved data from localStorage
        console.log("INSIDE useEffect");
        
        const savedSlabsConfig = localStorage.getItem("slabsConfig");
        const savedAuctionData = localStorage.getItem("AuctionData");
        const savedPlayers = localStorage.getItem("players");
        const savedPlayerData= localStorage.getItem("PlayerData")
        // Parse and set auction data if it exists
        if (savedAuctionData) {
            console.log("Inside useEffect's savedAuctionData=",savedAuctionData);
            
        setAuctionData(JSON.parse(savedAuctionData));
        }
    
        // Parse and set available players if they exist
        if (savedPlayers) {
        try {
            const parsedPlayers = JSON.parse(savedPlayers);
            setAvailablePlayers(parsedPlayers);
        } catch (error) {
            console.error("Error parsing players data from localStorage:", error);
        }
        }
        console.log("Inside useEffect's , slabConfig=",slabsConfig);
        // Check if slabsConfig exists, else distribute players
        if (!slabsConfig || slabsConfig.length === 0 ) {
            distributePlayersSmartly();
        }
        
        
        const checkSlabsBalanced = () => {
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
          };
      
          checkSlabsBalanced();
    
    }, [slabsConfig]); // Include slabsConfig as a dependency to trigger this effect when it changes
    
    const handleAddPlayerToSlab = (player, slabName) => {
        console.log("inside handleAddPlayerToSlab, slabsConfig=", slabsConfig);
        console.log("inside handleAddPlayerToSlab, slabName=", slabName);
        console.log("inside handleAddPlayerToSlab, player=", player);
        // Check if the player is already in another slab
        let playerInOtherSlab = null;
        const updatedSlabsConfig = slabsConfig.map((slab) => {
        // If the player is in the current slab and it’s not the selected one, remove the player
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
