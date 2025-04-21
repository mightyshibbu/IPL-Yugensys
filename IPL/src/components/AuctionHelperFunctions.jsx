import React from "react";

export const prepareAuctionData = (owners, slabs) => {
  const slabMapping = slabs.reduce((acc, slab, index) => {
    acc[slab.name] = index;
    return acc;
  }, {});

  return {
    owners: owners.map((owner) => {
      const slabPlayers = {};

      for (const slabName of Object.keys(slabMapping)) {
        const playersInSlab = owner.slabPlayers[slabName] || [];
        slabPlayers[slabName] = playersInSlab.length > 0 ? playersInSlab : "No Players";
      }

      return {
        id: owner.id,
        unitsLeft: owner.unitsLeft,
        slabPlayers: Object.fromEntries(
          Object.entries(slabPlayers).filter(([_, players]) => players !== "No Players")
        ),
        purchasedPlayers: owner.purchasedPlayers.map((player) => ({
          name: player.name,
          slab: player.slab,
          playerId: player.playerId,
        })),
      };
    }),
  };
};

export const endAuction = async (
  prepareAuctionData,
  owners,
  slabs,
  saveAuctionData,
  navigate
) => {
  console.log("Auction completed!");
  alert("Auction completed!");

  try {
    const auctionData = prepareAuctionData(owners, slabs);
    await saveAuctionData(auctionData);
    localStorage.removeItem("auctionData");
    navigate("/previousAuctions", { replace: true });
  } catch (error) {
    console.error("Error ending auction:", error);
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
        Purchased Players: {owner.purchasedPlayers.join(", ") || "None"}
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
  handleBidClick
) => {
  if (!isStarted || !currentPlayer || !slabDetails || !ifFullyFilled(owner.id) || currentPlayer.PID === 9999) {
    return null;
  }

  const basePrice = slabDetails.min || 50;
  const maxBid = slabDetails.max || 2000;
  const bidIncrement = 50;

  // Calculate valid bid values
  const validBids = [];
  for (let bid = basePrice; bid <= maxBid; bid += bidIncrement) {
    if (bid >= highestBid && bid <= owner.unitsLeft) {
      validBids.push(bid);
    }
  }

  if (validBids.length === 0) {
    return null;
  }

  return (
    <div className="bid-options">
      Available Bids:
      {validBids.map(bidValue => (
        <span
          key={bidValue}
          className="bid-option"
          onClick={() => handleBidClick(owner.id, bidValue)}
        >
          {bidValue}
        </span>
      ))}
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
