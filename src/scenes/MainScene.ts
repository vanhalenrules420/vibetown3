import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';
import { Player } from '../../server/room';

/**
 * MainScene - The primary game scene for Vibe Town
 * 
 * This scene handles:
 * - Loading and rendering the game map
 * - Player movement and animations
 * - Multiplayer synchronization via Colyseus
 * - Voice chat integration via PeerJS
 */
export default class MainScene extends Phaser.Scene {
    // Colyseus connection
    private room?: Room<any>;
    
    // Player rendering
    private playerSprites: Map<string, Phaser.GameObjects.Sprite>;
    private playerNicknames: Map<string, Phaser.GameObjects.Text>;
    
    // Input handling
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    
    // Player data
    private localPlayer?: Player;
    
    constructor() {
        super('MainScene');
        
        // Initialize maps
        this.playerSprites = new Map<string, Phaser.GameObjects.Sprite>();
        this.playerNicknames = new Map<string, Phaser.GameObjects.Text>();
    }

    /**
     * Preload game assets
     * - Tileset for the map
     * - Tilemap JSON
     * - Player spritesheet
     */
    preload(): void {
        console.log('Preloading assets...');
        // Tileset data URI with gray (#808080) and green (#00AA00) tiles
        const tilesetDataURI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAQCAYAAACm53kpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAARElEQVRYhe3WMQoAIAiFYQ+Xc/QcPYfP0XP0HD1Hx+gWQQhCW/4PxEF8LiIAAAAAAH9VZm5jl5m3zsxXZraxysy9ASz8Qwq8UzZPAAAAAElFTkSuQmCC";
        
        // Player spritesheet data URI with stick figures facing down, left, right, and up
        const playerDataURI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAACACAYAAABqZmsaAAAACXBIWXMAAAsTAAALEwEAmpwYAAABJklEQVR4nO3ZMU7DMBTG8b9bIXXoEDZYGBASEwfgAByBIzAzMXMEjsAROAJH6MbAEBZWJFZEZJw6jh3Hfk9K5Nh+/r50SJUCAAAAAAAAAPBvHEk6lXQu6UbSg6QnSc+S3iR9xBdJW0kbSWtJK0lLSXeS5pIuJJ1IOvgpwFjSVNKVpFtJ95IeJa0lvUraStpJ+pT0FV9CPiVtJL1IWkl6lrSQdCvpWtKFpImkYVuAkaRzSTNJ15LuJC0kPUlaSXqR9C7pQ9KnpC9JO0lfIcxW0oekjaRXSc+SFpJuJF1KOpM0ljRoCjCSNJV0IWkm6TK+LyU9SlpJWkt6k/Qe8/xI2sbXRtJa0oukR0m3kmaSppKOJe3VBQAAAAAAAAAAAMCf9g3oi8UVLtE7rwAAAABJRU5ErkJggg==";
        
        console.log('Loading tileset image...');
        this.load.image('tiles', tilesetDataURI);
        console.log('Tileset image loaded.');

        console.log('Loading tilemap JSON...');
        this.load.tilemapTiledJSON('map', 'assets/maps/vibetown.json');
        console.log('Tilemap JSON loaded.');

        console.log('Loading player spritesheet...');
        this.load.spritesheet('player', playerDataURI, { 
            frameWidth: 32, 
            frameHeight: 32 
        });
        console.log('Player spritesheet loaded.');

        this.load.on('complete', () => {
            console.log('All assets loaded successfully.');
        });

        this.load.on('loaderror', (file) => {
            console.error('Error loading asset:', file.src);
        });
    }
    
    /**
     * Create game world and initialize connections
     * - Set up Colyseus multiplayer
     * - Create and configure the tilemap
     * - Set up player input handling
     */
    async create(): Promise<void> {
        console.log('Initializing Colyseus client...');
        // 1. Colyseus Connection
        try {
            const client = new Client('ws://localhost:2567');
            this.room = await client.joinOrCreate('vibe_town');
            console.log('Connected to Colyseus server!', this.room.sessionId);
        } catch (error) {
            console.error('Failed to connect to Colyseus server:', error);
            this.add.text(10, 10, 'Error: ' + error, { color: 'red' });
            return;
        }
        
        // 2. Room State Event Listeners
        
        // Handle player joining
        this.room.state.players.onAdd((player: Player, sessionId: string) => {
            console.log('Player added:', sessionId);
            try {
                // Create player sprite
                const sprite = this.physics.add.sprite(player.x, player.y, 'player', 0);
                sprite.setOrigin(0.5, 0.5);
                
                // Add sprite to map
                this.playerSprites.set(sessionId, sprite);
                
                // Create nickname text
                const nickname = this.add.text(player.x, player.y - 20, player.nickname || 'Player', {
                    fontSize: '12px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2
                });
                nickname.setOrigin(0.5, 0.5);
                
                // Add nickname to map
                this.playerNicknames.set(sessionId, nickname);
                
                // If this is the local player
                if (sessionId === this.room?.sessionId) {
                    console.log('Local player joined!');
                    
                    // Set local player reference
                    this.localPlayer = player;
                    
                    // Configure camera to follow player
                    this.cameras.main.startFollow(sprite);
                    this.cameras.main.setZoom(1.5);
                    
                    // Prompt for nickname
                    const nickname = prompt('Enter your nickname (3-16 characters):') || 'Player';
                    this.room?.send('setNickname', nickname);
                }
            } catch (error) {
                console.error('Error handling player add:', error);
            }
        });
        
        // Handle player state changes
        this.room.state.players.onChange((player: Player, sessionId: string) => {
            console.log('Player state changed:', sessionId);
            try {
                const sprite = this.playerSprites.get(sessionId);
                const nickname = this.playerNicknames.get(sessionId);
                
                if (sprite && nickname) {
                    // Smoothly interpolate position
                    this.tweens.add({
                        targets: sprite,
                        x: player.x,
                        y: player.y,
                        duration: 100,
                        ease: 'Linear'
                    });
                    
                    // Update nickname position
                    nickname.setPosition(player.x, player.y - 20);
                    
                    // If nickname changed, update text
                    if (nickname.text !== player.nickname && player.nickname) {
                        nickname.setText(player.nickname);
                    }
                }
            } catch (error) {
                console.error('Error handling player change:', error);
            }
        });
        
        // Handle player leaving
        this.room.state.players.onRemove((player: Player, sessionId: string) => {
            console.log('Player removed:', sessionId);
            try {
                // Get sprite and nickname
                const sprite = this.playerSprites.get(sessionId);
                const nickname = this.playerNicknames.get(sessionId);
                
                // Destroy game objects
                if (sprite) sprite.destroy();
                if (nickname) nickname.destroy();
                
                // Remove from maps
                this.playerSprites.delete(sessionId);
                this.playerNicknames.delete(sessionId);
                
                console.log(`Player ${sessionId} left the game`);
            } catch (error) {
                console.error('Error handling player remove:', error);
            }
        });
        
        // 3. Tilemap Setup
        try {
            // Create tilemap from loaded JSON
            const map = this.make.tilemap({ key: 'map' });
            
            // Add tileset image
            const tileset = map.addTilesetImage('vibetown-tileset', 'tiles');
            
            if (tileset) {
                // Create layers
                const groundLayer = map.createLayer('Ground', tileset, 0, 0);
                const wallsLayer = map.createLayer('Walls', tileset, 0, 0);

                // Set collision for walls
                if (wallsLayer) {
                    wallsLayer.setCollisionByProperty({ collides: true });
                }
                
                // Add collision between player sprites and walls
                this.physics.add.collider(
                    Array.from(this.playerSprites.values()),
                    wallsLayer
                );
            } else {
                console.error('Failed to load tileset');
            }
        } catch (error) {
            console.error('Error setting up tilemap:', error);
            this.add.text(10, 30, 'Error: ' + error, { color: 'red' });
        }
        
        // 4. Input Setup
        this.cursors = this.input.keyboard.createCursorKeys();
    }
    
    /**
     * Update game state
     * - Handle local player movement based on input
     * - Send movement updates to the server
     * - Reconcile client position with server position if needed
     */
    update(): void {
        if (this.localPlayer) {
            console.log('Local player position:', this.localPlayer.x, this.localPlayer.y);
        }
        
        // 1. Local Player Movement
        // Check if we have all required references
        if (!this.localPlayer || !this.cursors || !this.room) {
            return;
        }
        
        try {
            // Initialize velocity
            let velocityX = 0;
            let velocityY = 0;
            
            // Define movement speed
            const moveSpeed = 150;
            
            // Handle keyboard input
            if (this.cursors.left.isDown) {
                velocityX = -moveSpeed;
            } else if (this.cursors.right.isDown) {
                velocityX = moveSpeed;
            }
            
            if (this.cursors.up.isDown) {
                velocityY = -moveSpeed;
            } else if (this.cursors.down.isDown) {
                velocityY = moveSpeed;
            }
            
            // Get local player sprite
            const sessionId = this.room.sessionId;
            const sprite = this.playerSprites.get(sessionId);
            
            if (sprite) {
                // Set sprite velocity
                sprite.setVelocity(velocityX, velocityY);
                
                // If player is moving, send position update to server
                if (velocityX !== 0 || velocityY !== 0) {
                    // Calculate intended new position
                    const newX = sprite.x + velocityX * (this.game.loop.delta / 1000);
                    const newY = sprite.y + velocityY * (this.game.loop.delta / 1000);
                    
                    // Send move message to server
                    this.room.send('move', { x: newX, y: newY });
                }
            }
            
            // 2. Reconciliation (Local Player)
            // Compare server position with client position
            if (sprite) {
                const serverX = this.localPlayer.x;
                const serverY = this.localPlayer.y;
                const clientX = sprite.x;
                const clientY = sprite.y;
                
                // Define threshold for position correction
                const threshold = 5;
                
                // Calculate position difference
                const diffX = Math.abs(serverX - clientX);
                const diffY = Math.abs(serverY - clientY);
                
                // If difference exceeds threshold, correct client position
                if (diffX > threshold || diffY > threshold) {
                    // Smoothly move sprite to server position
                    this.tweens.add({
                        targets: sprite,
                        x: serverX,
                        y: serverY,
                        duration: 100,
                        ease: 'Linear'
                    });
                }
            }
        } catch (error) {
            console.error('Error in update loop:', error);
        }
        
        // 3. Interpolation (Remote Players)
        // This is handled by the onChange event in create()
    }
}
