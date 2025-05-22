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

export const ifFullyFilled = (ownerId, owners, poolSize, slabDetails) => {
    const owner = owners.find((o) => o.id === ownerId);
    if (!owner) return false; // Owner not found, can't bid

    // Get initial player count from localStorage
    const initialPlayerCountsRaw = localStorage.getItem("initialPlayerCounts");
    const initialPlayerCounts = initialPlayerCountsRaw ? JSON.parse(initialPlayerCountsRaw) : {};
    const initialPlayersInSlab = initialPlayerCounts[slabDetails.name] || 0;

    const totalOwners = owners.length;
    const maxPlayersPerOwner = Math.ceil(initialPlayersInSlab / totalOwners); // Use initial player count
    const currentSlabPlayers = owner.slabPlayers[slabDetails.name] || [];
    
    // Check if owner has reached their limit for this slab
    if (currentSlabPlayers.length >= maxPlayersPerOwner) {
        console.log(`Owner ${ownerId} has reached slab limit:`, {
            currentPlayers: currentSlabPlayers.length,
            maxPlayers: maxPlayersPerOwner,
            initialPlayersInSlab,
            slabName: slabDetails.name
        });
        return false; // Owner has reached slab limit, can't bid
    }

    // Check if owner has reached their total player limit
    const totalPurchasedPlayers = owner.purchasedPlayers.length;
    const maxTotalPlayers = Math.ceil(poolSize / totalOwners);
    
    if (totalPurchasedPlayers >= maxTotalPlayers) {
        console.log(`Owner ${ownerId} has reached total limit:`, {
            totalPurchased: totalPurchasedPlayers,
            maxTotal: maxTotalPlayers
        });
        return false; // Owner has reached total limit, can't bid
    }

    return true; // Owner is eligible to bid
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
    
    const bidOptions = calculateBidOptions(owner, currentPlayer, slabDetails);
    console.log('Calculated bid options:', {
      ownerId: owner.id,
      bidOptions
    });

    return (
      <div key={owner.id} className="bid-options">
        <h3>{owner.name}</h3>
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
    );
  });
};