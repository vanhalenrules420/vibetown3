import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server, Room } from 'colyseus';
import { Schema, type, MapSchema } from '@colyseus/schema';

// Player schema
class Player extends Schema {
  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.nickname = "";
    this.peerId = "";
    this.muted = false;
  }
}

// Register schema fields
type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("string")(Player.prototype, "nickname");
type("string")(Player.prototype, "peerId");
type("boolean")(Player.prototype, "muted");

// Game state schema
class VibeTownState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
  }
}

// Register schema fields
type({ map: Player })(VibeTownState.prototype, "players");

// VibeTownRoom implementation
class VibeTownRoom extends Room {
  constructor() {
    super();
    this.maxClients = 16;
  }

  onCreate(options) {
    console.log("VibeTownRoom created!", options);
    
    // Initialize room state
    this.setState(new VibeTownState());
    
    // Register message handlers with error handling
    this.onMessage("move", (client, data) => {
      try {
        this.handleMove(client, data);
      } catch (error) {
        console.error("Error handling move message:", error);
      }
    });
    
    this.onMessage("nickname", (client, data) => {
      try {
        this.handleSetNickname(client, data);
      } catch (error) {
        console.error("Error handling nickname message:", error);
      }
    });
    
    this.onMessage("peerId", (client, data) => {
      try {
        this.handlePeerId(client, data);
      } catch (error) {
        console.error("Error handling peerId message:", error);
      }
    });
    
    this.onMessage("mute", (client, data) => {
      try {
        this.handleMute(client, data);
      } catch (error) {
        console.error("Error handling mute message:", error);
      }
    });
  }
  
  onJoin(client, options) {
    console.log(`Client joined: ${client.sessionId}`);
    
    try {
      // Create a new player in the state
      const player = new Player();
      
      // Set initial position (random for now)
      player.x = Math.floor(Math.random() * 400) + 200;
      player.y = Math.floor(Math.random() * 300) + 150;
      
      // Set player name (from options or default)
      player.nickname = options.nickname || `Player${Math.floor(Math.random() * 1000)}`;
      
      // Add the player to the state
      this.state.players.set(client.sessionId, player);
    } catch (error) {
      console.error('Error adding player:', error);
      throw error;
    }
  }
  
  onLeave(client, consented) {
    console.log(`Client left: ${client.sessionId}`);
    
    try {
      // Remove the player from the state
      this.state.players.delete(client.sessionId);
    } catch (error) {
      console.error('Error removing player:', error);
    }
  }
  
  onDispose() {
    console.log("Room disposed");
  }
  
  // Handle player movement
  handleMove(client, data) {
    const player = this.state.players.get(client.sessionId);
    if (player && typeof data.x === 'number' && typeof data.y === 'number') {
      player.x = data.x;
      player.y = data.y;
    }
  }
  
  // Handle nickname setting
  handleSetNickname(client, data) {
    const player = this.state.players.get(client.sessionId);
    if (player && data.nickname && data.nickname.length <= 20) {
      player.nickname = data.nickname;
    }
  }
  
  // Handle PeerJS ID setting
  handlePeerId(client, data) {
    const player = this.state.players.get(client.sessionId);
    if (player && data.peerId) {
      player.peerId = data.peerId;
    }
  }
  
  // Handle mute status
  handleMute(client, data) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.muted = data.muted;
    }
  }
}

// Create Express application
const app = express();

// Configure CORS to allow all origins for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

// Parse JSON bodies
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create Colyseus server instance
const gameServer = new Server({
  server: server
});

// Define the room
gameServer.define('vibe_town', VibeTownRoom);

// Get port from environment variable or use 2567 as default
const port = process.env.PORT ? parseInt(process.env.PORT) : 2567;

// Start listening
gameServer.listen(port).then(() => {
  console.log(`Vibe Town server is running on http://localhost:${port}`);
  console.log(`Colyseus WebSocket server is listening on ws://localhost:${port}`);
}).catch(err => {
  console.error('Failed to start server:', err);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  gameServer.gracefullyShutdown().then(() => {
    console.log('Server shutdown complete');
    process.exit(0);
  }).catch(err => {
    console.error('Error during shutdown:', err);
    process.exit(1);
  });
});
