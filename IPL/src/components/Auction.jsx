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
  PName: "",
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

// Utility functions
const getSlabDetails = (slabName) => {
  const slabsConfigRaw = localStorage.getItem("slabsConfig");
  const slabsConfig = slabsConfigRaw ? JSON.parse(slabsConfigRaw) : [];
  
  const slabConfig = slabsConfig.find(slab => slab.name === slabName);
  
  if (slabConfig) {
    return {
      min: slabConfig.basePrice || 50,
      max: slabConfig.maxBid || null,
      name: slabConfig.name
    };
  }

  // Default values if slab not found
  return {
    min: 50,
    max: null,
    name: slabName
  };
};

const sortPlayersByAuctionSequence = (players, sequence) => {
  if (!Array.isArray(players) || !Array.isArray(sequence)) {
    console.error("Invalid players or sequence data for sorting:", players, sequence);
    return Array.isArray(players) ? players : [];
  }

  const sequenceMap = new Map();
  sequence.forEach((pid, index) => sequenceMap.set(pid, index));

  return players.slice().sort((a, b) => {
    const aIndex = sequenceMap.has(a.PID) ? sequenceMap.get(a.PID) : Infinity;
    const bIndex = sequenceMap.has(b.PID) ? sequenceMap.get(b.PID) : Infinity;
    return aIndex - bIndex;
  });
};

const createInitialOwners = (numOwners) => {
  return Array.from({ length: numOwners }, (_, index) => ({
    id: index + 1,
    unitsLeft: 2500,
    purchasedPlayers: [],
    slabPlayers: {},
  }));
};

const slabMaxSize = (poolSize, numSlabs, totalOwners) => {
  const distribution = {};
  const slabNames = slabs.map((slab) => slab.name);
  const playersPerSlab = Math.floor(poolSize / 6);
  const remainingPlayers = poolSize % 6;

  slabNames.forEach((name, index) => {
    if (index < numSlabs) {
      distribution[name] = playersPerSlab;
      if (index === 0) {
        distribution[name] += 6;
      } else if (index === 1 && remainingPlayers > 0) {
        distribution[name] += remainingPlayers;
      }
    }
  });

  const maxAllocations = {};
  slabNames.forEach((name) => {
    if (distribution[name] > 0) {
      maxAllocations[name] = Math.floor(distribution[name] / totalOwners);
    }
  });

  console.log("Distribution of players per slab:", distribution);
  console.log("Max allocation per owner from each slab:", maxAllocations);

  return maxAllocations;
};

const auctionDataRaw = localStorage.getItem("AuctionData");
const auctionData = auctionDataRaw ? JSON.parse(auctionDataRaw) : {};
const configTime = auctionData.configTime || 180;
const totalOwners = auctionData.totalOwners || 3;
const poolSize = auctionData.poolSize || 12;

// Fix slabs configuration loading
const slabsConfigRaw = localStorage.getItem("slabsConfig");
const slabs = slabsConfigRaw ? JSON.parse(slabsConfigRaw) : [];
const numSlabs = slabs.length;

// Log for debugging
console.log("Slabs configuration:", slabs);
console.log("Number of slabs:", numSlabs);

const Auction = ({ players }) => {
    // State hooks
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [slabDetails, setSlabDetails] = useState(DEFAULT_SLAB);
    const [auctionSequence, setAuctionSequence] = useState([]);
    const [playerData, setPlayerData] = useState([]);
    const [playersList, setPlayersList] = useState([]);
    const [highestBid, setHighestBid] = useState(0);
    const [highestBidder, setHighestBidder] = useState(null);
    const [unbiddedPlayersQueue, setUnbiddedPlayersQueue] = useState([]);
    const [timer, setTimer] = useState(configTime);
    const [owners, setOwners] = useState(createInitialOwners(totalOwners));
    const [ownersWithMaxBid, setOwnersWithMaxBid] = useState([]);
    const [isStarted, setIsStarted] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [poolSizeState, setPoolSize] = useState(poolSize);
    const [slabsState, setSlabsState] = useState(slabs); // Add state for slabs
  
    const navigate = useNavigate();
    const currentPlayer = playersList[currentPlayerIndex] || DEFAULT_PLAYER;
    const numberOfPlayersLeft = playersList.filter((player) => player !== 0).length;
  
    // Derived values
    const slabMapping = slabs.reduce((map, slab, index) => {
      const slabLetter = String.fromCharCode(65 + index);
      map[slabLetter] = slab;
      return map;
    }, {});
  
    // Initialization effects
    useEffect(() => {
      initializePlayersFromLocalStorage(
        setPlayerData,
        setAuctionSequence,
        setPlayersList,
        sortPlayersByAuctionSequence,
        poolSize
      );
    }, [poolSize]);
  
    useEffect(() => {
      initializeAuctionState(
        localStorage,
        setIsStarted,
        setPlayersList,
        setOwners,
        setUnbiddedPlayersQueue,
        setTimer,
        setPoolSize,
        setCurrentPlayerIndex,
        () => moveToNextNonZeroPlayer(
          currentPlayer,
          playersList,
          currentPlayerIndex,
          setCurrentPlayerIndex,
          () => handleNoPlayersInCurrentSlab(
            currentPlayer.PSlab,
            slabs,
            playersList,
            setCurrentPlayerIndex,
            () => endAuction()
          ),
          () => handleNoPlayersInAnySlab(() => endAuction())
        ),
        () => resetAuctionState(
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
        ),
        players,
        poolSize,
        createInitialOwners,
        unbiddedPlayersQueue,
        timer,
        poolSize
      );
    }, [poolSize, players]);
  
    useEffect(() => {
      if (isStarted && !isStopped) {
        const countdown = timer > 0 
          ? setInterval(() => setTimer((prev) => prev - 1), 1000)
          : assignPlayerToHighestBidder(
              highestBidder,
              makeBid,
              playersList,
              currentPlayer,
              () => endAuction(),
              () => moveToNextNonZeroPlayer(
                currentPlayer,
                playersList,
                currentPlayerIndex,
                setCurrentPlayerIndex,
                () => handleNoPlayersInCurrentSlab(
                  currentPlayer.PSlab,
                  slabs,
                  playersList,
                  setCurrentPlayerIndex,
                  () => endAuction()
                ),
                () => handleNoPlayersInAnySlab(() => endAuction())
              ),
              () => resetAuction(
                setHighestBid,
                setHighestBidder,
                currentPlayer,
                slabDetails,
                setTimer,
                configTime
              )
            );
        
        return () => clearInterval(countdown);
      }
    }, [timer, isStarted, isStopped]);
  
    useEffect(() => {
      if (currentPlayer && currentPlayer.PSlab) {
        const details = getSlabDetails(currentPlayer.PSlab);
        setSlabDetails(details);
        setHighestBid(currentPlayer.minimumBid || details.basePrice);
      }
    }, [currentPlayerIndex, currentPlayer, slabs]);
  
    // Load slabs configuration on component mount
    useEffect(() => {
        const loadSlabsConfig = () => {
            const savedSlabsConfig = localStorage.getItem("slabsConfig");
            if (savedSlabsConfig) {
                const parsedSlabs = JSON.parse(savedSlabsConfig);
                setSlabsState(parsedSlabs);
                console.log("Loaded slabs configuration:", parsedSlabs);
            }
        };
        loadSlabsConfig();
    }, []);
  
    return (
      <>
        <div className="auction-container">
          {renderPlayerCard(
            currentPlayer,
            (index) => getPlayerImage(currentPlayer, img10, PLAYER_IMAGES, index),
            currentPlayerIndex,
            slabDetails,
            numberOfPlayersLeft
          )}
          <div style={{ flexGrow: 1, marginLeft: "20px" }}>
            {renderBidInfo(
              highestBid,
              highestBidder,
              poolSize,
              totalOwners,
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
                  (ownerId) => ifFullyFilled(ownerId, owners, poolSize),
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
                      configTime,
                      updateOwnerBid
                    )
                )
            )}
          </div>
        </div>
        {renderControlButtons(
          () => handleStart(setIsStarted, setIsStopped, () => saveAuctionState(
            playersList,
            currentPlayerIndex,
            owners,
            highestBid,
            highestBidder,
            poolSize,
            unbiddedPlayersQueue,
            timer
          )),
          () => handleStop(setIsStarted, setIsStopped),
          () => handleDiscard(navigate),
          () => resetAuction(
            setHighestBid,
            setHighestBidder,
            currentPlayer,
            slabDetails,
            setTimer,
            configTime
          ),
          () => assignPlayerToHighestBidder(
            highestBidder,
            makeBid,
            playersList,
            currentPlayer,
            () => endAuction(),
            () => moveToNextNonZeroPlayer(
              currentPlayer,
              playersList,
              currentPlayerIndex,
              setCurrentPlayerIndex,
              () => handleNoPlayersInCurrentSlab(
                currentPlayer.PSlab,
                slabs,
                playersList,
                setCurrentPlayerIndex,
                () => endAuction()
              ),
              () => handleNoPlayersInAnySlab(() => endAuction())
            ),
            () => resetAuction(
              setHighestBid,
              setHighestBidder,
              currentPlayer,
              slabDetails,
              setTimer,
              configTime
            )
          )
        )}
      </>
    );
  };
  
  export default Auction;
  