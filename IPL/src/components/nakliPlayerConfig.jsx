import React, { useState, useEffect } from "react";
import "../styles/PlayerConfig.css";

const PlayerConfig = ({ setSlabsConfig, totalOwners, numSlabs, poolSize }) => {
  const [editablePlayer, setEditablePlayer] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [playerToSwapWith, setPlayerToSwapWith] = useState(null);
  const [slabsConfig, setSlabsConfigState] = useState([]);
  const [auctionData, setAuctionData] = useState({});
  const [error, setError] = useState(null);
  const [isBalanced, setIsBalanced] = useState(false);
    const distributePlayersSmartly = () => {
        if (numSlabs < 1) {
        console.error("Number of slabs must be greater than 0.");
        return;
        }
        const players = JSON.parse(localStorage.getItem("players") || "[]");
        if (players.length === 0) {
        console.warn("No players found in local storage.");
        return;
        }
        // Fetch slab names dynamically from localStorage
        const savedSlabsConfig = JSON.parse(
        localStorage.getItem("slabsConfig") || "[]"
        );
        const slabNames = savedSlabsConfig.map((slab) => slab.name);
        // Calculate the number of players per slab
        const playersPerSlab = Math.floor(poolSize / numSlabs);
        const remainingPlayers = players.length - playersPerSlab * numSlabs;
        // Initialize slabs with names and players
        const slabs = slabNames.map((name) => ({ name, players: [] }));
        // Shuffle players to randomize distribution
        const shuffledPlayers = players.sort(() => Math.random() - 0.5);
        let currentSlab = 0;
        shuffledPlayers.forEach((player, index) => {
        if (
            index < playersPerSlab * numSlabs ||
            index < players.length - remainingPlayers
        ) {
            slabs[currentSlab].players.push({
            ...player,
            PSlab: slabs[currentSlab].name,
            });
            currentSlab = (currentSlab + 1) % numSlabs;
        }
        });
        // Save slabsConfig and PlayerData in local storage
        setSlabsConfigState(slabs);
        const playerData = slabs.reduce((acc, slab) => {
        acc[slab.name] = slab.players;
        return acc;
        }, {});
        console.log("TESTING, PlayerData:", playerData);
        localStorage.setItem("PlayerData", JSON.stringify(playerData));
    };
    //   useEffect(() => {
    //     // Retrieve saved data from localStorage
    //     const savedSlabsConfig = localStorage.getItem("slabsConfig");
    //     const savedAuctionData = localStorage.getItem("AuctionData");
    //     const savedPlayers = localStorage.getItem("players");

    //     // Parse and set auction data if it exists
    //     if (savedAuctionData) {
    //       setAuctionData(JSON.parse(savedAuctionData));
    //     }

    //     // Parse and set available players if they exist
    //     if (savedPlayers) {
    //       try {
    //         const parsedPlayers = JSON.parse(savedPlayers);
    //         setAvailablePlayers(parsedPlayers);
    //       } catch (error) {
    //         console.error("Error parsing players data from localStorage:", error);
    //       }
    //     }

    //     // Run distributePlayersSmartly() only if slabsConfig is empty
    //     if (!slabsConfig || slabsConfig.length === 0) {
    //       distributePlayersSmartly();
    //     }

    //     // Function to check if slabs are balanced
    //     const checkSlabsBalanced = () => {
    //       if (!slabsConfig || slabsConfig.length === 0) {
    //         setIsBalanced(false);
    //         return;
    //       }

    //       for (let slab of slabsConfig) {
    //         // Check for empty slabs or slabs with incorrect player count
    //         if (slab.players.length === 0 || slab.players.length !== Math.floor(poolSize / numSlabs)) {
    //           setIsBalanced(false);
    //           return;
    //         }

    //         // Check if number of players is a multiple of totalOwners
    //         if (slab.players.length % totalOwners !== 0) {
    //           setIsBalanced(false);
    //           return;
    //         }
    //       }

    //       // All checks passed; set as balanced
    //       setIsBalanced(true);
    //     };

    //     // Check slabs balance after setting/updating slabsConfig
    //     checkSlabsBalanced();
    //   }, [slabsConfig]); // Include slabsConfig in dependencies to rerun when it changes
    useEffect(() => {
        // Retrieve saved data from localStorage
        const savedSlabsConfig = localStorage.getItem("slabsConfig");
        const savedAuctionData = localStorage.getItem("AuctionData");
        const savedPlayers = localStorage.getItem("players");
    
        // Parse and set auction data if it exists
        if (savedAuctionData) {
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
        // Check if slabsConfig exists, else distribute players
        if (!slabsConfig || slabsConfig.length === 0) {
        distributePlayersSmartly();
        }
        // Function to check if slabs are balanced
        const checkSlabsBalanced = () => {
        if (!slabsConfig || slabsConfig.length === 0) {
            setIsBalanced(false);
            return;
        }
        for (let slab of slabsConfig) {
            // Check for empty slabs or slabs with an incorrect number of players
            if (slab.players.length === 0 || slab.players.length !== poolSize) {
            setIsBalanced(false);
            return;
            }
            // Check if the number of players is a multiple of totalOwners
            if (slab.players.length % totalOwners !== 0) {
            setIsBalanced(false);
            return;
            }
        }
        // If all conditions are met, set as balanced
        setIsBalanced(true);
        };
        // Call the check function
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
    // Handle when OK is clicked
    const handleOk = () => {
        if (poolSize >= 1 && poolSize <= players.length) {
        // Pass the configured slabs to the parent
        navigate("/preAuction", { replace: true });
        } else {
        setError(
            "Please enter a valid pool size between 1 and " + players.length
        );
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
        <div
            className={`balance-status ${isBalanced ? "balanced" : "unbalanced"}`}
        >
            {isBalanced ? "Balanced (Green)" : "Not Balanced (Red)"}
        </div>
        {slabsConfig.map((slab) => (
            <div key={slab.name} className="slab-section">
            <h3>{slab.name} Players</h3>

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
                        <button
                        onClick={() =>
                            handleRemovePlayerFromSlab(player, slab.name)
                        }
                        >
                        Remove
                        </button>
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
                .filter(
                    (player) => !slab.players.some((p) => p.PID === player.PID)
                )
                .map((player) => (
                    <option key={player.PID} value={player.PID}>
                    {player.PName}
                    </option>
                ))}
            </select>
            </div>
        ))}
        <button className="ok-btn" onClick={handleOk}>
            OK
        </button>
        </div>
    );
};

export default PlayerConfig;
