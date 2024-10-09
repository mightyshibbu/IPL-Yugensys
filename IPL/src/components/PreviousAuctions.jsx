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
        <>return (
            <div className="container">
                <h2>Auction Directory</h2>
                <button onClick={handleDiscard}>Back</button>
                <table>
                    <thead>
                        <tr>
                            <th>Auction ID</th>
                            <th>Owners</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    {/* <tbody>
                        {auctions.sort((a, b) => b.id - a.id).map((auction) => (
                            <tr key={auction.id}>
                                <td>{auction.id}</td>
                                <td>
                                    <div className="owners-list">
                                        {auction.owners.owners.map((owner) => (
                                            <div key={owner.id} className="owner-card">
                                                <div className="owner-header">
                                                    <h4>ID: {owner.id}</h4>
                                                    <p>Units Left: {owner.unitsLeft}</p>
                                                </div>
                                                <div className="players-section">
                                                    <h5>Purchased Players:</h5>
                                                    <ul className="players-list">
                                                        {owner.purchasedPlayers.slice(0, 3).map((player, index) => (
                                                            <li key={player.playerId || index}>
                                                                {player.name} (Slab: {player.slab})
                                                            </li>
                                                        ))}
                                                        {owner.purchasedPlayers.length > 3 && (
                                                            <li>...and {owner.purchasedPlayers.length - 3} more</li>
                                                        )}
                                                    </ul>
                                                    <h5>Slab Players:</h5>
                                                    {Object.entries(owner.slabPlayers).map(([slab, players]) => (
                                                        <div key={slab}>
                                                            <strong>Slab {slab}:</strong>
                                                            {players.length > 0 ? (
                                                                <ul className="players-list">
                                                                    {players.slice(0, 2).map((player, index) => (
                                                                        <li key={index}>{player}</li>
                                                                    ))}
                                                                    {players.length > 2 && (
                                                                        <li>...and {players.length - 2} more</li>
                                                                    )}
                                                                </ul>
                                                            ) : (
                                                                <p>No players</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td>{new Date(auction.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody> */}
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
                                        <div className="slab-section">
                                            {Object.entries(owner.slabPlayers).map(([slab, players]) => (
                                                <div key={slab} className="slab-card">
                                                    <strong>{`Slab ${slab}: `}</strong>
                                                    {players.length > 0 ? (
                                                        <span>{players.join(", ")}</span>
                                                    ) : (
                                                        <span>No players</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
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
        </>
    );
};

export default PreviousAuctions;
