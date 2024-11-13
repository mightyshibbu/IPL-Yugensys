import React, { useState, useEffect } from "react";
import "../styles/Configuration.css"; // You can add styles here
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
const Configuration = ({
  players,
  poolSize,
  setPoolSize,
  configTime,
  setConfigTime,
  numSlabs,
  setNumSlabs,
  setSlabs,
  totalOwners,
  setTotalOwners,
}) => {
  const navigate = useNavigate();
  // poolSize?():poolSize=totalOwners;
  const [marqueePlayers, setMarqueePlayers] = useState([]);
  const [slabAPlayers, setSlabAPlayers] = useState([]);
  const [slabBPlayers, setSlabBPlayers] = useState([]);
  const [slabCPlayers, setSlabCPlayers] = useState([]);
  const [slabDPlayers, setSlabDPlayers] = useState([]);
  const [slabEPlayers, setSlabEPlayers] = useState([]);
  const [impactPlayers, setImpactPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [minBid, setMinBid] = useState(50); // Default minimum bid
  const [maxBid, setMaxBid] = useState(400); // Default maximum bid
  const [slabsConfig, setSlabsConfig] = useState([]);
  useEffect(() => {
    const savedConfig = localStorage.getItem("slabsConfig");
    if (savedConfig) {
      setSlabsConfig(JSON.parse(savedConfig));
    }
  }, [setSlabsConfig]);
  // Save slabsConfig to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("slabsConfig", JSON.stringify(slabsConfig));
  }, [slabsConfig]);
  // Populate players for each active slab when slabsConfig changes
  useEffect(() => {
    setMarqueePlayers([]);
    setSlabAPlayers([]);
    setSlabBPlayers([]);
    setSlabCPlayers([]);
    setSlabDPlayers([]);
    setSlabEPlayers([]);
    setImpactPlayers([]);

    slabsConfig.forEach((slab) => {
      switch (slab.name) {
        case "Marquee":
          setMarqueePlayers(
            players.filter((player) => player.PSlab === "Marquee")
          );
          break;
        case "A":
          setSlabAPlayers(players.filter((player) => player.PSlab === "A"));
          break;
        case "B":
          setSlabBPlayers(players.filter((player) => player.PSlab === "B"));
          break;
        case "C":
          setSlabCPlayers(players.filter((player) => player.PSlab === "C"));
          break;
        case "D":
          setSlabDPlayers(players.filter((player) => player.PSlab === "D"));
          break;
        case "E":
          setSlabEPlayers(players.filter((player) => player.PSlab === "E"));
          break;
        case "Impact":
          setImpactPlayers(
            players.filter((player) => player.PSlab === "Impact")
          );
          break;
        default:
          break;
      }
    });
  }, [slabsConfig, players]);

  const adjustPlayers = (slabName, action) => {
    const incrementCount = totalOwners;
  
    const updateSlabPlayers = (slabPlayers, filterCondition) => {
      if (action === "increment") {
        const newPlayers = players
          .filter(filterCondition)
          .filter(player => !slabPlayers.some(existingPlayer => existingPlayer.PID === player.PID)) // Check for duplicates
          .slice(0, incrementCount); // Limit to the number of players to increment
  
        return [...slabPlayers, ...newPlayers]; // Return updated slab players
      } else if (action === "decrement") {
        return slabPlayers.slice(0, Math.max(0, slabPlayers.length - incrementCount)); // Ensure it doesn't go below zero
      }
      return slabPlayers; // Return original slab players if no action matches
    };
  
    switch (slabName) {
      case "Marquee":
        setMarqueePlayers((prev) =>
          updateSlabPlayers(prev, (player) => player.PSlab === "Marquee")
        );
        break;
      case "A":
        setSlabAPlayers((prev) =>
          updateSlabPlayers(prev, (player) => player.PSlab === "A")
        );
        break;
      case "B":
        setSlabBPlayers((prev) =>
          updateSlabPlayers(prev, (player) => player.PSlab === "B")
        );
        break;
      case "C":
        setSlabCPlayers((prev) =>
          updateSlabPlayers(prev, (player) => player.PSlab === "C")
        );
        break;
      case "D":
        setSlabDPlayers((prev) =>
          updateSlabPlayers(prev, (player) => player.PSlab === "D")
        );
        break;
      case "E":
        setSlabEPlayers((prev) =>
          updateSlabPlayers(prev, (player) => player.PSlab === "E")
        );
        break;
      case "Impact":
        setImpactPlayers((prev) =>
          updateSlabPlayers(prev, (player) => player.PSlab === "Impact")
        );
        break;
      default:
        break;
    }
  };
  
  const increasePoolSize = () => {
    if (poolSize + totalOwners <= players.length) {
      setPoolSize(poolSize + totalOwners);
      setError(null);
    } else {
      setError("Cannot exceed maximum player pool size of " + players.length);
    }
  };
  const handleGenerateSlabs = () => {
    if (numSlabs >= minSlabs && numSlabs <= maxSlabs) {
      setSlabsConfirmed(true);
    }
    const initialSlabs = Array.from({ length: numSlabs }, (_, index) => {
      let name;
      if (index === 0) {
        name = "Marquee"; // First slab name
      } else if (index === numSlabs - 1) {
        name = "Impact"; // Last slab name
      } else {
        name = String.fromCharCode(64 + index); // Generate names A, B, C, etc. for middle slabs
      }

      return {
        name, // Set the name based on index
        basePrice: 50, // Default min bid
        maxBid: 400, // Default max bid
      };
    });

    setSlabsConfig(initialSlabs); // Set the initial slab config
  };

  const handleSlabChange = (index, field, value) => {
    const updatedSlabs = [...slabsConfig];
    updatedSlabs[index][field] = value;
    setSlabsConfig(updatedSlabs); // Update the specific slab configuration
  };

  const decreasePoolSize = () => {
    if (poolSize - totalOwners >= totalOwners) {
      setPoolSize(poolSize - totalOwners);
      setError(null);
    } else {
      setError(`Pool size cannot be less than ${totalOwners}.`);
    }
  };

  const handleTimeChange = (event) => {
    const newTime = Number(event.target.value);
    if (newTime >= 3 && newTime <= 20) {
      // Add validation for bid time
      setConfigTime(newTime);
      setError(null); // Clear any previous error
    } else {
      setError("Please enter a valid bid time between 3 and 20 seconds.");
    }
  };

  const handleOk = () => {
    if (poolSize >= 1 && poolSize <= players.length) {
      setSlabs(slabsConfig); // Pass the configured slabs to the parent
      console.log("slab details:", slabsConfig);
      navigate("/", { replace: true });
    } else {
      setError(
        "Please enter a valid pool size between 1 and " + players.length
      );
    }
  };

  const increaseBidTime = () => {
    if (configTime + 10 <= 180) {
      setConfigTime(configTime + 10);
      setError(null);
    } else {
      setError("Bid time cannot exceed 180 seconds.");
    }
  };
  const handleSaveOwners = () => {
    if (totalOwners >= 2 && totalOwners <= 6) {
      setOwnersConfirmed(true);
    }
  };
  const [ownersConfirmed, setOwnersConfirmed] = useState(false);
  const decreaseBidTime = () => {
    if (configTime - 10 >= 9) {
      setConfigTime(configTime - 10);
      setError(null);
    } else {
      setError("Bid time cannot be less than 10 seconds.");
    }
  };
  const decreaseSlabSize = () => {
    if (numSlabs - 1 >= minSlabs) {
      setNumSlabs(numSlabs - 1);
    } else {
      setError("Minimum slab size is 1");
    }
  };
  const increaseSlabSize = () => {
    if (numSlabs + 1 <= maxSlabs) {
      setNumSlabs(numSlabs + 1);
    } else {
      setError("Maximum slab size reached");
    }
  };

  // Validate and save the pool size
  const handleSavePoolSize = () => {
    if (
      poolSize % totalOwners === 0 &&
      poolSize >= totalOwners &&
      poolSize <= 36
    ) {
      setPoolSizeConfirmed(true);
      calculateSlabRange();
    }
  };
  // // Calculate minimum and maximum number of slabs
  // const calculateSlabRange = () => {

  // };
  const [minSlabs, setMinSlabs] = useState(1);
  const [maxSlabs, setMaxSlabs] = useState(7);
  const [poolSizeConfirmed, setPoolSizeConfirmed] = useState(false);
  const [slabsConfirmed, setSlabsConfirmed] = useState(false);
  // Handler for saving slabs
  const handleSaveSlabs = () => {};

  return (
    <div className="configure-player-list">
      <h1 className="title">Configure Player List</h1>

      <div className="time-container">
        <label>Set Bid Time (Default 10 seconds): </label>
        <div className="selected-time">{configTime}s</div>
        <div className="adjuster-buttons">
          <button onClick={decreaseBidTime} disabled={configTime <= 3}>
            Decrease Bid Time
          </button>
          <button onClick={increaseBidTime} disabled={configTime >= 180}>
            Increase Bid Time
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="time-container">
        <label>Set Number of Owners (min 2, max 6): </label>
        <div className="selected-time">{totalOwners}</div>
        <div className="adjuster-buttons">
          {/* Decrease Owners */}
          <button
            onClick={() => {
              setTotalOwners((prev) => {
                const newOwners = Math.max(prev - 1, 2);
                setPoolSize(newOwners * 3); // Automatically adjust poolSize
                return newOwners;
              });
            }}
            disabled={totalOwners <= 2}
          >
            -1
          </button>
          {/* Increase Owners */}
          <button
            onClick={() => {
              setTotalOwners((prev) => {
                const newOwners = Math.min(prev + 1, 6);
                setPoolSize(newOwners * 3); // Automatically adjust poolSize
                return newOwners;
              });
            }}
            disabled={totalOwners >= 6}
          >
            +1
          </button>

          {/* Save Owners */}
          <button onClick={handleSaveOwners}>Save Owners</button>
        </div>

        {/* Display error message, if any */}
        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Pool Size Config */}
      {ownersConfirmed && (
       
        <div className="slab-config-container">
          <label>
            Number of Slabs (Min {minSlabs}, Max {maxSlabs}):{" "}
          </label>
          <div className="selected-pool-size">{numSlabs}</div>
          <div className="adjuster-buttons">
            <button onClick={decreaseSlabSize} disabled={numSlabs <= minSlabs}>
              -1
            </button>

            <button onClick={increaseSlabSize} disabled={numSlabs >= maxSlabs}>
              +1
            </button>
          </div>

          <button onClick={handleGenerateSlabs}>Save and Generate Slabs</button>

          {slabsConfig.map((slab, index) => (
            <div key={index} className="slab-input-container">
              <label>Slab Name: </label>
              <input
                type="text"
                value={slab.name}
                onChange={(e) =>
                  handleSlabChange(index, "name", e.target.value)
                }
              />

              <label>Min Bid: </label>
              <input
                type="number"
                value={slab.basePrice}
                onChange={(e) =>
                  handleSlabChange(index, "basePrice", Number(e.target.value))
                }
              />

              <label>Max Bid: </label>
              <input
                type="number"
                value={slab.maxBid}
                onChange={(e) =>
                  handleSlabChange(index, "maxBid", Number(e.target.value))
                }
              />
            </div>
          ))}
         
        </div>
      )}

      {/* Slab Config
      {poolSizeConfirmed && (
        
      )} */}

      <button className="ok-btn" onClick={handleOk}>
        OK
      </button>

      {/* Display player tables with increment/decrement controls for each slab */}
      <div className="PlayerSlabs">
        {/* Display player tables with increment/decrement controls for each slab */}
        {slabsConfirmed && marqueePlayers.length > 0 &&(
          <div  className="slab-config">

            <h3>Marquee Players</h3>
            <button onClick={() => adjustPlayers("Marquee", "increment")}>
              Increment
            </button>
            <button onClick={() => adjustPlayers("Marquee", "decrement")}>
              Decrement
            </button>
            <table>
            <tbody>
              {/* Render Marquee players here */}
              {marqueePlayers.map((player) => (
                <tr key={player.PID}>
                  <td>{player.PName}</td>
                  <td>{player.PRole}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}

        {slabsConfirmed && slabAPlayers.length > 0 && (
          <div  className="slab-config">
            <h3>Slab A Players</h3>
            <button onClick={() => adjustPlayers("A", "increment")}>
              Increment
            </button>
            <button onClick={() => adjustPlayers("A", "decrement")}>
              Decrement
            </button>
            <table>
            <tbody> 
              {/* Render Slab A players here */}
              {slabAPlayers.map((player) => (
                <tr key={player.PID}>
                <td>{player.PName}</td>
                <td>{player.PRole}</td>
              </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}

        {slabsConfirmed && slabBPlayers.length > 0 && (
          <div className="slab-config">
            <h3>Slab B Players</h3>
            <button onClick={() => adjustPlayers("B", "increment")}>
              Increment
            </button>
            <button onClick={() => adjustPlayers("B", "decrement")}>
              Decrement
            </button>
            <table>
              {/* Render Slab B players here */}
              <tbody>
              {slabBPlayers.map((player) => (
                <tr key={player.PID}>
                <td>{player.PName}</td>
                <td>{player.PRole}</td>
              </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}

        {slabsConfirmed && slabCPlayers.length > 0 && (
          <div className="slab-config">
            <h3>Slab C Players</h3>
            <button onClick={() => adjustPlayers("C", "increment")}>
              Increment
            </button>
            <button onClick={() => adjustPlayers("C", "decrement")}>
              Decrement
            </button>
            <table>
              {/* Render Slab C players here */}
              <tbody>
              {slabCPlayers.map((player) => (
               <tr key={player.PID}>
               <td>{player.PName}</td>
               <td>{player.PRole}</td>
             </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}

        {slabsConfirmed && slabDPlayers.length > 0 && (
          <div className="slab-config">
            <h3>Slab D Players</h3>
            <button onClick={() => adjustPlayers("D", "increment")}>
              Increment
            </button>
            <button onClick={() => adjustPlayers("D", "decrement")}>
              Decrement
            </button>
            <table>
            <tbody>
              {/* Render Slab D players here */}
              {slabDPlayers.map((player) => (
              <tr key={player.PID}>
              <td>{player.PName}</td>
              <td>{player.PRole}</td>
            </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}

        {slabsConfirmed && slabEPlayers.length > 0 && (
          <div className="slab-config">
            <h3>Slab E Players</h3>
            <button onClick={() => adjustPlayers("E", "increment")}>
              Increment
            </button>
            <button onClick={() => adjustPlayers("E", "decrement")}>
              Decrement
            </button>
            <table>
            <tbody>
              {/* Render Slab E players here */}
              {slabEPlayers.map((player) => (
               <tr key={player.PID}>
               <td>{player.PName}</td>
               <td>{player.PRole}</td>
             </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}

        {slabsConfirmed && impactPlayers.length > 0 &&(
          <div className="slab-config">
            <h3>Impact Players</h3>
            <button onClick={() => adjustPlayers("Impact", "increment")}>
              Increment
            </button>
            <button onClick={() => adjustPlayers("Impact", "decrement")}>
              Decrement
            </button>
            <table>
            <tbody>
              {/* Render Impact players here */}
              {impactPlayers.map((player) => (
                <tr key={player.PID}>
                <td>{player.PName}</td>
                <td>{player.PRole}</td>
              </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Configuration;
