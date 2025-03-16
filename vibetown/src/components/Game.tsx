import { useEffect, useRef } from 'react';
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
  
  useEffect(() => {
    // Only create the game instance if it doesn't exist and the container is ready
    if (gameRef.current === null && gameContainerRef.current !== null) {
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
            gravity: { y: 0 }, // No gravity for top-down game
            debug: process.env.NODE_ENV === 'development'
          }
        },
        scene: [MainScene]
      };
      
      // Create the game instance
      gameRef.current = new Phaser.Game(config);
      
      // Clean up function to destroy the game when component unmounts
      return () => {
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    }
  }, []);
  
  return (
    <div className="game-wrapper">
      <div ref={gameContainerRef} className="phaser-container" />
      <ChatIndicator />
    </div>
  );
};

export default Game;
