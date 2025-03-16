import { useState, useEffect } from 'react';
import './ChatIndicator.css';

// This component follows the single responsibility principle
// It only handles the visual feedback for voice chat activity
// No game logic or state management happens here
const ChatIndicator = () => {
  const [isActive, setIsActive] = useState(false);
  const [playerName, setPlayerName] = useState('');
  
  // Simulate voice activity for demonstration
  // In the real implementation, this would connect to PeerJS
  useEffect(() => {
    const interval = setInterval(() => {
      // Random chance to activate/deactivate
      if (Math.random() > 0.7) {
        setIsActive(prev => !prev);
        if (!isActive) {
          setPlayerName(`Player${Math.floor(Math.random() * 100)}`);
        }
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isActive]);
  
  if (!isActive) return null;
  
  return (
    <div className="chat-indicator">
      <div className="indicator-icon">
        <div className="sound-wave"></div>
      </div>
      <span className="player-name">{playerName} is speaking</span>
    </div>
  );
};

export default ChatIndicator;
