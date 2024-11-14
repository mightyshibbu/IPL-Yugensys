//   useEffect(() => {
//     const savedSlabsConfig = localStorage.getItem("slabsConfig");
//     const savedAuctionData = localStorage.getItem("AuctionData");
//     const savedPlayers = localStorage.getItem("players");

//     distributePlayersSmartly();

//     if (savedAuctionData) {
//       setAuctionData(JSON.parse(savedAuctionData));
//     }

//     if (savedPlayers) {
//       try {
//         const parsedPlayers = JSON.parse(savedPlayers);
//         setAvailablePlayers(parsedPlayers);
//       } catch (error) {
//         console.error("Error parsing players data from localStorage:", error);
//       }
//     }
//   }, []);

//   const handleAddPlayerToSlab = (player, slabName) => {
//     console.log("inside handleAddPlayerToSlab, slabsConfig=",slabsConfig);
//     console.log("inside handleAddPlayerToSlab, slabName=",slabName);
//     console.log("inside handleAddPlayerToSlab, player=",player);
    
//     const updatedSlabsConfig = slabsConfig.map((slab) => {
//         console.log("inside updatedSlabsConfig, slab=",slab);
        
//       if (
//         slab.name === slabName &&
//         !slab.players.some((p) => p.PID === player.PID)
//       ) {
//         return {
//           ...slab,
//           players: [...slab.players, { ...player, PSlab: slabName }],
//         };
//       }
//       return slab;
//     });

//     setSlabsConfigState(updatedSlabsConfig);
//     const updatedPlayerData = updatedSlabsConfig.reduce((acc, slab) => {
//       acc[slab.name] = slab.players;
//       return acc;
//     }, {});
//     localStorage.setItem("PlayerData", JSON.stringify(updatedPlayerData));
//   };
// useEffect(() => {
//     const savedSlabsConfig = localStorage.getItem("slabsConfig");
//     const savedAuctionData = localStorage.getItem("AuctionData");
//     const savedPlayers = localStorage.getItem("players");

//     distributePlayersSmartly();

//     // Check if slabs are balanced
//     const checkSlabsBalanced = () => {
//       if (slabsConfig.length === 0) {
//         setIsBalanced(false);
//         return;
//       }

//       // Check for empty slabs or slabs not having players equal to poolSize
//       for (let slab of slabsConfig) {
//         if (slab.players.length === 0 || slab.players.length !== poolSize) {
//           setIsBalanced(false);
//           return;
//         }

//         // Check if the number of players is a multiple of totalOwners
//         if (slab.players.length % totalOwners !== 0) {
//           setIsBalanced(false);
//           return;
//         }
//       }
      
//       // If all conditions are met, set as balanced
//       setIsBalanced(true);
//     };

//     checkSlabsBalanced();
//   }, [slabsConfig]);
// useEffect(() => {
//     const savedSlabsConfig = localStorage.getItem("slabsConfig");
//     const savedAuctionData = localStorage.getItem("AuctionData");
//     const savedPlayers = localStorage.getItem("players");
  
//     // Avoid running `distributePlayersSmartly()` here if it changes `slabsConfig`
//     if (!slabsConfig || slabsConfig.length === 0) {
//       distributePlayersSmartly();
//     }
  
//     // Check if slabs are balanced
//     const checkSlabsBalanced = () => {
//       if (slabsConfig.length === 0) {
//         setIsBalanced(false);
//         return;
//       }
  
//       for (let slab of slabsConfig) {
//         if (slab.players.length === 0 || slab.players.length !== poolSize) {
//           setIsBalanced(false);
//           return;
//         }
//         if (slab.players.length % totalOwners !== 0) {
//           setIsBalanced(false);
//           return;
//         }
//       }
      
//       setIsBalanced(true);
//     };
  
//     checkSlabsBalanced();
//   }, [slabsConfig]); // Ensure that `slabsConfig` isn't changing unnecessarily.