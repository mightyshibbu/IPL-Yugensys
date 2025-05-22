import React, { useState, useEffect } from "react";
import '../styles/PreAuction.css';
import { useNavigate } from "react-router-dom";

const PreAuction = ({ totalOwners }) => {
  const [playerData, setPlayerData] = useState({});
  const [purchases, setPurchases] = useState({});
  const [currentOwner, setCurrentOwner] = useState(1);
  const [bidValues, setBidValues] = useState({});
  const [ownerUnits, setOwnerUnits] = useState({}); // Track remaining units per owner
  const [auctionData, setAuctionData] = useState({}); // Auction configuration data
  const [actualTotalOwners, setActualTotalOwners] = useState(3); // Default to 3 if not set
  const navigate = useNavigate();

  // Load PlayerData, PreAuctionData, AuctionData, and OwnerUnits from localStorage
  useEffect(() => {
    const savedPlayerData = localStorage.getItem("PlayerData");
    const savedPurchases = localStorage.getItem("PreAuctionData");
    const savedOwnerUnits = localStorage.getItem("OwnerUnits");
    const savedAuctionData = localStorage.getItem("AuctionData");

    // Load AuctionData and set initial state
    if (savedAuctionData) {
      const auctionConfig = JSON.parse(savedAuctionData);
      setAuctionData(auctionConfig);
      setActualTotalOwners(auctionConfig.totalOwners || 3); // Set actual total owners from config

      // Always initialize owner units based on auction config
      const initialUnits = {};
      const unitsPerOwner = auctionConfig.units; // Units per owner
      for (let i = 1; i <= auctionConfig.totalOwners; i++) {
        initialUnits[i] = unitsPerOwner;
      }
      setOwnerUnits(initialUnits);
      localStorage.setItem("OwnerUnits", JSON.stringify(initialUnits)); // Save initial owner units
    }

    // Load PlayerData and Purchases
    if (savedPlayerData) {
      setPlayerData(JSON.parse(savedPlayerData));
    }
    if (savedPurchases) {
      setPurchases(JSON.parse(savedPurchases));
    }
  }, []); // Remove totalOwners dependency since we get it from auctionConfig

  // Save PreAuctionData and OwnerUnits to localStorage whenever changes occur
  useEffect(() => {
    localStorage.setItem("PreAuctionData", JSON.stringify(purchases));
    localStorage.setItem("OwnerUnits", JSON.stringify(ownerUnits));
    console.log("Updated owner units:", ownerUnits);
  }, [purchases, ownerUnits]);

  // Function to get max bid for a given slab
  const getSlabMaxBid = (slab) => {
    const slabsConfig = JSON.parse(localStorage.getItem("slabsConfig")) || [];
    const slabConfig = slabsConfig.find((config) => config.name === slab);
    return slabConfig ? slabConfig.maxBid : 0;
  };

  // Handle purchasing a player
  const handlePurchase = (player, slab, ownerId) => {
    const purchasePrice = bidValues[player.PID] || 0;
    const slabMaxBid = getSlabMaxBid(slab);
    if (purchasePrice < slabMaxBid) {
      alert(`Price should be at least ${slabMaxBid} units for players in the ${slab} slab.`);
      return;
    }

    // Check if the current owner has enough units left
    if (ownerUnits[ownerId] < purchasePrice) {
      alert("You do not have enough units left to purchase this player.");
      return;
    }
    // Update the remaining units for the current owner
    setOwnerUnits((prevUnits) => ({
      ...prevUnits,
      [ownerId]: prevUnits[ownerId] - purchasePrice,
    }));

    // Update purchases
    setPurchases((prev) => ({
      ...prev,
      [player.PID]: { price: purchasePrice, owner: ownerId, player },
    }));
  };

  const handleBack = () => {
    navigate("/playerConfig", { replace: true });
  };
  const handleBeginAuction = () => {
    // Get PlayerData from localStorage
    const storedPlayerData = localStorage.getItem("PlayerData");

    if (storedPlayerData) {
      const playerDataObj = JSON.parse(storedPlayerData);
      // Remove purchased players from each slab array in playerDataObj
      Object.keys(playerDataObj).forEach((slab) => {
        playerDataObj[slab] = playerDataObj[slab].filter(
          (player) => !purchases[player.PID]
        );
      });


      // Save updated PlayerData back to 
      localStorage.setItem("PlayerData", JSON.stringify(playerDataObj));
    }
    navigate("/sequence", { replace: true });
  };

  // Update currentOwner when switching owners
  const handleSwitchOwner = () => {
    setCurrentOwner((prev) => (prev % actualTotalOwners) + 1);
  };

  return (
    <div>
      <h1>Pre-Auction: Owner {currentOwner}</h1>
      {/* Display the remaining units for the current owner */}
      <p>Remaining Units: {ownerUnits[currentOwner] || 0}</p>

      {/* Button to go to the next owner */}
      <button onClick={handleSwitchOwner}>
        Switch Owner
      </button>

      {Object.entries(playerData).map(([slab, players]) => (
        <div key={slab}>
          <h3>Slab: {slab}</h3>
          <table>
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Role</th>
                <th>Age</th>
                <th>Height</th>
                <th>Weight</th>
                <th>Minimum Bid</th>
                <th>Purchase Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.filter((player) => !purchases[player.PID]).map((player) => (
                <tr key={player.PID}>
                  <td>{player.PName}</td>
                  <td>{player.PRole}</td>
                  <td>{player.PAge}</td>
                  <td>{player.PHeight}</td>
                  <td>{player.PWeight}</td>
                  <td>{getSlabMaxBid(slab)}</td>
                  <td>
                    <input
                      type="number"
                      min={getSlabMaxBid(slab)}
                      value={bidValues[player.PID] || ""}
                      onChange={(e) =>
                        setBidValues((prev) => ({
                          ...prev,
                          [player.PID]: Number(e.target.value),
                        }))
                      }
                      placeholder={`Min ${getSlabMaxBid(slab)}`}
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => handlePurchase(player, slab, currentOwner)}
                    >
                      Purchase
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <button className="ok-btn" onClick={handleBeginAuction}>
        Begin Auction
      </button>
      <button className="ok-btn" onClick={handleBack}>
        Back
      </button>
    </div>
  );
};

export default PreAuction;
