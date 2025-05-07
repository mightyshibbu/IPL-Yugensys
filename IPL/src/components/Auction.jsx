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

            // Initialize owners with their units, but only up to totalOwners
            const initialOwners = Object.entries(ownerUnits)
                .filter(([id]) => parseInt(id) <= totalOwners) // Only include owners up to totalOwners
                .map(([id, units]) => ({
                    id: parseInt(id),
                    unitsLeft: units,
                    purchasedPlayers: [],
                    slabPlayers: {},
                }));
            setOwners(initialOwners);

            // Load slabs configuration
            const slabsConfigRaw = localStorage.getItem("slabsConfig");
            const slabs = slabsConfigRaw ? JSON.parse(slabsConfigRaw) : [];
            setSlabsState(slabs);

            // Load auction sequence
            const auctionSequenceRaw = localStorage.getItem("AuctionSequence");
            const sequence = auctionSequenceRaw ? JSON.parse(auctionSequenceRaw) : [];
            setAuctionSequence(sequence);

            // Load player data
            const playerDataRaw = localStorage.getItem("PlayerData");
            const playerData = playerDataRaw ? JSON.parse(playerDataRaw) : {};
            setPlayerDataState(playerData);

            console.log('Loaded configuration:', {
                totalOwners,
                initialOwners,
                ownerUnits,
                slabs,
                sequence,
                playerData
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

    // Update slab details when current player changes
    useEffect(() => {
        console.log('Current Player Changed:', {
            currentPlayer,
            currentSlabName,
            currentSlabIndex
        });

        if (currentPlayer && currentPlayer.PSlab) {
            const slabConfig = slabsState.find(slab => slab.name === currentPlayer.PSlab);
            console.log('Found Slab Config:', slabConfig);
            
            if (slabConfig) {
                const newSlabDetails = {
                    name: slabConfig.name,
                    basePrice: slabConfig.basePrice,
                    maxBid: slabConfig.maxBid || slabConfig.basePrice * 2, // Default max bid if not set
                    numPlayers: slabConfig.numPlayers
                };
                console.log('Setting slab details:', newSlabDetails);
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
    }, [currentSlabIndex, currentPlayer, slabsState]);

    // Move to next unsold player in current slab or next slab
    const moveToNextPlayer = () => {
        console.log('Moving to Next Player:', {
            currentSlabName,
            currentSlabPlayers,
            currentPlayer
        });
        
        // Reset ownersWithMaxBid when moving to next player
        setOwnersWithMaxBid([]);
        
        // Check if current slab has any unsold players
        const hasUnsoldPlayers = currentSlabPlayers.some(player => player !== 0);
        
        if (!hasUnsoldPlayers) {
            console.log('No unsold players in current slab, moving to next slab');
            // Current slab is completely sold, move to next slab
            const nextSlabIndex = currentSlabIndex + 1;
            if (nextSlabIndex < auctionSequence.length) {
                // Show upcoming slab information
                const nextSlabName = auctionSequence[nextSlabIndex];
                console.log('Next Slab:', {
                    nextSlabIndex,
                    nextSlabName,
                    nextSlabPlayers: playerDataState[nextSlabName]
                });
                
                setUpcomingSlab(nextSlabName);
                
                // Wait for 2 seconds to show the message
                setTimeout(() => {
                    console.log('Transitioning to next slab');
                    setCurrentSlabIndex(nextSlabIndex);
                    setUpcomingSlab(null);
                    
                    // Update slab details for the new slab
                    const nextSlabConfig = slabsState.find(slab => slab.name === nextSlabName);
                    console.log('Next Slab Config:', nextSlabConfig);
                    
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
                        console.log('First Unsold Player in Next Slab:', firstUnsoldPlayer);
                        
                        if (firstUnsoldPlayer) {
                            setCurrentPlayer(firstUnsoldPlayer);
                        } else {
                            // If no unsold players in next slab, end auction
                            console.log('No unsold players in next slab, ending auction');
                            console.log('Current state before ending auction:', {
                                owners,
                                slabsState,
                                currentSlabIndex: nextSlabIndex,
                                currentSlabName: nextSlabName
                            });
                            endAuction(
                                prepareAuctionData,
                                owners,
                                slabsState,
                                saveAuctionData,
                                navigate
                            );
                        }
                    } else {
                        console.error('No slab configuration found for:', nextSlabName);
                        // If no slab config found, end auction
                        console.log('No slab config found, ending auction');
                        console.log('Current state before ending auction:', {
                            owners,
                            slabsState,
                            currentSlabIndex: nextSlabIndex,
                            currentSlabName: nextSlabName
                        });
                        endAuction(
                            prepareAuctionData,
                            owners,
                            slabsState,
                            saveAuctionData,
                            navigate
                        );
                    }
                }, 2000);
            } else {
                console.log('No more slabs, ending auction');
                console.log('Current state before ending auction:', {
                    owners,
                    slabsState,
                    currentSlabIndex,
                    currentSlabName
                });
                // End of auction
                endAuction(
                    prepareAuctionData,
                    owners,
                    slabsState,
                    saveAuctionData,
                    navigate
                );
            }
        } else {
            console.log('Staying in current slab, has unsold players');
            // Find next unsold player in current slab
            const currentPlayerIndex = currentSlabPlayers.findIndex(player => 
                player !== 0 && player.PID === currentPlayer.PID
            );
            console.log('Current Player Index:', currentPlayerIndex);
            
            // Find the next unsold player after the current one
            let nextUnsoldPlayer = null;
            for (let i = currentPlayerIndex + 1; i < currentSlabPlayers.length; i++) {
                if (currentSlabPlayers[i] !== 0) {
                    nextUnsoldPlayer = currentSlabPlayers[i];
                    break;
                }
            }
            
            console.log('Next Unsold Player:', nextUnsoldPlayer);
            
            if (nextUnsoldPlayer) {
                console.log('Found next unsold player:', nextUnsoldPlayer);
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
                        // If no unsold players in next slab, end auction
                        console.log('No unsold players in next slab, ending auction');
                        console.log('Current state before ending auction:', {
                            owners,
                            slabsState,
                            currentSlabIndex: nextSlabIndex,
                            currentSlabName: nextSlabName
                        });
                        endAuction(
                            prepareAuctionData,
                            owners,
                            slabsState,
                            saveAuctionData,
                            navigate
                        );
                    }
                } else {
                    console.log('No more slabs, ending auction');
                    console.log('Current state before ending auction:', {
                        owners,
                        slabsState,
                        currentSlabIndex,
                        currentSlabName
                    });
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

    // Handle bid assignment
    const handlePlayerAssignment = async () => {
        if (highestBidder) {
            console.log('Assigning player to highest bidder:', {
                highestBidder,
                currentPlayer,
                highestBid
            });

            const poolSize = Object.values(playerDataState).flat().length;
            const totalOwners = owners.length;

            // Update owner state first
            const updatedOwners = owners.map(owner => {
                if (owner.id === highestBidder.id) {
                    console.log('Updating owner:', owner.id, 'with player:', currentPlayer.PName);
                    
                    // Create new arrays to avoid reference issues
                    const updatedSlabPlayers = { ...owner.slabPlayers };
                    if (!updatedSlabPlayers[currentSlabName]) {
                        updatedSlabPlayers[currentSlabName] = [];
                    }
                    
                    // Add player to slab players if not already present
                    if (!updatedSlabPlayers[currentSlabName].includes(currentPlayer.PName)) {
                        updatedSlabPlayers[currentSlabName] = [...updatedSlabPlayers[currentSlabName], currentPlayer.PName];
                    }
                    
                    // Create new purchased players array
                    const updatedPurchasedPlayers = Array.isArray(owner.purchasedPlayers) 
                        ? [...owner.purchasedPlayers] 
                        : [];
                    
                    // Add player to purchased players if not already present
                    if (!updatedPurchasedPlayers.includes(currentPlayer.PName)) {
                        updatedPurchasedPlayers.push(currentPlayer.PName);
                    }

                    const updatedOwner = {
                        ...owner,
                        unitsLeft: owner.unitsLeft - highestBid,
                        purchasedPlayers: updatedPurchasedPlayers,
                        slabPlayers: updatedSlabPlayers,
                        currentBid: highestBid
                    };

                    console.log('Updated owner state:', {
                        id: updatedOwner.id,
                        purchasedPlayers: updatedOwner.purchasedPlayers,
                        slabPlayers: updatedOwner.slabPlayers,
                        unitsLeft: updatedOwner.unitsLeft
                    });

                    // Save the updated owner state to localStorage
                    const ownerState = {
                        id: updatedOwner.id,
                        unitsLeft: updatedOwner.unitsLeft,
                        purchasedPlayers: updatedOwner.purchasedPlayers,
                        slabPlayers: updatedOwner.slabPlayers
                    };
                    localStorage.setItem(`owner_${updatedOwner.id}_state`, JSON.stringify(ownerState));

                    return updatedOwner;
                }
                return owner;
            });

            console.log('Setting updated owners:', updatedOwners);
            setOwners(updatedOwners);

            // Update player data
            setPlayerDataState(prevData => {
                const updatedData = { ...prevData };
                if (updatedData[currentSlabName]) {
                    updatedData[currentSlabName] = updatedData[currentSlabName].map(p => 
                        p.PID === currentPlayer.PID ? 0 : p
                    );
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
                poolSize,
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
            console.log('No highest bidder found for player:', currentPlayer);
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

    const handleBidClick = (ownerId, bidValue) => {
        if (isStopped) return;

        const owner = owners.find((o) => o.id === ownerId);
        if (!owner || !slabDetails) return;

        // Check if owner has already reached their fair share for this slab
        const slabPlayers = owner.slabPlayers[slabDetails.name] || [];
        const playersPerOwner = slabDetails.numPlayers / owners.length;
        
        if (slabPlayers.length >= playersPerOwner) {
            alert(`Owner ${owner.id} has already reached their fair share of ${playersPerOwner} players from ${slabDetails.name} slab`);
            return;
        }

        // Check if owner has reached their total fair share across all slabs
        const totalPlayersOwned = Object.values(owner.slabPlayers).reduce((total, players) => total + players.length, 0);
        const totalPlayersPerOwner = Object.values(slabsState).reduce((total, slab) => total + (slab.numPlayers / owners.length), 0);
        
        if (totalPlayersOwned >= totalPlayersPerOwner) {
            alert(`Owner ${owner.id} has already reached their total fair share of ${totalPlayersPerOwner} players across all slabs`);
            return;
        }

        const cur_maxBid = slabDetails.maxBid;

        if (
            owner.unitsLeft >= bidValue &&
            bidValue >= highestBid &&
            owner !== highestBidder
        ) {
            console.log('Setting highest bidder:', {
                ownerId,
                bidValue,
                currentHighestBid: highestBid,
                currentHighestBidder: highestBidder
            });

            if (bidValue === cur_maxBid) {
                setOwnersWithMaxBid((prev) => {
                    const ownerAlreadyMaxBid = prev.some(o => o.id === owner.id);
                    if (!ownerAlreadyMaxBid) {
                        const updatedOwners = [...prev, owner];
                        // Only select from owners who bid max in this round
                        const randomOwner = updatedOwners[Math.floor(Math.random() * updatedOwners.length)];
                        setHighestBid(bidValue);
                        setHighestBidder(randomOwner);
                        return updatedOwners;
                    }
                    return prev;
                });
            } else {
                setHighestBid(bidValue);
                setHighestBidder(owner);
                // Reset ownersWithMaxBid when a new highest bid is set
                setOwnersWithMaxBid([]);
            }

            setTimer(180);
            updateOwnerBid(ownerId, bidValue, owners, setOwners);
        } else {
            console.log('Bid not accepted:', {
                ownerId,
                bidValue,
                ownerUnitsLeft: owner.unitsLeft,
                currentHighestBid: highestBid,
                isCurrentHighestBidder: owner === highestBidder
            });
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
                {renderPlayerCard(
                    currentPlayer,
                    (index) => getPlayerImage(currentPlayer, img10, PLAYER_IMAGES, index),
                    currentSlabIndex,
                    slabDetails,
                    numberOfPlayersLeft
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
  