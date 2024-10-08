import React, { useEffect, useState } from 'react';
import {useNavigate} from 'react-router-dom'
import '../styles/PreviousAuctions.css'; // Import the CSS file

const PreviousAuctions = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const  navigate = useNavigate();

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/auctions');
                if (!response.ok) {
                    throw new Error('Failed to fetch auctions');
                }
                const data = await response.json();
                
                // Parse `purchasedPlayers` and `slabPlayers` if they are strings
                const parsedData = data.map(auction => ({
                    ...auction,
                    owners: {
                        owners: auction.owners.owners.map(owner => ({
                            ...owner,
                            purchasedPlayers: typeof owner.purchasedPlayers === 'string' 
                                ? JSON.parse(owner.purchasedPlayers) 
                                : owner.purchasedPlayers,
                            slabPlayers: typeof owner.slabPlayers === 'string' 
                                ? JSON.parse(owner.slabPlayers) 
                                : owner.slabPlayers,
                        })),
                    },
                }));

                setAuctions(parsedData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAuctions();
    }, []);
    
    const handleDiscard = () => {
        navigate("/", { replace: true });
      };
    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="container">
            <h2>Previous Auctions</h2>
            <button onClick={handleDiscard}>Back</button>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Owners</th>
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    {auctions.sort((a, b) => b.id - a.id).map((auction) => (
                        <tr key={auction.id}>
                            <td>{auction.id}</td>
                            <td>
                                <div className="owners-list">
                                    {auction.owners.owners.map((owner) => (
                                        <div key={owner.id} className="owner-card">
                                            <h4>Owner ID: {owner.id}</h4>
                                            <p>Units Left: {owner.unitsLeft}</p>
                                            <h5>Purchased Players:</h5>
                                            <ul>
                                                {owner.purchasedPlayers.map((player,index) => (
                                                    <li key={player.playerId || index}>
                                                        {player.name} (Slab: {player.slab})
                                                    </li>
                                                ))}
                                            </ul>
                                            <h5>Slab Players:</h5>
                                            {Object.entries(owner.slabPlayers).map(([slab, players]) => (
                                                <div key={slab}>
                                                    <strong>Slab {slab}:</strong>
                                                    {players.length > 0 ? (
                                                        <ul>
                                                            {players.map((player, index) => (
                                                                <li key={index}>{player}</li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p>No players</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </td>
                            <td>{new Date(auction.created_at).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PreviousAuctions;
