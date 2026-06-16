import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      textAlign: 'center', 
      padding: '2rem',
      backgroundColor: '#242424',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1>Vite + React</h1>
      <p>Deployed automatically via GitHub Actions (Node.js 20)</p>
      
      <div style={{ margin: '2rem' }}>
        <button 
          onClick={() => setCount((count) => count + 1)}
          style={{
            padding: '0.6em 1.2em',
            fontSize: '1em',
            fontWeight: 500,
            borderRadius: '8px',
            border: '1px solid transparent',
            cursor: 'pointer',
            backgroundColor: '#646cff',
            color: 'white',
            transition: 'border-color 0.25s'
          }}
        >
          count is {count}
        </button>
      </div>
      <p style={{ color: '#888' }}>
        Edit <code>src/App.jsx</code> and push to trigger a re-deploy.
      </p>
    </div>
  )
}

export default App