import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import MainScene from '@scenes/MainScene';
import ChatIndicator from '@components/ChatIndicator';
import './Game.css';

// This component serves as the integration point between React and Phaser
// Following our modular architecture, it handles only the initialization and lifecycle
// of the Phaser game instance, with game logic contained in scene classes
const Game = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  
  useEffect(() => {
    // Only create the game instance if it doesn't exist and the container is ready
    if (gameRef.current === null && gameContainerRef.current !== null) {
      try {
        setStatus('Creating game config...');
        
        // Game configuration following Phaser best practices
        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO, // Let Phaser decide between WebGL and Canvas
          parent: gameContainerRef.current,
          width: 800,
          height: 600,
          backgroundColor: '#333333',
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 0 }, // No gravity for top-down game
              debug: process.env.NODE_ENV === 'development'
            }
          },
          scene: [MainScene]
        };
        
        setStatus('Creating Phaser game instance...');
        console.log('Creating Phaser game with config:', config);
        
        // Create the game instance
        gameRef.current = new Phaser.Game(config);
        
        setStatus('Phaser game created successfully');
        console.log('Phaser game created successfully');
        
        // Clean up function to destroy the game when component unmounts
        return () => {
          if (gameRef.current) {
            gameRef.current.destroy(true);
            gameRef.current = null;
          }
        };
      } catch (err) {
        console.error('Error creating Phaser game:', err);
        setError(`Error creating Phaser game: ${err instanceof Error ? err.message : String(err)}`);
        setStatus('Failed to create game');
      }
    }
  }, []);
  
  return (
    <div className="game-wrapper">
      <div className="debug-info">
        <p>Status: {status}</p>
        {error && <p className="error">Error: {error}</p>}
      </div>
      <div ref={gameContainerRef} className="phaser-container" />
      <ChatIndicator />
    </div>
  );
};

export default Game;
