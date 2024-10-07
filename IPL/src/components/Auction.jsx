import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auction.css";
const Auction = ({ players,poolSize,configTime }) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playersList,setPlayersList] = useState(players.slice(0, poolSize));
  const [highestBid, setHighestBid] = useState(
    playersList[currentPlayerIndex]?.minimumBid || 0
  ); // Fallback to 0 if player[0] is undefined
  const [highestBidder, setHighestBidder] = useState(null);
  const [unbiddedPlayersQueue, setUnbiddedPlayersQueue] = useState([...playersList]); // Queue for unbidded players

  const [timer, setTimer] = useState(configTime);
  const [owners, setOwners] = useState([
    { id: 1, unitsLeft: 2500, purchasedPlayers: [], slabPlayers: {} },
    { id: 2, unitsLeft: 2500, purchasedPlayers: [], slabPlayers: {} },
    { id: 3, unitsLeft: 2500, purchasedPlayers: [], slabPlayers: {} },
  ]);
  const [ownersWithMaxBid, setOwnersWithMaxBid] = useState([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const navigate = useNavigate();
  // Slab configuration with base prices and max bids
  const slabs = {
    A: { basePrice: 200, maxBid: 800 },
    B: { basePrice: 150, maxBid: 800 },
    C: { basePrice: 100, maxBid: 700 },
    D: { basePrice: 80, maxBid: 700 },
    E: { basePrice: 50, maxBid: 400 },
  };

  const currentPlayer = playersList[currentPlayerIndex];

  const slabDetails = slabs[currentPlayer.PSlab];

  // Reset the timer and start countdown when bid is updated
  useEffect(() => {
    if (isStarted && !isStopped) {
      if (timer === 0) {
        // Proceed to the next player when the timer runs out
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
    setHighestBid(currentPlayer.minimumBid || slabDetails.basePrice); // Initialize highestBid
  }, [currentPlayerIndex]);

  const resetAuction = () => {
    setHighestBid(currentPlayer.minimumBid || slabDetails.basePrice); // Reset to current player's minimum bid
    setHighestBidder(null); // Clear the highest bidder
    setTimer(configTime); // Reset timer
  };

  const handleBidClick = useCallback(
    (ownerId, bidValue) => {
      if (!isStopped) {
        console.log("aaaaa");

        // Find the owner making the bid
        const owner = owners.find((o) => o.id === ownerId);
        console.log("Bidder Owner", owner.id);

        // Ensure the owner has enough units, bid is higher than the current highest, and they are not the highest bidder
        if (
          owner.unitsLeft >= bidValue &&
          bidValue >= highestBid &&
          owner !== highestBidder
        ) {
          // Get the current player's slab
          const cur_slab = currentPlayer.PSlab;

          // Get the maximum bid allowed for the current slab
          const cur_maxBid = slabs[cur_slab].maxBid;
          console.log("cur_slab:", cur_slab);
          console.log("cur_maxBid:", cur_maxBid);

          // If the bid matches the max bid for the current slab, handle random owner selection
          if (bidValue === cur_maxBid) {
            // Add the owner to the ownersWithMaxBid state array
            setOwnersWithMaxBid((prev) => {
              const updatedOwners = [...prev, owner];
              console.log("Updated ownersWithMaxBid:", updatedOwners);

              // Function to select one random owner from the updated array
              const random_owner =
                updatedOwners[Math.floor(Math.random() * updatedOwners.length)];

              console.log("This time Random Owner:", random_owner.id);

              // Set highest bid and highest bidder to the random owner
              setHighestBid(bidValue);
              setHighestBidder(random_owner);

              return updatedOwners; // Return the updated array
            });
          } else {
            // If the bid doesn't reach max bid, just update normally
            setHighestBid(bidValue);
            setHighestBidder(owner);
          }

          console.log("bidValue & highest bid:", bidValue, highestBid);
          setTimer(configTime); // Reset the timer when a bid is placed

          // Update the owner's bid value without deducting units from them
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
  const makeBid = (ownerId, isManualBid) => {
    if (!isStopped) {
      const owner = owners.find((o) => o.id === ownerId);
      const slabPlayers = owner.slabPlayers[currentPlayer.PSlab] || [];

      if (slabPlayers.length < 2) {
        // Add player to the owner's purchased list
        slabPlayers.push(currentPlayer.PName);
        owner.purchasedPlayers.push(currentPlayer.PName);

        // Update owners and ensure slab assignment is done properly
        setOwners(
          owners.map((o) => {
            if (o.id === ownerId) {
              return {
                ...o,
                slabPlayers: {
                  ...o.slabPlayers,
                  [currentPlayer.PSlab]: slabPlayers,
                },
              };
            }
            return o;
          })
        );

        // Deduct units only for manual bids
        if (isManualBid) {
          setOwners((prevOwners) =>
            prevOwners.map((o) => {
              if (o.id === ownerId) {
                return {
                  ...o,
                  unitsLeft: o.unitsLeft - highestBid, // Deduct only when it's a manual bid
                };
              }
              return o;
            })
          );
        }
      } else {
        // If the owner already has 2 players in this slab, auto-assign to the next owner
        const nextOwner = owners.find(
          (o) =>
            o.id !== ownerId &&
            (o.slabPlayers[currentPlayer.PSlab] || []).length < 2
        );

        if (nextOwner) {
          return makeBid(nextOwner.id, false); // Auto-assign without units deduction
        } else {
          // If all owners have 2 players in the same slab, assign to the first owner at base price
          const firstOwner = owners[0];
          firstOwner.purchasedPlayers.push(currentPlayer.PName);

          setOwners(
            owners.map((o) => {
              if (o.id === firstOwner.id) {
                return {
                  ...o,
                  slabPlayers: {
                    ...o.slabPlayers,
                    [currentPlayer.PSlab]: [currentPlayer.PName],
                  },
                };
              }
              return o;
            })
          );
        }
      }
      //movenext
    }
  };
  const displayResult = () => {
    console.log("Auction completed!");
    alert("Auction completed!");
  };
  const moveToNextNonZeroPlayer = () => {
    console.log("MOVE TO NEXT NON ZERO PLAYER")
    // Move to next player in pool or revisit queue if pool size is reached
    if (currentPlayerIndex < poolSize - 1 && playersList[currentPlayerIndex+1]!==0) {
      setCurrentPlayerIndex((prevIndex) => prevIndex + 1);
    } else if (playersList.some(player => player !== 0)) {
      alert("in assignPlayer... Revisiting Unbidded players!");
      // Restart the auction with players in the queue
      let nextNonZeroIndex = playersList.findIndex((player, index) => index > currentPlayerIndex && player !== 0);
      if (nextNonZeroIndex === -1) {
        nextNonZeroIndex = playersList.findIndex(player => player !== 0);
      }
      console.log("nextNonZeroIndex: ",nextNonZeroIndex, " for player:",playersList[nextNonZeroIndex])
      setCurrentPlayerIndex(nextNonZeroIndex);
    } else {
      setTimer(0);
      setIsStarted(false);
      displayResult();
    }
  };
  useEffect(() => {
    console.log("Updated PlayersList: ", playersList);
    console.log("Updated UnbiddedPlayersQueue: ", unbiddedPlayersQueue);
  }, [playersList]);
  const assignPlayerToHighestBidder = () => {
    if (highestBidder) {
      // Handle case where there is a valid highest bidder
      const updatedOwners = owners.map((o) => {
        if (o.id === highestBidder.id) {
          return {
            ...o,
            unitsLeft: o.unitsLeft - highestBid,
            slabPlayers: {
              ...o.slabPlayers,
              [currentPlayer.PSlab]: [
                ...(o.slabPlayers[currentPlayer.PSlab] || []),
                currentPlayer.PName,
              ],
            },
          };
        }
        return o;
      });
      setOwners(updatedOwners);
      makeBid(highestBidder.id, true); // Manual bid
      // If the player was in the unbiddedPlayersQueue, remove them
      console.log("About to remove player from UnbiddedPlayerQueue!")
      setUnbiddedPlayersQueue((prevQueue) => 
        prevQueue.filter((player) => player.PID !== currentPlayer.PID)
      );
      setPlayersList((prevPlayers) => {
        const updatedPlayers = [...prevPlayers];  // Make a copy of the array
        updatedPlayers[currentPlayerIndex] = 0;   // Set the value at the specific index to 0
        return updatedPlayers;                    // Return the updated array
      });
      console.log("My PlayersList: ",playersList)

    } else {
      // No highest bidder, add player index to queue
      console.log("INSIDE else of assignPlayerToHighestBidder(UNBIDDED), for player at index:",currentPlayerIndex);
      console.log("for player:",currentPlayer);
      console.log("Unbidded Players: ",unbiddedPlayersQueue)

      // setPlayersList((prevPlayers) => {
      //   const updatedPlayers = [...prevPlayers];  // Make a copy of the array
      //   updatedPlayers[currentPlayerIndex] = 0;   // Set the value at the specific index to 0
      //   return updatedPlayers;                    // Return the updated array
      // });
      console.log("My PlayersList: ",playersList)
    }
    moveToNextNonZeroPlayer();
   
    resetAuction();
  };
  const handleStart = () => {
    setIsStarted(true);
    setIsStopped(false);
  };

  const handleStop = () => {
    setIsStarted(false);
    setIsStopped(true);
  };

  const handleDiscard = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="auction-container">
      <div className="player-card">
        <div>Auction ID: A07</div>
        <div>Player Card</div>
        <img src="<profile photo>" alt="Player" />
        <div>Slab: {currentPlayer.PSlab}</div>
        <div>Minimum Bid: {slabDetails.basePrice}</div>
        <div>Maximum Bid: {slabDetails.maxBid}</div>
        <div>Player ID: {currentPlayer.PID}</div>
        <div>Name: {currentPlayer.PName}</div>
        <div>Age: {currentPlayer.PAge}</div>
        <div>Height: {currentPlayer.PHeight}</div>
        <div>Weight: {currentPlayer.PWeight}</div>
        <div>Role: {currentPlayer.PRole}</div>
      </div>

      <div style={{ flexGrow: 1, marginLeft: "20px" }}>
        <div className="bid-info">
          <div>Current Bid: {highestBid}</div>
          <div>Highest Bidder: {highestBidder ? highestBidder.id : "None"}</div>
          <div>Pool Size: {poolSize}</div>
          <div>Timer (seconds): {timer}</div>
        </div>

        {owners.map((owner) => (
          <div key={owner.id} className="owner-card">
            <div>Owner {owner.id}</div>
            <div>Units Left: {owner.unitsLeft}</div>
            <div className="bid-options">
              Available Bids:
              {isStarted &&
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
                !highestBidder || highestBidder.id === owner.id || isStopped
              }
              onClick={() => !isStopped && makeBid(owner.id)}
            >
              Make Bid
            </button>
          </div>
        ))}
      </div>

      <div className="control-buttons">
        <button onClick={handleStart}>Start</button>
        <button onClick={handleStop}>Stop</button>
        <button onClick={handleDiscard}>Discard</button>
        <button onClick={resetAuction}>Reset this bid</button>
      </div>
    </div>
  );
};

export default Auction;
