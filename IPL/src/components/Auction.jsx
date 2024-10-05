import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";


const Auction = ({ players, poolSize }) => {
  console.log("auction render");
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [highestBid, setHighestBid] = useState(players[currentPlayerIndex]?.minimumBid || 0); // Fallback to 0 if player[0] is undefined
  const [highestBidder, setHighestBidder] = useState(null);
  const [timer, setTimer] = useState(10);
  const [owners, setOwners] = useState([
    { id: 1, unitsLeft: 2500, purchasedPlayers: [], slabPlayers: {} },
    { id: 2, unitsLeft: 2500, purchasedPlayers: [], slabPlayers: {} },
    { id: 3, unitsLeft: 2500, purchasedPlayers: [], slabPlayers: {} },
  ]);

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
  useEffect(() => {
    console.log("Current Player: ", currentPlayer);
    console.log("Highest Bidder: ", highestBidder);
    console.log("Highest Bid: ", highestBid);
    // Get the slab details for the current player
    console.log("Slab Details: ", slabDetails);
  }, [])
  const currentPlayer = players[currentPlayerIndex];

  const slabDetails = slabs[currentPlayer.PSlab];

  // Reset the timer and start countdown when bid is updated
  useEffect(() => {
    console.log("sssssss");
    
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

  const assignPlayerToHighestBidder = () => {
    if (highestBidder) {
      makeBid(highestBidder.id); // Assign player to highest bidder
    } else {
      if (currentPlayerIndex < poolSize - 1) {
        setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length); // Move to the next player
      } else {
        alert("Auction completed!");
        setIsStarted(false); // Stop the timer
      }
    }
    resetAuction();
  };

  const resetAuction = () => {
    setHighestBid(currentPlayer.minimumBid || slabDetails.basePrice); // Reset to current player's minimum bid
    setHighestBidder(null); // Clear the highest bidder
    setTimer(10); // Reset timer
  };
  // const handleBidClick = useCallback((ownerId, bidValue) => {
  //   if (!isStopped) {
  //     console.log("aaaaa");
      
  //     const owner = owners.find((o) => o.id === ownerId);
  //     console.log("Bidder Owner", owner.id)
  //     if (owner.unitsLeft >= bidValue && bidValue > highestBid && owner != highestBidder) {
  //       setHighestBid(bidValue); // Update highestBid using the previous state
  //       setHighestBidder(owner);
  //       console.log("bidValue & highest bid:",bidValue,highestBid)
  //       setTimer(10); // Reset the timer when a bid is placed
  
  //       const updatedOwners = owners.map((o) => {
  //         if (o.id === ownerId) {
  //           return { ...o, unitsLeft: o.unitsLeft - bidValue };
  //         }
  //         return o;
  //       });
  //       setOwners(updatedOwners);
  //     }
  //   }
  // }, [highestBid, isStopped, owners, setHighestBidder, setTimer, setOwners]);



  const handleBidClick = useCallback((ownerId, bidValue) => {
    if (!isStopped) {
      console.log("aaaaa");
      
      const owner = owners.find((o) => o.id === ownerId);
      console.log("Bidder Owner", owner.id)
      if (owner.unitsLeft >= bidValue && bidValue > highestBid && owner != highestBidder) {
        setHighestBid(bidValue); // Update highestBid using the previous state
        setHighestBidder(owner);
        console.log("bidValue & highest bid:",bidValue,highestBid)
        setTimer(10); // Reset the timer when a bid is placed
  
        const updatedOwners = owners.map((o) => {
          if (o.id === ownerId) {
            return { ...o, unitsLeft: o.unitsLeft - bidValue };
          }
          return o;
        });
        setOwners(updatedOwners);
      }
    }
  }, [highestBid, isStopped, owners, setHighestBidder, setTimer, setOwners]);

  const makeBid = (ownerId) => {
    if (!isStopped) {
      const owner = owners.find((o) => o.id === ownerId);
      const slabPlayers = owner.slabPlayers[currentPlayer.PSlab] || [];
      if (slabPlayers.length < 2) {
        slabPlayers.push(currentPlayer.PID);
        owner.purchasedPlayers.push(currentPlayer.PID);
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
      } else {
        // Auto-assign to the next owner if the current owner has already purchased two players from the same slab
        const nextOwner = owners.find(
          (o) => o.id !== ownerId && !o.slabPlayers[currentPlayer.PSlab]
        );
        if (nextOwner) {
          makeBid(nextOwner.id);
        } else {
          // If all owners have already purchased two players from the same slab, assign the player to the first owner at the base price
          const firstOwner = owners[0];
          firstOwner.purchasedPlayers.push(currentPlayer.PID);
          setOwners(
            owners.map((o) => {
              if (o.id === firstOwner.id) {
                return {
                  ...o,
                  slabPlayers: {
                    ...o.slabPlayers,
                    [currentPlayer.PSlab]: [currentPlayer.PID],
                  },
                };
              }
              return o;
            })
          );
        }
      }
    }
    if (currentPlayerIndex < poolSize - 1) {
      setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length); // Move to the next player
    } else {
      displayResult();
    }
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
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "20px",
      }}
    >
      <div
        style={{ border: "1px solid gray", padding: "10px", width: "250px" }}
      >
        <div>Auction ID: A07</div>
        <div>Player Card</div>
        <img
          src="<profile photo>"
          alt="Player"
          style={{ width: "100%", height: "auto" }}
        />
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div>Current Bid: {highestBid}</div>
          <div>Highest Bidder:{highestBidder ? highestBidder.id : "None"}</div>
          <div>Timer (seconds): {timer}</div>
        </div>

        {owners.map((owner) => (
          <div
            key={owner.id}
            style={{
              border: "1px solid gray",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <div>Owner {owner.id}</div>
            <div>Units Left: {owner.unitsLeft}</div>
            <div>
              Available Bids:
              {isStarted && [...Array(Math.floor((slabDetails.maxBid - slabDetails.basePrice) / 50) + 1)]
                .map((_, i) => slabDetails.basePrice + i * 50)
                .filter(
                  (bidValue) => bidValue >= highestBid || bidValue < owner.unitsLeft
                )
                .map((bidValue) => (
                  <span
                    key={bidValue}
                    style={{
                      marginRight: "5px",
                      color:highestBid > bidValue ? "red" : "black",
                      textDecoration:highestBid > bidValue ? "line-through" : "none",
                      cursor: bidValue === slabDetails.maxBid
                        ? owner.unitsLeft >= highestBid
                          ? "pointer"
                          : "not-allowed"
                        : owner.unitsLeft > highestBid
                        ? "pointer"
                        : "not-allowed",
                    }}
                    onClick={() =>handleBidClick(owner.id, bidValue)
                    }
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
              } // Add a check for `highestBidder`
              onClick={() => !isStopped && makeBid(owner.id)}
              style={{
                backgroundColor:
                  !highestBidder || highestBidder.id === owner.id || isStopped
                    ? "gray"
                    : "blue",
                color: "white",
                padding: "5px 10px",
                border: "none",
                borderRadius: "5px",
                cursor:
                  !highestBidder || highestBidder.id === owner.id || isStopped
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Make Bid
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <button onClick={handleStart}>Start</button>
        <button onClick={handleStop}>Stop</button>
        <button onClick={handleDiscard}>Discard</button>
        <button onClick={resetAuction}>Reset this bid</button>
      </div>
    </div>
  );
};

export default Auction;
