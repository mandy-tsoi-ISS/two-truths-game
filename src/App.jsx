import React, { useState, useEffect } from 'react';

// ==========================================
// GAME CONFIGURATION
// ==========================================
const GAME_CONFIG = {
  // Change this number to limit how many rounds a user can guess
  MAX_ROUNDS: 5, 
};

// API link for your Google Sheet
const LIVE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1nj3t7atv7BCq8UaODjmZr01eA4LwcIR5FSLehXLk9O0/gviz/tq?tqx=out:csv&sheet=Form%20responses%201";

function App() {
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Game state tracking
  const [currentRound, setCurrentRound] = useState(1);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [isGameOver, setIsGameOver] = useState(false);

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else current += char;
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => parseLine(line))
      .filter(row => row.length >= 5)
      .map(row => ({
        name: row[1] || 'Anonymous',
        statements: [
          { text: row[2], type: 'Truth' },
          { text: row[3], type: 'Truth' },
          { text: row[4], type: 'Lie' }
        ].sort(() => Math.random() - 0.5)
      }));
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(LIVE_SHEET_CSV_URL);
      if (!response.ok) throw new Error('Failed to connect. Check sheet permissions.');
      
      const textData = await response.text();
      const parsed = parseCSV(textData);
      
      if (parsed.length === 0) throw new Error('No data found. Ensure your sheet is public.');
      
      setPlayers(parsed);
      setCurrentPlayer(parsed[Math.floor(Math.random() * parsed.length)]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleConfirmReveal = () => {
    setIsRevealed(true);
    const isCorrect = currentPlayer.statements[selectedStatement].type === 'Lie';
    setStats(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
  };

  const handleNextRound = () => {
    // Check if the user has reached the maximum round limit configured
    if (currentRound >= GAME_CONFIG.MAX_ROUNDS) {
      setIsGameOver(true);
    } else {
      setIsRevealed(false);
      setSelectedStatement(null);
      setCurrentRound(prev => prev + 1);
      
      // Pick a random player for the next round
      if (players.length > 0) {
        setCurrentPlayer(players[Math.floor(Math.random() * players.length)]);
      }
    }
  };

  const handleRestartGame = () => {
    setCurrentRound(1);
    setStats({ correct: 0, total: 0 });
    setIsGameOver(false);
    setIsRevealed(false);
    setSelectedStatement(null);
    fetchData(); // Refresh data from sheet in case new submissions came in
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
      <h1>Two Truths and a Lie 🎲</h1>
      
      {isGameOver ? (
        // GAME OVER SCREEN
        <div style={{ padding: '20px' }}>
          <h2>🎮 Game Over!</h2>
          <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>
            You completed all {GAME_CONFIG.MAX_ROUNDS} rounds!
          </p>
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>
            Final Score: {stats.correct} / {stats.total}
          </div>
          <button onClick={handleRestartGame} style={{ padding: '12px 24px', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#38bdf8', border: 'none', borderRadius: '6px', color: '#0f172a', fontWeight: 'bold' }}>
            Play Again 🔄
          </button>
        </div>
      ) : (
        // ACTIVE GAME SCREEN
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0', padding: '0 10px', color: '#94a3b8' }}>
            <span>Round: {currentRound} / {GAME_CONFIG.MAX_ROUNDS}</span>
            <span>Score: {stats.correct} / {stats.total}</span>
          </div>

          {loading ? <p>Loading data...</p> : error ? <p style={{ color: '#fca5a5' }}>{error}</p> : currentPlayer && (
            <>
              <h2>Guess the Lie of: {currentPlayer.name}</h2>
              {currentPlayer.statements.map((s, i) => (
                <div 
                  key={i} 
                  onClick={() => !isRevealed && setSelectedStatement(i)}
                  style={{ 
                    padding: '15px', margin: '10px 0', borderRadius: '8px', cursor: 'pointer',
                    border: selectedStatement === i ? '2px solid #38bdf8' : '1px solid #334155',
                    background: isRevealed ? (s.type === 'Lie' ? '#064e3b' : '#7f1d1d') : '#1e293b',
                    transition: 'background 0.2s'
                  }}
                >
                  {s.text} {isRevealed && `(${s.type})`}
                </div>
              ))}
              {!isRevealed ? (
                <button 
                  disabled={selectedStatement === null} 
                  onClick={handleConfirmReveal} 
                  style={{ marginTop: '20px', padding: '10px 20px', cursor: selectedStatement === null ? 'not-allowed' : 'pointer' }}
                >
                  Lock in Answer
                </button>
              ) : (
                <button 
                  onClick={handleNextRound} 
                  style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#38bdf8', border: 'none', borderRadius: '4px', color: '#0f172a', fontWeight: 'bold' }}
                >
                  {currentRound >= GAME_CONFIG.MAX_ROUNDS ? "See Final Results 🏆" : "Next Round ➡️"}
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;