import React, { useState, useEffect } from 'react';
import "../styles/Configuration.css"; // You can add styles here
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
function Configuration({ players, numSlabs, setNumSlabs, poolSize, totalOwners, setTotalOwners, setPoolSize, setSlabs, slabs }) {
  const [ownersConfirmed, setOwnersConfirmed] = useState(false);
  const [poolSizeConfirmed, setPoolSizeConfirmed] = useState(false);
  const [slabsConfirmed, setSlabsConfirmed] = useState(false);
  const [minSlabs, setMinSlabs] = useState(1);
  const [maxSlabs, setMaxSlabs] = useState(1);

  // Handler for saving number of owners
  const handleSaveOwners = () => {
    if (totalOwners >= 2 && totalOwners <= 6) {
      setOwnersConfirmed(true);
    }
  };

  // Validate and save the pool size
  const handleSavePoolSize = () => {
    if (poolSize % totalOwners === 0 && poolSize >= totalOwners && poolSize <= 36) {
      setPoolSizeConfirmed(true);
      calculateSlabRange();
    }
  };

  // Calculate minimum and maximum number of slabs
  const calculateSlabRange = () => {
    const minSlabs = Math.ceil(poolSize / 6); // Minimum slabs required
    const maxSlabs = Math.min(poolSize / totalOwners, minSlabs); // Maximum slabs based on equal distribution
    setMinSlabs(minSlabs);
    setMaxSlabs(maxSlabs);
  };

  // Handler for saving slabs
  const handleSaveSlabs = () => {
    if (numSlabs >= minSlabs && numSlabs <= maxSlabs) {
      setSlabsConfirmed(true);
    }
  };

  // Handler for saving the entire configuration (final step)
  const handleFinalSave = () => {
    const auctionInfo = {
      totalOwners,
      poolSize,
      numSlabs,
      slabs
    };
    localStorage.setItem('AuctionInfo', JSON.stringify(auctionInfo));
    console.log('Auction info saved:', auctionInfo);
  };

  return (
    <div>
      {/* Timer Config (if any) */}

      {/* Number of Owners */}
      <div>
        <label>Select Number of Owners (2-6):</label>
        <input 
          type="number" 
          value={totalOwners} 
          onChange={(e) => setTotalOwners(parseInt(e.target.value))} 
          disabled={ownersConfirmed} 
        />
        <button onClick={handleSaveOwners}>Save Owners</button>
      </div>

      {/* Pool Size Config */}
      {ownersConfirmed && (
        <div>
          <label>Select Pool Size (Multiple of {totalOwners}, Max 36):</label>
          <input 
            type="number" 
            value={poolSize} 
            onChange={(e) => setPoolSize(parseInt(e.target.value))} 
            disabled={poolSizeConfirmed} 
          />
          <button onClick={handleSavePoolSize}>Save Pool Size</button>
        </div>
      )}

      {/* Slab Config */}
      {poolSizeConfirmed && (
        <div>
          <label>Select Number of Slabs (Min {minSlabs}, Max {maxSlabs}):</label>
          <input 
            type="number" 
            value={numSlabs} 
            onChange={(e) => setNumSlabs(parseInt(e.target.value))} 
            disabled={slabsConfirmed} 
          />
          <button onClick={handleSaveSlabs}>Save Slabs</button>
        </div>
      )}

      {/* Slab Customization */}
      {slabsConfirmed && (
        <div>
          <h3>Customize Slabs</h3>
          {slabs.map((slab, index) => (
            <div key={index}>
              <label>Slab {index + 1} Name:</label>
              <input 
                type="text" 
                value={slab.name} 
                onChange={(e) => {
                  const updatedSlabs = [...slabs];
                  updatedSlabs[index].name = e.target.value;
                  setSlabs(updatedSlabs);
                }} 
              />
              <label>Min Bid:</label>
              <input 
                type="number" 
                value={slab.basePrice} 
                onChange={(e) => {
                  const updatedSlabs = [...slabs];
                  updatedSlabs[index].basePrice = parseInt(e.target.value);
                  setSlabs(updatedSlabs);
                }} 
              />
              <label>Max Bid:</label>
              <input 
                type="number" 
                value={slab.maxBid} 
                onChange={(e) => {
                  const updatedSlabs = [...slabs];
                  updatedSlabs[index].maxBid = parseInt(e.target.value);
                  setSlabs(updatedSlabs);
                }} 
              />
            </div>
          ))}
          <button onClick={handleFinalSave}>Finalize Configuration</button>
        </div>
      )}

      {/* Slab-wise Player Table */}
      {slabsConfirmed && (
        <div>
          <h3>Players by Slabs</h3>
          {slabs.map((slab, index) => (
            <div key={index}>
              <h4>{slab.name} Players</h4>
              <table>
                <thead>
                  <tr>
                    <th>Player Name</th>
                    <th>Player Skill</th>
                    {/* Other player attributes */}
                  </tr>
                </thead>
                <tbody>
                  {players.filter(player => player.slab === slab.name).map(filteredPlayer => (
                    <tr key={filteredPlayer.id}>
                      <td>{filteredPlayer.name}</td>
                      <td>{filteredPlayer.skill}</td>
                      {/* Other player details */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Configuration;
