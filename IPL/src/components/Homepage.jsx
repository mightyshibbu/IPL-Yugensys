import React, { useState, useEffect } from 'react';
import '../styles/Homepage.css'; // Assuming you will style this separately
import { useNavigate } from 'react-router-dom';
import waterImage from '../static/water.png';
import Instructions from './Instructions'

const HomePage = () => {
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);
  const [configData, setConfigData] = useState({
    configTime: 180,
    numSlabs: 0,
    totalOwners: 3,
    poolSize: 0
  });

  // Add and remove homepage class on mount/unmount
  useEffect(() => {
    document.body.classList.add('homepage');
    return () => {
      document.body.classList.remove('homepage');
    };
  }, []);

  // Load configuration data from localStorage
  useEffect(() => {
    const loadConfigData = () => {
      try {
        // Load auction configuration
        const auctionConfigRaw = localStorage.getItem("AuctionData");
        if (auctionConfigRaw) {
          const auctionConfig = JSON.parse(auctionConfigRaw);
          setConfigData(prev => ({
            ...prev,
            configTime: auctionConfig.configTime || 180,
            totalOwners: auctionConfig.totalOwners || 3
          }));
        }

        // Load slabs configuration
        const slabsConfigRaw = localStorage.getItem("slabsConfig");
        if (slabsConfigRaw) {
          const slabsConfig = JSON.parse(slabsConfigRaw);
          setConfigData(prev => ({
            ...prev,
            numSlabs: slabsConfig.length || 0
          }));
        }

        // Load pool size
        const poolSize = localStorage.getItem("poolSize");
        if (poolSize) {
          setConfigData(prev => ({
            ...prev,
            poolSize: parseInt(poolSize) || 0
          }));
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
      }
    };

    loadConfigData();
  }, []);

  const handleConfig = () => {
    console.log("Navigating to Configuration");
    navigate("/auctionConfig", { replace: true });
  };

  const handleBeginAuction = () => {
    console.log("Beginning Auction");
    
    // Check for all required configurations
    const requiredConfigs = {
      "AuctionData": "Auction configuration (timer, owners, pool size, units)",
      "PlayerData": "Player data",
      "slabsConfig": "Slab configurations",
      "AuctionSequence": "Auction sequence",
      "OwnerUnits": "Owner units allocation"
    };

    const missingConfigs = [];
    
    // Check each required configuration
    for (const [key, description] of Object.entries(requiredConfigs)) {
      const config = localStorage.getItem(key);
      if (!config) {
        missingConfigs.push(description);
      }
    }

    // If any configurations are missing, show alert and return
    if (missingConfigs.length > 0) {
      alert(`Cannot begin auction. Missing required configurations:\n${missingConfigs.join('\n')}\n\nPlease configure all settings before beginning the auction.`);
      return;
    }

    // Validate the configurations
    try {
      const auctionData = JSON.parse(localStorage.getItem("AuctionData"));
      const playerData = JSON.parse(localStorage.getItem("PlayerData"));
      const slabsConfig = JSON.parse(localStorage.getItem("slabsConfig"));
      const auctionSequence = JSON.parse(localStorage.getItem("AuctionSequence"));
      const ownerUnits = JSON.parse(localStorage.getItem("OwnerUnits"));

      // Validate auction data
      if (!auctionData.configTime || !auctionData.totalOwners || !auctionData.units) {
        throw new Error("Invalid auction configuration");
      }

      // Validate player data
      if (Object.keys(playerData).length === 0) {
        throw new Error("No players configured");
      }

      // Validate slabs configuration
      if (!Array.isArray(slabsConfig) || slabsConfig.length === 0) {
        throw new Error("Invalid slabs configuration");
      }

      // Validate auction sequence
      if (!Array.isArray(auctionSequence) || auctionSequence.length === 0) {
        throw new Error("Invalid auction sequence");
      }

      // Validate owner units
      if (Object.keys(ownerUnits).length !== auctionData.totalOwners) {
        throw new Error("Invalid owner units allocation");
      }

      // If all validations pass, navigate to auction
      navigate("/auction", { replace: true });
    } catch (error) {
      alert(`Error validating configurations: ${error.message}\nPlease ensure all settings are properly configured.`);
      return;
    }
  };

  const handleViewPrevious = () => {
    console.log("Viewing Previous Auctions");
    navigate("/previousAuctions", { replace: true });
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };

  const handleClearSettings = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="homepage-container">
      {/* Rotating Image */}
      <div className="rotating-image-container">
        <img src={waterImage} alt="Water" className="rotating-image" />
      </div>
      <header className="auction-header" style={{marginBottom:"30px"}}>
        <h1>IPL LIVE AUCTION</h1>
        <h1>v6.1</h1>
      </header>
      <div className="button-container">
        <button className="auction-btn" onClick={handleConfig}>Configure</button>
        <button className="auction-btn" onClick={handleBeginAuction}>Begin Auction</button>
        <button className="auction-btn" onClick={handleViewPrevious}>View History</button>
      </div>
      <div className="button-container">
        <label className='auction-btn'>Timer(sec): {configData.configTime}</label>
        <label className='auction-btn'>Owners: {configData.totalOwners}</label>
        <label className='auction-btn'>Slabs: {configData.numSlabs}</label>
        <label className='auction-btn'>Pool Size: {configData.poolSize}</label>
      </div>
      <div className="button-container">
        <button className="auction-instruction-btn" onClick={handleShowInstructions}>Instructions</button>
        <button className="auction-instruction-btn clear-settings-btn" onClick={handleClearSettings}>Clear Auction Settings</button>
      </div>
      <div>
        {showInstructions && <Instructions onClose={handleCloseInstructions} />}
      </div>
    </div>
  );
};

export default HomePage;
