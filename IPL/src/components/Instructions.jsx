// import React from 'react';
// import '../styles/Instructions.css'; // Assuming you will style this separately

// const Instructions = ({ onClose }) => {
//     return (
//       <div className="modal-backdrop">
//         <div className="modal-content">
//           <h2>Instructions</h2>
          
//           <ul>
//             <li>There will be a total of 3 team owners bidding for players.</li>
//             <li>Players will be equally divided among the 3 teams.</li>
//             <li>Players are categorized into 5 different slabs:</li>
//             <ul>
//               <li>Slab A: 6 players</li>
//               <li>Slab B: 6 players</li>
//               <li>Slab C: 6 players</li>
//               <li>Slab D: 3 players</li>
//               <li>Slab E: 3 players</li>
//             </ul>
//             <li>Each team owner will be allocated 2,500 units to bid on players.</li>
//             <li>If there is a tie at the maximum bid for a player, the player will be awarded via a chit system.</li>
//           </ul>
//           <button className="close-btn" onClick={onClose}>Close</button>
//         </div>
//       </div>
//     );
//   };
  
// export default Instructions;
import React, { useEffect, useState } from 'react';
import '../styles/Instructions.css'; // Ensure this path is correct

const Instructions = ({ onClose }) => {
  const [fadeIn, setFadeIn] = useState(false); // State to control fade-in effect

  useEffect(() => {
    // Timeout to trigger the fade-in effect
    const timer = setTimeout(() => {
      setFadeIn(true); // Set fade-in to true after 50ms
    }, 50); // Slight delay for effect
    return () => clearTimeout(timer); // Cleanup on unmount
  }, []);

  return (
    <div className="modal-backdrop">
      <div className={`modal-content ${fadeIn ? 'fade-in' : ''}`}>
        <h2>Instructions</h2>
        <p><strong>Welcome to the Auction System!</strong></p>
        <p>In this auction, a total of <strong>3 team owners</strong> will be bidding for players. The pool of players consists of <strong>21 players</strong>, which will be equally divided among the 3 teams.</p>
        
        <p>Players are categorized into <strong>5 different slabs</strong>:</p>
        <div className="slab-info">
          <p><strong>Slab A:</strong> 6 players</p>
          <p><strong>Slab B:</strong> 6 players</p>
          <p><strong>Slab C:</strong> 6 players</p>
          <p><strong>Slab D:</strong> 3 players</p>
          <p><strong>Slab E:</strong> 3 players</p>
        </div>
        
        <p>Each team owner will be allocated <strong>2,500 units</strong> to bid on players. In the event of a tie at the maximum bid for a player, the player will be awarded via a <strong>chit system</strong>.</p>
        
        <button className="close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Instructions;
