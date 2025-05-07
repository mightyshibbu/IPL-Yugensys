import React from "react";

export const prepareAuctionData = (owners, slabs) => {
  console.log("Preparing auction data:", { owners, slabs });

  // Process each owner's data
  const processedOwners = owners.map(owner => {
    console.log(`Owner ${owner.id} purchased players:`, owner.purchasedPlayers);

    // Initialize arrays for each slab
    const slabPlayers = {};
    slabs.forEach(slab => {
      slabPlayers[slab.name] = [];
    });

    // First, copy over all existing slab players
    Object.entries(owner.slabPlayers).forEach(([slabName, players]) => {
      slabPlayers[slabName] = [...players];
    });

    // Process purchased players
    const purchasedPlayers = [];
    
    // First add all players from slabPlayers
    Object.entries(slabPlayers).forEach(([slabName, players]) => {
      players.forEach(playerName => {
        if (!purchasedPlayers.some(p => p.name === playerName)) {
          purchasedPlayers.push({
            name: playerName,
            slab: slabName,
            playerId: playerName
          });
        }
      });
    });

    // Then add any remaining players from purchasedPlayers that aren't in slabPlayers
    (owner.purchasedPlayers || []).forEach(player => {
      const playerName = typeof player === 'object' ? player.PName : player;
      if (!purchasedPlayers.some(p => p.name === playerName)) {
        // Find which slab this player belongs to
        let playerSlab = 'UNKNOWN';
        for (const [slabName, players] of Object.entries(owner.slabPlayers)) {
          if (players.includes(playerName)) {
            playerSlab = slabName;
            break;
          }
        }
        
        purchasedPlayers.push({
          name: playerName,
          slab: playerSlab,
          playerId: playerName
        });

        // Add to slab players if not already present
        if (!slabPlayers[playerSlab].includes(playerName)) {
          slabPlayers[playerSlab].push(playerName);
        }
      }
    });

    // Double check if any players are missing from either array
    const allPlayerNames = new Set([
      ...Object.values(slabPlayers).flat(),
      ...(owner.purchasedPlayers || []).map(p => typeof p === 'object' ? p.PName : p)
    ]);

    allPlayerNames.forEach(playerName => {
      // Check if player is in purchasedPlayers
      if (!purchasedPlayers.some(p => p.name === playerName)) {
        // Find which slab this player belongs to
        let playerSlab = 'UNKNOWN';
        for (const [slabName, players] of Object.entries(owner.slabPlayers)) {
          if (players.includes(playerName)) {
            playerSlab = slabName;
            break;
          }
        }
        
        purchasedPlayers.push({
          name: playerName,
          slab: playerSlab,
          playerId: playerName
        });
      }

      // Check if player is in slabPlayers
      let foundInSlab = false;
      for (const [slabName, players] of Object.entries(slabPlayers)) {
        if (players.includes(playerName)) {
          foundInSlab = true;
          break;
        }
      }

      if (!foundInSlab) {
        // Find which slab this player belongs to
        let playerSlab = 'UNKNOWN';
        for (const [slabName, players] of Object.entries(owner.slabPlayers)) {
          if (players.includes(playerName)) {
            playerSlab = slabName;
            break;
          }
        }
        
        if (!slabPlayers[playerSlab]) {
          slabPlayers[playerSlab] = [];
        }
        slabPlayers[playerSlab].push(playerName);
      }
    });

    console.log(`Owner ${owner.id} final slab players:`, slabPlayers);
    console.log(`Owner ${owner.id} final purchased players:`, purchasedPlayers.map(p => p.name));

    return {
      id: owner.id,
      unitsLeft: owner.unitsLeft,
      slabPlayers,
      purchasedPlayers
    };
  });

  const finalData = {
    owners: processedOwners
  };

  console.log("Final auction data:", finalData);
  return finalData;
};

export const endAuction = async (
  prepareAuctionData,
  owners,
  slabs,
  saveAuctionData,
  navigate
) => {
  console.log("Auction completed!");
  console.log("Current state when ending auction:");
  
  // Get the latest owner states from localStorage
  const latestOwners = owners.map(owner => {
    const storedState = localStorage.getItem(`owner_${owner.id}_state`);
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      console.log(`Retrieved latest state for owner ${owner.id}:`, parsedState);
      return {
        ...owner,
        purchasedPlayers: parsedState.purchasedPlayers || owner.purchasedPlayers,
        slabPlayers: parsedState.slabPlayers || owner.slabPlayers,
        unitsLeft: parsedState.unitsLeft || owner.unitsLeft
      };
    }
    return owner;
  });

  console.log("Latest owners state:", JSON.stringify(latestOwners, null, 2));
  console.log("Slabs:", JSON.stringify(slabs, null, 2));
  
  // Log each owner's purchased players and slab players
  latestOwners.forEach(owner => {
    console.log(`Owner ${owner.id} final state:`, {
      purchasedPlayers: owner.purchasedPlayers,
      slabPlayers: owner.slabPlayers,
      unitsLeft: owner.unitsLeft
    });
  });

  alert("Auction completed!");

  try {
    // Prepare the auction data with latest owner states
    const auctionData = prepareAuctionData(latestOwners, slabs);
    
    // Log the prepared data
    console.log('Prepared auction data for saving:', JSON.stringify(auctionData, null, 2));

    // Save the auction data
    const result = await saveAuctionData(auctionData);
    console.log('Auction data saved successfully:', result);
    
    // Clear the auction state from localStorage
    localStorage.removeItem("auctionData");
    
    // Navigate to the previous auctions page
    navigate("/previousAuctions", { replace: true });
  } catch (error) {
    console.error("Error ending auction:", error);
    alert("Error saving auction data. Please try again.");
  }
};

// UI control handlers
export const handleStart = (setIsStarted, setIsStopped, saveAuctionState) => {
  setIsStarted(true);
  setIsStopped(false);
  saveAuctionState();
};

export const handleStop = (setIsStarted, setIsStopped) => {
  setIsStarted(false);
  setIsStopped(true);
};

export const handleDiscard = (navigate) => {
  localStorage.removeItem("auctionData");
  navigate("/", { replace: true });
};

// Render functions
export const renderPlayerCard = (
  currentPlayer,
  getPlayerImage,
  currentPlayerIndex,
  slabDetails,
  numberOfPlayersLeft
) => (
  <div className="player-card">
    <div className="important-text">Player Card</div>
    <img
      src={getPlayerImage(currentPlayerIndex)}
      alt="Player"
      style={{ width: "240px", height: "240px", objectFit: "cover" }}
    />
    <div className="slab">Slab: {slabDetails.name}</div>
    <div className="bid-info">
      <div>MIN: {slabDetails.basePrice}</div>
      <div>MAX: {slabDetails.maxBid !== null && slabDetails.maxBid !== undefined ? slabDetails.maxBid : "No max bid"}</div>
    </div>
    <div className="important-text">Player ID: {currentPlayer.PID}</div>
    <div className="player-name">Name: {currentPlayer.PName}</div>
    <div>Age: {currentPlayer.PAge}</div>
    <div>Height: {currentPlayer.PHeight}</div>
    <div>Weight: {currentPlayer.PWeight}</div>
    <div>Role: {currentPlayer.PRole}</div>
    <div className="unbidded-players-count">
      Remaining unbidded players: {numberOfPlayersLeft}
    </div>
  </div>
);

export const renderBidInfo = (
  highestBid,
  highestBidder,
  poolSize,
  totalOwners,
  numSlabs,
  timer,
  isStarted
) => (
  <div className="bid-info">
    <div>Current Bid: {highestBid}</div>
    <div>Highest Bidder: {highestBidder ? highestBidder.id : "None"}</div>
    <div>Pool Size: {poolSize}</div>
    <div>Owners: {totalOwners}</div>
    <div>Slabs: {numSlabs}</div>
    <div className={`timer ${isStarted ? "glow" : ""}`}>{timer} seconds</div>
  </div>
);

export const renderOwnerCards = (
  owners,
  highestBidder,
  isStopped,
  renderBidOptions
) =>
  owners.map((owner) => (
    <div key={owner.id} className="owner-card">
      {owner.id == 1 ? (
        <div>Owner {owner.id} (PRANAV TRIPATHI)</div>
      ) : (
        <div>Owner {owner.id}</div>
      )}
      <div>Units Left: {owner.unitsLeft}</div>
      {renderBidOptions(owner)}
      <div>
        Purchased Players: {owner.purchasedPlayers.length > 0 ? owner.purchasedPlayers.join(", ") : "None"}
      </div>
      <button
        disabled={(highestBidder && highestBidder.id === owner.id) || isStopped}
        onClick={() => {}}
      >
        Make Bid
      </button>
    </div>
  ));

export const renderBidOptions = (
  owner,
  isStarted,
  ifFullyFilled,
  currentPlayer,
  slabDetails,
  highestBid,
  handleBidClick,
  totalOwners
) => {
  if (!isStarted || !currentPlayer || !slabDetails || !ifFullyFilled(owner.id) || currentPlayer.PID === 9999) {
    return null;
  }

  const basePrice = slabDetails.basePrice;
  const maxBid = slabDetails.maxBid;
  const bidIncrement = 50;

  // Calculate remaining players needed for this owner
  const remainingPlayersNeeded = Math.ceil((slabDetails.numPlayers || 0) / totalOwners);
  const playersPurchased = owner.purchasedPlayers.length;
  const playersLeftToBuy = remainingPlayersNeeded - playersPurchased;

  // Calculate minimum reserved amount needed for remaining players
  const minReservedAmount = playersLeftToBuy * basePrice;

  // Calculate all possible bid values
  const allBids = [];
  for (let bid = basePrice; bid <= maxBid; bid += bidIncrement) {
    allBids.push(bid);
  }

  // Filter bids based on owner's available units and required reserved amount
  const validBids = allBids.filter(bid => 
    (owner.unitsLeft - bid) >= minReservedAmount
  );

  if (validBids.length === 0) {
    return (
      <div className="bid-options">
        <div className="no-valid-bids">
          Insufficient funds to maintain required reserve for remaining players
        </div>
      </div>
    );
  }

  return (
    <div className="bid-options">
      <div className="reserve-info">
        Required Reserve: {minReservedAmount} units
      </div>
      Available Bids:
      {validBids.map(bidValue => {
        const isCancelled = bidValue < highestBid;
        const isMaxBid = bidValue === maxBid;
        const isHighestBid = bidValue === highestBid;
        
        return (
          <span
            key={bidValue}
            className={`bid-option ${isMaxBid ? 'max-bid' : ''} ${isCancelled ? 'cancelled' : ''} ${isHighestBid ? 'highest-bid' : ''}`}
            onClick={() => !isCancelled && handleBidClick(owner.id, bidValue)}
            style={{
              opacity: isCancelled ? 0.5 : 1,
              cursor: isCancelled ? 'not-allowed' : 'pointer',
              color: isCancelled ? 'red' : isMaxBid ? 'green' : isHighestBid ? 'blue' : 'black',
              textDecoration: isCancelled ? 'line-through' : 'none'
            }}
          >
            {bidValue}
          </span>
        );
      })}
    </div>
  );
};

export const renderControlButtons = (
  handleStart,
  handleStop,
  handleDiscard,
  resetAuction,
  assignPlayerToHighestBidder
) => (
  <div className="control-buttons">
    <button onClick={handleStart}>Start</button>
    <button onClick={handleStop}>Stop</button>
    <button onClick={handleDiscard}>Discard</button>
    <button onClick={resetAuction}>Reset bid</button>
    <button onClick={assignPlayerToHighestBidder}>Skip time</button>
  </div>
);
