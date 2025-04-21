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

// Load configuration from localStorage
const slabsConfigRaw = localStorage.getItem("slabsConfig");
const slabs = slabsConfigRaw ? JSON.parse(slabsConfigRaw) : [];
const numSlabs = slabs.length;

const ownerUnitsRaw = localStorage.getItem("OwnerUnits");
const ownerUnits = ownerUnitsRaw ? JSON.parse(ownerUnitsRaw) : {};

const auctionSequenceRaw = localStorage.getItem("AuctionSequence");
const auctionSequence = auctionSequenceRaw ? JSON.parse(auctionSequenceRaw) : [];

const playerDataRaw = localStorage.getItem("PlayerData");
const playerData = playerDataRaw ? JSON.parse(playerDataRaw) : {};

const Auction = ({ players }) => {
    // State hooks
    const [currentSlabIndex, setCurrentSlabIndex] = useState(0);
    const [slabDetails, setSlabDetails] = useState(DEFAULT_SLAB);
    const [playerDataState, setPlayerDataState] = useState(playerData);
    const [highestBid, setHighestBid] = useState(0);
    const [highestBidder, setHighestBidder] = useState(null);
    const [unbiddedPlayersQueue, setUnbiddedPlayersQueue] = useState([]);
    const [timer, setTimer] = useState(180); // Default timer
    const [owners, setOwners] = useState(() => {
        // Initialize owners with their units from localStorage
        return Object.entries(ownerUnits).map(([id, units]) => ({
            id: parseInt(id),
            unitsLeft: units,
            purchasedPlayers: [],
            slabPlayers: {},
        }));
    });
    const [ownersWithMaxBid, setOwnersWithMaxBid] = useState([]);
    const [isStarted, setIsStarted] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [slabsState, setSlabsState] = useState(slabs);
    const [upcomingSlab, setUpcomingSlab] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(DEFAULT_PLAYER);

    const navigate = useNavigate();
    
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
            const slabConfig = slabs.find(slab => slab.name === currentPlayer.PSlab);
            console.log('Found Slab Config:', slabConfig);
            
            if (slabConfig) {
                setSlabDetails({
                    name: slabConfig.name,
                    basePrice: slabConfig.basePrice,
                    maxBid: slabConfig.maxBid
                });
                setHighestBid(slabConfig.basePrice);
            }
        }
    }, [currentSlabIndex, currentPlayer]);

    // Move to next unsold player in current slab or next slab
    const moveToNextPlayer = () => {
        console.log('Moving to Next Player:', {
            currentSlabName,
            currentSlabPlayers,
            currentPlayer,
            hasUnsoldPlayers: currentSlabPlayers.some(player => player !== 0)
        });
        
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
                    const nextSlabConfig = slabs.find(slab => slab.name === nextSlabName);
                    console.log('Next Slab Config:', nextSlabConfig);
                    
                    if (nextSlabConfig) {
                        setSlabDetails({
                            name: nextSlabConfig.name,
                            basePrice: nextSlabConfig.basePrice,
                            maxBid: nextSlabConfig.maxBid
                        });
                        setHighestBid(nextSlabConfig.basePrice);
                        
                        // Get the first unsold player from the new slab
                        const nextSlabPlayers = playerDataState[nextSlabName] || [];
                        const firstUnsoldPlayer = nextSlabPlayers.find(player => player !== 0);
                        console.log('First Unsold Player in Next Slab:', firstUnsoldPlayer);
                        
                        if (firstUnsoldPlayer) {
                            // Update current player
                            setCurrentPlayer(firstUnsoldPlayer);
                        } else {
                            console.log('No unsold players found in next slab');
                            // If no unsold players in next slab, move to next slab
                            moveToNextPlayer();
                        }
                    } else {
                        console.error('No slab configuration found for:', nextSlabName);
                        // If no slab config found, try to move to next slab
                        moveToNextPlayer();
                    }
                }, 2000);
            } else {
                console.log('No more slabs, ending auction');
                // End of auction
                endAuction(
                    prepareAuctionData,
                    owners,
                    slabs,
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
            
            // If we're at the last player in the slab, move to next slab
            if (currentPlayerIndex === currentSlabPlayers.length - 1) {
                console.log('Reached last player in slab, moving to next slab');
                const nextSlabIndex = currentSlabIndex + 1;
                if (nextSlabIndex < auctionSequence.length) {
                    const nextSlabName = auctionSequence[nextSlabIndex];
                    const nextSlabPlayers = playerDataState[nextSlabName] || [];
                    const firstUnsoldPlayer = nextSlabPlayers.find(player => player !== 0);
                    
                    if (firstUnsoldPlayer) {
                        setCurrentSlabIndex(nextSlabIndex);
                        setCurrentPlayer(firstUnsoldPlayer);
                        
                        const nextSlabConfig = slabs.find(slab => slab.name === nextSlabName);
                        if (nextSlabConfig) {
                            setSlabDetails({
                                name: nextSlabConfig.name,
                                basePrice: nextSlabConfig.basePrice,
                                maxBid: nextSlabConfig.maxBid
                            });
                            setHighestBid(nextSlabConfig.basePrice);
                        }
                    } else {
                        moveToNextPlayer();
                    }
                } else {
                    endAuction(
                        prepareAuctionData,
                        owners,
                        slabs,
                        saveAuctionData,
                        navigate
                    );
                }
                return;
            }
            
            const nextUnsoldPlayer = currentSlabPlayers.find((player, index) => 
                player !== 0 && index > currentPlayerIndex
            ) || currentSlabPlayers.find(player => player !== 0);
            
            console.log('Next Unsold Player:', nextUnsoldPlayer);
            
            if (nextUnsoldPlayer) {
                console.log('Found next unsold player:', nextUnsoldPlayer);
                setCurrentPlayer(nextUnsoldPlayer);
            } else {
                console.log('No next unsold player found in current slab, checking slab state:', {
                    currentSlabName,
                    currentSlabPlayers,
                    currentPlayerIndex
                });
                moveToNextPlayer();
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
    const handlePlayerAssignment = () => {
        if (highestBidder) {
            const poolSize = Object.values(playerDataState).flat().length;
            const totalOwners = owners.length;

            assignPlayerToHighestBidder(
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
                () => saveAuctionState(
                    playerDataState,
                    currentSlabIndex,
                    owners,
                    highestBid,
                    highestBidder,
                    poolSize,
                    unbiddedPlayersQueue,
                    timer
                ),
                setOwners,
                unbiddedPlayersQueue,
                setUnbiddedPlayersQueue,
                playerDataState,
                setPlayerDataState,
                currentSlabName,
                setHighestBid,
                setHighestBidder,
                setTimer
            );
            updatePlayerData(currentSlabName, currentPlayer);
            moveToNextPlayer();
        }
    };

    // Timer effect
    useEffect(() => {
        if (isStarted && !isStopped) {
            const countdown = timer > 0 
                ? setInterval(() => setTimer((prev) => prev - 1), 1000)
                : handlePlayerAssignment();
            
            return () => clearInterval(countdown);
        }
    }, [timer, isStarted, isStopped]);

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
                        numSlabs,
                        timer,
                        isStarted
                    )}
                    {renderOwnerCards(
                        owners,
                        highestBidder,
                        isStopped,
                        (owner) =>
                            renderBidOptions(
                                owner,
                                isStarted,
                                (ownerId) => ifFullyFilled(ownerId, owners, Object.values(playerDataState).flat().length),
                                currentPlayer,
                                slabDetails,
                                highestBid,
                                (ownerId, bidValue) =>
                                    handleBidClick(
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
                                        180,
                                        updateOwnerBid,
                                        setOwners
                                    )
                            )
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
  