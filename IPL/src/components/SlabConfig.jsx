import React, { useState, useEffect } from "react";
import "../styles/SlabConfig.css"; // You can add styles here
import { useNavigate } from "react-router-dom";

const SlabConfig = ({
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
  const [slabsConfig, setSlabsConfig] = useState([]);
  const [minBid, setMinBid] = useState(50); // Default minimum bid
  const [maxBid, setMaxBid] = useState(400); // Default maximum bid
  const [allowMaxBidCap, setAllowMaxBidCap] = useState(false); // Checkbox for max bid cap
  const [error, setError] = useState(null);
  const [reservedAmount, setReservedAmount] = useState(null); // State to store the reserved amount
  const [isOkEnabled, setIsOkEnabled] = useState(false); // State to enable the OK button

  // Function to adjust pool size by multiple of total owners
  const adjustPoolSize = (increment) => {
    const currentPoolSize = poolSize;
    const adjustment = increment ? totalOwners : -totalOwners;
    const newPoolSize = currentPoolSize + adjustment;
    
    if (newPoolSize >= totalOwners && newPoolSize <= players.length) {
      setPoolSize(newPoolSize);
      setError(null);
    } else {
      setError(`Pool size must be between ${totalOwners} and ${players.length}`);
    }
  };

  // Function to adjust number of players in a slab by multiple of total owners
  const adjustSlabPlayers = (index, increment) => {
    const updatedSlabs = [...slabsConfig];
    const currentPlayers = Number(updatedSlabs[index].numPlayers) || 0;
    const adjustment = increment ? totalOwners : -totalOwners;
    const newPlayers = currentPlayers + adjustment;
    
    // Check if new total would exceed pool size
    const totalPlayersInOtherSlabs = updatedSlabs.reduce((total, slab, i) => 
      i !== index ? total + (Number(slab.numPlayers) || 0) : total, 0);
    
    if (newPlayers >= 0 && (totalPlayersInOtherSlabs + newPlayers) <= poolSize) {
      updatedSlabs[index].numPlayers = newPlayers;
      setSlabsConfig(updatedSlabs);
      setError(null);
    } else {
      setError("Number of players cannot be negative and total players cannot exceed pool size");
    }
  };

  // Load config from localStorage on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("slabsConfig");
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setSlabsConfig(parsedConfig);
      setNumSlabs(parsedConfig.length);
    }
  }, [setNumSlabs]);

  // Save slabsConfig to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("slabsConfig", JSON.stringify(slabsConfig));
  }, [slabsConfig]);

  // Handle checkbox change for max bid cap
  const handleMaxBidCapChange = () => {
    setAllowMaxBidCap(!allowMaxBidCap);
    if (!allowMaxBidCap) {
      // Set maxBid to null for all slabs if max bid cap is disabled
      const updatedSlabs = slabsConfig.map((slab) => ({
        ...slab,
        maxBid: null,
      }));
      setSlabsConfig(updatedSlabs);
    }
  };

  // Generate slabs with initial data
  const handleGenerateSlabs = () => {
    const initialSlabs = Array.from({ length: numSlabs }, (_, index) => {
      // Use the existing name if available, otherwise generate a default name
      const existingSlab = slabsConfig[index];
      const name = existingSlab?.name || `Slab ${index + 1}`;

      return {
        name,
        basePrice: minBid,
        maxBid: allowMaxBidCap ? maxBid : null,
        numPlayers: 0,
      };
    });

    setSlabsConfig(initialSlabs);
  };

  // Handle slab changes for name, min bid, max bid, and number of players
  const handleSlabChange = (index, field, value) => {
    const updatedSlabs = [...slabsConfig];
    if (field === "numPlayers") {
      // Convert value to number and ensure it's a multiple of total owners
      const numValue = Number(value);
      if (isNaN(numValue) || numValue % totalOwners !== 0) {
        setError(`Number of players must be a multiple of ${totalOwners} (total owners)`);
        return;
      }
      updatedSlabs[index][field] = numValue;
    } else {
      updatedSlabs[index][field] = value;
    }
    setSlabsConfig(updatedSlabs);
    setError(null);
  };

  // Handle when OK is clicked
  const handleOk = () => {
    console.log("Inside HandleOK poolsize", poolSize);
    
    // Check if pool size is a multiple of total owners
    if (poolSize % totalOwners !== 0) {
      setError(`Pool size must be a multiple of ${totalOwners} (total owners)`);
      return;
    }
    
    if (poolSize >= 1 && poolSize <= players.length) {
      setSlabs(slabsConfig); // Pass the configured slabs to the parent
      navigate("/playerConfig", { replace: true });
    } else {
      setError("Please enter a valid pool size between 1 and " + players.length);
    }
  };

  // Calculate the reserved amount
  const calculateReservedAmount = () => {
    // Check if pool size is a multiple of total owners
    if (poolSize % totalOwners !== 0) {
      setError(`Pool size must be a multiple of ${totalOwners} (total owners)`);
      return;
    }

    let amount = 0;
    slabsConfig.forEach((slab) => {
      amount += slab.numPlayers/totalOwners * slab.basePrice;
    });
    setReservedAmount(amount); // Set the calculated amount
    localStorage.setItem("ReservedAmount", amount);
    setIsOkEnabled(true); // Enable the OK button
  };

  const handleBack = () => {
    navigate("/auctionConfig", { replace: true });
  };

  return (
    <div className="configure-player-list">
      <h1 className="title">Slab Configuration</h1>

      <div className="slab-config-container">
        <label>Number of Slabs (Min 1, Max 7): </label>
        <div className="selected-pool-size">{numSlabs}</div>
        <div className="adjuster-buttons">
          <button onClick={() => setNumSlabs(numSlabs - 1)} disabled={numSlabs <= 1}>
            -1
          </button>
          <button onClick={() => setNumSlabs(numSlabs + 1)} disabled={numSlabs >= 7}>
            +1
          </button>
        </div>

        <div className="pool-size-container">
          <label>Pool Size: </label>
          <div className="selected-pool-size">{poolSize}</div>
          <div className="adjuster-buttons">
            <button onClick={() => adjustPoolSize(false)} disabled={poolSize <= totalOwners}>
              -{totalOwners}
            </button>
            <button onClick={() => adjustPoolSize(true)} disabled={poolSize + totalOwners > players.length}>
              +{totalOwners}
            </button>
          </div>
        </div>

        <button onClick={handleGenerateSlabs}>Save and Generate Slabs</button>

        <div className="checkbox-container">
          <input
            type="checkbox"
            checked={allowMaxBidCap}
            onChange={handleMaxBidCapChange}
          />
          <label>Allow Max Bid Cap</label>
        </div>

        {slabsConfig.map((slab, index) => (
          <div key={index} className="slab-input-container">
            <label>Slab Name: </label>
            <input
              type="text"
              value={slab.name}
              onChange={(e) => handleSlabChange(index, "name", e.target.value)}
            />
            <label>Min Bid: </label>
            <input
              type="number"
              value={slab.basePrice}
              onChange={(e) => handleSlabChange(index, "basePrice", Number(e.target.value))}
            />
            {allowMaxBidCap && (
              <>
                <label>Max Bid: </label>
                <input
                  type="number"
                  value={slab.maxBid}
                  onChange={(e) => handleSlabChange(index, "maxBid", Number(e.target.value))}
                />
              </>
            )}
            <div className="players-container">
              <label>Number of Players: </label>
              <div className="selected-players">{slab.numPlayers}</div>
              <div className="adjuster-buttons">
                <button 
                  onClick={() => adjustSlabPlayers(index, false)} 
                  disabled={Number(slab.numPlayers) <= 0}
                >
                  -{totalOwners}
                </button>
                <button 
                  onClick={() => adjustSlabPlayers(index, true)}
                  disabled={Number(slab.numPlayers) + totalOwners > poolSize}
                >
                  +{totalOwners}
                </button>
              </div>
            </div>
          </div>
        ))}

        <button onClick={calculateReservedAmount}>Calculate Reserved Amount</button>
        {reservedAmount !== null && (
          <div className="reserved-amount">Reserved Amount: {reservedAmount} units</div>
        )}
      </div>

      <button className="ok-btn" onClick={handleOk} disabled={!isOkEnabled}>
        OK
      </button>
      <button className="ok-btn" onClick={handleBack}>
        Back
      </button>
    </div>
  );
};

export default SlabConfig;
