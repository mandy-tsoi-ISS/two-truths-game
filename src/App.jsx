import React, { useState, useEffect } from 'react';

// Method 2: Query Engine API for direct, stable data streaming
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

    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => parseLine(line))
      .filter(row => row.length >= 8)
      .map(row => ({
        name: row[2] || 'Anonymous',
        statements: [...[
          { text: row[3], type: row[4] },
          { text: row[5], type: row[6] },
          { text: row[7], type: row[8] }
        ]].sort(() => Math.random() - 0.5)
      }));
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(LIVE_SHEET_CSV_URL);
      if (!response.ok) throw new Error('Connection failed. Verify "Anyone with the link can view".');
      
      const textData = await response.text();
      if (textData.includes("error")) throw new Error('Data format error. Verify sheet name "Form responses 1".');
      
      const parsed = parseCSV(textData);
      if (parsed.length === 0) throw new Error('Sheet is connected but contains no data entries.');
      
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
    const isCorrect = currentPlayer.statements[selectedStatement].type?.toLowerCase() === 'lie';
    setStats(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', color: '#fff', backgroundColor: '#0f172a', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>Two Truths and a Lie 🎲</h1>
        <div style={{ background: '#1e293b', padding: '10px', borderRadius: '20px' }}>
          Score: {stats.correct} / {stats.total}
        </div>
      </header>

      {loading ? <p>Loading data...</p> : error ? <div style={{ color: '#f87171' }}>Error: {error}</div> : currentPlayer && (
        <main>
          <h2>Who is this: {currentPlayer.name}?</h2>
          {currentPlayer.statements.map((s, i) => (
            <div 
              key={i} 
              onClick={() => !isRevealed && setSelectedStatement(i)}
              style={{ 
                padding: '1rem', margin: '10px 0', borderRadius: '8px', cursor: 'pointer',
                border: selectedStatement === i ? '2px solid #38bdf8' : '1px solid #334155',
                background: isRevealed ? (s.type.toLowerCase() === 'lie' ? '#064e3b' : '#7f1d1d') : '#1e293b'
              }}
            >
              {s.text} {isRevealed && `(${s.type})`}
            </div>
          ))}
          {!isRevealed ? (
            <button disabled={selectedStatement === null} onClick={handleConfirmReveal}>Lock in Answer</button>
          ) : (
            <button onClick={() => { setIsRevealed(false); setSelectedStatement(null); fetchData(); }}>Next Round</button>
          )}
        </main>
      )}
    </div>
  );
}

export default App;