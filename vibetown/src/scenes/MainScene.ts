import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';

// MainScene is the primary Phaser scene that handles:
// 1. Rendering the game world
// 2. Player movement and interactions
// 3. Connection to the Colyseus server
// 4. Responding to state changes from the server
export default class MainScene extends Phaser.Scene {
  // Game elements
  private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private otherPlayers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  
  // Networking
  private client?: Client;
  private room?: Room;
  private playerId?: string;
  
  // Movement tracking for network updates
  private lastPosition = { x: 0, y: 0 };
  
  constructor() {
    super({ key: 'MainScene' });
  }
  
  preload() {
    // Load assets
    this.load.image('player', 'placeholder-player.png');
    this.load.image('otherPlayer', 'placeholder-other-player.png');
    
    // In a real implementation, we would load the tilemap here
    // this.load.tilemapTiledJSON('map', 'assets/maps/vibetown.json');
    // this.load.image('tiles', 'assets/tiles/tileset.png');
  }
  
  create() {
    // Set up the game world
    this.setupWorld();
    
    // Set up player input
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Connect to the Colyseus server
    this.connectToServer();
  }
  
  update() {
    // Handle player movement
    if (this.player && this.cursors) {
      this.handlePlayerMovement();
      
      // Send position updates to the server if the player has moved
      if (this.room && 
          (this.player.x !== this.lastPosition.x || 
           this.player.y !== this.lastPosition.y)) {
        
        this.lastPosition = { x: this.player.x, y: this.player.y };
        this.room.send('move', this.lastPosition);
      }
    }
  }
  
  private setupWorld() {
    // In a real implementation, we would create the tilemap here
    // const map = this.make.tilemap({ key: 'map' });
    // const tileset = map.addTilesetImage('tileset', 'tiles');
    // const groundLayer = map.createLayer('Ground', tileset);
    // const wallsLayer = map.createLayer('Walls', tileset);
    // wallsLayer.setCollisionByProperty({ collides: true });
    
    // For now, just create a simple colored background
    this.add.rectangle(0, 0, 800, 600, 0x4a7ba7).setOrigin(0, 0);
    
    // Create a temporary player sprite
    this.player = this.physics.add.sprite(400, 300, 'player');
    this.player.setCollideWorldBounds(true);
    
    // In a real implementation, we would add collision with walls
    // this.physics.add.collider(this.player, wallsLayer);
  }
  
  private handlePlayerMovement() {
    if (!this.player || !this.cursors) return;
    
    // Reset velocity
    this.player.setVelocity(0);
    
    // Handle movement based on cursor keys
    const speed = 200;
    
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
    }
    
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    }
    
    // Normalize diagonal movement
    if (this.player.body.velocity.x !== 0 && this.player.body.velocity.y !== 0) {
      this.player.body.velocity.normalize().scale(speed);
    }
  }
  
  private connectToServer() {
    try {
      // Create a Colyseus client
      this.client = new Client('ws://localhost:2567');
      
      // Connect to the VibeTownRoom
      this.client.joinOrCreate('vibetown').then(room => {
        this.room = room;
        this.playerId = room.sessionId;
        console.log('Connected to Colyseus server with ID:', this.playerId);
        
        // Set up event handlers for room state changes
        this.setupRoomHandlers();
      }).catch(error => {
        console.error('Failed to join room:', error);
      });
    } catch (error) {
      console.error('Failed to connect to Colyseus server:', error);
    }
  }
  
  private setupRoomHandlers() {
    if (!this.room) return;
    
    // Handle player joining
    this.room.state.players.onAdd = (player, sessionId) => {
      console.log('Player joined:', sessionId);
      
      // Don't create a sprite for the local player
      if (sessionId === this.playerId) return;
      
      // Create a sprite for the other player
      const otherPlayer = this.add.sprite(player.x, player.y, 'otherPlayer');
      this.otherPlayers.set(sessionId, otherPlayer);
      
      // Listen for position changes
      player.onChange = () => {
        if (otherPlayer) {
          otherPlayer.setPosition(player.x, player.y);
        }
      };
    };
    
    // Handle player leaving
    this.room.state.players.onRemove = (player, sessionId) => {
      console.log('Player left:', sessionId);
      
      // Remove the player's sprite
      const otherPlayer = this.otherPlayers.get(sessionId);
      if (otherPlayer) {
        otherPlayer.destroy();
        this.otherPlayers.delete(sessionId);
      }
    };
  }
}
