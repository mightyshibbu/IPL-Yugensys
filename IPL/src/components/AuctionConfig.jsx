import React, { useState, useEffect } from "react";
import "../styles/AuctionConfig.css";
import { useNavigate } from "react-router-dom";

const AuctionConfig = ({
  units,
  setUnits,
  poolSize,
  setPoolSize,
  configTime,
  setConfigTime,
  numSlabs,
  setNumSlabs,
  totalOwners,
  setTotalOwners,
}) => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  // Load AuctionData from localStorage when component mounts
  useEffect(() => {
    const savedData = localStorage.getItem("AuctionData");
    if (savedData) {
      const auctionData = JSON.parse(savedData);
      setConfigTime(auctionData.configTime || "");
      setTotalOwners(auctionData.totalOwners || "");
      setPoolSize(auctionData.poolSize || "");
    //   setNumSlabs(auctionData.numSlabs || "");
      setUnits(auctionData.units || "");
    }
  }, [setConfigTime, setTotalOwners, setPoolSize, setNumSlabs, setUnits]);

  // Input change handlers
  const handleTimeChange = (event) => {
    setConfigTime(event.target.value);
  };

  const handleUnitsChange = (event) => {
    setUnits(event.target.value);
  };

  const handlePoolSizeChange = (event) => {
    setPoolSize(event.target.value);
  };

//   const handleSlabsChange = (event) => {
//     setNumSlabs(event.target.value);
//   };

  const handleOwnersChange = (event) => {
    setTotalOwners(event.target.value);
  };

  const handleOk = () => {
    // Validate only if values have been changed and are required
    if (configTime === undefined || configTime < 5 || configTime > 200) {
      alert("Bid time must be between 5 and 200 seconds.");
      return;
    }
    if (totalOwners === undefined || totalOwners < 2 || totalOwners > 6) {
      alert("Number of owners must be between 2 and 6.");
      return;
    }
    if (poolSize === undefined || poolSize > 36) {

       
      alert(`Pool size must be between ${totalOwners} and ${poolSize}.`);
      return;
    }
    if (units === undefined || units < 1) {
      alert("Units must be at least 1.");
      return;
    }
  
    // Create AuctionData object
    const AuctionData = {
      configTime,   // Bid time
      totalOwners,  // Number of owners
      poolSize,     // Player pool size
      units         // Total units per owner
    };
  
    // Save AuctionData to localStorage
    localStorage.setItem("AuctionData", JSON.stringify(AuctionData));
  
    // Navigate to next page
    navigate("/slabConfig", { replace: true });
  };
  

  return (
    <div className="configure-player-list">
      <h1 className="title">Auction Configuration</h1>

      {/* Bid Time Input */}
      <div className="input-container">
        <label>Bid Time (3-200 seconds): </label>
        <input
          type="number"
          value={configTime}
          onChange={handleTimeChange}
          className="input-field"
          placeholder="Enter bid time"
        />
      </div>

      {/* Owners Input */}
      <div className="input-container">
        <label>Number of Owners (2-6): </label>
        <input
          type="number"
          value={totalOwners}
          onChange={handleOwnersChange}
          className="input-field"
          placeholder="Enter number of owners"
        />
      </div>

      {/* Pool Size Input */}
      <div className="input-container">
        <label>Players Pool Size (min {totalOwners}, max 36): </label>
        <input
          type="number"
          value={poolSize}
          onChange={handlePoolSizeChange}
          className="input-field"
          placeholder="Enter player pool size"
        />
      </div>

      {/* Slabs Input */}
      {/* <div className="input-container">
        <label>Number of Slabs (1-10): </label>
        <input
          type="number"
          value={numSlabs}
          onChange={handleSlabsChange}
          className="input-field"
          placeholder="Enter number of slabs"
        />
      </div> */}

      {/* Units Input */}
      <div className="input-container">
        <label>Total Units per Owner: </label>
        <input
          type="number"
          value={units}
          onChange={handleUnitsChange}
          className="input-field"
          placeholder="Enter total units per owner"
        />
      </div>

      <button className="ok-btn" onClick={handleOk}>
        OK
      </button>
    </div>
  );
};

export default AuctionConfig;
