import React from "react";

export const prepareAuctionData = (owners, slabs) => {
  // Process each owner's data
  const processedOwners = owners.map(owner => {
    // Create a copy of the owner's slab players
    const slabPlayers = {};
    Object.entries(owner.slabPlayers).forEach(([slabName, players]) => {
      slabPlayers[slabName] = [...players];
    });

    // Create a list of purchased players with their slabs
    const purchasedPlayers = [];
    Object.entries(owner.slabPlayers).forEach(([slabName, players]) => {
      players.forEach(playerName => {
        purchasedPlayers.push({
          name: playerName,
          slab: slabName,
          playerId: playerName
        });
      });
    });

    return {
      id: owner.id,
      unitsLeft: owner.unitsLeft,
      slabPlayers,
      purchasedPlayers
    };
  });

  return {
    owners: processedOwners
  };
};

export const endAuction = async (
  prepareAuctionData,
  owners,
  slabs,
  saveAuctionData,
  navigate
) => {
  // Get the latest owner states from localStorage
  const latestOwners = owners.map(owner => {
    const storedState = localStorage.getItem(`owner_${owner.id}_state`);
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      return {
        ...owner,
        purchasedPlayers: parsedState.purchasedPlayers || owner.purchasedPlayers,
        slabPlayers: parsedState.slabPlayers || owner.slabPlayers,
        unitsLeft: parsedState.unitsLeft || owner.unitsLeft
      };
    }
    return owner;
  });

  alert("Auction completed!");

  try {
    // Prepare the auction data with latest owner states
    const auctionData = prepareAuctionData(latestOwners, slabs);
    
    // Save the auction data
    await saveAuctionData(auctionData);
    
    // Clear the auction state from localStorage
    localStorage.removeItem("auctionData");
    
    // Navigate to the previous auctions page
    navigate("/previousAuctions", { replace: true });
  } catch (error) {
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
  numberOfPlayersLeft,
  preAuctionData
) => (
  <div className="player-card">
    <div className="important-text">Player Card</div>
    <img
      src={getPlayerImage(currentPlayerIndex)}
      alt="Player"
      style={{ width: "240px", height: "240px", objectFit: "cover" }}
    />
    <div className="player-name">{slabDetails.name}</div>
    <div >
      <div>MIN: {slabDetails.basePrice}</div>
      <div>MAX: {slabDetails.maxBid !== null && slabDetails.maxBid !== undefined ? slabDetails.maxBid : "No max bid"}</div>
    </div>
    <div className="important-text">Player ID: {currentPlayer.PID}</div>
    <div className="slab">
     {currentPlayer.PName}
    </div>
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
) => {
  // Get pre-auction data
  const preAuctionData = JSON.parse(localStorage.getItem("PreAuctionData") || "{}");

  return owners.map((owner) => (
    <div key={owner.id} className="owner-card">
      <div className="owner-header">
        {owner.id == 1 ? (
          <div>Owner {owner.id}   </div>
        ) : (
          <div>Owner {owner.id}</div>
        )}
        <div>Units Left: {owner.unitsLeft}</div>
      </div>
      
      <div className="purchased-players">
        <h4>Purchased Players:</h4>
        {owner.purchasedPlayers.length > 0 ? (
          <div className="players-list">
            {owner.purchasedPlayers.map((player, index) => {
              // Find which owner bought this player
              const buyer = owners.find(o => 
                o.purchasedPlayers.includes(player)
              );
              const isSold = buyer && buyer.id !== owner.id;
              
              // Check if player was purchased in pre-auction
              const isPreAuctioned = Object.values(preAuctionData).some(
                data => data.player.PName === player && data.owner === owner.id
              );
              
              return (
                <span 
                  key={index} 
                  className={`player-name ${isSold ? 'sold' : ''}`}
                >
                  {isPreAuctioned && <span className="pre-auction-tag">PRE</span>}
                  {player}
                  {isSold && <span className="buyer-info"> (Owner {buyer.id})</span>}
                  {index < owner.purchasedPlayers.length - 1 ? ", " : ""}
                </span>
              );
            })}
          </div>
        ) : (
          "None"
        )}
      </div>

      <div className="bid-section">
        {renderBidOptions(owner)}
        <button
          disabled={(highestBidder && highestBidder.id === owner.id) || isStopped}
          onClick={() => {}}
        >
          Make Bid
        </button>
      </div>
    </div>
  ));
};

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
  // Check if auction is started and we have valid player/slab data
  if (!isStarted || !currentPlayer || !slabDetails || currentPlayer.PID === 9999) {
    return null;
  }

  // Check if owner has reached their limits
  const hasReachedLimit = ifFullyFilled(owner.id);
  if (hasReachedLimit) {
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
