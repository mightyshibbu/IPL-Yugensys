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

// Connect to the database
db.connect((err) => {
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
        owners: owners,
    };
    const sql = 'INSERT INTO auctions (owners) VALUES (?)';
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
    db.query('SELECT * FROM auctions', (err, rows) => {
        if (err) {
            console.error('Error retrieving auctions:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(rows);
    });
});


// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});