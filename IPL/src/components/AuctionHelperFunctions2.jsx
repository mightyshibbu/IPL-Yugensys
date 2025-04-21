import React, { useCallback } from 'react';

// Initialization functions
export const initializePlayersFromLocalStorage = (
  setPlayerData,
  setAuctionSequence,
  setPlayersList,
  sortPlayersByAuctionSequence,
  poolSize
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

  // Create a flattened array of players maintaining slab order from AuctionSequence
  const flattenedPlayers = storedAuctionSequence.reduce((acc, slabName) => {
    if (storedPlayerData[slabName]) {
      // Sort players within each slab by PID to maintain consistent order
      const sortedSlabPlayers = [...storedPlayerData[slabName]].sort((a, b) => a.PID - b.PID);
      acc.push(...sortedSlabPlayers);
    }
    return acc;
  }, []);

  setPlayersList(flattenedPlayers);
};

export const initializeAuctionState = (
  localStorage,
  setIsStarted,
  setPlayersList,
  setOwners,
  setUnbiddedPlayersQueue,
  setTimer,
  setPoolSize,
  setCurrentPlayerIndex,
  moveToNextNonZeroPlayer,
  resetAuctionState,
  players,
  poolSize,
  createInitialOwners,
  savedUnbiddedPlayersQueue,
  savedTimer,
  savedPoolSize
) => {
  const savedAuctionData = localStorage.getItem("auctionData");

  if (savedAuctionData) {
    const {
      playersList: savedPlayersList,
      currentPlayerIndex: savedCurrentPlayerIndex,
      owners: savedOwners,
      isStarted: savedIsStarted,
    } = JSON.parse(savedAuctionData);

    setIsStarted(savedIsStarted || false);
    setPlayersList(savedPlayersList || players.slice(0, poolSize));
    setOwners(savedOwners || createInitialOwners(totalOwners));
    setUnbiddedPlayersQueue(savedUnbiddedPlayersQueue || [...savedPlayersList]);
    setTimer(savedTimer || configTime);
    setPoolSize(savedPoolSize || poolSize);

    savedIsStarted 
      ? moveToNextNonZeroPlayer() 
      : setCurrentPlayerIndex(savedCurrentPlayerIndex || 0);
  } else {
    resetAuctionState();
  }
};

export const resetAuctionState = (
  setPlayersList,
  setOwners,
  setHighestBid,
  setHighestBidder,
  setUnbiddedPlayersQueue,
  setTimer,
  setPoolSize,
  setCurrentPlayerIndex,
  players,
  poolSize,
  createInitialOwners,
  configTime,
  totalOwners
) => {
  setPlayersList(players.slice(0, poolSize));
  setOwners(createInitialOwners(totalOwners));
  setHighestBid(0);
  setHighestBidder(null);
  setUnbiddedPlayersQueue([...players.slice(0, poolSize)]);
  setTimer(configTime);
  setPoolSize(poolSize);
  setCurrentPlayerIndex(0);
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
  currentPlayer,
  slabDetails,
  setTimer,
  configTime
) => {
  setHighestBid(currentPlayer.minimumBid || slabDetails.basePrice);
  setHighestBidder(null);
  setTimer(configTime);
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
  updateOwnerBid
) => {
  if (isStopped) return;

  const owner = owners.find((o) => o.id === ownerId);
  if (!owner || !slabDetails) return;

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
    updateOwnerBid(ownerId, bidValue);
  }
};

export const updateOwnerBid = (ownerId, bidValue, owners, setOwners) => {
  setOwners(owners.map((o) => 
    o.id === ownerId ? { ...o, currentBid: bidValue } : o
  ));
};

export const ifFullyFilled = (ownerID, owners, poolSize) => {
  const owner = owners.find((o) => o.id === ownerID);
  return owner ? owner.purchasedPlayers.length < poolSize / 3 : false;
};

export const makeBid = (
  ownerId,
  isStopped,
  owners,
  slabDetails,
  highestBid,
  currentPlayer,
  slabMaxSize,
  poolSize,
  numSlabs,
  totalOwners,
  updateOwnerState,
  updatePlayerLists,
  saveAuctionState
) => {
  if (isStopped) return;

  const owner = owners.find((o) => o.id === ownerId);
  if (!owner || !slabDetails) return;

  const currentSlabMaxSize = slabMaxSize(poolSize, numSlabs, totalOwners);
  const slabPlayers = owner.slabPlayers[slabDetails.name] || [];

  if (slabPlayers.length >= currentSlabMaxSize[slabDetails.name]) {
    alert(`Owner ${owner.id} cannot purchase more players from ${slabDetails.name} slab`);
    return;
  }

  const updatedSlabPlayers = [...slabPlayers, currentPlayer.PName];
  const updatedPurchasedPlayers = [...owner.purchasedPlayers, currentPlayer.PName];

  updateOwnerState(ownerId, updatedSlabPlayers, updatedPurchasedPlayers);
  updatePlayerLists();
  saveAuctionState();
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
  setOwners(owners.map((o) => {
    if (o.id === ownerId) {
      return {
        ...o,
        unitsLeft: o.unitsLeft - highestBid,
        slabPlayers: {
          ...o.slabPlayers,
          [slabDetails.name]: updatedSlabPlayers,
        },
        purchasedPlayers: updatedPurchasedPlayers,
      };
    }
    return o;
  }));
};

export const updatePlayerLists = (
  unbiddedPlayersQueue,
  playersList,
  currentPlayerIndex,
  setUnbiddedPlayersQueue,
  setPlayersList
) => {
  const updatedUnbiddedPlayersQueue = unbiddedPlayersQueue.filter(
    (player) => player.PID !== playersList[currentPlayerIndex].PID
  );
  const updatedPlayersList = playersList.map((player, index) =>
    index === currentPlayerIndex ? 0 : player
  );

  setUnbiddedPlayersQueue(updatedUnbiddedPlayersQueue);
  setPlayersList(updatedPlayersList);
};

export const saveAuctionState = (
  playersList,
  currentPlayerIndex,
  owners,
  highestBid,
  highestBidder,
  poolSize,
  unbiddedPlayersQueue,
  timer
) => {
  const auctionState = {
    playersList,
    currentPlayerIndex: currentPlayerIndex + 1,
    owners,
    highestBid,
    highestBidder,
    poolSize,
    unbiddedPlayersQueue,
    timer,
  };

  localStorage.setItem("auctionData", JSON.stringify(auctionState));
};

export const assignPlayerToHighestBidder = (
  highestBidder,
  makeBid,
  playersList,
  currentPlayer,
  endAuction,
  moveToNextNonZeroPlayer,
  resetAuction
) => {
  if (highestBidder) {
    makeBid(highestBidder.id);
  } else {
    console.log("NO HIGHEST BIDDER for player:", currentPlayer);
  }

  if (playersList.every((player) => player === 0)) {
    endAuction();
  } else {
    moveToNextNonZeroPlayer();
    resetAuction();
  }
};

// Auction result functions
export const saveAuctionData = async (auctionData) => {
  try {
    const response = await fetch("http://localhost:3000/api/saveAuction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auctionData),
    });

    if (!response.ok) throw new Error("Failed to save auction data");
    const result = await response.json();
    console.log("Auction saved successfully:", result);
  } catch (error) {
    console.error("Error saving auction data:", error);
  }
};
