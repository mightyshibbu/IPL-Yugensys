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

      // Distribute the total units among the owners if not already set
      if (!savedOwnerUnits) {
        const initialUnits = {};
        const unitsPerOwner = auctionConfig.units; // Units per owner
        for (let i = 1; i <= totalOwners; i++) {
          initialUnits[i] = unitsPerOwner;
        }
        setOwnerUnits(initialUnits);
        localStorage.setItem("OwnerUnits", JSON.stringify(initialUnits)); // Save initial owner units
      }
    }

    // Load PlayerData and Purchases
    if (savedPlayerData) {
      setPlayerData(JSON.parse(savedPlayerData));
    }
    if (savedPurchases) {
      setPurchases(JSON.parse(savedPurchases));
    }
    if (savedOwnerUnits) {
      setOwnerUnits(JSON.parse(savedOwnerUnits));
    }
  }, [totalOwners]);

  // Save PreAuctionData, AuctionData, and OwnerUnits to localStorage whenever changes occur
  useEffect(() => {
    localStorage.setItem("PreAuctionData", JSON.stringify(purchases));
    localStorage.setItem("AuctionData", JSON.stringify(auctionData)); // Save auction configuration
    localStorage.setItem("OwnerUnits", JSON.stringify(ownerUnits)); // Save owner units
    console.log("ownerUnits:", ownerUnits)
  }, [purchases, auctionData, ownerUnits]);

  // Handle purchasing a player
  const handlePurchase = (player, slab, ownerId) => {
    const purchasePrice = bidValues[player.PID] || 0;
    const slabMinBid = getSlabMinBid(slab);
    if (purchasePrice < slabMinBid) {
      alert(`Price should be at least ${slabMinBid} units for players in the ${slab} slab.`);
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

  // Function to get base price (min bid) for a given slab
  const getSlabMinBid = (slab) => {
    const slabsConfig = JSON.parse(localStorage.getItem("slabsConfig")) || [];
    const slabConfig = slabsConfig.find((config) => config.name === slab);
    return slabConfig ? slabConfig.basePrice : 0;
  };

  return (
    <div>
      <h1>Pre-Auction: Owner {currentOwner}</h1>
      {/* Display the remaining units for the current owner */}
      <p>Remaining Units: {ownerUnits[currentOwner] || 0}</p>

      {/* Button to go to the next owner */}
      <button
        onClick={() => setCurrentOwner((prev) => (prev % totalOwners) + 1)}
      >
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
                <th>Base Price (Min Bid)</th>
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
                  <td>{getSlabMinBid(slab)}</td>
                  <td>
                    <input
                      type="number"
                      min={getSlabMinBid(slab)}
                      value={bidValues[player.PID] || ""}
                      onChange={(e) =>
                        setBidValues((prev) => ({
                          ...prev,
                          [player.PID]: Number(e.target.value),
                        }))
                      }
                      placeholder={`Min ${getSlabMinBid(slab)}`}
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
