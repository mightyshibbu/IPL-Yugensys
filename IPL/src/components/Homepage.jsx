import React ,{useState}from 'react';
import '../styles/Homepage.css'; // Assuming you will style this separately
import { useNavigate } from 'react-router-dom';
import waterImage from '../static/water.png';
import Instructions from './Instructions'
const HomePage = ({poolSize,configTime}) => {
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);
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
    console.log("Viewing Previous Auction s");
    // Add your logic to view previous auctions
    navigate("/previousAuctions", { replace: true }); // Assuming you have a previous auctions route
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };

  return (
    <div className="homepage-container">
      {/* Rotating Image */}
      <div className="rotating-image-container">
        <img src={waterImage} alt="Water" className="rotating-image" />
      </div>
      <header className="auction-header">
        <h1>IPL LIVE AUCTION</h1>
        <h2>@Yugensys</h2>
      </header>
      <div className="button-container">
        <button className="auction-btn" onClick={handleConfig}>Configure</button>
        <button className="auction-btn" onClick={handleBeginAuction}>Begin Auction</button>
        <button className="auction-btn" onClick={handleViewPrevious}>View History</button>
      </div>
      <div className="button-container">
        <label className='auction-btn'>Pool Size: {poolSize}</label>
        <label className='auction-btn'>Timer(sec): {configTime}</label>
        </div>
      <div className="button-container">
      <button className="auction-instruction-btn" onClick={handleShowInstructions}>Instructions</button>
        </div>
        <div>
      {showInstructions && <Instructions onClose={handleCloseInstructions} />}
    </div>
    </div>
    
  );
};

export default HomePage;
