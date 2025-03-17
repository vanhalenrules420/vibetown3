import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';

// Define player state interface to fix implicit any errors
interface PlayerState {
  x: number;
  y: number;
  anim: string;
  onChange?: (changes: any) => void;
}

// Define room state interface to fix unknown type errors
interface RoomState {
  players: {
    onAdd: (player: PlayerState, sessionId: string) => void;
    onRemove: (player: PlayerState, sessionId: string) => void;
  };
}

class MainScene extends Phaser.Scene {
  // Game elements
  private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private otherPlayers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  
  // Networking
  private client!: Client;
  private room: Room<RoomState> | null = null; // Add generic type to Room
  private playerId: string = ''; // Initialize with empty string instead of undefined
  
  // Movement tracking for network updates
  private lastX: number = 0;
  private lastY: number = 0;
  
  // Asset loading status
  // Using this to track asset loading status internally
  private _assetsLoaded: boolean = false;
  
  constructor() {
    super({ key: 'MainScene' });
    console.log('MainScene constructor called');
  }

  preload() {
    try {
      console.log('MainScene: preload started');
      
      // Add a simple colored rectangle as a fallback
      this.load.image('placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAFklEQVRYhe3QMQEAAAjDMMC/56EB3omEXwLYiAVJLgF0HAA6');
      
      // Try to load the actual game assets
      this.load.image('tiles', 'assets/tilesets/tuxmon-sample-32px-extruded.png');
      this.load.tilemapTiledJSON('map', 'assets/tilemaps/tuxemon-town.json');
      this.load.atlas('atlas', 'assets/atlas/atlas.png', 'assets/atlas/atlas.json');
      
      console.log('MainScene: preload completed');
    } catch (error) {
      console.error('Error in preload:', error);
      this.displayError(`Preload error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Handle loading complete
    this.load.on('complete', () => {
      this._assetsLoaded = true;
      console.log('All assets loaded successfully');
    });
    
    // Handle loading error
    this.load.on('loaderror', (file: any) => {
      console.error('Error loading asset:', file.key);
    });
  }

  create() {
    try {
      console.log('MainScene: create started');
      this.setupWorld();
      this.cursors = this.input.keyboard.createCursorKeys();
      this.connectToServer();
      console.log('MainScene: create completed');
    } catch (error) {
      console.error('Error in create:', error);
      this.displayError(`Create error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  setupWorld() {
    try {
      console.log('Setting up world...');
      
      // Create a simple colored background as a fallback
      this.add.rectangle(0, 0, 800, 600, 0x4a7ba7).setOrigin(0, 0);
      
      // Try to create the tilemap if the assets are loaded
      try {
        if (this._assetsLoaded && this.textures.exists('tiles') && this.cache.tilemap.exists('map')) {
          const map = this.make.tilemap({ key: 'map' });
          const tileset = map.addTilesetImage('tuxmon-sample-32px-extruded', 'tiles');
          
          if (tileset) {
            map.createLayer('Below Player', tileset, 0, 0);
            const worldLayer = map.createLayer('World', tileset, 0, 0);
            
            if (worldLayer) {
              worldLayer.setCollisionByProperty({ collides: true });
            }
            
            map.createLayer('Above Player', tileset, 0, 0);
            console.log('Tilemap created successfully');
          }
        } else {
          console.warn('Tilemap assets not found, using fallback background');
        }
      } catch (mapError) {
        console.error('Error creating tilemap:', mapError);
      }
      
      // Create the player sprite
      try {
        if (this.textures.exists('atlas')) {
          // Use the atlas if it's available
          this.player = this.physics.add.sprite(400, 300, 'atlas', 'misa-front');
          console.log('Created player sprite from atlas');
        } else {
          // Use the placeholder if the atlas isn't available
          this.player = this.physics.add.sprite(400, 300, 'placeholder');
          this.player.setTint(0xff0000);
          this.player.setDisplaySize(32, 32);
          console.log('Created placeholder player sprite');
        }
        
        // Set up player physics
        if (this.player) {
          this.player.setCollideWorldBounds(true);
        }
      } catch (playerError) {
        console.error('Error creating player sprite:', playerError);
        this.displayError(`Player sprite error: ${playerError instanceof Error ? playerError.message : String(playerError)}`);
      }
      
      console.log('World setup completed');
    } catch (error) {
      console.error('Error setting up world:', error);
      this.displayError(`World setup error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  connectToServer() {
    try {
      console.log('Connecting to server...');
      
      // Create a Colyseus client
      this.client = new Client('ws://localhost:2567');
      
      // Connect to the VibeTownRoom
      this.client.joinOrCreate<RoomState>('vibe_town').then(room => {
        if (!room) {
          console.error('Room is null after joining');
          return;
        }
        
        this.room = room as Room<RoomState>;
        this.playerId = room.sessionId;
        console.log('Connected to server with ID:', this.playerId);
        
        // Now room.state is properly typed
        if (this.room && this.room.state) {
          this.room.state.players.onAdd = (player: PlayerState, sessionId: string) => {
            console.log('Player added:', sessionId);
            
            // Don't create a sprite for the local player
            if (sessionId === this.playerId) {
              return;
            }
            
            let otherPlayerSprite;
            
            // Create other player sprites based on available assets
            if (this.textures.exists('atlas')) {
              otherPlayerSprite = this.add.sprite(player.x, player.y, 'atlas', 'misa-front');
            } else {
              otherPlayerSprite = this.add.sprite(player.x, player.y, 'placeholder');
              otherPlayerSprite.setTint(0x00ff00);
              otherPlayerSprite.setDisplaySize(32, 32);
            }
            
            this.otherPlayers.set(sessionId, otherPlayerSprite);
          };
          
          this.room.state.players.onRemove = (_player: PlayerState, sessionId: string) => {
            console.log('Player removed:', sessionId);
            const sprite = this.otherPlayers.get(sessionId);
            if (sprite) sprite.destroy();
            this.otherPlayers.delete(sessionId);
          };
        }
        
        room.onMessage('move', (message: any) => {
          console.log('Move message received:', message);
          const { sessionId, x, y } = message;
          const otherPlayer = this.otherPlayers.get(sessionId);
          if (otherPlayer) {
            otherPlayer.x = x;
            otherPlayer.y = y;
          }
        });
      }).catch(error => {
        console.error('Failed to join room:', error);
        this.displayError(`Server connection error: ${error instanceof Error ? error.message : String(error)}`);
      });
    } catch (error) {
      console.error('Error connecting to server:', error);
      this.displayError(`Server connection error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  update() {
    if (!this.cursors) return;
    
    // Get the player sprite
    const player = this.player;
    if (!player) return;
    
    // Reset velocity
    player.setVelocity(0);
    
    // Handle movement
    const speed = 200;
    let moved = false;
    
    if (this.cursors.left.isDown) {
      player.setVelocityX(-speed);
      moved = true;
    } else if (this.cursors.right.isDown) {
      player.setVelocityX(speed);
      moved = true;
    }
    
    if (this.cursors.up.isDown) {
      player.setVelocityY(-speed);
      moved = true;
    } else if (this.cursors.down.isDown) {
      player.setVelocityY(speed);
      moved = true;
    }
    
    // Send position updates to server if moved and position changed
    if (moved && 
        (Math.abs(player.x - this.lastX) > 1 || Math.abs(player.y - this.lastY) > 1) && 
        this.room) {
      this.lastX = player.x;
      this.lastY = player.y;
      
      // Only send message if room is not null (null check is in the condition above)
      this.room.send('move', { x: player.x, y: player.y });
    }
  }

  // Utility method to display errors on screen
  displayError(message: string) {
    console.error('GAME ERROR:', message);
    const text = this.add.text(10, 10, message, {
      color: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    text.setDepth(1000);
  }
}

export default MainScene;
