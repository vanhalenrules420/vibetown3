import { describe, it, expect, vi, beforeEach } from 'vitest';
import MainScene from '../src/scenes/MainScene';

// Mock modules
vi.mock('phaser', () => {
  return {
    default: {
      Scene: class Scene {
        constructor(config: string) {
          this.scene = { key: config };
        }
        scene: { key: string };
        
        // Mock Phaser methods and properties that will be used
        load = {
          image: vi.fn(),
          tilemapTiledJSON: vi.fn(),
          spritesheet: vi.fn()
        };
        
        add = {
          image: vi.fn(),
          sprite: vi.fn().mockImplementation(() => ({
            setOrigin: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            setScale: vi.fn().mockReturnThis(),
            play: vi.fn().mockReturnThis(),
            destroy: vi.fn()
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
              setOrigin: vi.fn().mockReturnThis(),
              setDepth: vi.fn().mockReturnThis(),
              setScale: vi.fn().mockReturnThis(),
              play: vi.fn().mockReturnThis(),
              setVelocity: vi.fn(),
              body: { velocity: { x: 0, y: 0 } },
              x: 0,
              y: 0,
              destroy: vi.fn()
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
                  return { x: 100, y: 100, nickname: '', peerId: '' };
                } else if (id === 'other-player-id') {
                  return { x: 200, y: 200, nickname: 'Other Player', peerId: 'other-peer-id' };
                }
                return undefined;
              }),
              onAdd: vi.fn(),
              onRemove: vi.fn(),
              onChange: vi.fn()
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

// Mock the Peer class from peerjs
vi.mock('peerjs', () => {
  return {
    default: class MockPeer {
      id = 'test-peer-id';
      
      eventHandlers: Record<string, Function[]> = {};
      
      on(event: string, callback: Function) {
        if (!this.eventHandlers[event]) {
          this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(callback);
        
        // Immediately trigger the open event when registered
        if (event === 'open') {
          this.triggerEvent('open', this.id);
        }
        
        return this;
      }
      
      call = vi.fn().mockImplementation((peerId: string, stream: any) => {
        return {
          on: vi.fn(),
          close: vi.fn()
        };
      });
      
      // Method to trigger events for testing
      triggerEvent(event: string, ...args: any[]) {
        if (this.eventHandlers[event]) {
          this.eventHandlers[event].forEach(callback => callback(...args));
        }
      }
    }
  };
});

// Mock the server/room module
vi.mock('../server/room', () => {
  return {
    Player: class Player {
      x: number;
      y: number;
      nickname: string;
      peerId: string;
      
      constructor(x: number, y: number, nickname: string, peerId: string) {
        this.x = x;
        this.y = y;
        this.nickname = nickname;
        this.peerId = peerId;
      }
    }
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

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockImplementation(() => Promise.resolve('mock-local-stream'))
  },
  configurable: true
});

// Mock window.prompt
global.prompt = vi.fn().mockImplementation(() => 'Test Player');

describe('MainScene', () => {
  let mainScene: MainScene;
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create a new instance of MainScene
    mainScene = new MainScene();
  });
  
  describe('Initialization', () => {
    it('should create the scene with the correct key', () => {
      expect(mainScene.scene.key).toBe('MainScene');
    });
    
    it('should initialize maps for player sprites, nicknames, and connections', () => {
      expect((mainScene as any).playerSprites).toEqual(new Map());
      expect((mainScene as any).playerNicknames).toEqual(new Map());
      expect((mainScene as any).connections).toEqual(new Map());
    });
  });
  
  describe('preload method', () => {
    beforeEach(() => {
      mainScene.preload();
    });
    
    it('should load the tileset image', () => {
      expect(mainScene.load.image).toHaveBeenCalledWith('tiles', expect.any(String));
    });
    
    it('should load the tilemap JSON', () => {
      expect(mainScene.load.tilemapTiledJSON).toHaveBeenCalledWith('map', expect.any(String));
    });
    
    it('should load the player spritesheet', () => {
      expect(mainScene.load.spritesheet).toHaveBeenCalledWith('player', expect.any(String), { frameWidth: 32, frameHeight: 32 });
    });
  });
  
  describe('create method', () => {
    let createSpy: any;
    
    beforeEach(() => {
      // Spy on the create method to ensure it's called
      createSpy = vi.spyOn(mainScene, 'create');
    });
    
    it('should initialize a Colyseus client with the correct endpoint', async () => {
      await mainScene.create();
      
      // Check that a Colyseus client was created with the correct endpoint
      expect((mainScene as any).client.endpoint).toBe('ws://localhost:2567');
    });
    
    it('should join or create the vibe_town room', async () => {
      await mainScene.create();
      
      // Check that joinOrCreate was called with the correct room name
      expect((mainScene as any).client.joinOrCreate).toHaveBeenCalledWith('vibe_town');
    });
    
    it('should set up event listeners for room state changes', async () => {
      await mainScene.create();
      
      // Check that event listeners were set up
      expect((mainScene as any).room.state.players.onAdd).toHaveBeenCalled();
      expect((mainScene as any).room.state.players.onRemove).toHaveBeenCalled();
      expect((mainScene as any).room.state.players.onChange).toHaveBeenCalled();
    });
    
    it('should create a tilemap', async () => {
      await mainScene.create();
      
      // Check that a tilemap was created
      expect(mainScene.add.tilemap).toHaveBeenCalledWith('map');
    });
    
    it('should set up input handling', async () => {
      await mainScene.create();
      
      // Check that cursor keys were created
      expect(mainScene.input.keyboard.createCursorKeys).toHaveBeenCalled();
    });
    
    it('should initialize PeerJS', async () => {
      await mainScene.create();
      
      // Check that a PeerJS instance was created
      expect((mainScene as any).peer).toBeDefined();
    });
  });
  
  describe('Player management', () => {
    beforeEach(async () => {
      // Set up the scene with a mock room
      await mainScene.create();
      
      // Mock the room's state players map
      (mainScene as any).room.state.players = {
        get: vi.fn().mockImplementation((id: string) => {
          if (id === 'test-session-id') {
            return { x: 100, y: 100, nickname: '', peerId: '' };
          } else if (id === 'other-player-id') {
            return { x: 200, y: 200, nickname: 'Other Player', peerId: 'other-peer-id' };
          }
          return undefined;
        }),
        onAdd: vi.fn(),
        onRemove: vi.fn(),
        onChange: vi.fn()
      };
      
      // Set up the local player
      (mainScene as any).localPlayer = { x: 100, y: 100, nickname: '', peerId: '' };
    });
    
    it('should create a sprite and nickname when a player is added', async () => {
      // Get the onAdd callback
      const onAddCallback = (mainScene as any).room.state.players.onAdd.mock.calls[0][0];
      
      // Create a mock player
      const mockPlayer = { x: 200, y: 200, nickname: 'Test Player', peerId: 'test-peer-id' };
      
      // Call the onAdd callback
      onAddCallback(mockPlayer, 'other-player-id');
      
      // Check that a sprite and nickname were created
      expect(mainScene.physics.add.sprite).toHaveBeenCalledWith(200, 200, 'player');
      expect(mainScene.add.text).toHaveBeenCalledWith(200, 200 - 20, 'Test Player', expect.any(Object));
    });
    
    it('should set up the local player when the session ID matches', async () => {
      // Get the onAdd callback
      const onAddCallback = (mainScene as any).room.state.players.onAdd.mock.calls[0][0];
      
      // Create a mock player
      const mockPlayer = { x: 100, y: 100, nickname: '', peerId: '' };
      
      // Call the onAdd callback with the session ID
      onAddCallback(mockPlayer, 'test-session-id');
      
      // Check that the local player was set up
      expect((mainScene as any).localPlayer).toEqual(mockPlayer);
      
      // Check that the camera follows the local player sprite
      expect(mainScene.cameras.main.startFollow).toHaveBeenCalled();
    });
    
    it('should update sprite position when a player changes position', async () => {
      // Set up a mock player and sprite
      const mockPlayer = { x: 100, y: 100, nickname: 'Test Player', peerId: 'test-peer-id' };
      const mockSprite = { x: 100, y: 100, setVelocity: vi.fn() };
      
      // Add the player and sprite to the maps
      (mainScene as any).playerSprites.set('other-player-id', mockSprite);
      
      // Get the onChange callback
      const onChangeCallback = (mainScene as any).room.state.players.onChange.mock.calls[0][0];
      
      // Update the player position
      mockPlayer.x = 150;
      mockPlayer.y = 150;
      
      // Call the onChange callback
      onChangeCallback(mockPlayer, 'other-player-id');
      
      // Check that the tween was added
      expect(mainScene.tweens.add).toHaveBeenCalledWith({
        targets: mockSprite,
        x: 150,
        y: 150,
        duration: 100,
        ease: 'Linear'
      });
    });
    
    it('should remove sprites and nicknames when a player leaves', async () => {
      // Set up a mock player, sprite, and nickname
      const sessionId = 'other-player-id';
      const mockSprite = { destroy: vi.fn() };
      const mockNickname = { destroy: vi.fn() };
      
      // Add the sprite and nickname to the maps
      (mainScene as any).playerSprites.set(sessionId, mockSprite);
      (mainScene as any).playerNicknames.set(sessionId, mockNickname);
      
      // Get the onRemove callback
      const onRemoveCallback = (mainScene as any).room.state.players.onRemove.mock.calls[0][0];
      
      // Call the onRemove callback
      onRemoveCallback({}, sessionId);
      
      // Check that the sprite and nickname were destroyed
      expect(mockSprite.destroy).toHaveBeenCalled();
      expect(mockNickname.destroy).toHaveBeenCalled();
      
      // Check that they were removed from the maps
      expect((mainScene as any).playerSprites.has(sessionId)).toBe(false);
      expect((mainScene as any).playerNicknames.has(sessionId)).toBe(false);
    });
  });
  
  describe('update method', () => {
    beforeEach(async () => {
      // Set up the scene with a mock room and local player
      await mainScene.create();
      
      // Mock the local player
      (mainScene as any).localPlayer = { x: 100, y: 100, nickname: 'Test Player', peerId: '' };
      
      // Mock the local player sprite
      const mockSprite = { x: 100, y: 100, setVelocity: vi.fn(), body: { velocity: { x: 0, y: 0 } } };
      (mainScene as any).playerSprites.set('test-session-id', mockSprite);
      
      // Mock the cursor keys
      (mainScene as any).cursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: false },
        down: { isDown: false }
      };
    });
    
    it('should not update if localPlayer, cursors, or room is not defined', () => {
      // Remove the local player
      (mainScene as any).localPlayer = undefined;
      
      // Call update
      mainScene.update(0, 16);
      
      // Check that no movement was sent
      expect((mainScene as any).room.send).not.toHaveBeenCalled();
    });
    
    it('should set sprite velocity based on cursor keys', () => {
      // Set up cursor keys
      (mainScene as any).cursors.right.isDown = true;
      (mainScene as any).cursors.down.isDown = true;
      
      // Get the local player sprite
      const localSprite = (mainScene as any).playerSprites.get('test-session-id');
      
      // Call update
      mainScene.update(0, 16);
      
      // Check that the sprite velocity was set
      expect(localSprite.setVelocity).toHaveBeenCalledWith(100, 100);
    });
    
    it('should send a move message to the server when the player moves', () => {
      // Set up cursor keys to move right
      (mainScene as any).cursors.right.isDown = true;
      
      // Call update
      mainScene.update(0, 16);
      
      // Check that a move message was sent
      expect((mainScene as any).room.send).toHaveBeenCalledWith('move', {
        x: expect.any(Number),
        y: expect.any(Number)
      });
    });
    
    it('should not send a move message if the player is not moving', () => {
      // Call update with no keys pressed
      mainScene.update(0, 16);
      
      // Check that no move message was sent
      expect((mainScene as any).room.send).not.toHaveBeenCalled();
    });
    
    it('should reconcile position if the difference exceeds the threshold', () => {
      // Set up a large discrepancy between client and server positions
      (mainScene as any).localPlayer.x = 100;
      (mainScene as any).localPlayer.y = 100;
      
      const localSprite = (mainScene as any).playerSprites.get('test-session-id');
      localSprite.x = 200;
      localSprite.y = 200;
      
      // Call update
      mainScene.update(0, 16);
      
      // Check that a tween was added to reconcile the position
      expect(mainScene.tweens.add).toHaveBeenCalledWith({
        targets: localSprite,
        x: 100,
        y: 100,
        duration: 100,
        ease: 'Linear'
      });
    });
    
    it('should not reconcile position if the difference is below the threshold', () => {
      // Set up a small discrepancy between client and server positions
      (mainScene as any).localPlayer.x = 100;
      (mainScene as any).localPlayer.y = 100;
      
      const localSprite = (mainScene as any).playerSprites.get('test-session-id');
      localSprite.x = 102;
      localSprite.y = 102;
      
      // Call update
      mainScene.update(0, 16);
      
      // Check that no tween was added
      expect(mainScene.tweens.add).not.toHaveBeenCalled();
    });
  });
  
  describe('PeerJS integration', () => {
    beforeEach(async () => {
      // Set up the scene with PeerJS
      await mainScene.create();
      
      // Mock the local player
      (mainScene as any).localPlayer = { x: 100, y: 100, nickname: 'Test Player', peerId: '' };
    });
    
    it('should send peerId to server when peer connection is established', () => {
      // The open event is automatically triggered in the mock
      
      // Check that the peerId was sent to the server
      expect((mainScene as any).room.send).toHaveBeenCalledWith('peerId', 'test-peer-id');
    });
    
    it('should answer incoming calls and set up audio elements', () => {
      // Get the call callback
      const onCallCallback = (mainScene as any).peer.eventHandlers.call[0];
      
      // Create a mock call
      const mockCall = {
        answer: vi.fn(),
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'stream') {
            callback('mock-remote-stream');
          }
        }),
        peer: 'other-peer-id'
      };
      
      // Call the callback
      onCallCallback(mockCall);
      
      // Check that getUserMedia was called
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true, video: false });
      
      // Check that a new audio element was created
      expect(document.createElement).toHaveBeenCalledWith('audio');
    });
    
    it('should initiate calls to remote players with peerIds', () => {
      // Set up a remote player with a peerId
      const remotePlayer = { x: 200, y: 200, nickname: 'Remote Player', peerId: 'remote-peer-id' };
      
      // Get the onChange callback for players
      const onChangeCallback = (mainScene as any).room.state.players.onChange.mock.calls[0][0];
      
      // Call the callback to update the peerId
      onChangeCallback(remotePlayer, 'other-player-id');
      
      // Check that a call was made to the remote peer
      expect((mainScene as any).peer.call).toHaveBeenCalledWith('remote-peer-id', 'mock-local-stream');
    });
    
    it('should clean up audio elements when connections are closed', () => {
      // Set up a connection and audio element
      const mockAudio = { remove: vi.fn() };
      (mainScene as any).connections.set('other-peer-id', { audio: mockAudio, call: { close: vi.fn() } });
      
      // Get the onRemove callback
      const onRemoveCallback = (mainScene as any).room.state.players.onRemove.mock.calls[0][0];
      
      // Create a mock player with the peerId
      const mockPlayer = { peerId: 'other-peer-id' };
      
      // Call the callback
      onRemoveCallback(mockPlayer, 'other-player-id');
      
      // Check that the audio element was removed
      expect(mockAudio.remove).toHaveBeenCalled();
      
      // Check that the connection was removed from the map
      expect((mainScene as any).connections.has('other-peer-id')).toBe(false);
    });
  });
});
