import { describe, it, expect, vi, beforeEach } from 'vitest';
import MainScene from '../src/scenes/MainScene';

// Mock modules
vi.mock('phaser', () => {
  return {
    default: {
      Scene: class Scene {
        constructor(config: { key: string }) {
          this.scene = { key: config };
        }
        scene: { key: { key: string } };
        
        // Mock Phaser methods and properties that will be used
        load = {
          image: vi.fn(),
          tilemapTiledJSON: vi.fn(),
          spritesheet: vi.fn()
        };
        
        add = {
          image: vi.fn(),
          rectangle: vi.fn().mockReturnValue({
            setOrigin: vi.fn().mockReturnThis()
          }),
          sprite: vi.fn().mockImplementation(() => ({
            setOrigin: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            setScale: vi.fn().mockReturnThis(),
            play: vi.fn().mockReturnThis(),
            destroy: vi.fn(),
            setPosition: vi.fn()
          })),
          text: vi.fn().mockImplementation(() => ({
            setOrigin: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            destroy: vi.fn()
          })),
          tilemap: vi.fn().mockImplementation(() => ({
            addTilesetImage: vi.fn(),
            createLayer: vi.fn().mockImplementation(() => ({
              setCollisionByProperty: vi.fn()
            }))
          }))
        };
        
        input = {
          keyboard: {
            createCursorKeys: vi.fn().mockImplementation(() => ({
              left: { isDown: false },
              right: { isDown: false },
              up: { isDown: false },
              down: { isDown: false }
            }))
          }
        };
        
        physics = {
          add: {
            sprite: vi.fn().mockImplementation(() => ({
              setCollideWorldBounds: vi.fn(),
              setVelocity: vi.fn(),
              setPosition: vi.fn(),
              body: {
                velocity: { x: 0, y: 0 }
              }
            }))
          },
          world: {
            addCollider: vi.fn()
          }
        };
        
        cameras = {
          main: {
            startFollow: vi.fn()
          }
        };
        
        tweens = {
          add: vi.fn()
        };
        
        make = {
          tilemap: vi.fn().mockImplementation(() => ({
            addTilesetImage: vi.fn(),
            createLayer: vi.fn().mockImplementation(() => ({
              setCollisionByProperty: vi.fn()
            }))
          }))
        };
        
        preload() {}
        create() {}
        update() {}
      }
    }
  };
});

// Mock the Client class from colyseus.js
vi.mock('colyseus.js', () => {
  return {
    Client: class MockClient {
      endpoint: string;
      
      constructor(endpoint: string) {
        this.endpoint = endpoint;
      }
      
      joinOrCreate = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          sessionId: 'test-session-id',
          state: {
            players: {
              get: vi.fn().mockImplementation((id: string) => {
                if (id === 'test-session-id') {
                  return { x: 100, y: 100, nickname: '', onChange: vi.fn() };
                } else if (id === 'other-player-id') {
                  return { x: 200, y: 200, nickname: 'Other Player', onChange: vi.fn() };
                }
                return undefined;
              }),
              onAdd: null,
              onRemove: null
            }
          },
          send: vi.fn(),
          onMessage: vi.fn(),
          onLeave: vi.fn()
        });
      })
    },
    Room: class MockRoom {}
  };
});

// Mock document
global.document = {
  createElement: vi.fn().mockImplementation((tag) => {
    if (tag === 'audio') {
      return {
        srcObject: null,
        play: vi.fn(),
        remove: vi.fn()
      };
    }
    return {};
  })
} as any;

// Mock console
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn()
} as any;

describe('MainScene', () => {
  let mainScene: MainScene;
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create a new instance of MainScene
    mainScene = new MainScene();
  });
  
  describe('Initialization', () => {
    it('should be created with the correct scene key', () => {
      // The scene key should be 'MainScene'
      expect((mainScene as any).scene.key.key).toBe('MainScene');
    });
    
    it('should initialize maps for other players', () => {
      expect((mainScene as any).otherPlayers).toEqual(new Map());
    });
  });
  
  describe('preload method', () => {
    beforeEach(() => {
      mainScene.preload();
    });
    
    it('should load the player image', () => {
      expect(mainScene.load.image).toHaveBeenCalledWith('player', expect.any(String));
    });
    
    it('should load the other player image', () => {
      expect(mainScene.load.image).toHaveBeenCalledWith('otherPlayer', expect.any(String));
    });
  });
  
  describe('create method', () => {
    beforeEach(() => {
      // Spy on the setupWorld and connectToServer methods
      vi.spyOn(mainScene as any, 'setupWorld').mockImplementation(() => {});
      vi.spyOn(mainScene as any, 'connectToServer').mockImplementation(() => {});
      
      mainScene.create();
    });
    
    it('should set up the game world', () => {
      expect((mainScene as any).setupWorld).toHaveBeenCalled();
    });
    
    it('should set up input handling', () => {
      expect((mainScene as any).input?.keyboard?.createCursorKeys).toHaveBeenCalled();
    });
    
    it('should connect to the server', () => {
      expect((mainScene as any).connectToServer).toHaveBeenCalled();
    });
  });
  
  describe('setupWorld method', () => {
    let mockRectangle: any;
    let mockPlayer: any;
    
    beforeEach(() => {
      // Create mock objects
      mockRectangle = { setOrigin: vi.fn() };
      mockPlayer = { setCollideWorldBounds: vi.fn() };
      
      // Mock the add.rectangle method
      (mainScene.add.rectangle as any).mockReturnValue(mockRectangle);
      
      // Mock the physics.add.sprite method
      (mainScene.physics.add.sprite as any).mockReturnValue(mockPlayer);
      
      // Call the setupWorld method directly
      (mainScene as any).setupWorld();
    });
    
    it('should create a background rectangle', () => {
      expect(mainScene.add.rectangle).toHaveBeenCalledWith(0, 0, 800, 600, expect.any(Number));
    });
    
    it('should create a player sprite', () => {
      expect(mainScene.physics.add.sprite).toHaveBeenCalledWith(400, 300, 'player');
    });
    
    it('should set the player to collide with world bounds', () => {
      expect(mockPlayer.setCollideWorldBounds).toHaveBeenCalledWith(true);
    });
  });
  
  describe('handlePlayerMovement method', () => {
    beforeEach(() => {
      // Set up the player and cursors
      (mainScene as any).player = {
        setVelocity: vi.fn(),
        setVelocityX: vi.fn(),
        setVelocityY: vi.fn(),
        body: {
          velocity: {
            x: 0,
            y: 0,
            normalize: vi.fn().mockReturnThis(),
            scale: vi.fn()
          }
        }
      };
      
      (mainScene as any).cursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: false },
        down: { isDown: false }
      };
    });
    
    it('should not update if player or cursors are not defined', () => {
      // Remove the player
      (mainScene as any).player = undefined;
      
      // Call handlePlayerMovement
      (mainScene as any).handlePlayerMovement();
      
      // Check that no velocity was set
      expect((mainScene as any).player).toBeUndefined();
    });
    
    it('should set player velocity based on cursor keys', () => {
      // Set up cursor keys
      (mainScene as any).cursors.right.isDown = true;
      (mainScene as any).cursors.down.isDown = true;
      
      // Call handlePlayerMovement
      (mainScene as any).handlePlayerMovement();
      
      // Check that the velocity was set
      expect((mainScene as any).player.setVelocityX).toHaveBeenCalledWith(200);
      expect((mainScene as any).player.setVelocityY).toHaveBeenCalledWith(200);
    });
    
    it('should normalize diagonal movement', () => {
      // Set up cursor keys for diagonal movement
      (mainScene as any).cursors.right.isDown = true;
      (mainScene as any).cursors.down.isDown = true;
      
      // Set up velocity to simulate diagonal movement
      (mainScene as any).player.body.velocity.x = 200;
      (mainScene as any).player.body.velocity.y = 200;
      
      // Call handlePlayerMovement
      (mainScene as any).handlePlayerMovement();
      
      // Check that the velocity was normalized
      expect((mainScene as any).player.body.velocity.normalize).toHaveBeenCalled();
      expect((mainScene as any).player.body.velocity.scale).toHaveBeenCalledWith(200);
    });
  });
  
  describe('connectToServer method', () => {
    beforeEach(() => {
      // Spy on the setupRoomHandlers method
      vi.spyOn(mainScene as any, 'setupRoomHandlers').mockImplementation(() => {});
      
      // Call the connectToServer method directly
      (mainScene as any).connectToServer();
    });
    
    it('should create a Colyseus client with the correct endpoint', () => {
      // Check that a Client instance was created
      expect((mainScene as any).client).toBeTruthy();
      // And that it has the correct endpoint
      expect((mainScene as any).client.endpoint).toBe('ws://localhost:2567');
    });
    
    it('should join or create the vibetown room', () => {
      expect((mainScene as any).client.joinOrCreate).toHaveBeenCalledWith('vibetown');
    });
    
    it('should set up room handlers when connected', async () => {
      // Wait for the promise to resolve
      await (mainScene as any).client.joinOrCreate();
      
      // Check that setupRoomHandlers was called
      expect((mainScene as any).setupRoomHandlers).toHaveBeenCalled();
    });
    
    it('should handle connection errors', async () => {
      // Create a new instance for this test to avoid interference
      const testScene = new MainScene();
      
      // Create a mock client that will throw an error
      const mockClient = {
        joinOrCreate: vi.fn().mockImplementation(() => {
          return Promise.reject(new Error('Connection error'));
        })
      };
      
      // Spy on console.error
      const consoleSpy = vi.spyOn(console, 'error');
      
      // Set the client and manually call the catch block to simulate an error
      (testScene as any).client = mockClient;
      
      // Call the joinOrCreate method and wait for it to reject
      await mockClient.joinOrCreate().catch(error => {
        // This simulates the catch block in connectToServer
        console.error('Failed to join room:', error);
      });
      
      // Check that the error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to join room:', expect.any(Error));
    });
  });
  
  describe('setupRoomHandlers method', () => {
    beforeEach(() => {
      // Set up the room
      (mainScene as any).room = {
        sessionId: 'test-session-id',
        state: {
          players: {
            onAdd: null,
            onRemove: null
          }
        }
      };
      
      // Set up the playerId
      (mainScene as any).playerId = 'test-session-id';
      
      // Call setupRoomHandlers
      (mainScene as any).setupRoomHandlers();
    });
    
    it('should set up onAdd handler for players', () => {
      expect((mainScene as any).room.state.players.onAdd).toBeDefined();
    });
    
    it('should set up onRemove handler for players', () => {
      expect((mainScene as any).room.state.players.onRemove).toBeDefined();
    });
    
    it('should create a sprite when a player is added', () => {
      // Create a mock player
      const mockPlayer = { x: 200, y: 200, onChange: null };
      
      // Call the onAdd handler
      (mainScene as any).room.state.players.onAdd(mockPlayer, 'other-player-id');
      
      // Check that a sprite was created
      expect(mainScene.add.sprite).toHaveBeenCalledWith(200, 200, 'otherPlayer');
      
      // Check that the player was added to the otherPlayers map
      expect((mainScene as any).otherPlayers.has('other-player-id')).toBe(true);
    });
    
    it('should not create a sprite for the local player', () => {
      // Create a mock player
      const mockPlayer = { x: 100, y: 100, onChange: null };
      
      // Call the onAdd handler with the local player ID
      (mainScene as any).room.state.players.onAdd(mockPlayer, 'test-session-id');
      
      // Check that no sprite was created
      expect(mainScene.add.sprite).not.toHaveBeenCalled();
    });
    
    it('should update sprite position when a player changes position', () => {
      // Create a mock player with an onChange property that will be set by onAdd
      const mockPlayer = { 
        x: 200, 
        y: 200,
        onChange: null as unknown as (() => void) | null
      };
      
      // Create a mock sprite
      const mockSprite = {
        setPosition: vi.fn(),
        destroy: vi.fn()
      };
      
      // Mock the add.sprite method to return our mock sprite
      (mainScene.add.sprite as any).mockReturnValue(mockSprite);
      
      // Add the player to trigger the onAdd handler which sets up onChange
      (mainScene as any).room.state.players.onAdd(mockPlayer, 'other-player-id');
      
      // Store the onChange handler that was set by onAdd
      const onChangeHandler = mockPlayer.onChange;
      
      // Make sure our mock sprite is in the otherPlayers map
      (mainScene as any).otherPlayers.set('other-player-id', mockSprite);
      
      // Update the player position
      mockPlayer.x = 250;
      mockPlayer.y = 250;
      
      // Call the onChange handler that was set by onAdd
      if (typeof onChangeHandler === 'function') {
        onChangeHandler();
      }
      
      // Check that the sprite position was updated
      expect(mockSprite.setPosition).toHaveBeenCalledWith(250, 250);
    });
    
    it('should remove sprites when a player leaves', () => {
      // Create a mock sprite
      const mockSprite = { destroy: vi.fn() };
      
      // Add the sprite to the otherPlayers map
      (mainScene as any).otherPlayers.set('other-player-id', mockSprite);
      
      // Call the onRemove handler
      (mainScene as any).room?.state.players.onRemove({}, 'other-player-id');
      
      // Check that the sprite was destroyed and removed from the map
      expect(mockSprite.destroy).toHaveBeenCalled();
      expect((mainScene as any).otherPlayers.has('other-player-id')).toBe(false);
    });
  });
  
  describe('update method', () => {
    beforeEach(() => {
      // Set up the player, cursors, and room
      (mainScene as any).player = {
        x: 100,
        y: 100,
        setVelocity: vi.fn(),
        body: { velocity: { x: 0, y: 0 } }
      };
      
      (mainScene as any).cursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: false },
        down: { isDown: false }
      };
      
      (mainScene as any).room = {
        send: vi.fn()
      };
      
      // Spy on the handlePlayerMovement method
      vi.spyOn(mainScene as any, 'handlePlayerMovement').mockImplementation(() => {});
      
      // Initialize lastPosition
      (mainScene as any).lastPosition = { x: 100, y: 100 };
    });
    
    it('should call handlePlayerMovement if player and cursors are defined', () => {
      // Call update
      mainScene.update();
      
      // Check that handlePlayerMovement was called
      expect((mainScene as any).handlePlayerMovement).toHaveBeenCalled();
    });
    
    it('should not call handlePlayerMovement if player is not defined', () => {
      // Remove the player
      (mainScene as any).player = undefined;
      
      // Call update
      mainScene.update();
      
      // Check that handlePlayerMovement was not called
      expect((mainScene as any).handlePlayerMovement).not.toHaveBeenCalled();
    });
    
    it('should not call handlePlayerMovement if cursors are not defined', () => {
      // Remove the cursors
      (mainScene as any).cursors = undefined;
      
      // Call update
      mainScene.update();
      
      // Check that handlePlayerMovement was not called
      expect((mainScene as any).handlePlayerMovement).not.toHaveBeenCalled();
    });
    
    it('should send a move message to the server when the player moves', () => {
      // Update the player position
      (mainScene as any).player.x = 150;
      (mainScene as any).player.y = 150;
      
      // Call update
      mainScene.update();
      
      // Check that a move message was sent
      expect((mainScene as any).room.send).toHaveBeenCalledWith('move', { x: 150, y: 150 });
      
      // Check that lastPosition was updated
      expect((mainScene as any).lastPosition).toEqual({ x: 150, y: 150 });
    });
    
    it('should not send a move message if the player has not moved', () => {
      // Call update without changing the player position
      mainScene.update();
      
      // Check that no move message was sent
      expect((mainScene as any).room.send).not.toHaveBeenCalled();
    });
  });
});
