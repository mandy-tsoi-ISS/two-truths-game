import React, { useState, useEffect } from 'react';

// Your official Google Sheet Published CSV Link
const LIVE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTskfCHx80zWlby_R_B74F-7X8m-1M6Cj1w786A7Vf7_f9r96B3L8m_f7wX-H36kO9R0/pub?output=csv";

function App() {
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  // Simple CSV parser supporting standard quotes and commas
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const dataRows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const rowData = parseLine(lines[i]);
      if (rowData.length >= headers.length) {
        dataRows.push(rowData);
      }
    }

    return dataRows.map(row => {
      const statements = [
        { text: row[2], type: row[3] },
        { text: row[4], type: row[5] },
        { text: row[6], type: row[7] }
      ];
      // Randomize statements order so the lie isn't always in the same place
      const shuffledStatements = [...statements].sort(() => Math.random() - 0.5);
      
      return {
        name: row[1] || 'Anonymous',
        statements: shuffledStatements
      };
    });
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(LIVE_SHEET_CSV_URL);
      if (!response.ok) throw new Error('Failed to fetch data from your Google Sheet. Make sure it is Published to the Web as a CSV.');
      const textData = await response.text();
      
      const parsed = parseCSV(textData);
      if (parsed.length === 0) {
        throw new Error('No entries found. Please submit the Google Form first!');
      }
      
      setPlayers(parsed);
      const randomIdx = Math.floor(Math.random() * parsed.length);
      setCurrentPlayer(parsed[randomIdx]);
      setSelectedStatement(null);
      setIsRevealed(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectRandomPlayer = () => {
    if (players.length <= 1) {
      const randomIdx = Math.floor(Math.random() * players.length);
      const player = players[randomIdx];
      setCurrentPlayer({
        ...player,
        statements: [...player.statements].sort(() => Math.random() - 0.5)
      });
    } else {
      const options = players.filter(p => p.name !== currentPlayer?.name);
      const randomIdx = Math.floor(Math.random() * options.length);
      setCurrentPlayer(options[randomIdx]);
    }
    setSelectedStatement(null);
    setIsRevealed(false);
  };

  const handleGuess = (index) => {
    if (isRevealed) return;
    setSelectedStatement(index);
  };

  const handleConfirmReveal = () => {
    if (selectedStatement === null) return;
    setIsRevealed(true);
    
    const isCorrect = currentPlayer.statements[selectedStatement].type.toLowerCase() === 'lie';
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header Banner */}
      <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#38bdf8', marginBottom: '0.5rem', fontWeight: '800' }}>
          Two Truths and a Lie 🎉
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
          Automated Live Audience Party Game Panel
        </p>
        
        {/* Game Stats Tracker */}
        <div style={{ display: 'inline-block', marginTop: '1rem', background: '#1e293b', padding: '0.5rem 1.5rem', borderRadius: '50px', border: '1px solid #334155' }}>
          <span style={{ color: '#e2e8f0', fontWeight: '600' }}>Scoreboard: </span>
          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{stats.correct}</span> / {stats.total} Correct Guesses
        </div>
      </header>

      {/* Main Game Interface Board */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.3rem', color: '#94a3b8' }}>Loading Live Responses...</div>
      ) : error ? (
        <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #f87171', padding: '1.5rem', borderRadius: '8px', color: '#fca5a5', textAlign: 'center' }}>
          <strong>Connection Error:</strong> {error}
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Double check that your Google Sheet is published to the web as a CSV file.</p>
        </div>
      ) : currentPlayer ? (
        <main>
          {/* Identity Presenter Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ textTransform: 'uppercase', fontSize: '0.85rem', color: '#38bdf8', fontWeight: '700' }}>Active Subject Target</span>
            <h2 style={{ fontSize: '2.2rem', margin: '0.25rem 0 0 0', color: '#ffffff' }}>
              Whose Lie is it Anyway? It's <span style={{ textDecoration: 'underline', color: '#f43f5e' }}>{currentPlayer.name}</span>!
            </h2>
          </div>

          {/* Cards Display Structure Grid */}
          <div style={{ margin: '2rem 0' }}>
            {currentPlayer.statements.map((stmt, idx) => {
              let cardBg = '#1e293b';
              let cardBorder = '1px solid #334155';
              let titleBadge = null;

              if (selectedStatement === idx) {
                cardBg = '#334155';
                cardBorder = '2px solid #38bdf8';
              }

              if (isRevealed) {
                const isLie = stmt.type.toLowerCase() === 'lie';
                if (isLie) {
                  cardBg = '#064e3b';
                  cardBorder = '2px solid #10b981';
                  titleBadge = <span style={{ backgroundColor: '#10b981', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', float: 'right', fontWeight: 'bold' }}>🔥 THE LIE</span>;
                } else {
                  if (selectedStatement === idx) {
                    cardBg = '#7f1d1d';
                    cardBorder = '2px solid #ef4444';
                    titleBadge = <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', float: 'right', fontWeight: 'bold' }}>❌ WRONG GUESS</span>;
                  } else {
                    cardBg = '#0f172a';
                    cardBorder = '1px solid #1e293b';
                    titleBadge = <span style={{ color: '#64748b', fontSize: '0.75rem', float: 'right' }}>Truth</span>;
                  }
                }
              }

              return (
                <div
                  key={idx}
                  onClick={() => handleGuess(idx)}
                  style={{
                    backgroundColor: cardBg,
                    border: cardBorder,
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '1rem',
                    cursor: isRevealed ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedStatement === idx ? '0 0 15px rgba(56, 189, 248, 0.2)' : 'none'
                  }}
                >
                  <div style={{ overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', color: '#64748b', fontSize: '1.1rem' }}>Statement #{idx + 1}</span>
                    {titleBadge}
                  </div>
                  <p style={{ fontSize: '1.25rem', margin: 0, color: isRevealed && stmt.type.toLowerCase() !== 'lie' ? '#64748b' : '#f8fafc', lineHeight: '1.5' }}>
                    "{stmt.text}"
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action Control Panel */}
          <div style={{ textAlign: 'center', marginTop: '2.5rem', display: 'block' }}>
            {!isRevealed ? (
              <button
                onClick={handleConfirmReveal}
                disabled={selectedStatement === null}
                style={{
                  backgroundColor: selectedStatement === null ? '#475569' : '#10b981',
                  color: selectedStatement === null ? '#94a3b8' : '#ffffff',
                  border: 'none',
                  padding: '1rem 2.5rem',
                  fontSize: '1.1rem',
                  borderRadius: '8px',
                  cursor: selectedStatement === null ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  boxShadow: selectedStatement !== null ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                Lock in Answer & Reveal Lie 🔍
              </button>
            ) : (
              <button
                onClick={selectRandomPlayer}
                style={{
                  backgroundColor: '#38bdf8',
                  color: '#0f172a',
                  border: 'none',
                  padding: '1rem 2.5rem',
                  fontSize: '1.1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)'
                }}
              >
                Next Participant Round 🎲
              </button>
            )}
          </div>
        </main>
      ) : (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No dynamic answers loaded yet.</div>
      )}
    </div>
  );
}

export default App;