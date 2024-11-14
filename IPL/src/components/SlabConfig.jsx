// import React, { useState, useEffect } from "react";
// import "../styles/SlabConfig.css"; // You can add styles here
// import { useNavigate } from "react-router-dom";

// const SlabConfig = ({
//   players,
//   poolSize,
//   setPoolSize,
//   configTime,
//   setConfigTime,
//   numSlabs,
//   setNumSlabs,
//   setSlabs,
//   totalOwners,
//   setTotalOwners,
// }) => {
//   const navigate = useNavigate();
//   const [slabsConfig, setSlabsConfig] = useState([]);
//   const [minBid, setMinBid] = useState(50); // Default minimum bid
//   const [maxBid, setMaxBid] = useState(400); // Default maximum bid
//   const [allowMaxBidCap, setAllowMaxBidCap] = useState(false); // Checkbox for max bid cap
//   const [error, setError] = useState(null);

//   // Load config from localStorage on component mount
//   useEffect(() => {
//     const savedConfig = localStorage.getItem("slabsConfig");
//     if (savedConfig) {
//       const parsedConfig = JSON.parse(savedConfig);
//       setSlabsConfig(parsedConfig);
//       setNumSlabs(parsedConfig.length);
//     }
//   }, [setNumSlabs]);

//   // Save slabsConfig to localStorage whenever it changes
//   useEffect(() => {
//     localStorage.setItem("slabsConfig", JSON.stringify(slabsConfig));
//   }, [slabsConfig]);

//   // Handle checkbox change for max bid cap
//   const handleMaxBidCapChange = () => {
//     setAllowMaxBidCap(!allowMaxBidCap);
//     if (!allowMaxBidCap) {
//       // Set maxBid to null for all slabs if max bid cap is disabled
//       const updatedSlabs = slabsConfig.map((slab) => ({
//         ...slab,
//         maxBid: null,
//       }));
//       setSlabsConfig(updatedSlabs);
//     }
//   };

//   // Generate slabs with initial data
//   const handleGenerateSlabs = () => {
//     const initialSlabs = Array.from({ length: numSlabs }, (_, index) => {
//       let name;
//       if (index === 0) {
//         name = "Marquee"; // First slab name
//       } else if (index === numSlabs - 1) {
//         name = "Impact"; // Last slab name
//       } else {
//         name = String.fromCharCode(64 + index); // Generate names A, B, C, etc. for middle slabs
//       }

//       return {
//         name, // Set the name based on index
//         basePrice: minBid, // Default min bid
//         maxBid: allowMaxBidCap ? maxBid : null, // Respect max bid cap setting
//       };
//     });

//     setSlabsConfig(initialSlabs);
//   };

//   // Handle slab changes for name, min bid, and max bid
//   const handleSlabChange = (index, field, value) => {
//     const updatedSlabs = [...slabsConfig];
//     updatedSlabs[index][field] = value;
//     setSlabsConfig(updatedSlabs);
//   };

//   // Handle when OK is clicked
//   const handleOk = () => {
//     if (poolSize >= 1 && poolSize <= players.length) {
//       setSlabs(slabsConfig); // Pass the configured slabs to the parent
//       navigate("/playerConfig", { replace: true });
//     } else {
//       setError("Please enter a valid pool size between 1 and " + players.length);
//     }
//   };

//   return (
//     <div className="configure-player-list">
//       <h1 className="title">Slab Configuration</h1>

//       <div className="slab-config-container">
//         <label>
//           Number of Slabs (Min 1, Max 7):{" "}
//         </label>
//         <div className="selected-pool-size">{numSlabs}</div>
//         <div className="adjuster-buttons">
//           <button onClick={() => setNumSlabs(numSlabs - 1)} disabled={numSlabs <= 1}>
//             -1
//           </button>

//           <button onClick={() => setNumSlabs(numSlabs + 1)} disabled={numSlabs >= 7}>
//             +1
//           </button>
//         </div>

//         <button onClick={handleGenerateSlabs}>Save and Generate Slabs</button>

//         <div className="checkbox-container">
//           <input
//             type="checkbox"
//             checked={allowMaxBidCap}
//             onChange={handleMaxBidCapChange}
//           />
//           <label>Allow Max Bid Cap</label>
//         </div>

//         {slabsConfig.map((slab, index) => (
//           <div key={index} className="slab-input-container">
//             <label>Slab Name: </label>
//             <input
//               type="text"
//               value={slab.name}
//               onChange={(e) =>
//                 handleSlabChange(index, "name", e.target.value)
//               }
//             />

//             <label>Min Bid: </label>
//             <input
//               type="number"
//               value={slab.basePrice}
//               onChange={(e) =>
//                 handleSlabChange(index, "basePrice", Number(e.target.value))
//               }
//             />

//             {allowMaxBidCap && (
//               <>
//                 <label>Max Bid: </label>
//                 <input
//                   type="number"
//                   value={slab.maxBid}
//                   onChange={(e) =>
//                     handleSlabChange(index, "maxBid", Number(e.target.value))
//                   }
//                 />
//               </>
//             )}
//           </div>
//         ))}
//       </div>

//       <button className="ok-btn" onClick={handleOk}>
//         OK
//       </button>
//     </div>
//   );
// };

// export default SlabConfig;
import React, { useState, useEffect } from "react";
import "../styles/SlabConfig.css"; // You can add styles here
import { useNavigate } from "react-router-dom";

const SlabConfig = ({
  players,
  poolSize,
  setPoolSize,
  configTime,
  setConfigTime,
  numSlabs,
  setNumSlabs,
  setSlabs,
  totalOwners,
  setTotalOwners,
}) => {
  const navigate = useNavigate();
  const [slabsConfig, setSlabsConfig] = useState([]);
  const [minBid, setMinBid] = useState(50); // Default minimum bid
  const [maxBid, setMaxBid] = useState(400); // Default maximum bid
  const [allowMaxBidCap, setAllowMaxBidCap] = useState(false); // Checkbox for max bid cap
  const [error, setError] = useState(null);

  // Load config from localStorage on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("slabsConfig");
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setSlabsConfig(parsedConfig);
      setNumSlabs(parsedConfig.length);
    }
  }, [setNumSlabs]);

  // Save slabsConfig to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("slabsConfig", JSON.stringify(slabsConfig));
  }, [slabsConfig]);

  // Handle checkbox change for max bid cap
  const handleMaxBidCapChange = () => {
    setAllowMaxBidCap(!allowMaxBidCap);
    if (!allowMaxBidCap) {
      // Set maxBid to null for all slabs if max bid cap is disabled
      const updatedSlabs = slabsConfig.map((slab) => ({
        ...slab,
        maxBid: null,
      }));
      setSlabsConfig(updatedSlabs);
    }
  };

  // Generate slabs with initial data
  const handleGenerateSlabs = () => {
    const initialSlabs = Array.from({ length: numSlabs }, (_, index) => {
      let name;
      if (index === 0) {
        name = "Marquee"; // First slab name
      } else if (index === numSlabs - 1) {
        name = "Impact"; // Last slab name
      } else {
        name = String.fromCharCode(64 + index); // Generate names A, B, C, etc. for middle slabs
      }

      return {
        name, // Set the name based on index
        basePrice: minBid, // Default min bid
        maxBid: allowMaxBidCap ? maxBid : null, // Respect max bid cap setting
        numPlayers: 0, // New field for the number of players
      };
    });

    setSlabsConfig(initialSlabs);
  };

  // Handle slab changes for name, min bid, max bid, and number of players
  const handleSlabChange = (index, field, value) => {
    const updatedSlabs = [...slabsConfig];
    updatedSlabs[index][field] = value;
    setSlabsConfig(updatedSlabs);
  };
  const handleBack = () => {
    navigate("/auctionConfig", { replace: true })
  };
  // Handle when OK is clicked
  const handleOk = () => {
    if (poolSize >= 1 && poolSize <= players.length) {
      setSlabs(slabsConfig); // Pass the configured slabs to the parent
      navigate("/playerConfig", { replace: true });
    } else {
      setError("Please enter a valid pool size between 1 and " + players.length);
    }
  };

  return (
    <div className="configure-player-list">
      <h1 className="title">Slab Configuration</h1>

      <div className="slab-config-container">
        <label>
          Number of Slabs (Min 1, Max 7):{" "}
        </label>
        <div className="selected-pool-size">{numSlabs}</div>
        <div className="adjuster-buttons">
          <button onClick={() => setNumSlabs(numSlabs - 1)} disabled={numSlabs <= 1}>
            -1
          </button>

          <button onClick={() => setNumSlabs(numSlabs + 1)} disabled={numSlabs >= 7}>
            +1
          </button>
        </div>

        <button onClick={handleGenerateSlabs}>Save and Generate Slabs</button>

        <div className="checkbox-container">
          <input
            type="checkbox"
            checked={allowMaxBidCap}
            onChange={handleMaxBidCapChange}
          />
          <label>Allow Max Bid Cap</label>
        </div>

        {slabsConfig.map((slab, index) => (
          <div key={index} className="slab-input-container">
            <label>Slab Name: </label>
            <input
              type="text"
              value={slab.name}
              onChange={(e) =>
                handleSlabChange(index, "name", e.target.value)
              }
            />

            <label>Min Bid: </label>
            <input
              type="number"
              value={slab.basePrice}
              onChange={(e) =>
                handleSlabChange(index, "basePrice", Number(e.target.value))
              }
            />

            {allowMaxBidCap && (
              <>
                <label>Max Bid: </label>
                <input
                  type="number"
                  value={slab.maxBid}
                  onChange={(e) =>
                    handleSlabChange(index, "maxBid", Number(e.target.value))
                  }
                />
              </>
            )}

            {/* New input for the number of players */}
            <label>Number of Players: </label>
            <input
              type="number"
              value={slab.numPlayers}
              onChange={(e) =>
                handleSlabChange(index, "numPlayers", Number(e.target.value))
              }
            />
          </div>
        ))}
      </div>

      <button className="ok-btn" onClick={handleOk}>
        OK
      </button>
      <button className="ok-btn" onClick={handleBack}>
        Back
      </button>
    </div>
  );
};

export default SlabConfig;
