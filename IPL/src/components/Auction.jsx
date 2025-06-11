import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auction.css";
import img1 from "../static/img1.jpg";
import img2 from "../static/img2.jpg";
import img3 from "../static/img3.jpg";
import img4 from "../static/img4.jpg";
import img5 from "../static/img5.jpg";
import img6 from "../static/img6.jpg";
import img7 from "../static/img7.jpg";
import img8 from "../static/img8.jpg";
import img9 from "../static/img9.jpg";
import img10 from "../static/img10.jpg";

import {
  prepareAuctionData,
  endAuction,
  handleStart,
  handleStop,
  handleDiscard,
  renderPlayerCard,
  renderBidInfo,
  renderOwnerCards,
  renderBidOptions,
  renderControlButtons,
} from "./AuctionHelperFunctions";

import {
  initializePlayersFromLocalStorage,
  initializeAuctionState,
  resetAuctionState,
  getPlayerImage,
  moveToNextNonZeroPlayer,
  handleNoPlayersInCurrentSlab,
  handleNoPlayersInAnySlab,
  resetAuction,
  autoAssign,
  handleBidClick,
  updateOwnerBid,
  ifFullyFilled,
  makeBid,
  updateOwnerState,
  updatePlayerLists,
  saveAuctionState,
  assignPlayerToHighestBidder,
  saveAuctionData,
} from "./AuctionHelperFunctions2";

// Constants
const DEFAULT_PLAYER = {
  PID: 9999,
  PName: "DEFAULT NAME",
  PAge: 0,
  PHeight: "",
  PWeight: "",
  PRole: "",
  PSlab: "DEFAULT",
};

const DEFAULT_SLAB = {
  name: "DEFAULT SLAB",
  basePrice: 9999,
  maxBid: 9999,
};

const PLAYER_IMAGES = [img1, img2, img3, img4, img5, img6, img7, img8, img9];

// Add new UpcomingPlayersPanel component
const UpcomingPlayersPanel = ({ playerDataState, currentPlayer, auctionSequence, currentSlabIndex }) => {
    return (
        <div className="upcoming-players-panel">
            <h3>Upcoming Players</h3>
            {auctionSequence.map((slabName, index) => {
                const players = playerDataState[slabName] || [];
                const unsoldPlayers = players.filter(player => player !== 0);
                
                return (
                    <div key={slabName} className={`slab-section ${index === currentSlabIndex ? 'current-slab' : ''}`}>
                        <h4>{slabName}</h4>
                        <div className="players-list">
                            {unsoldPlayers.map((player) => (
                                <div 
                                    key={player.PID} 
                                    className={`player-name ${currentPlayer && player.PID === currentPlayer.PID ? 'current-player' : ''}`}
                                >
                                    {player.PName}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const Auction = ({ players }) => {
    // State hooks
    const [currentSlabIndex, setCurrentSlabIndex] = useState(0);
    const [slabDetails, setSlabDetails] = useState(DEFAULT_SLAB);
    const [playerDataState, setPlayerDataState] = useState({});
    const [highestBid, setHighestBid] = useState(0);
    const [highestBidder, setHighestBidder] = useState(null);
    const [unbiddedPlayersQueue, setUnbiddedPlayersQueue] = useState([]);
    const [timer, setTimer] = useState(180); // Default timer
    const [owners, setOwners] = useState([]);
    const [ownersWithMaxBid, setOwnersWithMaxBid] = useState([]);
    const [isStarted, setIsStarted] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [slabsState, setSlabsState] = useState([]);
    const [upcomingSlab, setUpcomingSlab] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(DEFAULT_PLAYER);
    const [auctionSequence, setAuctionSequence] = useState([]);
    const [isSequenceComplete, setIsSequenceComplete] = useState(false);
    const [initialPlayerCounts, setInitialPlayerCounts] = useState({});

    const navigate = useNavigate();

    // Load latest configuration from localStorage
    useEffect(() => {
        const loadLatestConfig = () => {
            // Load auction configuration first to get the number of owners
            const auctionConfigRaw = localStorage.getItem("AuctionData");
            let totalOwners = 2; // Default to 2 if not specified
            if (auctionConfigRaw) {
                const auctionConfig = JSON.parse(auctionConfigRaw);
                totalOwners = parseInt(auctionConfig.totalOwners) || 2;
                setTimer(auctionConfig.configTime || 180);
            }

            // Load owner units
            const ownerUnitsRaw = localStorage.getItem("OwnerUnits");
            const ownerUnits = ownerUnitsRaw ? JSON.parse(ownerUnitsRaw) : {};

            // Load pre-auction data
            const preAuctionDataRaw = localStorage.getItem("PreAuctionData");
            const preAuctionData = preAuctionDataRaw ? JSON.parse(preAuctionDataRaw) : {};

            // Initialize owners with their units and pre-auction purchases
            const initialOwners = Object.entries(ownerUnits)
                .filter(([id]) => parseInt(id) <= totalOwners) // Only include owners up to totalOwners
                .map(([id, units]) => {
                    // Find all players purchased by this owner in pre-auction
                    const purchasedPlayers = Object.entries(preAuctionData)
                        .filter(([_, data]) => data.owner === parseInt(id))
                        .map(([_, data]) => data.player.PName);

                    // Group purchased players by slab
                    const slabPlayers = {};
                    Object.entries(preAuctionData)
                        .filter(([_, data]) => data.owner === parseInt(id))
                        .forEach(([_, data]) => {
                            const slab = data.player.PSlab;
                            if (!slabPlayers[slab]) {
                                slabPlayers[slab] = [];
                            }
                            slabPlayers[slab].push(data.player.PName);
                        });

                    return {
                        id: parseInt(id),
                        unitsLeft: units,
                        purchasedPlayers,
                        slabPlayers,
                    };
                });
            setOwners(initialOwners);

            // Load slabs configuration
            const slabsConfigRaw = localStorage.getItem("slabsConfig");
            const slabs = slabsConfigRaw ? JSON.parse(slabsConfigRaw) : [];
            setSlabsState(slabs);

            // Load auction sequence
            const auctionSequenceRaw = localStorage.getItem("AuctionSequence");
            const sequence = auctionSequenceRaw ? JSON.parse(auctionSequenceRaw) : [];
            setAuctionSequence(sequence);

            // Load player data and remove pre-auction purchased players
            const playerDataRaw = localStorage.getItem("PlayerData");
            const playerData = playerDataRaw ? JSON.parse(playerDataRaw) : {};
            
            // Remove players that were purchased in pre-auction
            Object.entries(playerData).forEach(([slab, players]) => {
                playerData[slab] = players.filter(player => !preAuctionData[player.PID]);
            });
            
            setPlayerDataState(playerData);

            console.log('Loaded configuration:', {
                totalOwners,
                initialOwners,
                ownerUnits,
                slabs,
                sequence,
                playerData,
                preAuctionData
            });
        };

        loadLatestConfig();
    }, []); // Empty dependency array means this runs once on component mount

    // Get current slab name from auction sequence
    const currentSlabName = auctionSequence[currentSlabIndex] || "";
    // Get current slab's players
    const currentSlabPlayers = playerDataState[currentSlabName] || [];
    // Get first unsold player from current slab
    useEffect(() => {
        const firstUnsoldPlayer = currentSlabPlayers.find(player => player !== 0) || DEFAULT_PLAYER;
        setCurrentPlayer(firstUnsoldPlayer);
    }, [currentSlabIndex, currentSlabPlayers]);

    // Calculate total number of players left across all slabs
    const numberOfPlayersLeft = Object.values(playerDataState).reduce((total, slabPlayers) => {
        return total + slabPlayers.filter(player => player !== 0).length;
    }, 0);

    // Add useEffect to update slab details when slabsState changes
    useEffect(() => {
        if (currentPlayer && currentPlayer.PSlab) {
            const slabConfig = slabsState.find(slab => slab.name === currentPlayer.PSlab);
            console.log('Updating slab details:', {
                currentPlayer,
                slabConfig,
                slabsState,
                auctionSequence
            });
            
            if (slabConfig) {
                // Get actual number of players in this slab from playerDataState
                const actualPlayerCount = playerDataState[slabConfig.name]?.filter(p => p !== 0).length || 0;
                
                const newSlabDetails = {
                    name: slabConfig.name,
                    basePrice: slabConfig.basePrice,
                    maxBid: slabConfig.maxBid || slabConfig.basePrice * 2,
                    numPlayers: actualPlayerCount // Use actual player count
                };
                
                console.log('Setting updated slab details:', {
                    newSlabDetails,
                    actualPlayerCount,
                    slabPlayers: playerDataState[slabConfig.name]
                });
                
                setSlabDetails(newSlabDetails);
                setHighestBid(slabConfig.basePrice);
            } else {
                console.log('No slab config found for:', currentPlayer.PSlab);
                setSlabDetails(DEFAULT_SLAB);
            }
        } else {
            console.log('No current player or PSlab, using default slab');
            setSlabDetails(DEFAULT_SLAB);
        }
    }, [currentPlayer, slabsState, playerDataState, auctionSequence]);

    // Update useEffect to store initial player counts
    useEffect(() => {
        if (Object.keys(playerDataState).length > 0 && Object.keys(initialPlayerCounts).length === 0) {
            const counts = {};
            Object.entries(playerDataState).forEach(([slabName, players]) => {
                counts[slabName] = players.filter(p => p !== 0).length;
            });
            console.log('Setting initial player counts:', counts);
            setInitialPlayerCounts(counts);
            // Save to localStorage for other components to use
            localStorage.setItem("initialPlayerCounts", JSON.stringify(counts));
        }
    }, [playerDataState]);

    // Modify moveToNextPlayer function to handle unbidded players
    const moveToNextPlayer = () => {
        // Only log sequence state when it changes significantly
        if (isSequenceComplete || currentSlabIndex > 0) {
            console.log('Sequence State:', {
                isSequenceComplete,
                currentSlabIndex,
                currentSlabName,
                unbiddedPlayersQueue: unbiddedPlayersQueue.length
            });
        }
        
        // Reset ownersWithMaxBid when moving to next player
        setOwnersWithMaxBid([]);
        
        // If we're in the unbidded players queue phase
        if (isSequenceComplete) {
            if (unbiddedPlayersQueue.length > 0) {
                // Get the next unbidded player
                const nextUnbiddedPlayer = unbiddedPlayersQueue[0];
                console.log('Processing unbidded player:', {
                    playerName: nextUnbiddedPlayer.PName,
                    playerId: nextUnbiddedPlayer.PID,
                    originalSlab: nextUnbiddedPlayer.PSlab,
                    currentState: playerDataState[nextUnbiddedPlayer.PSlab]?.find(p => p.PID === nextUnbiddedPlayer.PID)
                });
                
                // Update current player and slab index
                setCurrentPlayer(nextUnbiddedPlayer);
                const originalSlabIndex = auctionSequence.findIndex(slab => slab === nextUnbiddedPlayer.PSlab);
                if (originalSlabIndex !== -1) {
                    setCurrentSlabIndex(originalSlabIndex);
                }
                
                // Remove the player from the queue
                setUnbiddedPlayersQueue(prev => prev.slice(1));
                
                // Set the slab details for the unbidded player
                const slabConfig = slabsState.find(slab => slab.name === nextUnbiddedPlayer.PSlab);
                if (slabConfig) {
                    const newSlabDetails = {
                        name: slabConfig.name,
                        basePrice: slabConfig.basePrice,
                        maxBid: slabConfig.maxBid || slabConfig.basePrice * 2,
                        numPlayers: slabConfig.numPlayers
                    };
                    console.log('Setting slab details for unbidded player:', newSlabDetails);
                    setSlabDetails(newSlabDetails);
                    setHighestBid(slabConfig.basePrice);
                }

                // Update player data state to ensure the player is available for bidding
                setPlayerDataState(prevData => {
                    const updatedData = { ...prevData };
                    if (updatedData[nextUnbiddedPlayer.PSlab]) {
                        console.log('Before restoring player:', {
                            slabName: nextUnbiddedPlayer.PSlab,
                            playerState: updatedData[nextUnbiddedPlayer.PSlab].find(p => p.PID === nextUnbiddedPlayer.PID),
                            playerId: nextUnbiddedPlayer.PID
                        });

                        // Create a new array to avoid reference issues
                        const updatedSlabPlayers = [...updatedData[nextUnbiddedPlayer.PSlab]];
                        const playerIndex = updatedSlabPlayers.findIndex(p => p.PID === nextUnbiddedPlayer.PID);
                        
                        if (playerIndex === -1) {
                            // If player not found, add them back
                            updatedSlabPlayers.push(nextUnbiddedPlayer);
                        } else if (updatedSlabPlayers[playerIndex] === 0) {
                            // If player is marked as sold (0), restore them
                            updatedSlabPlayers[playerIndex] = nextUnbiddedPlayer;
                        }
                        
                        updatedData[nextUnbiddedPlayer.PSlab] = updatedSlabPlayers;

                        console.log('After restoring player:', {
                            slabName: nextUnbiddedPlayer.PSlab,
                            playerState: updatedData[nextUnbiddedPlayer.PSlab].find(p => p.PID === nextUnbiddedPlayer.PID),
                            playerId: nextUnbiddedPlayer.PID
                        });
                    }
                    return updatedData;
                });

                // Remove player from unbiddedPlayersQueue to prevent repeated restoration
                setUnbiddedPlayersQueue(prevQueue => prevQueue.filter(p => p.PID !== nextUnbiddedPlayer.PID));
            } else {
                // No more unbidded players, end auction
                endAuction(
                    prepareAuctionData,
                    owners,
                    slabsState,
                    saveAuctionData,
                    navigate
                );
            }
            return;
        }
        
        // Check if current slab has any unsold players
        const hasUnsoldPlayers = currentSlabPlayers.some(player => player !== 0);
        
        if (!hasUnsoldPlayers) {
            // Current slab is completely sold, move to next slab
            const nextSlabIndex = currentSlabIndex + 1;
            if (nextSlabIndex < auctionSequence.length) {
                // Show upcoming slab information
                const nextSlabName = auctionSequence[nextSlabIndex];
                setUpcomingSlab(nextSlabName);
                
                // Wait for 2 seconds to show the message
                setTimeout(() => {
                    setCurrentSlabIndex(nextSlabIndex);
                    setUpcomingSlab(null);
                    
                    // Update slab details for the new slab
                    const nextSlabConfig = slabsState.find(slab => slab.name === nextSlabName);
                    if (nextSlabConfig) {
                        setSlabDetails({
                            name: nextSlabConfig.name,
                            basePrice: nextSlabConfig.basePrice,
                            maxBid: nextSlabConfig.maxBid || nextSlabConfig.basePrice * 2
                        });
                        setHighestBid(nextSlabConfig.basePrice);
                        
                        // Get the first unsold player from the new slab
                        const nextSlabPlayers = playerDataState[nextSlabName] || [];
                        const firstUnsoldPlayer = nextSlabPlayers.find(player => player !== 0);
                        
                        if (firstUnsoldPlayer) {
                            setCurrentPlayer(firstUnsoldPlayer);
                        } else {
                            // If no unsold players in next slab, move to next slab
                            const nextNextSlabIndex = nextSlabIndex + 1;
                            if (nextNextSlabIndex < auctionSequence.length) {
                                setCurrentSlabIndex(nextNextSlabIndex);
                                const nextNextSlabName = auctionSequence[nextNextSlabIndex];
                                const nextNextSlabPlayers = playerDataState[nextNextSlabName] || [];
                                const nextFirstUnsoldPlayer = nextNextSlabPlayers.find(player => player !== 0);
                                if (nextFirstUnsoldPlayer) {
                                    setCurrentPlayer(nextFirstUnsoldPlayer);
                                } else {
                                    // If no more slabs with unsold players, check for unbidded players
                                    if (unbiddedPlayersQueue.length > 0) {
                                        console.log('Starting unbidded players queue:', unbiddedPlayersQueue.length, 'players remaining');
                                        setIsSequenceComplete(true);
                                        const firstUnbiddedPlayer = unbiddedPlayersQueue[0];
                                        setCurrentPlayer(firstUnbiddedPlayer);
                                        setUnbiddedPlayersQueue(prev => prev.slice(1));
                                    } else {
                                        console.log('Auction Complete - No more players');
                                        endAuction(
                                            prepareAuctionData,
                                            owners,
                                            slabsState,
                                            saveAuctionData,
                                            navigate
                                        );
                                    }
                                }
                            } else {
                                // End of sequence, check for unbidded players
                                if (unbiddedPlayersQueue.length > 0) {
                                    console.log('Starting unbidded players queue:', unbiddedPlayersQueue.length, 'players remaining');
                                    setIsSequenceComplete(true);
                                    const firstUnbiddedPlayer = unbiddedPlayersQueue[0];
                                    setCurrentPlayer(firstUnbiddedPlayer);
                                    setUnbiddedPlayersQueue(prev => prev.slice(1));
                                } else {
                                    console.log('Auction Complete - No more players');
                                    endAuction(
                                        prepareAuctionData,
                                        owners,
                                        slabsState,
                                        saveAuctionData,
                                        navigate
                                    );
                                }
                            }
                        }
                    }
                }, 2000);
            } else {
                // End of sequence, check for unbidded players
                if (unbiddedPlayersQueue.length > 0) {
                    console.log('Starting unbidded players queue:', unbiddedPlayersQueue.length, 'players remaining');
                    setIsSequenceComplete(true);
                    const firstUnbiddedPlayer = unbiddedPlayersQueue[0];
                    setCurrentPlayer(firstUnbiddedPlayer);
                    setUnbiddedPlayersQueue(prev => prev.slice(1));
                } else {
                    console.log('Auction Complete - No more players');
                    endAuction(
                        prepareAuctionData,
                        owners,
                        slabsState,
                        saveAuctionData,
                        navigate
                    );
                }
            }
        } else {
            // Find next unsold player in current slab
            const currentPlayerIndex = currentSlabPlayers.findIndex(player => 
                player !== 0 && player.PID === currentPlayer.PID
            );
            
            // Find the next unsold player after the current one
            let nextUnsoldPlayer = null;
            for (let i = currentPlayerIndex + 1; i < currentSlabPlayers.length; i++) {
                if (currentSlabPlayers[i] !== 0) {
                    nextUnsoldPlayer = currentSlabPlayers[i];
                    break;
                }
            }
            
            if (nextUnsoldPlayer) {
                setCurrentPlayer(nextUnsoldPlayer);
            } else {
                // If no more players in current slab, move to next slab
                const nextSlabIndex = currentSlabIndex + 1;
                if (nextSlabIndex < auctionSequence.length) {
                    setCurrentSlabIndex(nextSlabIndex);
                    const nextSlabName = auctionSequence[nextSlabIndex];
                    const nextSlabPlayers = playerDataState[nextSlabName] || [];
                    const firstUnsoldPlayer = nextSlabPlayers.find(player => player !== 0);
                    if (firstUnsoldPlayer) {
                        setCurrentPlayer(firstUnsoldPlayer);
                    } else {
                        // If no unsold players in next slab, check for unbidded players
                        if (unbiddedPlayersQueue.length > 0) {
                            console.log('Starting unbidded players queue:', unbiddedPlayersQueue.length, 'players remaining');
                            setIsSequenceComplete(true);
                            const firstUnbiddedPlayer = unbiddedPlayersQueue[0];
                            setCurrentPlayer(firstUnbiddedPlayer);
                            setUnbiddedPlayersQueue(prev => prev.slice(1));
                        } else {
                            console.log('Auction Complete - No more players');
                            endAuction(
                                prepareAuctionData,
                                owners,
                                slabsState,
                                saveAuctionData,
                                navigate
                            );
                        }
                    }
                } else {
                    // End of sequence, check for unbidded players
                    if (unbiddedPlayersQueue.length > 0) {
                        console.log('Starting unbidded players queue:', unbiddedPlayersQueue.length, 'players remaining');
                        setIsSequenceComplete(true);
                        const firstUnbiddedPlayer = unbiddedPlayersQueue[0];
                        setCurrentPlayer(firstUnbiddedPlayer);
                        setUnbiddedPlayersQueue(prev => prev.slice(1));
                    } else {
                        console.log('Auction Complete - No more players');
                        endAuction(
                            prepareAuctionData,
                            owners,
                            slabsState,
                            saveAuctionData,
                            navigate
                        );
                    }
                }
            }
        }
    };

    // Update player data when a player is purchased
    const updatePlayerData = (slabName, player) => {
        setPlayerDataState(prevData => {
            const updatedData = { ...prevData };
            if (updatedData[slabName]) {
                updatedData[slabName] = updatedData[slabName].map(p => 
                    p.PID === player.PID ? 0 : p
                );
            }
            return updatedData;
        });
    };

    // Modify handlePlayerAssignment to use initial player counts and clearer logging
    const handlePlayerAssignment = async () => {
        // Debug Step 1: Log initial state
        console.log('DEBUG: Starting handlePlayerAssignment', {
            currentPlayer: currentPlayer.PName,
            currentSlab: currentSlabName,
            isSequenceComplete,
            highestBidder: highestBidder?.id,
            highestBid
        });

        if (highestBidder) {
            // Debug Step 2: Log owner's current state before fair share calculation
            console.log('DEBUG: Owner State Before Fair Share Check', {
                ownerId: highestBidder.id,
                slabPlayers: highestBidder.slabPlayers,
                unitsLeft: highestBidder.unitsLeft,
                currentSlab: currentSlabName
            });

            // For unbidded players, we need to check the actual current state
            const isUnbiddedPlayer = isSequenceComplete;
            
            // Debug Step 3: Log unbidded player status
            console.log('DEBUG: Unbidded Player Status', {
                isUnbiddedPlayer,
                currentSlab: currentSlabName,
                remainingPlayersInSlab: playerDataState[currentSlabName]?.filter(p => p !== 0).length,
                allSlabsState: Object.entries(playerDataState).map(([slab, players]) => ({
                    slab,
                    remainingPlayers: players.filter(p => p !== 0).length
                }))
            });
            
            // Get current players in slab for this owner
            const currentOwnerSlabPlayers = highestBidder.slabPlayers[currentSlabName] || [];
            const currentPlayerCount = Array.isArray(currentOwnerSlabPlayers) ? currentOwnerSlabPlayers.length : 0;
            
            // Calculate total players owned across all slabs
            const totalPlayersOwned = Object.values(highestBidder.slabPlayers).reduce((total, players) => {
                return total + (Array.isArray(players) ? players.length : 0);
            }, 0);

            // Debug Step 4: Log player counts
            console.log('DEBUG: Player Counts', {
                ownerId: highestBidder.id,
                currentPlayerCount,
                totalPlayersOwned,
                currentOwnerSlabPlayers,
                allSlabPlayers: highestBidder.slabPlayers
            });

            // For unbidded players, we need to check the actual current state of the slab
            let playersPerOwner;
            if (isUnbiddedPlayer) {
                // For unbidded players, calculate fair share based on remaining players in the slab
                const remainingPlayersInSlab = playerDataState[currentSlabName]?.filter(p => p !== 0).length || 0;
                playersPerOwner = Math.ceil(remainingPlayersInSlab / owners.length);
                
                // Debug Step 5: Log unbidded player fair share calculation
                console.log('DEBUG: Unbidded Player Fair Share Calculation', {
                    remainingPlayersInSlab,
                    ownersCount: owners.length,
                    calculatedFairShare: playersPerOwner,
                    currentPlayerCount,
                    slabName: currentSlabName
                });
            } else {
                // For normal sequence, use initial player count
                const initialPlayerCount = initialPlayerCounts[currentSlabName] || 0;
                playersPerOwner = Math.ceil(initialPlayerCount / owners.length);
                
                // Debug Step 6: Log normal sequence fair share calculation
                console.log('DEBUG: Normal Sequence Fair Share Calculation', {
                    initialPlayerCount,
                    ownersCount: owners.length,
                    calculatedFairShare: playersPerOwner,
                    currentPlayerCount,
                    slabName: currentSlabName
                });
            }
            
            // Calculate total players per owner using initial counts
            const totalPlayersPerOwner = Math.ceil(
                auctionSequence.reduce((total, slabName) => {
                    return total + (initialPlayerCounts[slabName] || 0);
                }, 0) / owners.length
            );

            // Debug Step 7: Log final fair share state
            console.log('DEBUG: Final Fair Share State', {
                ownerId: highestBidder.id,
                isUnbiddedPlayer,
                currentSlab: currentSlabName,
                playersPerOwner,
                currentPlayerCount,
                totalPlayersPerOwner,
                totalPlayersOwned,
                canAssign: currentPlayerCount < playersPerOwner
            });

            // Check slab-specific fair share
            if (currentPlayerCount >= playersPerOwner) {
                // Debug Step 8: Log fair share limit reached
                console.log('DEBUG: Fair Share Limit Reached', {
                    ownerId: highestBidder.id,
                    currentPlayers: currentPlayerCount,
                    fairShare: playersPerOwner,
                    slabName: currentSlabName,
                    isUnbiddedPlayer,
                    remainingPlayersInSlab: isUnbiddedPlayer ? playerDataState[currentSlabName]?.filter(p => p !== 0).length : null
                });
                alert(`Owner ${highestBidder.id} has already reached their fair share of ${playersPerOwner} players from ${currentSlabName} slab`);
                return;
            }

            // Debug Step 9: Log proceeding with assignment
            console.log('DEBUG: Proceeding with Player Assignment', {
                ownerId: highestBidder.id,
                currentPlayer: currentPlayer.PName,
                currentSlab: currentSlabName,
                bidAmount: highestBid
            });

            // Update owner state first
            const updatedOwners = owners.map(owner => {
                if (owner.id === highestBidder.id) {
                    // Create new arrays to avoid reference issues
                    const updatedSlabPlayers = { ...owner.slabPlayers };
                    if (!updatedSlabPlayers[currentSlabName]) {
                        updatedSlabPlayers[currentSlabName] = [];
                    }
                    
                    // Add player to slab players if not already present
                    const playerName = currentPlayer.PName;
                    if (!updatedSlabPlayers[currentSlabName].includes(playerName)) {
                        updatedSlabPlayers[currentSlabName] = [...updatedSlabPlayers[currentSlabName], playerName];
                    }
                    
                    // Create new purchased players array
                    const updatedPurchasedPlayers = Array.isArray(owner.purchasedPlayers) 
                        ? [...owner.purchasedPlayers] 
                        : [];
                    
                    // Add player to purchased players if not already present
                    if (!updatedPurchasedPlayers.includes(playerName)) {
                        updatedPurchasedPlayers.push(playerName);
                    }

                    const updatedOwner = {
                        ...owner,
                        unitsLeft: owner.unitsLeft - highestBid,
                        purchasedPlayers: updatedPurchasedPlayers,
                        slabPlayers: updatedSlabPlayers,
                        currentBid: highestBid
                    };

                    console.log(`Owner ${updatedOwner.id} State After Assignment:`, {
                        slabPlayers: updatedSlabPlayers[currentSlabName],
                        purchasedPlayers: updatedPurchasedPlayers,
                        unitsLeft: updatedOwner.unitsLeft,
                        currentPlayerCount: updatedSlabPlayers[currentSlabName].length,
                        fairSharePerSlab: playersPerOwner
                    });

                    // Save the updated owner state to localStorage
                    const ownerState = {
                        id: updatedOwner.id,
                        unitsLeft: updatedOwner.unitsLeft,
                        purchasedPlayers: updatedPurchasedPlayers,
                        slabPlayers: updatedSlabPlayers
                    };
                    localStorage.setItem(`owner_${updatedOwner.id}_state`, JSON.stringify(ownerState));

                    return updatedOwner;
                }
                return owner;
            });

            setOwners(updatedOwners);

            // Update player data state to mark player as sold
            setPlayerDataState(prevData => {
                const updatedData = { ...prevData };
                if (updatedData[currentSlabName]) {
                    console.log('Updating player data state:', {
                        slabName: currentSlabName,
                        beforeUpdate: updatedData[currentSlabName].find(p => p.PID === currentPlayer.PID),
                        playerId: currentPlayer.PID,
                        currentSlabPlayers: updatedData[currentSlabName],
                        actualPlayerCount: updatedData[currentSlabName].filter(p => p !== 0).length
                    });
                    
                    // Create a new array to avoid reference issues
                    const updatedSlabPlayers = [...updatedData[currentSlabName]];
                    const playerIndex = updatedSlabPlayers.findIndex(p => p.PID === currentPlayer.PID);
                    
                    if (playerIndex !== -1) {
                        // Mark player as sold (0)
                        updatedSlabPlayers[playerIndex] = 0;
                        updatedData[currentSlabName] = updatedSlabPlayers;
                    }
                    
                    console.log('After update:', {
                        slabName: currentSlabName,
                        afterUpdate: updatedData[currentSlabName].find(p => p.PID === currentPlayer.PID),
                        playerId: currentPlayer.PID,
                        updatedSlabPlayers,
                        actualPlayerCount: updatedSlabPlayers.filter(p => p !== 0).length
                    });
                }
                return updatedData;
            });

            // Save auction state before moving to next player
            await saveAuctionState(
                playerDataState,
                currentSlabIndex,
                updatedOwners,
                slabDetails.basePrice,
                null,
                Object.values(playerDataState).flat().filter(p => p !== 0).length,
                unbiddedPlayersQueue,
                180
            );

            // Reset auction state for next player
            setHighestBid(slabDetails.basePrice);
            setHighestBidder(null);
            setTimer(180);

            // Move to next player
            moveToNextPlayer();
        } else {
            // Timer expired with no bid
            console.log('Player skipped - adding to queue:', {
                playerName: currentPlayer.PName,
                playerId: currentPlayer.PID,
                currentSlab: currentSlabName,
                playerDataState: playerDataState[currentSlabName]?.find(p => p.PID === currentPlayer.PID)
            });
            
            // Add player to unbidded queue if not already present
            setUnbiddedPlayersQueue(prev => {
                const isAlreadyInQueue = prev.some(p => p.PID === currentPlayer.PID);
                if (!isAlreadyInQueue) {
                    return [...prev, currentPlayer];
                }
                return prev;
            });
            
            // Reset auction state
            setHighestBid(slabDetails.basePrice);
            setHighestBidder(null);
            setTimer(180);
            
            // Move to next player
            moveToNextPlayer();
        }
    };

    // Add useEffect to save auction state whenever relevant state changes
    React.useEffect(() => {
        saveAuctionState(
            playerDataState,
            currentSlabIndex,
            owners,
            highestBid,
            highestBidder,
            Object.values(playerDataState).flat().length,
            unbiddedPlayersQueue,
            timer
        );
    }, [
        playerDataState,
        currentSlabIndex,
        owners,
        highestBid,
        highestBidder,
        unbiddedPlayersQueue,
        timer
    ]);

    // Timer effect
    useEffect(() => {
        if (isStarted && !isStopped) {
            if (timer === 0) {
                handlePlayerAssignment();
            } else {
                const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
                return () => clearInterval(countdown);
            }
        }
    }, [timer, isStarted, isStopped]);

    // Modify handleBidClick to have clearer logging
    const handleBidClick = (ownerId, bidValue) => {
        if (isStopped) return;

        const owner = owners.find((o) => o.id === ownerId);
        if (!owner || !slabDetails) return;

        // Get current state of owner's players
        const slabPlayers = owner.slabPlayers[slabDetails.name] || [];
        
        // Use initial player count for fair share calculation
        const initialPlayerCount = initialPlayerCounts[slabDetails.name] || 0;
        const playersPerOwner = Math.ceil(initialPlayerCount / owners.length);
        
        // Get the actual count of players in the slab for this owner
        const currentPlayerCount = Array.isArray(slabPlayers) ? slabPlayers.length : 0;
        
        // Calculate total players owned across all slabs
        const totalPlayersOwned = Object.values(owner.slabPlayers).reduce((total, players) => {
            return total + (Array.isArray(players) ? players.length : 0);
        }, 0);
        
        // Calculate total players per owner using initial counts
        const totalPlayersPerOwner = Math.ceil(
            auctionSequence.reduce((total, slabName) => {
                return total + (initialPlayerCounts[slabName] || 0);
            }, 0) / owners.length
        );

        // Log owner's current state
        console.log(`Owner ${ownerId} State:`, {
            currentPlayersInSlab: currentPlayerCount,
            playersInSlab: slabPlayers,
            totalPlayersOwned,
            unitsLeft: owner.unitsLeft
        });
        
        console.log(`Fair Share Check for Owner ${ownerId}:`, {
            slabName: slabDetails.name,
            initialPlayersInSlab: initialPlayerCount,
            fairShareForSlab: playersPerOwner,
            totalFairShare: totalPlayersPerOwner,
            canBid: currentPlayerCount < playersPerOwner && totalPlayersOwned < totalPlayersPerOwner
        });

        // Check slab-specific fair share
        if (currentPlayerCount >= playersPerOwner) {
            console.log(`Owner ${ownerId} has reached slab fair share limit:`, {
                currentPlayers: currentPlayerCount,
                fairShare: playersPerOwner,
                slabName: slabDetails.name
            });
            alert(`Owner ${owner.id} has already reached their fair share of ${playersPerOwner} players from ${slabDetails.name} slab`);
            return;
        }

        // Check total fair share across all slabs
        if (totalPlayersOwned >= totalPlayersPerOwner) {
            console.log(`Owner ${ownerId} has reached total fair share limit:`, {
                totalOwned: totalPlayersOwned,
                totalFairShare: totalPlayersPerOwner,
                slabsOwned: Object.entries(owner.slabPlayers).map(([slab, players]) => ({
                    slab,
                    count: Array.isArray(players) ? players.length : 0
                }))
            });
            alert(`Owner ${owner.id} has already reached their total fair share of ${totalPlayersPerOwner} players across all slabs`);
            return;
        }

        const cur_maxBid = slabDetails.maxBid;

        if (owner.unitsLeft >= bidValue && bidValue >= highestBid) {
            if (bidValue === cur_maxBid) {
                setOwnersWithMaxBid(prev => {
                    const ownerAlreadyMaxBid = prev.some(o => o.id === owner.id);
                    if (!ownerAlreadyMaxBid) {
                        const updatedOwners = [...prev, owner];
                        const randomOwner = updatedOwners[Math.floor(Math.random() * updatedOwners.length)];
                        setHighestBid(bidValue);
                        setHighestBidder(randomOwner);
                        return updatedOwners;
                    }
                    return prev;
                });
            } else if (bidValue > highestBid) {
                setHighestBid(bidValue);
                setHighestBidder(owner);
                setOwnersWithMaxBid([]);
            } else if (bidValue === highestBid) {
                setOwnersWithMaxBid(prev => {
                    const ownerAlreadyMaxBid = prev.some(o => o.id === owner.id);
                    if (!ownerAlreadyMaxBid) {
                        const updatedOwners = [...prev, owner];
                        const randomOwner = updatedOwners[Math.floor(Math.random() * updatedOwners.length)];
                        setHighestBidder(randomOwner);
                        return updatedOwners;
                    }
                    return prev;
                });
            }

            setTimer(180);
            updateOwnerBid(ownerId, bidValue, owners, setOwners);
        }
    };

    return (
        <>
            <div className="auction-container">
                {upcomingSlab && (
                    <div className="upcoming-slab-notification">
                        <h2>Upcoming Slab: {upcomingSlab}</h2>
                    </div>
                )}
                <div className="main-content">
                    {renderPlayerCard(
                        currentPlayer,
                        (index) => getPlayerImage(currentPlayer, img10, PLAYER_IMAGES, index),
                        currentSlabIndex,
                        slabDetails,
                        numberOfPlayersLeft,
                        JSON.parse(localStorage.getItem("PreAuctionData") || "{}")
                    )}
                    <div style={{ flexGrow: 1, marginLeft: "20px" }}>
                        {renderBidInfo(
                            highestBid,
                            highestBidder,
                            Object.values(playerDataState).flat().length,
                            owners.length,
                            slabsState.length,
                            timer,
                            isStarted
                        )}
                        {renderOwnerCards(
                            owners,
                            highestBidder,
                            isStopped,
                            (owner) => {
                                return renderBidOptions(
                                    owner,
                                    isStarted,
                                    (ownerId) => ifFullyFilled(ownerId, owners, Object.values(playerDataState).flat().length, slabDetails),
                                    currentPlayer,
                                    slabDetails,
                                    highestBid,
                                    handleBidClick,
                                    owners.length
                                );
                            }
                        )}
                    </div>
                </div>
                <UpcomingPlayersPanel 
                    playerDataState={playerDataState}
                    currentPlayer={currentPlayer}
                    auctionSequence={auctionSequence}
                    currentSlabIndex={currentSlabIndex}
                />
            </div>
            {renderControlButtons(
                () => handleStart(setIsStarted, setIsStopped, () => saveAuctionState(
                    playerDataState,
                    currentSlabIndex,
                    owners,
                    highestBid,
                    highestBidder,
                    Object.values(playerDataState).flat().length,
                    unbiddedPlayersQueue,
                    timer
                )),
                () => handleStop(setIsStarted, setIsStopped),
                () => handleDiscard(navigate),
                () => resetAuction(
                    setHighestBid,
                    setHighestBidder,
                    slabDetails,
                    setTimer,
                    180
                ),
                () => handlePlayerAssignment()
            )}
        </>
    );
};

export default Auction;
  