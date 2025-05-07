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
import '../styles/Instructions.css';

const Instructions = ({ onClose }) => {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="modal-backdrop">
      <div className={`modal-content ${fadeIn ? 'fade-in' : ''}`}>
        <h2>Auction Rules and Instructions</h2>
        
        <h3>1. Basic Configuration</h3>
        <ul>
          <li>Number of owners: 2-6 owners can participate in the auction</li>
          <li>Pool size: Must be a multiple of the number of owners (e.g., for 4 owners, pool size can be 4, 8, 12, etc.)</li>
          <li>Maximum pool size: 36 players</li>
          <li>Bid timer: Configurable between 5-200 seconds</li>
        </ul>

        <h3>2. Slab Configuration</h3>
        <ul>
          <li>Number of slabs: 1-7 slabs can be created</li>
          <li>Each slab must have:
            <ul>
              <li>A unique name</li>
              <li>A base price (minimum bid)</li>
              <li>Optional maximum bid cap</li>
              <li>Number of players (must be a multiple of total owners)</li>
            </ul>
          </li>
        </ul>

        <h3>3. Fair Distribution Rules</h3>
        <ul>
          <li>Equal Distribution:
            <ul>
              <li>Players must be distributed equally among all owners</li>
              <li>Each owner gets an equal share of players from each slab</li>
              <li>Total players per owner = Total pool size ÷ Number of owners</li>
            </ul>
          </li>
          <li>Slab-wise Distribution:
            <ul>
              <li>Players in each slab must be a multiple of the number of owners</li>
              <li>Each owner gets equal number of players from each slab</li>
              <li>Example: For 4 owners and 8 players in a slab, each owner gets 2 players</li>
            </ul>
          </li>
        </ul>

        <h3>4. Bidding Rules</h3>
        <ul>
          <li>Bid Amount:
            <ul>
              <li>Must be at least equal to the base price of the slab</li>
              <li>Cannot exceed the owner's remaining units</li>
              <li>Must be higher than the current highest bid</li>
            </ul>
          </li>
          <li>Maximum Bid Cap:
            <ul>
              <li>If enabled for a slab, bids cannot exceed the maximum bid cap</li>
              <li>When multiple owners bid the maximum amount, random selection occurs</li>
            </ul>
          </li>
        </ul>

        <h3>5. Random Selection Process</h3>
        <ul>
          <li>When multiple owners bid the maximum amount:
            <ul>
              <li>Only owners who bid the maximum amount in the current round are considered</li>
              <li>Previous rounds' bids are not considered</li>
              <li>One owner is randomly selected from the current maximum bidders</li>
              <li>The selection is independent for each player</li>
            </ul>
          </li>
          <li>Example:
            <ul>
              <li>Player 1: If Owner 1 bids max, they get the player</li>
              <li>Player 2: If Owner 2 bids max, they get the player</li>
              <li>Player 3: If Owners 1 and 2 both bid max, one is randomly selected</li>
            </ul>
          </li>
        </ul>

        <h3>6. Player Assignment</h3>
        <ul>
          <li>Automatic Assignment:
            <ul>
              <li>When timer reaches zero, player is assigned to highest bidder</li>
              <li>If multiple maximum bids, random selection occurs</li>
              <li>Owner's units are deducted by the bid amount</li>
            </ul>
          </li>
          <li>Fair Share Enforcement:
            <ul>
              <li>Owners cannot bid if they've reached their fair share for a slab</li>
              <li>Owners cannot bid if they've reached their total fair share across all slabs</li>
            </ul>
          </li>
        </ul>

        <button className="close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Instructions;
