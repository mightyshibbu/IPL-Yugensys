import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,
  credentials: true
}));

// Middleware to parse JSON
app.use(express.json());

// Create a MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const initializeDatabase = () => {
  db.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
    if (err) {
      console.error('Error creating database:', err);
      return;
    }
    console.log('Database created or already exists');

    // Create tables if they do not exist
    const createPlayersTable = `
      CREATE TABLE IF NOT EXISTS Players (
        PID INT AUTO_INCREMENT PRIMARY KEY,
        PName VARCHAR(255),
        PAge INT,
        PRole VARCHAR(255),
        PHeight INT,
        PWeight INT,
        PSlab VARCHAR(255)
      )`;

    db.query(createPlayersTable, (err) => {
      if (err) {
        console.error('Error creating Players table:', err);
        return;
      }
      console.log('Players table created or already exists');
    });

    const createAuctionsTable = `
      CREATE TABLE IF NOT EXISTS auctions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owners JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    db.query(createAuctionsTable, (err) => {
      if (err) {
        console.error('Error creating auctions table:', err);
        return;
      }
      console.log('Auctions table created or already exists');

      // Add created_at column if it doesn't exist
      db.query(`SHOW COLUMNS FROM auctions LIKE 'created_at'`, (err, results) => {
        if (err) {
          console.error('Error checking created_at column:', err);
          return;
        }
        
        if (results.length === 0) {
          // Add created_at column with default value
          db.query(`
            ALTER TABLE auctions 
            ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          `, (err) => {
            if (err) {
              console.error('Error adding created_at column:', err);
              return;
            }
            console.log('Added created_at column to auctions table');
            
            // Update existing records with current timestamp
            db.query(`
              UPDATE auctions 
              SET created_at = CURRENT_TIMESTAMP 
              WHERE created_at IS NULL
            `, (err) => {
              if (err) {
                console.error('Error updating existing records:', err);
                return;
              }
              console.log('Updated timestamps for existing records');
            });
          });
        }
      });
    });
  });
};

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  // Call the initialization function
  initializeDatabase();
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Sample RESTful API endpoint
app.get('/api/getAllPlayers', (req, res) => {
    db.query('SELECT * FROM Players', (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    });
  });
  
  app.post('/api/saveAuction', (req, res) => {
    const { owners } = req.body;
    const auctionData = {
      owners: owners.map((owner) => ({
        id: owner.id,
        unitsLeft: owner.unitsLeft,
        purchasedPlayers: JSON.stringify(owner.purchasedPlayers),
        slabPlayers: JSON.stringify(owner.slabPlayers),
      })),
    };
    const sql = 'INSERT INTO auctions (owners, created_at) VALUES (?, CURRENT_TIMESTAMP)';
    db.query(sql, [JSON.stringify(auctionData)], (err, result) => {
      if (err) {
        console.error('Error saving auction data:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Auction data saved successfully', result });
    });
  });

// Get Previous Auctions
app.get('/api/auctions', (req, res) => {
    db.query('SELECT id, owners, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i:%s") as created_at FROM auctions', (err, rows) => {
        if (err) {
            console.error('Error retrieving auctions:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        console.log('Retrieved auctions:', rows);
        res.json(rows);
    });
});
// Get player data by ID
app.get('/api/players/:id', (req, res) => {
  const { id } = req.params; // Get the player ID from the URL parameters
  
  db.query('SELECT * FROM Players WHERE PID = ?', [id], (err, rows) => { 
    if (err) {
      console.error('Error retrieving player:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(rows[0]); // Return the first player found
  });
});

// Update player data by ID
app.put('/api/players/:id', (req, res) => {
  const { id } = req.params; // Get the player ID from the URL parameters
  const { PName, PAge, PRole ,PHeight,PWeight,PSlab } = req.body; // Get updated player data from the request body
  const sql = 'UPDATE Players SET PName = ?, PAge = ?, PRole = ?, PHeight = ?, PWeight = ?, PSlab=? WHERE PID = ?';
  db.query(sql, [PName, PAge, PRole, PHeight,PWeight,PSlab,id], (err, result) => {
    if (err) {
      console.error('Error updating player data:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({ message: 'Player data updated successfully', playerId: id });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});