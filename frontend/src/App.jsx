import { useEffect, useState } from 'react'
import Game from './Game.jsx'

function App() {
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    fetch('/api/test')
      .then((res) => res.json())
      .then((data) => {
        console.log('Backend response:', data)
      })
      .catch((err) => {
        console.error('API error:', err)
      })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', paddingTop: '24px' }}>
      <p>BSL-game frontend</p>

      {!gameStarted ? (
        <button onClick={() => setGameStarted(true)}>
          Start Game
        </button>
      ) : (
        <Game />
      )}
    </div>
  )
}

export default App