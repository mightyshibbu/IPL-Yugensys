import React, { useState } from 'react';
import '../styles/Configuration.css'; // You can add styles here
import { useNavigate } from 'react-router-dom';

const Configuration = ({ players, poolSize, setPoolSize, configTime, setConfigTime }) => {
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState(poolSize);

  const handlePoolSizeChange = (event) => {
    const newSize = Number(event.target.value);
    setInputValue(newSize);
    const roundedSize = Math.round(newSize / 3) * 3; // Round to nearest multiple of 3
    if (roundedSize >= 1 && roundedSize <= players.length) {
      setPoolSize(roundedSize); // Update only if within valid range
      setError(null); // Clear any previous error
    } else {
      setError('Please enter a valid pool size between 1 and ' + players.length);
    }
  };

  const handleTimeChange = (event) => {
    const newTime = Number(event.target.value);
    if (newTime >= 3 && newTime <= 20) { // Add validation for bid time
      setConfigTime(newTime);
      setError(null); // Clear any previous error
    } else {
      setError('Please enter a valid bid time between 3 and 20 seconds.');
    }
  };

  const handleOk = () => {
    if (poolSize >= 1 && poolSize <= players.length) {  
      navigate("/", { replace: true });
    } else {
      setError('Please enter a valid pool size between 1 and ' + players.length);
    }
  };

  const handleEdit = (playerId) => {
    // Logic to edit player details
    navigate(`/edit-player/${playerId}`, { replace: true });
  };

  return (
    <div className="configure-player-list">
      <h1 className="title">Configure Player List</h1>
      <div className="pool-size-container">
        <label>Set Pool Size (max {players.length}): </label>
        <input
          type="number"
          value={inputValue} // Use inputValue instead of poolSize
          onChange={handlePoolSizeChange} // Correct event handling
          min="1"
          max={players.length} // Ensure the input respects the maximum pool size based on available players
          className="pool-size-input"
        />
        {error && <div className="error-message">{error}</div>}
        <button className="ok-btn" onClick={handleOk}>OK</button>
      </div>
      <div className="time-container">
        <label>Set Bid Time (Default 10): </label>
        <input
          type="number"
          value={configTime} // Use value instead of defaultValue to reflect state changes
          onChange={handleTimeChange} // Added onChange handler here
          min="3"
          max="20" // Ensure the input respects the maximum bid time
          className="pool-size-input"
        />
        {error && <div className="error-message">{error}</div>}
        <button className="ok-btn" onClick={handleOk}>OK</button>
      </div>

      <table className="player-table">
        <thead>
          <tr>
            <th>PID</th>
            <th>PName</th>
            <th>PAge</th>
            <th>PHeight</th>
            <th>PWeight</th>
            <th>PRole</th>
            <th>PSlab</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {players.slice(0, poolSize).map((player) => (
            <tr key={player.PID}>
              <td>{player.PID}</td>
              <td>{player.PName}</td>
              <td>{player.PAge}</td>
              <td>{player.PHeight}</td>
              <td>{player.PWeight}</td>
              <td>{player.PRole}</td>
              <td>{player.PSlab}</td>
              <td>
                <button className="edit-btn" onClick={() => handleEdit(player.PID)}>EDIT</button>
              </td>
            </tr>
          ))}
        </tbody>
      </ table>
    </div>
  );
};

export default Configuration;