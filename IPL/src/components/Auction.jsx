import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auction.css";
import img1 from "../static/img1.jpg";
import img2 from "../static/img2.jpg";
import img3 from "../static/img3.jpg";
import img4 from "../static/img4.jpg";
import img5 from "../static/img5.jpg";
import img6 from "../static/img6.jpg";
import img9 from "../static/img9.jpg";
import img8 from "../static/img8.jpg";
import img7 from "../static/img7.jpg";
const images = [img1, img2, img3, img4, img5, img6, img7, img8, img9];
const Auction = ({ players, poolSize, configTime }) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playersList, setPlayersList] = useState(players.slice(0, poolSize));
  const [highestBid, setHighestBid] = useState(
    playersList[currentPlayerIndex]?.minimumBid || 0
  );
  const [highestBidder, setHighestBidder] = useState(null);
  const [unbiddedPlayersQueue, setUnbiddedPlayersQueue] = useState([
    ...playersList,
  ]);
  const getPlayerImage = (playerIndex) => {
    // Use modulo to repeat the images for players beyond the 6th
    return images[playerIndex % images.length];
  };
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

  const slabs = {
    A: { basePrice: 200, maxBid: 800 },
    B: { basePrice: 150, maxBid: 800 },
    C: { basePrice: 100, maxBid: 700 },
    D: { basePrice: 80, maxBid: 700 },
    E: { basePrice: 50, maxBid: 400 },
  };
  useEffect(() => {
    if (players && players.length > 0) {
      setPlayersList(players.slice(0, poolSize));
      setUnbiddedPlayersQueue([...players]);
    }
  }, [players, poolSize]);
  const currentPlayer = playersList[currentPlayerIndex]
    ? playersList[currentPlayerIndex]
    : {
        PID: 9999,
        PName: "COMPLETED!",
        PAge: 99,
        PHeight: "COMPLETED!",
        PWeight: "COMPLETED!",
        PRole: "COMPLETED!",
        PSlab: "A",
      };

  const slabDetails = slabs[currentPlayer.PSlab];
  const slabMaxSize = {
    A: 2,
    B: 2,
    C: 2,
    D: 1,
    E: 1,
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
    setHighestBid(currentPlayer.minimumBid || slabDetails.basePrice);
  }, [currentPlayerIndex]);
  useEffect(() => {
    // console.log("PlayersList:", playersList);
    // console.log("UnbiddedPlayerQUeue:", unbiddedPlayersQueue);
    // console.log("players:",players)
  }, [timer]);

  const resetAuction = () => {
    setHighestBid(currentPlayer.minimumBid || slabDetails.basePrice);
    setHighestBidder(null);
    setTimer(configTime);
  };

  const handleBidClick = useCallback(
    (ownerId, bidValue) => {
      if (!isStopped) {
        console.log("aaaaa");

        const owner = owners.find((o) => o.id === ownerId);
        console.log("Bidder Owner", owner.id);

        if (
          owner.unitsLeft >= bidValue &&
          bidValue >= highestBid &&
          owner !== highestBidder
        ) {
          const cur_slab = currentPlayer.PSlab;

          const cur_maxBid = slabs[cur_slab].maxBid;
          console.log("cur_slab:", cur_slab);
          console.log("cur_maxBid:", cur_maxBid);

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
  const makeBid = (ownerId) => {
    if (!isStopped) {
      const owner = owners.find((o) => o.id === ownerId);
      const slabPlayers = owner.slabPlayers[currentPlayer.PSlab] || [];

      if (slabPlayers.length < slabMaxSize[currentPlayer.PSlab]) {
        slabPlayers.push(currentPlayer.PName);
        owner.purchasedPlayers.push(currentPlayer.PName);

        setOwners(
          owners.map((o) => {
            if (o.id === ownerId) {
              return {
                ...o,
                unitsLeft: o.unitsLeft - highestBid,
                slabPlayers: {
                  ...o.slabPlayers,
                  [currentPlayer.PSlab]: slabPlayers,
                },
              };
            }
            return o;
          })
        );
        setUnbiddedPlayersQueue((prevQueue) =>
          prevQueue.filter((player) => player.PID !== currentPlayer.PID)
        );
        setPlayersList((prevPlayers) => {
          const updatedPlayers = [...prevPlayers];
          updatedPlayers[currentPlayerIndex] = 0;
          return updatedPlayers;
        });
      } else {
        alert(
          `Owner ${owner.id} cannot purchase more players from ${currentPlayer.PSlab}`
        );
      }
    }
  };

  const saveAuctionData = async (auctionData) => {
    try {
      const response = await fetch("/api/saveAuction", {
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

    const auctionData = {
      owners: owners.map((owner) => ({
        id: owner.id,
        unitsLeft: owner.unitsLeft,
        purchasedPlayers: owner.purchasedPlayers,
        slabPlayers: owner.slabPlayers,
      })),
    };

    try {
      await saveAuctionData(auctionData);
      console.log("Auction data saved successfully!");
    } catch (error) {
      console.error("Error saving auction data:", error);
    }
  };

  const moveToNextNonZeroPlayer = () => {
    console.log("MOVE TO NEXT NON ZERO PLAYER");
    if (
      currentPlayerIndex < poolSize - 1 &&
      playersList[currentPlayerIndex + 1] !== 0
    ) {
      setCurrentPlayerIndex((prevIndex) => prevIndex + 1);
    } else if (playersList.some((player) => player !== 0)) {
      console.log("Current playerList:", playersList);
      let nextNonZeroIndex = playersList.findIndex(
        (player, index) => index > currentPlayerIndex && player !== 0
      );
      if (nextNonZeroIndex === -1) {
        nextNonZeroIndex = playersList.findIndex((player) => player !== 0);
      }
      console.log(
        "nextNonZeroIndex: ",
        nextNonZeroIndex,
        " for player:",
        playersList[nextNonZeroIndex]
      );
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
    console.log("CURRENT LIST OF OWNERS:", owners);
    if (highestBidder) {
      makeBid(highestBidder.id);
    } else {
      console.log("NO HIGHEST BIDDER", currentPlayerIndex);
      console.log("for player:", currentPlayer);
      console.log("Unbidded Players: ", unbiddedPlayersQueue);

      console.log("My PlayersList: ", playersList);
    }
    if (playersList.every((player) => player === 0)) {
      setTimer(0);
      setIsStarted(false);
      displayResult();
    } else {
      moveToNextNonZeroPlayer();
      resetAuction();
    }
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
    <> 
    <div className="auction-container">
      {/* <div className="player-card">
        <div>Auction ID: A07</div>
        <div>Player Card</div>
        <img src={getPlayerImage(currentPlayerIndex)} alt="Player"  style={{ width: "240px", height: "240px", objectFit: "cover" }}  />
        <div>Slab: {currentPlayer.PSlab}</div>
        <div>Minimum Bid: {slabDetails.basePrice}</div>
        <div>Maximum Bid: {slabDetails.maxBid}</div>
        <div>Player ID: {currentPlayer.PID}</div>
        <div>Name: {currentPlayer.PName}</div>
        <div>Age: {currentPlayer.PAge}</div>
        <div>Height: {currentPlayer.PHeight}</div>
        <div>Weight: {currentPlayer.PWeight}</div>
        <div>Role: {currentPlayer.PRole}</div>
      </div> */}
<div className="player-card">
  <div className="important-text">Auction ID: A07</div>
  <div className="important-text">Player Card</div>
  <img
    src={getPlayerImage(currentPlayerIndex)}
    alt="Player"
    style={{ width: "240px", height: "240px", objectFit: "cover" }}
  />
  <div className="slab">Slab: {currentPlayer.PSlab}</div>
  <div className="bid-info">
    <div>Minimum Bid: {slabDetails.basePrice}</div>
    <div>Maximum Bid: {slabDetails.maxBid}</div>
  </div>
  <div className="important-text">Player ID: {currentPlayer.PID}</div>
  <div className="player-name">Name: {currentPlayer.PName}</div>
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
