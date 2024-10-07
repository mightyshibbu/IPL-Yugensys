import React, { useState } from 'react';  // Import useState
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './components/Homepage';  // Default import, no curly braces
import Configuration from './components/Configuration';
import Auction from './components/Auction'
function App() {
  const [poolSize, setPoolSize] = useState(8);  // Define state variables
  const [configTime,setConfigTime]=useState(10);
  const [players,setPlayers] = useState([
    { "PID": 1001, "PName": "Shubman Gill", "PAge": 24, "PHeight": "178 cm", "PWeight": "72 kg", "PRole": "Batsman", "PSlab": "B" },
    { "PID": 1002, "PName": "Jasprit Bumrah", "PAge": 27, "PHeight": "178 cm", "PWeight": "78 kg", "PRole": "Bowler", "PSlab": "A" },
    { "PID": 1003, "PName": "Ben Stokes", "PAge": 30, "PHeight": "185 cm", "PWeight": "80 kg", "PRole": "All-Rounder", "PSlab": "A" },
    { "PID": 1004, "PName": "Quinton de Kock", "PAge": 28, "PHeight": "170 cm", "PWeight": "72 kg", "PRole": "Wicket-Keeper", "PSlab": "B" },
    { "PID": 1005, "PName": "David Warner", "PAge": 34, "PHeight": "171 cm", "PWeight": "74 kg", "PRole": "Batsman", "PSlab": "A" },
    { "PID": 1006, "PName": "Pat Cummins", "PAge": 28, "PHeight": "192 cm", "PWeight": "87 kg", "PRole": "Bowler", "PSlab": "B" },
    { "PID": 1007, "PName": "Virat Kohli", "PAge": 32, "PHeight": "175 cm", "PWeight": "70 kg", "PRole": "Batsman", "PSlab": "A" },
    { "PID": 1008, "PName": "Glenn Maxwell", "PAge": 33, "PHeight": "182 cm", "PWeight": "76 kg", "PRole": "All-Rounder", "PSlab": "D" },
    { "PID": 1009, "PName": "Mohammed Shami", "PAge": 31, "PHeight": "180 cm", "PWeight": "79 kg", "PRole": "Bowler", "PSlab": "D" },
    { "PID": 1010, "PName": "Faf du Plessis", "PAge": 36, "PHeight": "178 cm", "PWeight": "80 kg", "PRole": "Batsman", "PSlab": "B" },
    { "PID": 1011, "PName": "KL Rahul", "PAge": 29, "PHeight": "175 cm", "PWeight": "74 kg", "PRole": "Wicket-Keeper", "PSlab": "B" },
    { "PID": 1012, "PName": "Trent Boult", "PAge": 32, "PHeight": "180 cm", "PWeight": "81 kg", "PRole": "Bowler", "PSlab": "B" },
    { "PID": 1013, "PName": "Kane Williamson", "PAge": 31, "PHeight": "173 cm", "PWeight": "71 kg", "PRole": "Batsman", "PSlab": "A" },
    { "PID": 1014, "PName": "Rishabh Pant", "PAge": 24, "PHeight": "177 cm", "PWeight": "75 kg", "PRole": "Wicket-Keeper", "PSlab": "A" },
    { "PID": 1026, "PName": "Shane Watson", "PAge": 40, "PHeight": "183 cm", "PWeight": "82 kg", "PRole": "All-Rounder", "PSlab": "A" },
    { "PID": 1015, "PName": "Mitchell Starc", "PAge": 30, "PHeight": "197 cm", "PWeight": "85 kg", "PRole": "Bowler", "PSlab": "C" },
    { "PID": 1016, "PName": "Ravindra Jadeja", "PAge": 32, "PHeight": "179 cm", "PWeight": "73 kg", "PRole": "All-Rounder", "PSlab": "C" },
    { "PID": 1017, "PName": "Aaron Finch", "PAge": 35, "PHeight": "174 cm", "PWeight": "76 kg", "PRole": "Batsman", "PSlab": "C" },
    { "PID": 1018, "PName": "Yuzvendra Chahal", "PAge": 31, "PHeight": "168 cm", "PWeight": "62 kg", "PRole": "Bowler", "PSlab": "C" },
    { "PID": 1019, "PName": "Sam Curran", "PAge": 23, "PHeight": "175 cm", "PWeight": "68 kg", "PRole": "All-Rounder", "PSlab": "C" },
    { "PID": 1020, "PName": "Shikhar Dhawan", "PAge": 36, "PHeight": "177 cm", "PWeight": "78 kg", "PRole": "Batsman", "PSlab": "C" },
    { "PID": 1021, "PName": "Imran Tahir", "PAge": 42, "PHeight": "173 cm", "PWeight": "67 kg", "PRole": "Bowler", "PSlab": "D" },
    { "PID": 1022, "PName": "Rohit Sharma", "PAge": 34, "PHeight": "175 cm", "PWeight": "78 kg", "PRole": "Batsman", "PSlab": "E" },
    { "PID": 1023, "PName": "AB de Villiers", "PAge": 37, "PHeight": "177 cm", "PWeight": "76 kg", "PRole": "Wicket-Keeper", "PSlab": "E" },
    { "PID": 1024, "PName": "Andre Russell", "PAge": 33, "PHeight": "185 cm", "PWeight": "84 kg", "PRole": "All-Rounder", "PSlab": "E" },
    { "PID": 1025, "PName": "Jason Roy", "PAge": 31, "PHeight": "182 cm", "PWeight": "78 kg", "PRole": "Batsman", "PSlab": "A" },
    { "PID": 1027, "PName": "Chris Gayle", "PAge": 42, "PHeight": "188 cm", "PWeight": "95 kg", "PRole": "Batsman", "PSlab": "A" },
    { "PID": 1028, "PName": "Bhuvneshwar Kumar", "PAge": 31, "PHeight": "178 cm", "PWeight": "72 kg", "PRole": "Bowler", "PSlab": "B" },
    { "PID": 1029, "PName": "Adam Zampa", "PAge": 29, "PHeight": "175 cm", "PWeight": "68 kg", "PRole": "Bowler", "PSlab": "B" },
    { "PID": 1030, "PName": "Ruturaj Gaikwad", "PAge": 25, "PHeight": "173 cm", "PWeight": "70 kg", "PRole": "Batsman", "PSlab": "B" },
    { "PID": 1031, "PName": "Nicholas Pooran", "PAge": 26, "PHeight": "175 cm", "PWeight": "71 kg", "PRole": "Wicket-Keeper", "PSlab": "C" },
    { "PID": 1032, "PName": "Marnus Labuschagne", "PAge": 27, "PHeight": "177 cm", "PWeight": "73 kg", "PRole": "Batsman", "PSlab": "C" },
    { "PID": 1033, "PName": "David Willey", "PAge": 31, "PHeight": "185 cm", "PWeight": "80 kg", "PRole": "Bowler", "PSlab": "C" },
  ]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage poolSize={poolSize}  configTime={configTime}/>} />
        <Route path="/config" element={<Configuration players={players} poolSize={poolSize} setPoolSize={setPoolSize} configTime={configTime} setConfigTime={setConfigTime} />} />
        <Route path="/auction" element={<Auction players={players} poolSize={poolSize} configTime={configTime} />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
