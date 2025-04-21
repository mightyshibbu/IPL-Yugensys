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

const images = [img1, img2, img3, img4, img5, img6, img7, img8, img9];

const Auction = ({players}) => {
  
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [slabDetails, setSlabDetails] = useState({
    name: "DEFAULT SLAB",
    basePrice: 9999,
    maxBid: 9999,
  });

  // New state for AuctionSequence and PlayerData from localStorage
  const [auctionSequence, setAuctionSequence] = useState([]);
  const [playerData, setPlayerData] = useState([]);

  const [playersList, setPlayersList] = useState([]);

  // Function to sort playersList according to auctionSequence order
  const sortPlayersByAuctionSequence = (players, sequence) => {
    if (!Array.isArray(players) || !Array.isArray(sequence)) {
      console.error("Invalid players or sequence data for sorting:", players, sequence);
      return Array.isArray(players) ? players : [];
    }
    const sequenceMap = new Map();
    sequence.forEach((pid, index) => {
      sequenceMap.set(pid, index);
    });
    // Sort players by their PID's index in sequence
    return players.slice().sort((a, b) => {
      const aIndex = sequenceMap.has(a.PID) ? sequenceMap.get(a.PID) : Infinity;
      const bIndex = sequenceMap.has(b.PID) ? sequenceMap.get(b.PID) : Infinity;
      return aIndex - bIndex;
    });
  };

  // Initialize playersList from localStorage PlayerData and AuctionSequence
  useEffect(() => {
    const rawPlayerData = localStorage.getItem("PlayerData");
    const rawAuctionSequence = localStorage.getItem("AuctionSequence");

    console.log("Raw PlayerData from localStorage:", rawPlayerData);
    console.log("Raw AuctionSequence from localStorage:", rawAuctionSequence);

    let storedPlayerData = {};
    let storedAuctionSequence = [];

    try {
      storedPlayerData = JSON.parse(rawPlayerData) || {};
    } catch (e) {
      console.error("Error parsing PlayerData from localStorage:", e);
    }

    try {
      storedAuctionSequence = JSON.parse(rawAuctionSequence) || [];
    } catch (e) {
      console.error("Error parsing AuctionSequence from localStorage:", e);
    }

    setPlayerData(storedPlayerData);
    setAuctionSequence(storedAuctionSequence);

    // Flatten PlayerData object into array of players
    const flattenedPlayers = Object.values(storedPlayerData).flat();

    const sortedPlayers = sortPlayersByAuctionSequence(flattenedPlayers, storedAuctionSequence);
    setPlayersList(sortedPlayers.slice(0, poolSize));
  }, [poolSize]);

  const currentPlayer = playersList[currentPlayerIndex]
    ? playersList[currentPlayerIndex]
    : {
        PID: 9999,
        PName: "",
        PAge: 0,
        PHeight: "",
        PWeight: "",
        PRole: "",
        PSlab: "DEFAULT",
      };
  const [highestBid, setHighestBid] = useState(
    playersList[currentPlayerIndex]?.minimumBid || 0
  );
  const [highestBidder, setHighestBidder] = useState(null);

  const [unbiddedPlayersQueue, setUnbiddedPlayersQueue] = useState([
    ...playersList,
  ]);
  const [timer, setTimer] = useState(configTime);

  const [owners, setOwners] = useState(Array.from({ length: totalOwners }, (_, index) => ({
    id: index + 1,
    unitsLeft: 2500,
    purchasedPlayers: [],
    slabPlayers: {},
  })));

  const [ownersWithMaxBid, setOwnersWithMaxBid] = useState([]);

  const [isStarted, setIsStarted] = useState(false);

  const [isStopped, setIsStopped] = useState(false);

  const navigate = useNavigate();

  let numberOfPlayersLeft = playersList.filter((player) => player !== 0).length;
  // Map PSlab to slabs by name
  const slabMapping = slabs.reduce((map, slab, index) => {
    const slabLetter = String.fromCharCode(65 + index); // Generate "A", "B", etc.
    map[slabLetter] = slab;
    return map;
  }, {});

  useEffect(() => {
    const savedAuctionData = localStorage.getItem("auctionData");
    console.log("totalOwners: ",totalOwners);
    console.log("slab details: ", slabs);

    if (savedAuctionData) {
      const {
        playersList: savedPlayersList,
        poolSize: savedPoolSize,
        currentPlayerIndex: savedCurrentPlayerIndex,
        owners: savedOwners,
        highestBid: savedHighestBid,
        highestBidder: savedHighestBidder,
        unbiddedPlayersQueue: savedUnbiddedPlayersQueue,
        timer: savedTimer,
        isStarted: savedIsStarted, // Add this to check if auction was started
      } = JSON.parse(savedAuctionData);
      console.log("OWNER FROM LOCALSTORAGE:", owners);
      setIsStarted(savedIsStarted || false); // Check if the auction was started before

      setPlayersList(savedPlayersList || players.slice(0, poolSize));
      setOwners(
        savedOwners || createInitialOwners(totalOwners)
      );
      setUnbiddedPlayersQueue(
        savedUnbiddedPlayersQueue || [...savedPlayersList]
      );
      setTimer(savedTimer || configTime);
      setPoolSize(savedPoolSize || poolSize);

      if (savedIsStarted) {
        // Only move to the next player if the auction was already started
        moveToNextNonZeroPlayer();
      } else {
        // If the auction hasn't started, reset the currentPlayerIndex to 0
        setCurrentPlayerIndex(savedCurrentPlayerIndex || 0);
      }
    } else {
      setPlayersList(players.slice(0, poolSize));
      setOwners(createInitialOwners(totalOwners));
      setHighestBid(0);
      setHighestBidder(null);
      setUnbiddedPlayersQueue([...players.slice(0, poolSize)]);
      setTimer(configTime);
      setPoolSize(poolSize);
      setCurrentPlayerIndex(0); // Move to the first player
    }
  }, [poolSize, players]);

  const createInitialOwners = (numOwners) => {
    return Array.from({ length: numOwners }, (_, index) => ({
      id: index + 1,
      unitsLeft: 2500,
      purchasedPlayers: [],
      slabPlayers: {},
    }));
  };
  useEffect(() => {
    if (isStarted && !isStopped) {
      if (timer === 0) {
        assignPlayerToHighestBidder();
      } else {
        const countdown = setInterval(() => {
          setTimer((prevTimer) => prevTimer - 1);
        }, 1000);
        return () => clearInterval(countdown);
      }
    }
  }, [timer, isStarted, isStopped]);

  useEffect(() => {
    if (!currentPlayer || !currentPlayer.PSlab) {
      console.error(
        "currentPlayer or currentPlayer.PSlab is not initialized yet."
      );
      return;
    }

    // Get slab details using the function
    const slabDetails = getSlabDetails(currentPlayer.PSlab, slabs);
    console.log("useEffect currentPlayer.PSlab:", currentPlayer.PSlab);
    console.log("useEffect slabs[slabIndex]:", slabDetails);

    // Update slab details and highest bid
    setSlabDetails(slabDetails);
    setHighestBid(currentPlayer.minimumBid || slabDetails.basePrice);
  }, [currentPlayerIndex, currentPlayer, slabs]);
  // Function to get slab details based on current player's slab
  const getSlabDetails = (playerSlab, slabs) => {
    // Default slab if no matching slab is found
    const defaultSlab = {
      name: "DEFAULT",
      basePrice: 9999,
      maxBid: 9999,
    };

    if (!playerSlab || !slabs || slabs.length === 0) {
      return defaultSlab; // Return default if slabs array is empty or player slab is not defined
    }

    // Find slab object by matching name
    const slab = slabs.find((s) => s.name === playerSlab);

    return slab || defaultSlab;
  };

  useEffect(() => {
    console.log("Current Player:", currentPlayer);
    console.log("Current Slab Mapping:", currentPlayer.PSlab);
    // Rest of the logic
  }, [currentPlayer, currentPlayerIndex]);

  const getPlayerImage = (playerIndex) => {
    // Use modulo to repeat the images for players beyond the 6th
    if (currentPlayer.PID == 9999) {
      return img10;
    }
    return images[playerIndex % images.length];
  };

  const slabMaxSize = (poolSize, numSlabs, totalOwners) => {
    const distribution = {};
    const slabNames = slabs.map((slab) => slab.name); // Define your slab names
    const playersPerSlab = Math.floor(poolSize / 6); // Players per slab based on the fixed sequence
    const remainingPlayers = poolSize % 6; // Remaining players after filling up to multiples of 6

    // Initialize the distribution for each slab based on the number of players
    slabNames.forEach((name, index) => {
      if (index < numSlabs) {
        distribution[name] = playersPerSlab; // Each slab gets the base allocation
        if (index === 0) {
          distribution[name] += 6; // Slab A always gets the first 6 players
        } else if (index === 1 && remainingPlayers > 0) {
          distribution[name] += remainingPlayers; // Slab B gets any remaining players
        }
      }
    });

    // Determine max allocation per owner for each slab
    const maxAllocations = {};
    slabNames.forEach((name) => {
      if (distribution[name] > 0) {
        maxAllocations[name] = Math.floor(distribution[name] / totalOwners); // Maximum players per owner from this slab
      }
    });

    console.log("Distribution of players per slab:", distribution);
    console.log("Max allocation per owner from each slab:", maxAllocations);

    return maxAllocations;
  };

  const autoAssign = (ownerId) => {
    if (!slabDetails) {
      console.error("Invalid slab:", currentPlayer.PSlab);
      return;
    }

    console.log("Owner with the lowest no. of players:", ownerId);
    console.log("Reached here 333, Players Base Price:", slabDetails.basePrice);

    // Use the base price of the slab and add 100 to handleBidClick
    handleBidClick(ownerId, slabDetails.basePrice + 100);
  };

  const resetAuction = () => {
    setHighestBid(currentPlayer.minimumBid || slabDetails.basePrice);
    setHighestBidder(null);
    setTimer(configTime);
  };

  const handleBidClick = useCallback(
    (ownerId, bidValue) => {
      if (!isStopped) {
        const owner = owners.find((o) => o.id === ownerId);
        console.log("Bidder Owner", owner.id);

        if (!slabDetails) {
          console.error("Invalid slab:", currentSlabName);
          return;
        }

        const cur_maxBid = slabDetails.maxBid;
        console.log("Slab:", slabDetails.name);
        console.log("cur_maxBid:", cur_maxBid);

        if (
          owner.unitsLeft >= bidValue &&
          bidValue >= highestBid &&
          owner !== highestBidder
        ) {
          if (bidValue === cur_maxBid) {
            setOwnersWithMaxBid((prev) => {
              const updatedOwners = [...prev, owner];
              console.log("Updated ownersWithMaxBid:", updatedOwners);

              const random_owner =
                updatedOwners[Math.floor(Math.random() * updatedOwners.length)];
              console.log("This time Random Owner:", random_owner.id);

              setHighestBid(bidValue);
              setHighestBidder(random_owner);

              return updatedOwners;
            });
          } else {
            setHighestBid(bidValue);
            setHighestBidder(owner);
          }

          console.log("bidValue & highest bid:", bidValue, highestBid);
          setTimer(configTime);

          const updatedOwners = owners.map((o) => {
            if (o.id === ownerId) {
              return { ...o, currentBid: bidValue };
            }
            return o;
          });
          setOwners(updatedOwners);
        }
      }
    },
    [highestBid, isStopped, owners, setHighestBidder, setTimer, setOwners]
  );

  const ifFullyFilled = (ownerID) => {
    const owner = owners.find((o) => o.id === ownerID);
    if (!owner) return false; // Handle case where owner is not found
    const totalPurchased = owner.purchasedPlayers.length;
    return totalPurchased < poolSize / 3 ? true : false;
  };

  const makeBid = (ownerId) => {
    if (!isStopped) {
      const owner = owners.find((o) => o.id === ownerId);

      if (!slabDetails) {
        console.error("Invalid slab:", currentSlabName);
        return;
      }

      // Get slab max size based on pool size and total owners
      const currentSlabMaxSize = slabMaxSize(poolSize, numSlabs, totalOwners); // poolSize=9 , numSlabs=2 , owners=3
      const slabPlayers = owner.slabPlayers[slabDetails.name] || [];

      console.log("slabPlayers.length:", slabPlayers.length);
      console.log("slabDetails.name:", slabDetails.name);
      console.log(
        "currentSlabMaxSize[slabDetails.name]:",
        currentSlabMaxSize[slabDetails.name]
      );
      console.log("currentSlabMaxSize:", currentSlabMaxSize);

      // Check if the number of players in this slab is less than the maximum size allowed
      if (slabPlayers.length < currentSlabMaxSize[slabDetails.name]) {
        const updatedSlabPlayers = [...slabPlayers, currentPlayer.PName];
        const updatedPurchasedPlayers = [
          ...owner.purchasedPlayers,
          currentPlayer.PName,
        ];

        // Update the owners' state
        setOwners(
          owners.map((o) => {
            if (o.id === ownerId) {
              return {
                ...o,
                unitsLeft: o.unitsLeft - highestBid,
                slabPlayers: {
                  ...o.slabPlayers,
                  [slabDetails.name]: updatedSlabPlayers, // Use new slab names here
                },
                purchasedPlayers: updatedPurchasedPlayers,
              };
            }
            return o;
          })
        );

        // Log updated state
        const updatedOwners = owners.map((o) => {
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
        });

        console.log("Owners set in LOCALSTORAGE:", updatedOwners);

        // Update players queue and list
        const updatedUnbiddedPlayersQueue = unbiddedPlayersQueue.filter(
          (player) => player.PID !== currentPlayer.PID
        );
        const updatedPlayersList = playersList.map((player, index) =>
          index === currentPlayerIndex ? 0 : player
        );

        setUnbiddedPlayersQueue(updatedUnbiddedPlayersQueue);
        setPlayersList(updatedPlayersList);
        console.log("updatedPlayersList after player sell", updatedPlayersList);

        // Save updated auction state to localStorage
        localStorage.setItem(
          "auctionData",
          JSON.stringify({
            playersList: updatedPlayersList,
            currentPlayerIndex: currentPlayerIndex + 1,
            owners: updatedOwners,
            highestBid,
            highestBidder,
            poolSize,
            unbiddedPlayersQueue: updatedUnbiddedPlayersQueue,
            timer,
          })
        );
      } else {
        alert(
          `Owner ${owner.id} cannot purchase more players from ${slabDetails.name} slab`
        );
      }
    }
  };

  const saveAuctionData = async (auctionData) => {
    try {
      const response = await fetch("http://localhost:3000/api/saveAuction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(auctionData),
      });

      if (!response.ok) {
        throw new Error("Failed to save auction data");
      }

      const result = await response.json();
      console.log("Auction saved successfully:", result);
    } catch (error) {
      console.error("Error saving auction data:", error);
    }
  };

  const displayResult = async () => {
    console.log("Auction completed!");
    alert("Auction completed!");

    console.log("slabs in displayResult", slabs);

    // Create a mapping of slabs based on the new structure
    const slabMapping = slabs.reduce((acc, slab, index) => {
      acc[slab.name] = index; // Map slab names to their respective index
      return acc;
    }, {});

    console.log("slabMapping in displayResult: ", slabMapping);

    // Prepare the auction data
    const auctionData = {
      owners: owners.map((owner) => {
        const slabPlayers = {};

        // Iterate through each slab using the new slab names
        for (const slabName of Object.keys(slabMapping)) {
          const playersInSlab = owner.slabPlayers[slabName] || []; // Access players based on new slab names

          // Only include slabs that have players or set "No Players"
          if (playersInSlab.length > 0) {
            slabPlayers[slabName] = playersInSlab;
          } else {
            slabPlayers[slabName] = "No Players";
          }
        }

        return {
          id: owner.id,
          unitsLeft: owner.unitsLeft,
          slabPlayers: slabPlayers,
          purchasedPlayers: owner.purchasedPlayers.map((player) => ({
            name: player.name,
            slab: player.slab, // Ensure the player's slab is saved using the correct name
            playerId: player.playerId,
          })),
        };
      }),
    };

    // Remove slabs that have "No Players" from the auction data
    auctionData.owners.forEach((owner) => {
      owner.slabPlayers = Object.fromEntries(
        Object.entries(owner.slabPlayers).filter(
          ([slab, players]) => players !== "No Players"
        )
      );
    });

    try {
      await saveAuctionData(auctionData);
      localStorage.removeItem("auctionData");
      console.log("Auction data saved successfully!");

      navigate("/previousAuctions", { replace: true });
    } catch (error) {
      console.error("Error saving auction data:", error);
    }
  };

  const moveToNextNonZeroPlayer = () => {
    console.log("MOVE TO NEXT NON ZERO PLAYER");

    // Get current slab name
    const currentSlabName = currentPlayer.PSlab;

    // Check if there are any remaining non-zero players in current slab
    const playersInCurrentSlab = playersList.filter(
      (player) => player !== 0 && player.PSlab === currentSlabName
    );

    if (playersInCurrentSlab.length > 0) {
      // Find next non-zero player in current slab after currentPlayerIndex
      let nextNonZeroIndex = playersList.findIndex(
        (player, index) =>
          index > currentPlayerIndex && player !== 0 && player.PSlab === currentSlabName
      );

      // If no non-zero players after current index in current slab, wrap around to first in slab
      if (nextNonZeroIndex === -1) {
        nextNonZeroIndex = playersList.findIndex(
          (player) => player !== 0 && player.PSlab === currentSlabName
        );
      }

      if (nextNonZeroIndex !== -1) {
        setCurrentPlayerIndex(nextNonZeroIndex);
        console.log(
          "moveToNextNonZeroPlayer -> nextNonZeroIndex: ",
          nextNonZeroIndex
        );
        console.log(
          "moveToNextNonZeroPlayer -> currentplayerIndex",
          currentPlayerIndex
        );
      } else {
        console.log("No more valid players left in current slab.");
        // All players in current slab purchased, move to next slab players
        // Find next slab in slabs array after current slab
        const slabNames = slabs.map((slab) => slab.name);
        const currentSlabIndex = slabNames.indexOf(currentSlabName);
        let nextSlabIndex = currentSlabIndex + 1;

        while (nextSlabIndex < slabNames.length) {
          const nextSlabName = slabNames[nextSlabIndex];
          const playersInNextSlab = playersList.filter(
            (player) => player !== 0 && player.PSlab === nextSlabName
          );
          if (playersInNextSlab.length > 0) {
            // Set currentPlayerIndex to first player in next slab
            const nextPlayerIndex = playersList.findIndex(
              (player) => player !== 0 && player.PSlab === nextSlabName
            );
            setCurrentPlayerIndex(nextPlayerIndex);
            return;
          }
          nextSlabIndex++;
        }

        // If no players left in any slab, end auction
        console.log("No more valid players left in any slab.");
        setIsStarted(false);
        displayResult();
      }
    } else {
      console.log("All players have been bid on.");
      setIsStarted(false);
      displayResult();
    }
  };

  const assignPlayerToHighestBidder = () => {
    console.log("CURRENT LIST OF OWNERS:", owners);
    if (highestBidder) {
      makeBid(highestBidder.id);
    } else {
      console.log("NO HIGHEST BIDDER", currentPlayerIndex);
      console.log("for player:", currentPlayer);
    }

    // Check if the auction should continue
    if (playersList.every((player) => player === 0)) {
      setIsStarted(false);
      displayResult();
    } else {
      console.log(
        "IIMEDIATE CurrentPlayerIndex before localStorage",
        currentPlayerIndex
      );
      moveToNextNonZeroPlayer();
      resetAuction(); // Reset for the next player
    }
  };

  const handleStart = () => {
    setIsStarted(true);
    setIsStopped(false);

    localStorage.setItem(
      "auctionData",
      JSON.stringify({
        playersList,
        currentPlayerIndex,
        owners,
        highestBid,
        highestBidder,
        unbiddedPlayersQueue,
        poolSize, // Add this
        timer, // Already present
      })
    );
  };

  const handleStop = () => {
    setIsStarted(false);
    setIsStopped(true);
  };

  const handleDiscard = () => {
    localStorage.removeItem("auctionData");
    navigate("/", { replace: true });
  };

  return (
    <>
      <div className="auction-container">
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
            <div>MAX: {slabDetails.maxBid}</div>
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
        <div style={{ flexGrow: 1, marginLeft: "20px" }}>
          <div className="bid-info">
            <div>Current Bid: {highestBid}</div>
            <div>
              Highest Bidder: {highestBidder ? highestBidder.id : "None"}
            </div>
            <div>Pool Size: {poolSize}</div>
            <div>Owners: {totalOwners}</div>
            <div>Slabs: {numSlabs}</div>
            <div className={`timer ${isStarted ? "glow" : ""}`}>
              {timer} seconds
            </div>
          </div>

          {owners.map((owner) => (
            <div key={owner.id} className="owner-card">
              {owner.id == 1 ? (
                <div>Owner {owner.id} (PRANAV TRIPATHI)</div>
              ) : (
                <div>Owner {owner.id}</div>
              )}
              <div>Units Left: {owner.unitsLeft}</div>
              <div className="bid-options">
                Available Bids:
                {isStarted &&
                  ifFullyFilled(owner.id) &&
                  currentPlayer.PID != 9999 &&
                  [
                    ...Array(
                      Math.floor(
                        (slabDetails.maxBid - slabDetails.basePrice) / 50
                      ) + 1
                    ),
                  ]
                    .map((_, i) => slabDetails.basePrice + i * 50)
                    .filter(
                      (bidValue) =>
                        bidValue >= highestBid || bidValue < owner.unitsLeft
                    )
                    .map((bidValue) => (
                      <span
                        key={bidValue}
                        className={`
                    ${
                      highestBid > bidValue || owner.unitsLeft < bidValue
                        ? "line-through"
                        : ""
                    } 
                    ${
                      bidValue === slabDetails.maxBid
                        ? owner.unitsLeft >= highestBid
                          ? "pointer"
                          : "not-allowed"
                        : ""
                    }
                  `}
                        onClick={() => handleBidClick(owner.id, bidValue)}
                      >
                        {bidValue}
                      </span>
                    ))}
              </div>
              <div>
                Purchased Players: {owner.purchasedPlayers.join(", ") || "None"}
              </div>
              <button
                disabled={
                  (highestBidder && highestBidder.id === owner.id) || isStopped
                }
                onClick={() => {}}
              >
                Make Bid
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="control-buttons">
        <button onClick={handleStart}>Start</button>
        <button onClick={handleStop}>Stop</button>
        <button onClick={handleDiscard}>Discard</button>
        <button onClick={resetAuction}>Reset bid</button>
        <button onClick={assignPlayerToHighestBidder}>Skip time</button>
      </div>
    </>
  );
};

export default Auction;
