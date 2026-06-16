import React from 'react';

function App() {
  const containerStyle = {
    textAlign: 'center',
    padding: '2rem',
    borderRadius: '12px',
    background: '#1e1e1e',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#61dafb', marginBottom: '1.5rem' }}>
        Two Truths and a Lie 🎉
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#aaa' }}>
        Welcome to the application. Your automated deployment is working!
      </p>
    </div>
  );
}

export default App;