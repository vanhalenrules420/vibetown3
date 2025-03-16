import { useState, useEffect } from 'react'
import './App.css'
import Game from '@components/Game'

function App() {
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    // Simulate asset loading or initialization
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Vibe Town</h1>
      </header>
      
      <main className="game-container">
        {isLoaded ? (
          <Game />
        ) : (
          <div className="loading">Loading Vibe Town...</div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>Vibe Town &copy; 2025</p>
      </footer>
    </div>
  )
}

export default App
