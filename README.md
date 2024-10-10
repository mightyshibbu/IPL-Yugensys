🏏 IPL Style Auction System
This project implements an IPL-style auction system built using the MERN stack, with MySQL as the database for persisting auction data. It’s a web-based platform that allows team owners to bid on a pool of players, following configurable rules and settings. This README outlines the main features, setup instructions, and system functionalities.

🎯 Features
Data Persistence: All auctions and player data are stored in a MySQL database.
Configurable Player Data: Easily configure player details such as names and starting bid prices.
Customizable Pool Size: Set the total number of players in the pool (default: 21 players).
Adjustable Bid Timer: Control the bidding time for each player.
Auction History: Access past auctions and view bid history, including final team compositions.
Enhanced UI/UX: A modern, sleek, and responsive user interface for smooth interactions.
Instruction Panel: A step-by-step guide for users throughout the auction process.
Auto-Assign Last Player: Automatically assigns remaining players when applicable.
Chit System for Tie-Breaking: Handles tie bids by assigning players using a chit system.
Automatic Pool Size Adjustment: Automatically adjusts the pool size to ensure equal player distribution among the three teams.
🏗️ Project Structure
Frontend: ReactJS
Backend: Node.js + Express.js
Database: MySQL
APIs: REST API for seamless interaction between frontend and backend
📝 IPL Auction System Requirements
👥 Teams and Players
Teams: 3 team owners will participate in the auction.
Player Pool: 21 players will be divided among the teams.
Player Slabs:
Slab A: 6 players
Slab B: 6 players
Slab C: 6 players
Slab D: 3 players
Slab E: 3 players
💰 Team Budget
Each team owner is allocated 2,500 units to bid on players.
⚙️ Configurable Settings
Player Pool Size: Changeable pool size, default set at 21 players.
Player Names and Slabs: Customizable player names and categories.
Bid Timer: Set adjustable time for bidding on each player.
🏷️ Player Categories & Base Prices
Slab	Base Price (units)	Max Bid (units)
Slab A	200	800
Slab B	150	800
Slab C	100	700
Slab D	80	700
Slab E	50	400
🏷️ Rules & Restrictions
Maximum Players per Slab: Each team owner can acquire a maximum of two players per slab.
Tiebreaker Mechanism: If two teams tie at the maximum bid, the chit system assigns the player.
Automatic Assignment: If a team owner runs out of units or fails to bid, the remaining players are automatically assigned at their base price.
Pool Size Adjustment: The pool size is automatically rounded to ensure an equal number of players for each team.
⚙️ Installation & Setup
Prerequisites
Node.js (v12+)
MySQL (v5.7+)
Steps
1. Clone the repository:
bash
    
git clone <repository-url>
cd <repository-directory>
2. Backend Setup:
Navigate to the backend directory and install dependencies:
bash
    
cd backend
npm install
Create a .env file in the backend directory with the following:
bash
    
DB_HOST=<MySQL Host>
DB_USER=<MySQL Username>
DB_PASSWORD=<MySQL Password>
DB_NAME=<MySQL Database Name>
Run the backend server:
bash
    
npm start
3. Frontend Setup:
Navigate to the frontend directory and install dependencies:
bash
    
cd frontend
npm install
Run the frontend server:
bash
    
npm start
4. MySQL Setup:
Import the provided MySQL database schema.
Ensure your MySQL server is running with the correct credentials.
🚀 Usage
Start both frontend and backend servers.
Admins can configure player data, pool size, and bid timers.
Team owners participate in the live auction, bidding on players based on set rules.
The system ensures all rules are followed, including tiebreakers and auto-assignment.
📅 Future Enhancements
Support for more than three teams.
Integration with other databases such as PostgreSQL.
Real-time notifications for a more dynamic auction environment.
