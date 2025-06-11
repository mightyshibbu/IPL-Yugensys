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
  clearAlerts
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
    const [shownAlerts, setShownAlerts] = useState(new Set());
    const [processedUnbiddedPlayers] = useState(new Set());

    const navigate = useNavigate();

    // Load latest configuration from localStorage
    useEffect(() => {
        const loadLatestConfig = () => {
            // Clear any existing auction state first
            localStorage.removeItem("auctionData");
            
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
            
            if (slabConfig) {
                // Get actual number of players in this slab from playerDataState
                const actualPlayerCount = playerDataState[slabConfig.name]?.filter(p => p !== 0).length || 0;
                
                const newSlabDetails = {
                    name: slabConfig.name,
                    basePrice: slabConfig.basePrice,
                    maxBid: slabConfig.maxBid || slabConfig.basePrice * 2,
                    numPlayers: actualPlayerCount // Use actual player count
                };
                
                setSlabDetails(newSlabDetails);
                setHighestBid(slabConfig.basePrice);
            } else {
                setSlabDetails(DEFAULT_SLAB);
            }
        } else {
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

            setInitialPlayerCounts(counts);
            // Save to localStorage for other components to use
            localStorage.setItem("initialPlayerCounts", JSON.stringify(counts));
        }
    }, [playerDataState]);

    // Add this helper function at the top level of the Auction component
    const transitionToUnbiddedPlayer = (nextUnbiddedPlayer, updateStates) => {
        console.log('DEBUG: Transitioning to unbidded player:', nextUnbiddedPlayer.PName);
        
        // Find the original slab index for this player
        const originalSlabIndex = auctionSequence.findIndex(slab => slab === nextUnbiddedPlayer.PSlab);
        
        // Get slab config for the unbidded player
        const slabConfig = slabsState.find(slab => slab.name === nextUnbiddedPlayer.PSlab);
        
        // Create a single batch of state updates
        const stateUpdates = {
            currentPlayer: nextUnbiddedPlayer,
            currentSlabIndex: originalSlabIndex !== -1 ? originalSlabIndex : currentSlabIndex,
            slabDetails: slabConfig ? {
                name: slabConfig.name,
                basePrice: slabConfig.basePrice,
                maxBid: slabConfig.maxBid || slabConfig.basePrice * 2,
                numPlayers: slabConfig.numPlayers
            } : slabDetails,
            highestBid: slabConfig ? slabConfig.basePrice : highestBid,
            highestBidder: null,
            timer: 180,
            isSequenceComplete: true
        };
        
        // Execute all state updates in a single batch
        updateStates(stateUpdates);
        
        // Log the current unbidded queue state
        setUnbiddedPlayersQueue(prevQueue => {
            console.log('DEBUG: Current unbidded queue:', prevQueue.map(p => p.PName));
            return prevQueue;
        });
    };

    // Modify moveToNextPlayer to properly handle unbidded phase
    const moveToNextPlayer = () => {
        // Clear alerts when moving to next player
        clearAlerts();
        
        // Reset ownersWithMaxBid when moving to next player
        setOwnersWithMaxBid([]);
        
        // Create a function to handle state updates in a batch
        const updateStates = (updates) => {
            if (updates.currentPlayer) setCurrentPlayer(updates.currentPlayer);
            if (updates.currentSlabIndex !== undefined) setCurrentSlabIndex(updates.currentSlabIndex);
            if (updates.slabDetails) setSlabDetails(updates.slabDetails);
            if (updates.highestBid !== undefined) setHighestBid(updates.highestBid);
            if (updates.highestBidder !== undefined) setHighestBidder(updates.highestBidder);
            if (updates.timer !== undefined) setTimer(updates.timer);
            if (updates.isSequenceComplete !== undefined) setIsSequenceComplete(updates.isSequenceComplete);
        };

        // If we're in the unbidded players queue phase
        if (isSequenceComplete) {
            console.log('DEBUG: In unbidded players phase');
            setUnbiddedPlayersQueue(prevQueue => {
                console.log('DEBUG: Current unbidded queue length:', prevQueue.length);
                if (prevQueue.length > 0) {
                    // Get the next player from the queue
                    const [nextPlayer, ...remainingQueue] = prevQueue;
                    console.log('DEBUG: Moving to next unbidded player:', nextPlayer.PName);
                    console.log('DEBUG: Remaining unbidded players:', remainingQueue.length);
                    
                    // Update the queue first
                    setTimeout(() => {
                        transitionToUnbiddedPlayer(nextPlayer, updateStates);
                    }, 0);
                    
                    return remainingQueue;
                } else {
                    console.log('DEBUG: No more unbidded players, ending auction');
                    endAuction();
                    return [];
                }
            });
            return;
        }

        // For normal sequence, find next unsold player
        const currentSlabPlayers = playerDataState[auctionSequence[currentSlabIndex]] || [];
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
            console.log('DEBUG: Moving to next player in current slab:', nextUnsoldPlayer.PName);
            updateStates({
                currentPlayer: nextUnsoldPlayer,
                highestBidder: null,
                timer: 180
            });
            return;
        }

        // If no more players in current slab, move to next slab
        const nextSlabIndex = currentSlabIndex + 1;
        if (nextSlabIndex < auctionSequence.length) {
            console.log('DEBUG: Moving to next slab:', auctionSequence[nextSlabIndex]);
            const nextSlabName = auctionSequence[nextSlabIndex];
            const nextSlabPlayers = playerDataState[nextSlabName] || [];
            const firstUnsoldPlayer = nextSlabPlayers.find(player => player !== 0);
            
            if (firstUnsoldPlayer) {
                console.log('DEBUG: Setting first unsold player in next slab:', firstUnsoldPlayer.PName);
                const nextSlabConfig = slabsState.find(slab => slab.name === nextSlabName);
                updateStates({
                    currentPlayer: firstUnsoldPlayer,
                    currentSlabIndex: nextSlabIndex,
                    slabDetails: nextSlabConfig ? {
                        name: nextSlabConfig.name,
                        basePrice: nextSlabConfig.basePrice,
                        maxBid: nextSlabConfig.maxBid || nextSlabConfig.basePrice * 2,
                        numPlayers: nextSlabConfig.numPlayers
                    } : slabDetails,
                    highestBid: nextSlabConfig ? nextSlabConfig.basePrice : highestBid,
                    highestBidder: null,
                    timer: 180
                });
            } else if (unbiddedPlayersQueue.length > 0) {
                // If no players in next slab, check for unbidded players
                console.log('DEBUG: Moving to unbidded players phase');
                const firstUnbiddedPlayer = unbiddedPlayersQueue[0];
                transitionToUnbiddedPlayer(firstUnbiddedPlayer, updateStates);
            } else {
                console.log('DEBUG: No more players to process, ending auction');
                endAuction();
            }
        } else if (unbiddedPlayersQueue.length > 0) {
            // If we're at the last slab and there are unbidded players, move to them
            console.log('DEBUG: Last slab complete, moving to unbidded players');
            const firstUnbiddedPlayer = unbiddedPlayersQueue[0];
            transitionToUnbiddedPlayer(firstUnbiddedPlayer, updateStates);
        } else {
            console.log('DEBUG: No more players to process, ending auction');
            endAuction();
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

    const handlePlayerAssignment = () => {
        // Only move to next player if timer has expired or there's a valid bid
        if (!isStarted || isStopped) {
            console.log('DEBUG: Cannot handle player assignment - auction not started or is stopped');
            return;
        }

        if (!highestBidder && timer > 0) {
            // If there's no highest bidder but timer is still running, don't move to next player
            console.log('DEBUG: Timer still running with no bids, waiting...');
            return;
        }

        if (!highestBidder && timer === 0) {
            // Timer expired with no bids, add player to unbidded queue if not already there
            console.log('DEBUG: Timer expired with no bids, checking unbidded queue for:', currentPlayer.PName);
            
            setUnbiddedPlayersQueue(prevQueue => {
                // Check if player is already in queue
                const playerExists = prevQueue.some(p => p.PID === currentPlayer.PID);
                if (!playerExists) {
                    console.log('DEBUG: Adding player to unbidded queue:', currentPlayer.PName);
                    return [...prevQueue, currentPlayer];
                } else {
                    console.log('DEBUG: Player already in unbidded queue:', currentPlayer.PName);
                    return prevQueue;
                }
            });

            // Move to next player
            moveToNextPlayer();
            return;
        }

        // Process the purchase only if there's a highest bidder
        console.log('DEBUG: Processing purchase for player:', currentPlayer.PName);
        
        // Update owner state
        const updatedSlabPlayers = [...(highestBidder.slabPlayers[slabDetails.name] || []), currentPlayer.PName];
        const updatedPurchasedPlayers = [...highestBidder.purchasedPlayers, currentPlayer.PName];
        
        // Update owner state
        setOwners(prevOwners => {
            const newOwners = prevOwners.map(owner => {
                if (owner.id === highestBidder.id) {
                    return {
                        ...owner,
                        unitsLeft: owner.unitsLeft - highestBid,
                        slabPlayers: {
                            ...owner.slabPlayers,
                            [slabDetails.name]: updatedSlabPlayers
                        },
                        purchasedPlayers: updatedPurchasedPlayers
                    };
                }
                return owner;
            });
            return newOwners;
        });

        // Only update player data state when a player is actually purchased
        setPlayerDataState(prevData => {
            const updatedData = { ...prevData };
            if (updatedData[currentPlayer.PSlab]) {
                updatedData[currentPlayer.PSlab] = updatedData[currentPlayer.PSlab].map(p => 
                    p && p.PID === currentPlayer.PID ? 0 : p
                );
            }
            return updatedData;
        });

        // Remove from unbidded queue if present
        setUnbiddedPlayersQueue(prevQueue => {
            const newQueue = prevQueue.filter(p => p.PID !== currentPlayer.PID);
            console.log('DEBUG: Removed purchased player from unbidded queue. Remaining:', newQueue.length);
            return newQueue;
        });

        // Reset auction state
        setHighestBid(slabDetails.basePrice);
        setHighestBidder(null);
        setTimer(180);
        
        // Move to next player
        moveToNextPlayer();
    };

    // Add useEffect to handle transition to unbidded phase
    useEffect(() => {
        // Check if we've completed all slabs and have unbidded players
        const allSlabsComplete = auctionSequence.every((slabName, index) => {
            const slabPlayers = playerDataState[slabName] || [];
            return slabPlayers.every(player => player === 0);
        });

        if (allSlabsComplete && unbiddedPlayersQueue.length > 0 && !isSequenceComplete) {
            console.log('DEBUG: All slabs complete, transitioning to unbidded phase');
            setIsSequenceComplete(true);
            const firstUnbiddedPlayer = unbiddedPlayersQueue[0];
            transitionToUnbiddedPlayer(firstUnbiddedPlayer, (updates) => {
                if (updates.currentPlayer) setCurrentPlayer(updates.currentPlayer);
                if (updates.currentSlabIndex !== undefined) setCurrentSlabIndex(updates.currentSlabIndex);
                if (updates.slabDetails) setSlabDetails(updates.slabDetails);
                if (updates.highestBid !== undefined) setHighestBid(updates.highestBid);
                if (updates.highestBidder !== undefined) setHighestBidder(updates.highestBidder);
                if (updates.timer !== undefined) setTimer(updates.timer);
                if (updates.isSequenceComplete !== undefined) setIsSequenceComplete(updates.isSequenceComplete);
            });
        }
    }, [playerDataState, unbiddedPlayersQueue, isSequenceComplete, auctionSequence]);

    // Modify handleSkipTimer to properly handle timer expiration
    const handleSkipTimer = () => {
        if (!isStarted || isStopped) {
            console.log('DEBUG: Cannot skip timer - auction not started or is stopped');
            return;
        }

        console.log('DEBUG: Skipping timer, current state:', {
            currentPlayer: currentPlayer.PName,
            highestBidder: highestBidder ? highestBidder.id : null,
            highestBid,
            timer
        });

        // Force timer to 0 to trigger expiration
        setTimer(0);
    };

    // Timer effect
    useEffect(() => {
        if (isStarted && !isStopped) {
            if (timer === 0) {
                console.log('DEBUG: Timer expired, current state:', {
                    currentPlayer: currentPlayer.PName,
                    highestBidder: highestBidder ? highestBidder.id : null,
                    highestBid
                });
                
                // Only handle player assignment when timer expires
                handlePlayerAssignment();
                return;
            }

            const interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [isStarted, isStopped, timer, currentPlayer, highestBidder, highestBid]);

    // Modify handleBidClick to remove redundant state save
    const handleBidClick = (ownerId, bidValue) => {
        if (isStopped) {
            console.log('DEBUG: Auction is stopped, bid rejected');
            return;
        }

        const owner = owners.find((o) => o.id === ownerId);
        if (!owner || !slabDetails) {
            console.log('DEBUG: Invalid owner or slab details');
            console.log('DEBUG: Owner found:', !!owner);
            console.log('DEBUG: Slab details found:', !!slabDetails);
            return;
        }

        console.log('DEBUG: Processing bid for Owner', ownerId);
        console.log('DEBUG: Bid value:', bidValue);
        console.log('DEBUG: Current highest bid:', highestBid);
        console.log('DEBUG: Current highest bidder:', highestBidder?.id);

        // Check fair share with isBidCheck=true
        const isNotEligible = ifFullyFilled(
            ownerId, 
            owners, 
            Object.values(playerDataState).flat().length, 
            slabDetails,
            isSequenceComplete,
            playerDataState,
            true  // Set isBidCheck to true for bid validation
        );

        if (isNotEligible) {
            console.log('DEBUG: Owner not eligible to bid due to fair share limits');
            return;
        }

        const cur_maxBid = slabDetails.maxBid;
        console.log('DEBUG: Max bid allowed:', cur_maxBid);
        console.log('DEBUG: Owner units left:', owner.unitsLeft);

        if (owner.unitsLeft >= bidValue && bidValue > highestBid) {
            setHighestBid(bidValue);
            setHighestBidder(owner);
            
            // Update owner's current bid
            updateOwnerBid(ownerId, bidValue, owners, setOwners);
            
            // Reset timer
            setTimer(180);
            
            console.log('DEBUG: Bid processed successfully');
            console.log('DEBUG: New highest bid:', bidValue);
            console.log('DEBUG: New highest bidder:', owner.id);
        } else {
            console.log('DEBUG: Bid rejected');
            console.log('DEBUG: Owner units left:', owner.unitsLeft);
            console.log('DEBUG: Bid value:', bidValue);
            console.log('DEBUG: Current highest bid:', highestBid);
        }
    };

    // Add useEffect to reset shown alerts when moving to next player
    useEffect(() => {
        setShownAlerts(new Set());
    }, [currentPlayer]);

    // Update renderBidOptions to pass isBidCheck=false
    const renderBidOptionsForOwner = (owner) => {
        return renderBidOptions(
            owner,
            isStarted,
            (ownerId) => ifFullyFilled(
                ownerId, 
                owners, 
                Object.values(playerDataState).flat().length, 
                slabDetails,
                isSequenceComplete,
                playerDataState,
                false  // Set isBidCheck to false for rendering
            ),
            currentPlayer,
            slabDetails,
            highestBid,
            handleBidClick,
            owners.length
        );
    };

    // Add a new function to handle auction completion
    const handleAuctionComplete = async () => {
        // Only save final auction state if there were any purchases
        const hasPurchases = owners.some(owner => owner.purchasedPlayers.length > 0);
        
        if (hasPurchases) {
            console.log('DEBUG: Preparing final auction data for saving');
            
            // Prepare the auction data for database save
            const auctionData = {
                owners: owners.map(owner => ({
                    id: owner.id,
                    unitsLeft: owner.unitsLeft,
                    purchasedPlayers: owner.purchasedPlayers,
                    slabPlayers: owner.slabPlayers
                }))
            };

            try {
                // Save to database
                console.log('DEBUG: Saving auction data to database:', JSON.stringify(auctionData, null, 2));
                await saveAuctionData(auctionData);
                
                // Save to localStorage for immediate access
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
                
                console.log('DEBUG: Auction data saved successfully');
            } catch (error) {
                console.error('DEBUG: Error saving auction data:', error);
                alert('Error saving auction data. Please try again.');
                return;
            }
        } else {
            console.log('DEBUG: No purchases made, not saving auction state');
            localStorage.removeItem("auctionData");
        }
        
        // Navigate to previous auctions
        navigate("/previousAuctions", { replace: true });
    };

    // Modify the endAuction call to use handleAuctionComplete
    const endAuction = () => {
        handleAuctionComplete();
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
                            renderBidOptionsForOwner
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
                handleSkipTimer
            )}
        </>
    );
};

export default Auction;
  