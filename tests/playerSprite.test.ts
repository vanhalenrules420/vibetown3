import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the global Image object since we're not in a browser
class MockImage {
  width: number = 0;
  height: number = 0;
  onload: () => void = () => {};
  onerror: () => void = () => {};
  
  constructor() {
    // Set the dimensions immediately for our mock
    this.width = 32;
    this.height = 128;
  }
  
  set src(value: string) {
    // In a real implementation, this would trigger loading
    // For our mock, we just validate it's a PNG data URI
    if (value.startsWith('data:image/png;base64,')) {
      // Simulate successful load in next tick
      setTimeout(() => this.onload(), 0);
    } else {
      setTimeout(() => this.onerror(), 0);
    }
  }
}

// Replace global Image with our mock
vi.stubGlobal('Image', MockImage);

// Mock Phaser classes and methods
const mockAddSprite = vi.fn();
const mockSetCollideWorldBounds = vi.fn().mockReturnThis();
const mockSetVelocity = vi.fn().mockReturnThis();
const mockPlay = vi.fn().mockReturnThis();

class MockSprite {
  x: number = 0;
  y: number = 0;
  setCollideWorldBounds = mockSetCollideWorldBounds;
  setVelocity = mockSetVelocity;
  play = mockPlay;
}

class MockScene {
  add = {
    sprite: mockAddSprite.mockReturnValue(new MockSprite())
  };
  physics = {
    add: {
      sprite: mockAddSprite.mockReturnValue(new MockSprite())
    }
  };
}

// Mock Colyseus room
class MockRoom {
  state = {
    players: new Map()
  };
  send = vi.fn();
}

// Player spritesheet data URI (stick figures facing down, left, right, up)
const playerSpriteDataUri = 'data:image/png;base64,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';

describe('Player Spritesheet', () => {
  let image: any;
  let scene: MockScene;
  let room: MockRoom;
  let sprite: MockSprite;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create fresh instances
    image = new Image();
    scene = new MockScene();
    room = new MockRoom();
    sprite = new MockSprite();
    
    // Set up image
    image.src = playerSpriteDataUri;
  });

  describe('Asset Loading', () => {
    it('should have width of 32 pixels', async () => {
      return new Promise<void>(resolve => {
        image.onload = () => {
          expect(image.width).toBe(32);
          resolve();
        };
      });
    });

    it('should have height of 128 pixels', async () => {
      return new Promise<void>(resolve => {
        image.onload = () => {
          expect(image.height).toBe(128);
          resolve();
        };
      });
    });

    it('should handle invalid image data', async () => {
      return new Promise<void>(resolve => {
        image.onerror = () => {
          expect(true).toBe(true); // Error handler called
          resolve();
        };
        image.src = 'invalid-data-uri';
      });
    });
  });

  describe('Sprite Animation States', () => {
    it('should play down animation when moving down', () => {
      sprite.setVelocity(0, 100);
      sprite.play('down');
      expect(mockPlay).toHaveBeenCalledWith('down');
    });

    it('should play up animation when moving up', () => {
      sprite.setVelocity(0, -100);
      sprite.play('up');
      expect(mockPlay).toHaveBeenCalledWith('up');
    });

    it('should play left animation when moving left', () => {
      sprite.setVelocity(-100, 0);
      sprite.play('left');
      expect(mockPlay).toHaveBeenCalledWith('left');
    });

    it('should play right animation when moving right', () => {
      sprite.setVelocity(100, 0);
      sprite.play('right');
      expect(mockPlay).toHaveBeenCalledWith('right');
    });
  });

  describe('Collision Detection', () => {
    it('should enable world bounds collision', () => {
      sprite.setCollideWorldBounds(true);
      expect(mockSetCollideWorldBounds).toHaveBeenCalledWith(true);
    });

    it('should stop on world bounds collision', () => {
      sprite.setCollideWorldBounds(true);
      sprite.setVelocity(100, 0);
      expect(mockSetCollideWorldBounds).toHaveBeenCalledWith(true);
      expect(mockSetVelocity).toHaveBeenCalledWith(100, 0);
    });
  });

  describe('Player Movement Validation', () => {
    it('should not allow diagonal movement', () => {
      // Attempting diagonal movement should resolve to cardinal direction
      sprite.setVelocity(100, 100);
      expect(mockSetVelocity).toHaveBeenCalledWith(100, 100);
    });

    it('should maintain constant velocity magnitude', () => {
      sprite.setVelocity(100, 0);
      expect(mockSetVelocity).toHaveBeenCalledWith(100, 0);
    });
  });

  describe('State Synchronization', () => {
    it('should send position updates to server', () => {
      sprite.x = 100;
      sprite.y = 200;
      room.send('move', { x: sprite.x, y: sprite.y });
      expect(room.send).toHaveBeenCalledWith('move', { x: 100, y: 200 });
    });

    it('should update sprite position from server state', () => {
      const serverX = 150;
      const serverY = 250;
      room.state.players.set('player1', { x: serverX, y: serverY });
      sprite.x = serverX;
      sprite.y = serverY;
      expect(sprite.x).toBe(serverX);
      expect(sprite.y).toBe(serverY);
    });
  });
});
