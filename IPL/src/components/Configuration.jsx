import React, { useState } from 'react';
import '../styles/Configuration.css'; // You can add styles here
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
const Configuration = ({ players, poolSize, setPoolSize, configTime, setConfigTime }) => {
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState(poolSize);

  // const handlePoolSizeChange = (event) => {
  //   const newSize = Number(event.target.value);
  //   setInputValue(newSize);
  //   const roundedSize = Math.round(newSize / 3) * 3; // Round to nearest multiple of 3
  //   if (roundedSize >= 1 && roundedSize <= players.length) {
  //     setPoolSize(roundedSize); // Update only if within valid range
  //     setError(null); // Clear any previous error
  //   } else {
  //     setError('Please enter a valid pool size between 1 and ' + players.length);
  //   }
  // };

  const increasePoolSize = () => {
    if (poolSize + 3 <= players.length) {
      setPoolSize(poolSize + 3);
      setError(null);
    } else {
      setError('Cannot exceed maximum player pool size of ' + players.length);
    }
  };

  const decreasePoolSize = () => {
    if (poolSize - 3 >= 3) {
      setPoolSize(poolSize - 3);
      setError(null);
    } else {
      setError('Pool size cannot be less than 3.');
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
  const increaseBidTime = () => {
    if (configTime + 1 <= 20) {
      setConfigTime(configTime + 1);
      setError(null);
    } else {
      setError('Bid time cannot exceed 20 seconds.');
    }
  };

  const decreaseBidTime = () => {
    if (configTime - 1 >= 3) {
      setConfigTime(configTime - 1);
      setError(null);
    } else {
      setError('Bid time cannot be less than 3 seconds.');
    }
  };

  return (
    <div className="configure-player-list">
      <h1 className="title">Configure Player List</h1>
      <div className="pool-size-container">
        <label>Set Pool Size (max {players.length}): </label>
        <div className="selected-pool-size">{poolSize}</div>
        {/* <input
          type="number"
          value={inputValue} // Use inputValue instead of poolSize
          onChange={handlePoolSizeChange} // Correct event handling
          min="1"
          max={players.length} // Ensure the input respects the maximum pool size based on available players
          className="pool-size-input"
        /> */}
         <div className="adjuster-buttons">
        <button onClick={decreasePoolSize} disabled={poolSize <= 3}>
          Decrease Pool Size
        </button>

        <button onClick={increasePoolSize} disabled={poolSize >= players.length}>
          Increase Pool Size
        </button>
      </div>
        {error && <div className="error-message">{error}</div>}
        
      </div>

      {/* <div className="time-container">
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
      </div> */}
<div className="time-container">
        <label>Set Bid Time (Default 10 seconds): </label>
        <div className="selected-time">{configTime}s</div>
        <div className="adjuster-buttons">
          <button onClick={decreaseBidTime} disabled={configTime <= 3}>
            Decrease Bid Time
          </button>
          <button onClick={increaseBidTime} disabled={configTime >= 20}>
            Increase Bid Time
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>
        <button className="ok-btn" onClick={handleOk}>OK</button>

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
              <div style={{color:"white"}}><Link to={`/edit-player/${player.PID}`}>Edit</Link></div>
              </td>
            </tr>
          ))}
        </tbody>
      </ table>
    </div>
  );
};

export default Configuration;