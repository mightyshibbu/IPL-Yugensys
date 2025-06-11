import React, { useCallback } from 'react';

// Initialization functions
export const initializePlayersFromLocalStorage = (
  setPlayerData,
  setAuctionSequence
) => {
  const rawPlayerData = localStorage.getItem("PlayerData");
  const rawAuctionSequence = localStorage.getItem("AuctionSequence");

  let storedPlayerData = {};
  let storedAuctionSequence = [];

  try {
    storedPlayerData = JSON.parse(rawPlayerData) || {};
    storedAuctionSequence = JSON.parse(rawAuctionSequence) || [];
  } catch (e) {
    console.error("Error parsing localStorage data:", e);
  }

  setPlayerData(storedPlayerData);
  setAuctionSequence(storedAuctionSequence);
};

export const initializeAuctionState = (
  localStorage,
  setIsStarted,
  setPlayerData,
  setOwners,
  setUnbiddedPlayersQueue,
  setTimer,
  setCurrentSlabIndex,
  moveToNextPlayer,
  resetAuctionState,
  players,
  createInitialOwners,
  savedUnbiddedPlayersQueue,
  savedTimer
) => {
  const savedAuctionData = localStorage.getItem("auctionData");

  if (savedAuctionData) {
    const {
      playerData: savedPlayerData,
      currentSlabIndex: savedCurrentSlabIndex,
      owners: savedOwners,
      isStarted: savedIsStarted,
    } = JSON.parse(savedAuctionData);

    setIsStarted(savedIsStarted || false);
    setPlayerData(savedPlayerData || {});
    setOwners(savedOwners || createInitialOwners());
    setUnbiddedPlayersQueue(savedUnbiddedPlayersQueue || []);
    setTimer(savedTimer || 180);

    if (savedIsStarted) {
      moveToNextPlayer();
    } else {
      setCurrentSlabIndex(savedCurrentSlabIndex || 0);
    }
  } else {
    resetAuctionState();
  }
};

export const resetAuctionState = (
  setPlayerData,
  setOwners,
  setHighestBid,
  setHighestBidder,
  setUnbiddedPlayersQueue,
  setTimer,
  setCurrentSlabIndex,
  players,
  createInitialOwners
) => {
  const ownerUnitsRaw = localStorage.getItem("OwnerUnits");
  const ownerUnits = ownerUnitsRaw ? JSON.parse(ownerUnitsRaw) : {};

  setPlayerData({});
  setOwners(Object.entries(ownerUnits).map(([id, units]) => ({
    id: parseInt(id),
    unitsLeft: units,
    purchasedPlayers: [],
    slabPlayers: {},
  })));
  setHighestBid(0);
  setHighestBidder(null);
  setUnbiddedPlayersQueue([]);
  setTimer(180);
  setCurrentSlabIndex(0);
};

// Player management functions
export const getPlayerImage = (currentPlayer, img10, PLAYER_IMAGES, playerIndex) => {
  return currentPlayer.PID === 9999 ? img10 : PLAYER_IMAGES[playerIndex % PLAYER_IMAGES.length];
};

export const moveToNextNonZeroPlayer = (
  currentPlayer,
  playersList,
  currentPlayerIndex,
  setCurrentPlayerIndex,
  handleNoPlayersInCurrentSlab,
  handleNoPlayersInAnySlab
) => {
  const currentSlabName = currentPlayer.PSlab;
  
  // First, try to find next player in current slab
  let nextNonZeroIndex = playersList.findIndex(
    (player, index) => index > currentPlayerIndex && 
    player !== 0 && 
    player.PSlab === currentSlabName
  );

  // If no more players in current slab, try from beginning of slab
  if (nextNonZeroIndex === -1) {
    nextNonZeroIndex = playersList.findIndex(
      (player) => player !== 0 && player.PSlab === currentSlabName
    );
  }

  // If still no players in current slab, move to next slab
  if (nextNonZeroIndex === -1) {
    handleNoPlayersInCurrentSlab(currentSlabName);
    return;
  }

  setCurrentPlayerIndex(nextNonZeroIndex);
};

export const handleNoPlayersInCurrentSlab = (
  currentSlabName,
  slabs,
  playersList,
  setCurrentPlayerIndex,
  endAuction
) => {
  const slabOrder = ["Marquee", "A", "B", "C", "D", "E", "F", "Impact"];
  const currentSlabIndex = slabOrder.indexOf(currentSlabName);
  
  // Find next slab with players
  for (let i = currentSlabIndex + 1; i < slabOrder.length; i++) {
    const nextSlabName = slabOrder[i];
    const nextPlayerIndex = playersList.findIndex(
      (player) => player !== 0 && player.PSlab === nextSlabName
    );
    
    if (nextPlayerIndex !== -1) {
      setCurrentPlayerIndex(nextPlayerIndex);
      return;
    }
  }

  // If no more slabs with players, end auction
  endAuction();
};

export const handleNoPlayersInAnySlab = (endAuction) => {
  endAuction();
};

// Auction control functions
export const resetAuction = (
  setHighestBid,
  setHighestBidder,
  slabDetails,
  setTimer,
  configTime
) => {
  try {
    if (!slabDetails) return;
    
    if (setHighestBid && typeof setHighestBid === 'function') {
      setHighestBid(slabDetails.basePrice);
    }
    
    if (setHighestBidder && typeof setHighestBidder === 'function') {
      setHighestBidder(null);
    }
    
    if (setTimer && typeof setTimer === 'function') {
      setTimer(configTime);
    }
  } catch (error) {
    console.error('Error in resetAuction:', error);
  }
};

export const autoAssign = (ownerId, slabDetails, handleBidClick) => {
  if (!slabDetails) return;
  handleBidClick(ownerId, slabDetails.basePrice + 100);
};

export const handleBidClick = (
  ownerId,
  bidValue,
  isStopped,
  owners,
  slabDetails,
  highestBid,
  highestBidder,
  setOwnersWithMaxBid,
  setHighestBid,
  setHighestBidder,
  setTimer,
  configTime,
  updateOwnerBid,
  setOwners
) => {
  if (isStopped) return;

  const owner = owners.find((o) => o.id === ownerId);
  if (!owner || !slabDetails) return;

  // Check slab limit first
  const slabPlayers = owner.slabPlayers[slabDetails.name] || [];
  const maxPlayersPerOwner = Math.ceil(slabDetails.numPlayers / owners.length); // Use actual slab details
  if (slabPlayers.length >= maxPlayersPerOwner) {
    console.log(`Owner ${owner.id} cannot purchase more players from ${slabDetails.name} slab:`, {
      currentPlayers: slabPlayers.length,
      maxPlayers: maxPlayersPerOwner,
      slabName: slabDetails.name
    });
    alert(`Owner ${owner.id} cannot purchase more players from ${slabDetails.name} slab`);
    return; // Return early without making any state changes
  }

  const cur_maxBid = slabDetails.maxBid;

  if (
    owner.unitsLeft >= bidValue &&
    bidValue >= highestBid &&
    owner !== highestBidder
  ) {
    if (bidValue === cur_maxBid) {
      setOwnersWithMaxBid((prev) => {
        const updatedOwners = [...prev, owner];
        const randomOwner = updatedOwners[Math.floor(Math.random() * updatedOwners.length)];
        
        setHighestBid(bidValue);
        setHighestBidder(randomOwner);
        return updatedOwners;
      });
    } else {
      setHighestBid(bidValue);
      setHighestBidder(owner);
    }

    setTimer(configTime);
    updateOwnerBid(ownerId, bidValue, owners, setOwners);
  }
};

export const updateOwnerBid = (ownerId, bidValue, owners, setOwners) => {
  setOwners(owners.map((o) => 
    o.id === ownerId ? { ...o, currentBid: bidValue } : o
  ));
};

// Add static Set to track shown alerts across function calls
const shownAlerts = new Set();

export const ifFullyFilled = (ownerId, owners, poolSize, slabDetails, isUnbiddedPlayer = false, playerDataState = {}, isBidCheck = false) => {
    // Get the owner
    const owner = owners.find(o => o.id === ownerId);
    if (!owner) {
        if (isBidCheck) console.log('DEBUG: Owner not found for ID:', ownerId);
        return true;
    }

    // Get current players in slab for this owner
    const currentSlabPlayers = owner.slabPlayers[slabDetails.name] || [];
    const currentPlayerCount = Array.isArray(currentSlabPlayers) ? currentSlabPlayers.length : 0;

    // Calculate total players owned across all slabs
    const totalPlayersOwned = Object.values(owner.slabPlayers).reduce((total, players) => {
        return total + (Array.isArray(players) ? players.length : 0);
    }, 0);

    // Get initial player counts from localStorage
    const initialPlayerCountsRaw = localStorage.getItem("initialPlayerCounts");
    const initialPlayerCounts = initialPlayerCountsRaw ? JSON.parse(initialPlayerCountsRaw) : {};

    // Calculate total initial players across all slabs
    const totalInitialPlayers = Object.values(initialPlayerCounts).reduce((sum, count) => sum + count, 0);
    const totalPlayersPerOwner = Math.ceil(totalInitialPlayers / owners.length);

    if (isBidCheck) {
        console.log('DEBUG: Fair Share Calculation for Owner', ownerId);
        console.log('DEBUG: Current Slab:', slabDetails.name);
        console.log('DEBUG: Players in current slab:', currentPlayerCount);
        console.log('DEBUG: Total players owned across all slabs:', totalPlayersOwned);
        console.log('DEBUG: Initial player count for this slab:', initialPlayerCounts[slabDetails.name] || 0);
        console.log('DEBUG: Total initial players across all slabs:', totalInitialPlayers);
        console.log('DEBUG: Total players per owner:', totalPlayersPerOwner);
        console.log('DEBUG: Number of owners:', owners.length);
        console.log('DEBUG: Is unbidded player phase:', isUnbiddedPlayer);
    }

    // For unbidded players, we only check total fair share
    if (isUnbiddedPlayer) {
        if (isBidCheck) {
            console.log('DEBUG: Checking unbidded player fair share');
            console.log('DEBUG: Owner', ownerId, 'has', totalPlayersOwned, 'players out of', totalPlayersPerOwner, 'allowed');
        }
        
        // For unbidded players, use the same fair share as normal sequence
        const initialPlayerCount = initialPlayerCounts[slabDetails.name] || 0;
        const maxPlayersPerOwner = Math.ceil(initialPlayerCount / owners.length);
        
        // Check slab-specific fair share first
        if (currentPlayerCount >= maxPlayersPerOwner) {
            if (isBidCheck) console.log('DEBUG: Owner', ownerId, 'has reached slab-specific fair share limit');
            return true;
        }
        
        // Then check total fair share
        if (totalPlayersOwned >= totalPlayersPerOwner) {
            if (isBidCheck) console.log('DEBUG: Owner', ownerId, 'has reached total fair share limit');
            return true;
        }
        
        if (isBidCheck) console.log('DEBUG: Owner', ownerId, 'is eligible to bid in unbidded phase');
        return false;
    }

    // For normal sequence, check both slab-specific and total fair share
    const initialPlayerCount = initialPlayerCounts[slabDetails.name] || 0;
    const maxPlayersPerOwner = Math.ceil(initialPlayerCount / owners.length);

    if (isBidCheck) {
        console.log('DEBUG: Normal sequence fair share check');
        console.log('DEBUG: Slab-specific fair share:', maxPlayersPerOwner, 'players per owner');
        console.log('DEBUG: Owner', ownerId, 'has', currentPlayerCount, 'players in this slab');
    }

    // Check slab-specific fair share
    if (currentPlayerCount >= maxPlayersPerOwner) {
        if (isBidCheck) console.log('DEBUG: Owner', ownerId, 'has reached slab-specific fair share limit');
        return true;
    }

    // Check total fair share
    if (totalPlayersOwned >= totalPlayersPerOwner) {
        if (isBidCheck) console.log('DEBUG: Owner', ownerId, 'has reached total fair share limit');
        return true;
    }

    if (isBidCheck) console.log('DEBUG: Owner', ownerId, 'is eligible to bid');
    return false;
};

// Add function to clear alerts when moving to next player
export const clearAlerts = () => {
    shownAlerts.clear();
};

export const updatePlayerLists = (
  unbiddedPlayersQueue,
  playerData,
  currentSlabName,
  currentPlayer,
  setUnbiddedPlayersQueue,
  setPlayerData
) => {
  if (!unbiddedPlayersQueue || !playerData || !currentSlabName || !currentPlayer) return;

  // Update unbidded players queue
  if (setUnbiddedPlayersQueue) {
    setUnbiddedPlayersQueue(prevQueue => {
      if (!prevQueue) return [];
      return prevQueue.filter(player => player.PID !== currentPlayer.PID);
    });
  }

  // Update player data
  if (setPlayerData) {
    setPlayerData(prevData => {
      if (!prevData) return {};
      const updatedData = { ...prevData };
      if (updatedData[currentSlabName]) {
        updatedData[currentSlabName] = updatedData[currentSlabName].map(p => 
          p.PID === currentPlayer.PID ? 0 : p
        );
      }
      return updatedData;
    });
  }
};

export const updateAuctionState = (
  playerData,
  currentSlabIndex,
  owners,
  highestBid,
  highestBidder,
  poolSize,
  unbiddedPlayersQueue,
  timer
) => {
  saveAuctionState(
    playerData,
    currentSlabIndex,
    owners,
    highestBid,
    highestBidder,
    poolSize,
    unbiddedPlayersQueue,
    timer
  );
};

export const makeBid = (
  ownerId,
  isStopped,
  owners,
  slabDetails,
  highestBid,
  currentPlayer,
  poolSize,
  numSlabs,
  totalOwners,
  updateOwnerState,
  updatePlayerLists,
  setOwners,
  unbiddedPlayersQueue,
  setUnbiddedPlayersQueue,
  playerData,
  setPlayerData,
  currentSlabName,
  currentSlabIndex,
  highestBidder,
  timer
) => {
  if (isStopped || !owners || !slabDetails || !currentPlayer) return;

  const owner = owners.find((o) => o.id === ownerId);
  if (!owner) {
    console.error("Owner not found:", ownerId);
    return;
  }

  // Calculate max players per slab per owner - same as ifFullyFilled
  const maxPlayersPerSlab = Math.ceil(slabDetails.numPlayers / owners.length);
  const slabPlayers = owner.slabPlayers[slabDetails.name] || [];

  if (slabPlayers.length >= maxPlayersPerSlab) {
    console.log(`Owner ${owner.id} cannot purchase more players from ${slabDetails.name} slab. Current: ${slabPlayers.length}, Max: ${maxPlayersPerSlab}`);
    return;
  }

  const updatedSlabPlayers = [...slabPlayers, currentPlayer.PName];
  const updatedPurchasedPlayers = [...owner.purchasedPlayers, currentPlayer.PName];

  updateOwnerState(ownerId, updatedSlabPlayers, updatedPurchasedPlayers, owners, slabDetails, highestBid, setOwners);
  updatePlayerLists(unbiddedPlayersQueue, playerData, currentSlabName, currentPlayer, setUnbiddedPlayersQueue, setPlayerData);
  updateAuctionState(
    playerData,
    currentSlabIndex,
    owners,
    highestBid,
    highestBidder,
    poolSize,
    unbiddedPlayersQueue,
    timer
  );
};

export const updateOwnerState = (
  ownerId,
  updatedSlabPlayers,
  updatedPurchasedPlayers,
  owners,
  slabDetails,
  highestBid,
  setOwners
) => {
  if (!owners || !setOwners) return;
  
  setOwners(prevOwners => {
    if (!prevOwners) return owners;
    
    return prevOwners.map((o) => {
      if (o.id === ownerId) {
        return {
          ...o,
          unitsLeft: o.unitsLeft - highestBid,
          slabPlayers: {
            ...o.slabPlayers,
            [slabDetails.name]: updatedSlabPlayers,
          },
          purchasedPlayers: updatedPurchasedPlayers
        };
      }
      return o;
    });
  });
};

export const assignPlayerToHighestBidder = (
  highestBidder,
  isStopped,
  owners,
  slabDetails,
  highestBid,
  currentPlayer,
  poolSize,
  numSlabs,
  totalOwners,
  updateOwnerState,
  updatePlayerLists,
  setOwners,
  unbiddedPlayersQueue,
  setUnbiddedPlayersQueue,
  playerData,
  setPlayerData,
  currentSlabName,
  saveAuctionState,
  setHighestBid,
  setHighestBidder,
  setTimer
) => {
  if (!highestBidder) {
    console.log("NO HIGHEST BIDDER for player:", currentPlayer);
    return;
  }

  makeBid(
    highestBidder.id,
    isStopped,
    owners,
    slabDetails,
    highestBid,
    currentPlayer,
    poolSize,
    numSlabs,
    totalOwners,
    updateOwnerState,
    updatePlayerLists,
    setOwners,
    unbiddedPlayersQueue,
    setUnbiddedPlayersQueue,
    playerData,
    setPlayerData,
    currentSlabName,
    saveAuctionState
  );

  // Reset auction state
  resetAuction(
    setHighestBid,
    setHighestBidder,
    slabDetails,
    setTimer,
    180
  );
};

export const saveAuctionData = async (auctionData) => {
  try {
    // Log the data being sent
    console.log('Saving auction data:', JSON.stringify(auctionData, null, 2));

    const response = await fetch("http://localhost:3000/api/saveAuction", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        ...auctionData,
        timestamp: new Date().toISOString(),
        status: 'completed'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to save auction data: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    console.log("Auction saved successfully:", result);
    return result;
  } catch (error) {
    console.error("Error saving auction data:", error);
    throw error;
  }
};

export const saveAuctionState = (
  playerData,
  currentSlabIndex,
  owners,
  highestBid,
  highestBidder,
  poolSize,
  unbiddedPlayersQueue,
  timer
) => {
  const auctionState = {
    playerData,
    currentSlabIndex,
    owners,
    highestBid,
    highestBidder,
    poolSize,
    unbiddedPlayersQueue,
    timer,
  };
  
  localStorage.setItem("auctionData", JSON.stringify(auctionState));
};

export const renderBidOptions = (owners, currentPlayer, slabDetails, handleBidClick) => {
  console.log('renderBidOptions called with:', {
    owners,
    currentPlayer,
    slabDetails
  });

  if (!currentPlayer || !slabDetails) {
    console.log('Missing currentPlayer or slabDetails, returning null');
    return null;
  }
  
  return owners.map((owner) => {
    const isEligible = ifFullyFilled(owner.id, owners, currentPlayer.poolSize, slabDetails);
    console.log('Owner eligibility check:', {
      ownerId: owner.id,
      isEligible,
      unitsLeft: owner.unitsLeft
    });

    if (!isEligible) return null;
    
    // Calculate bid options and reserve info
    const maxPlayersPerSlab = Math.ceil(slabDetails.numPlayers / owners.length);
    const currentSlabPlayers = owner.slabPlayers[slabDetails.name] || [];
    const playersLeftToBuy = maxPlayersPerSlab - currentSlabPlayers.length;
    const requiredAmount = playersLeftToBuy * slabDetails.basePrice;
    const availableBids = owner.unitsLeft - requiredAmount;

    const bidOptions = [];
    for (let bid = slabDetails.basePrice; bid <= slabDetails.maxBid; bid += 50) {
      if (bid <= availableBids) {
        bidOptions.push(bid);
      }
    }

    if (bidOptions.length === 0) {
      return (
        <div key={owner.id} className="bid-options">
          <div className="reserve-info">
            <div className="total-reserve" data-label="Total Reserve">{requiredAmount}</div>
            <div className="available-bids" data-label="Available Bids">{availableBids}</div>
            <div className="remaining-players" data-label="Remaining Players">{playersLeftToBuy}</div>
          </div>
          <div className="no-valid-bids">
            Insufficient funds to maintain required reserve for remaining players
          </div>
        </div>
      );
    }

    return (
      <div key={owner.id} className="bid-options">
        <div className="reserve-info">
          <div className="total-reserve" data-label="Total Reserve">{requiredAmount}</div>
          <div className="available-bids" data-label="Available Bids">{availableBids}</div>
          <div className="remaining-players" data-label="Remaining Players">{playersLeftToBuy}</div>
        </div>
        <div className="bid-buttons">
          {bidOptions.map((bid) => (
            <button
              key={bid}
              onClick={() => handleBidClick(owner.id, bid)}
              className={bid === slabDetails.maxBid ? 'max-bid' : ''}
            >
              {bid}
            </button>
          ))}
        </div>
      </div>
    );
  });
};

export const renderOwnerCards = (
  owners,
  highestBidder,
  isStopped,
  renderBidOptions,
  slabDetails
) => {
  // Get pre-auction data
  const preAuctionData = JSON.parse(localStorage.getItem("PreAuctionData") || "{}");

  return owners.map((owner) => {
    // Calculate required amount
    const maxPlayersPerSlab = Math.ceil(slabDetails.numPlayers / owners.length);
    const currentSlabPlayers = owner.slabPlayers[slabDetails.name] || [];
    const playersLeftToBuy = maxPlayersPerSlab - currentSlabPlayers.length;
    const requiredAmount = playersLeftToBuy * slabDetails.basePrice;

    return (
      <div key={owner.id} className="owner-card">
        <div className="owner-header">
          <div className="owner-title">Owner {owner.id}</div>
          <div className="units-left">{owner.unitsLeft}</div>
          <div className="required-amount">{requiredAmount}</div>
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
    );
  });
};