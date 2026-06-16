import React, { useState, useEffect } from 'react';

// API link for your Google Sheet
const LIVE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1nj3t7atv7BCq8UaODjmZr01eA4LwcIR5FSLehXLk9O0/gviz/tq?tqx=out:csv&sheet=Form%20responses%201";

function App() {
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

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

    // Skip the header row and map based on your column structure:
    // row[1]=Name, row[2]=Truth1, row[3]=Truth2, row[4]=Lie
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

  useEffect(() => { fetchData(); }, []);

  const handleConfirmReveal = () => {
    setIsRevealed(true);
    const isCorrect = currentPlayer.statements[selectedStatement].type === 'Lie';
    setStats(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
      <h1>Two Truths and a Lie 🎲</h1>
      <p>Score: {stats.correct} / {stats.total}</p>

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
                background: isRevealed ? (s.type === 'Lie' ? '#064e3b' : '#7f1d1d') : '#1e293b'
              }}
            >
              {s.text} {isRevealed && `(${s.type})`}
            </div>
          ))}
          {!isRevealed ? (
            <button disabled={selectedStatement === null} onClick={handleConfirmReveal} style={{ marginTop: '20px', padding: '10px 20px' }}>
              Lock in Answer
            </button>
          ) : (
            <button onClick={() => { setIsRevealed(false); setSelectedStatement(null); fetchData(); }} style={{ marginTop: '20px', padding: '10px 20px' }}>
              Next Player
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default App;