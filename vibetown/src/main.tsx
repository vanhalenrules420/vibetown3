import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.message);
  
  // Display error on screen
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = `Error: ${event.message}`;
  document.body.appendChild(errorElement);
});

// Log initialization start
console.log('Starting Vibe Town initialization...');

try {
  // Configure the Phaser game
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [MainScene],
    backgroundColor: '#4a7ba7'
  };
  
  // Create the game instance
  const game = new Phaser.Game(config);
  
  // Store game instance on window for debugging
  (window as any).game = game;
  
  console.log('Phaser game initialized successfully');
} catch (error) {
  console.error('Failed to initialize Phaser game:', error);
  
  // Display error on screen
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = `Failed to initialize game: ${error instanceof Error ? error.message : String(error)}`;
    gameContainer.appendChild(errorElement);
  }
}
