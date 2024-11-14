import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Sequence.css';

const Sequence = () => {
  const [sequence, setSequence] = useState([]);
  const [currentSlabIndex, setCurrentSlabIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true); // Track animation state
  const [showImpact, setShowImpact] = useState(false); // To show Impact slab for 5 seconds
  const navigate = useNavigate();

  // Get PlayerData from localStorage
  const playerData = JSON.parse(localStorage.getItem('PlayerData')) || {};

  // Function to randomize slabs (excluding "Marquee" which should always be first)
  const getRandomizedSlabs = () => {
    const slabsKeys = Object.keys(playerData).filter(key => key !== 'Marquee');
    const shuffled = slabsKeys.sort(() => Math.random() - 0.5); // Shuffle remaining slabs
    return ['Marquee', ...shuffled]; // Ensure Marquee is always first
  };

  // Set sequence and start animating when the component mounts
  useEffect(() => {
    const randomizedSequence = getRandomizedSlabs();
    setSequence(randomizedSequence);
    localStorage.setItem('AuctionSequence', JSON.stringify(randomizedSequence));

    // Show each slab with a delay, animate transition
    let index = 0;
    const interval = setInterval(() => {
      setCurrentSlabIndex(index);
      index++;

      if (index === randomizedSequence.length) {
        clearInterval(interval);
        setShowImpact(true); // Show Impact slab for 5 seconds
      }
    }, 1500); // Show new slab every 1.5 seconds

    // Navigate to the /auction page after 15 seconds (5 seconds for Impact slab)
    const timer = setTimeout(() => {
      navigate('/auction');
    }, 15000); // Total 15 seconds (10 + 5)

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="sequence-container">
      <h1>Upcoming Auction Slabs</h1>

      {/* Display Marquee slab first */}
      <div className="current-slab">
        <h2>{sequence[currentSlabIndex]}</h2>
        <div className="arrow-down">↓</div>
      </div>

      {/* Show next slabs with arrows */}
      {currentSlabIndex < sequence.length - 1 && (
        <div className={`next-slab ${isAnimating ? 'slide-in' : ''}`}>
          <h3>{sequence[currentSlabIndex + 1]}</h3>
        </div>
      )}

      {/* Hold on Impact slab for 5 seconds before navigating */}
      {showImpact && <p className="impact-slab">Impact Slab Revealed!</p>}

      {isAnimating && <p className="animation-text">Revealing Slabs...</p>}
    </div>
  );
};

export default Sequence;
