import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/EditPlayer.css'
const EditPlayer = () => {
  const { id } = useParams(); // Get the player ID from the URL
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState({
    PID: '',
    PName: '',
    PAge: '',
    PHeight: '',
    PWeight: '',
    PRole: '',
    PSlab: '',
  });

  useEffect(() => {
    // Fetch current player data
    const fetchPlayerData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/players/${id}`); // Adjust URL as needed
        const data = await response.json();
        console.log("data from server:", data)
        // Assuming the API returns a single player object
        if (Array.isArray(data) && data.length > 0) {
          setPlayerData(data[0]); // Set the state with the first (and only) player
        } else if (typeof data === 'object') {
          setPlayerData(data); // Set the state with the player object
        }
      } catch (error) {
        console.error('Error fetching player data:', error);
      }
    };
  
    fetchPlayerData();
  }, [id]);

useEffect(()=>{
console.log("Player Data: ",playerData.PName)
})
const handleBack = () => {
    navigate("/playerConfig", { replace: true });
  };
const handleChange = (e) => {
    const { name, value } = e.target;
    setPlayerData({ ...playerData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("inside Handle Submit with PlayerData:", playerData)
    try {
      const response = await fetch(`http://localhost:3000/api/players/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
      });

      if (response.ok) {
        // Get current player data and slab assignments
        const savedPlayerData = localStorage.getItem("PlayerData");
        const savedPlayers = localStorage.getItem("players");
        
        if (savedPlayerData) {
          const currentPlayerData = JSON.parse(savedPlayerData);
          // Create a new object to avoid circular references
          const updatedPlayerData = {};
          
          // Update the player in their current slab
          Object.keys(currentPlayerData).forEach(slabName => {
            const slabPlayers = currentPlayerData[slabName];
            updatedPlayerData[slabName] = slabPlayers.map(p => {
              if (p.PID === parseInt(id)) {
                // Create a new player object with updated data
                return {
                  ...playerData,
                  PSlab: slabName
                };
              }
              return p;
            });
          });
          
          // Save the updated player data
          localStorage.setItem("PlayerData", JSON.stringify(updatedPlayerData));
        }

        // Update the players list
        if (savedPlayers) {
          const players = JSON.parse(savedPlayers);
          const updatedPlayers = players.map(p => {
            if (p.PID === parseInt(id)) {
              return { ...playerData };
            }
            return p;
          });
          localStorage.setItem("players", JSON.stringify(updatedPlayers));
        }
        
        navigate('/playerConfig'); // Redirect to the configure page
      } else {
        console.error('Error updating player data');
      }
    } catch (error) {
      console.error('Error updating player data:', error);
    }
  };
  return (
    <div className="edit-player-container">
      
          <form className="edit-player-form" onSubmit={handleSubmit}>
            <h2>Edit Player</h2>
          <div>
            <label>Name:</label>
            <input
              type="text"
              name="PName"
              value={playerData.PName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Age:</label>
            <input
              type="number"
              name="PAge"
              value={playerData.PAge}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Role:</label>
            <input
              type="text"
              name="PRole"
              value={playerData.PRole}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Height:</label>
            <input
              type="text"
              name="PHeight"
              value={playerData.PHeight}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Weight:</label>
            <input
              type="text"
              name="PWeight"
              value={playerData.PWeight}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit">SAVE</button>
          <button onClick={handleBack}>Back</button>

        </form>
    </div>
  );
};

export default EditPlayer;
