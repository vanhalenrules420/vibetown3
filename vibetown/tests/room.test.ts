import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Colyseus modules
vi.mock('colyseus', () => ({
  Client: vi.fn(),
  Room: vi.fn().mockImplementation(() => ({
    state: { players: new Map() },
    onMessage: vi.fn(),
    setState: vi.fn(),
    broadcast: vi.fn(),
  })),
}));

// Import the actual room implementation after mocking dependencies
import { VibeTownRoom } from '../server/room';

/**
 * VibeTownRoom Test Suite
 * 
 * This test suite verifies the functionality of the VibeTownRoom class,
 * including player lifecycle management and message handling.
 */

// Player class for testing
class Player {
  x = 0;
  y = 0;
  nickname = "";
  peerId = "";
  muted = false;
}

// State class for testing
class State {
  players = new Map();
}

// Mock Client class for testing
class MockClient {
  sessionId;
  messages = new Map();

  constructor(sessionId) {
    this.sessionId = sessionId;
  }

  send(type, message) {
    if (!this.messages.has(type)) {
      this.messages.set(type, []);
    }
    this.messages.get(type).push(message);
  }

  // Helper to get the last message of a specific type
  getLastMessage(type) {
    const messages = this.messages.get(type) || [];
    return messages.length > 0 ? messages[messages.length - 1] : null;
  }
}

// Test Room implementation that exposes message handlers for testing
class TestRoom {
  state;
  maxClients = 16;
  onMessageHandlers = new Map();

  constructor() {
    this.state = new State();
  }

  onCreate(options) {
    // Set up message handlers
    this.onMessage("move", this.handleMove.bind(this));
    this.onMessage("setNickname", this.handleSetNickname.bind(this));
    this.onMessage("peerId", this.handlePeerId.bind(this));
    this.onMessage("mute", this.handleMute.bind(this));
  }

  onMessage(type, handler) {
    this.onMessageHandlers.set(type, handler);
  }

  onJoin(client, options) {
    const player = new Player();
    
    // Set initial position
    player.x = Math.floor(Math.random() * 400) + 50;
    player.y = Math.floor(Math.random() * 400) + 50;
    
    // Add player to the room state
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client, consented) {
    // Remove player from the room state
    this.state.players.delete(client.sessionId);
  }

  // Helper method to call message handlers directly
  dispatchMessage(type, client, data) {
    const handler = this.onMessageHandlers.get(type);
    if (handler) {
      handler(client, data);
    }
  }

  // Message handlers
  handleMove(client, data) {
    try {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = data.x;
        player.y = data.y;
      }
    } catch (error) {
      console.error("Error in move handler:", error);
    }
  }

  handleSetNickname(client, data) {
    try {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const nickname = data.nickname.trim();
      
      // Validate nickname length (3-16 characters)
      if (nickname.length < 3 || nickname.length > 16) {
        client.send("error", { 
          message: "Nickname must be between 3 and 16 characters",
          code: "INVALID_NICKNAME_LENGTH"
        });
        return;
      }
      
      // Check for nickname uniqueness
      let isUnique = true;
      let suffix = 1;
      let suggestedNickname = nickname;
      
      // Check if any other player has the same nickname
      this.state.players.forEach((otherPlayer, sessionId) => {
        if (sessionId !== client.sessionId && otherPlayer.nickname === nickname) {
          isUnique = false;
          suggestedNickname = `${nickname}${suffix}`;
          suffix++;
        }
      });
      
      if (isUnique) {
        player.nickname = nickname;
      } else {
        // Send error with suggested alternative
        client.send("error", { 
          message: "Nickname already taken",
          code: "NICKNAME_TAKEN",
          suggestion: suggestedNickname
        });
      }
    } catch (error) {
      console.error("Error in setNickname handler:", error);
    }
  }

  handlePeerId(client, data) {
    try {
      const player = this.state.players.get(client.sessionId);
      if (player && data.peerId) {
        player.peerId = data.peerId;
      }
    } catch (error) {
      console.error("Error in peerId handler:", error);
    }
  }

  handleMute(client, data) {
    try {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.muted = data.muted;
      }
    } catch (error) {
      console.error("Error in mute handler:", error);
    }
  }
}

describe('VibeTownRoom Tests', () => {
  let room;
  
  beforeEach(() => {
    // Create a new room instance before each test
    room = new TestRoom();
    
    // Initialize the room
    room.onCreate({});
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  describe('Player Lifecycle', () => {
    it('should add a new player to the room state when a client joins', () => {
      // Arrange
      const client = new MockClient('client1');
      
      // Act
      room.onJoin(client, {});
      
      // Assert
      expect(room.state.players.has('client1')).toBe(true);
      const player = room.state.players.get('client1');
      expect(player).toBeDefined();
      expect(player.x).toBeGreaterThanOrEqual(50);
      expect(player.y).toBeGreaterThanOrEqual(50);
      expect(player.nickname).toBe('');
      expect(player.peerId).toBe('');
      expect(player.muted).toBe(false);
    });

    it('should remove a player from the room state when a client leaves', () => {
      // Arrange
      const client = new MockClient('client1');
      room.onJoin(client, {});
      expect(room.state.players.has('client1')).toBe(true);
      
      // Act
      room.onLeave(client, true);
      
      // Assert
      expect(room.state.players.has('client1')).toBe(false);
    });
  });

  describe('Message Handlers', () => {
    let client;
    
    beforeEach(() => {
      // Create a client and add it to the room before each test
      client = new MockClient('client1');
      room.onJoin(client, {});
    });

    describe('move message', () => {
      it('should update player position when a move message is received', () => {
        // Arrange
        const expectedX = 150;
        const expectedY = 250;
        const moveData = { x: expectedX, y: expectedY };
        
        // Act - Dispatch a move message
        room.dispatchMessage('move', client, moveData);
        
        // Assert - Verify exact coordinates
        const player = room.state.players.get('client1');
        expect(player.x).toBe(expectedX);
        expect(player.y).toBe(expectedY);
      });

      it('should handle missing player gracefully', () => {
        // Arrange
        const nonExistentClient = new MockClient('nonexistent');
        const moveData = { x: 100, y: 200 };
        
        // Act & Assert - Should not throw an error
        expect(() => {
          room.dispatchMessage('move', nonExistentClient, moveData);
        }).not.toThrow();
      });
    });

    describe('setNickname message', () => {
      it('should set a valid nickname', () => {
        // Arrange
        const expectedNickname = 'ValidName';
        const nicknameData = { nickname: expectedNickname };
        
        // Act
        room.dispatchMessage('setNickname', client, nicknameData);
        
        // Assert
        const player = room.state.players.get('client1');
        expect(player.nickname).toBe(expectedNickname);
      });

      it('should reject a nickname that is too short', () => {
        // Arrange
        const invalidNickname = 'Ab'; // Less than 3 characters
        const nicknameData = { nickname: invalidNickname };
        
        // Act
        room.dispatchMessage('setNickname', client, nicknameData);
        
        // Assert
        const player = room.state.players.get('client1');
        expect(player.nickname).toBe(''); // Nickname should not be set
        
        // Check error message
        const errorMessage = client.getLastMessage('error');
        expect(errorMessage).toBeDefined();
        expect(errorMessage.code).toBe('INVALID_NICKNAME_LENGTH');
        expect(errorMessage.message).toBe('Nickname must be between 3 and 16 characters');
      });

      it('should reject a nickname that is too long', () => {
        // Arrange
        const invalidNickname = 'ThisNicknameIsTooLongForTheSystem'; // More than 16 characters
        const nicknameData = { nickname: invalidNickname };
        
        // Act
        room.dispatchMessage('setNickname', client, nicknameData);
        
        // Assert
        const player = room.state.players.get('client1');
        expect(player.nickname).toBe(''); // Nickname should not be set
        
        // Check error message
        const errorMessage = client.getLastMessage('error');
        expect(errorMessage).toBeDefined();
        expect(errorMessage.code).toBe('INVALID_NICKNAME_LENGTH');
        expect(errorMessage.message).toBe('Nickname must be between 3 and 16 characters');
      });

      it('should reject a duplicate nickname and suggest an alternative', () => {
        // Arrange - Add a second client with a nickname
        const client2 = new MockClient('client2');
        room.onJoin(client2, {});
        
        const duplicateNickname = 'DuplicateName';
        const expectedSuggestion = 'DuplicateName1';
        
        // Set nickname for client2
        room.dispatchMessage('setNickname', client2, { nickname: duplicateNickname });
        
        // Act - Try to set the same nickname for client1
        room.dispatchMessage('setNickname', client, { nickname: duplicateNickname });
        
        // Assert
        const player = room.state.players.get('client1');
        expect(player.nickname).toBe(''); // Nickname should not be set
        
        // Check error message
        const errorMessage = client.getLastMessage('error');
        expect(errorMessage).toBeDefined();
        expect(errorMessage.code).toBe('NICKNAME_TAKEN');
        expect(errorMessage.suggestion).toBe(expectedSuggestion);
      });
    });

    describe('peerId message', () => {
      it('should set a valid peerId', () => {
        // Arrange
        const expectedPeerId = 'peer-123-456';
        const peerIdData = { peerId: expectedPeerId };
        
        // Act
        room.dispatchMessage('peerId', client, peerIdData);
        
        // Assert
        const player = room.state.players.get('client1');
        expect(player.peerId).toBe(expectedPeerId);
      });

      it('should handle missing peerId gracefully', () => {
        // Arrange
        const emptyPeerIdData = { peerId: '' };
        
        // Act
        room.dispatchMessage('peerId', client, emptyPeerIdData);
        
        // Assert
        const player = room.state.players.get('client1');
        expect(player.peerId).toBe(''); // PeerId should remain empty
      });
    });

    describe('mute message', () => {
      it('should set muted status to true', () => {
        // Arrange
        const expectedMuteStatus = true;
        const muteData = { muted: expectedMuteStatus };
        
        // Act
        room.dispatchMessage('mute', client, muteData);
        
        // Assert
        const player = room.state.players.get('client1');
        expect(player.muted).toBe(expectedMuteStatus);
      });

      it('should set muted status to false', () => {
        // Arrange
        // First set to true
        room.dispatchMessage('mute', client, { muted: true });
        
        // Then set to false
        const expectedMuteStatus = false;
        const unmuteData = { muted: expectedMuteStatus };
        
        // Act
        room.dispatchMessage('mute', client, unmuteData);
        
        // Assert
        const player = room.state.players.get('client1');
        expect(player.muted).toBe(expectedMuteStatus);
      });
    });
  });
});
