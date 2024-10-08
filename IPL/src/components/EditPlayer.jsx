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
    navigate("/config", { replace: true });
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
        navigate('/config'); // Redirect to the configure page or wherever needed
      } else {
        console.error('Error updating player data');
      }
    } catch (error) {
      console.error('Error updating player data:', error);
    }
  };
  return (
    <div className="edit-player-container">
      {playerData.PName ? (
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
            <label>Position:</label>
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
          <div>
            <label>Slab:</label>
            <input
              type="text"
              name="PSlab"
              value={playerData.PSlab}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit">SAVE</button>
          <button onClick={handleBack}>Back</button>

        </form>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default EditPlayer;
