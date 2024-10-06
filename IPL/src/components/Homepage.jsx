import React from 'react';
import '../styles/Homepage.css'; // Assuming you will style this separately
import { useNavigate } from 'react-router-dom';

const HomePage = ({poolSize}) => {
  const navigate = useNavigate();

  const handleConfig = () => {
    console.log("Navigating to Configuration");
    navigate("/config", { replace: true });
  };

  const handleBeginAuction = () => {
    console.log("Beginning Auction");
    // Add your auction starting logic here
    navigate("/auction", { replace: true }); // Assuming you have an auction route
  };

  const handleViewPrevious = () => {
    console.log("Viewing Previous Auctions");
    // Add your logic to view previous auctions
    navigate("/previous", { replace: true }); // Assuming you have a previous auctions route
  };

  return (
    <div className="homepage-container">
      <header className="auction-header">
        <h1>IPL LIVE AUCTION</h1>
        <h2>@Yugensys</h2>
      </header>
      <div className="button-container">
        <label>Pool Size: {poolSize}</label>
        <button className="auction-btn" onClick={handleConfig}>Configure</button>
        <button className="auction-btn" onClick={handleBeginAuction}>Begin Auction</button>
        <button className="auction-btn" onClick={handleViewPrevious}>View Previous Auctions</button>
      </div>
    </div>
  );
};

export default HomePage;
