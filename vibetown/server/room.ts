import { Room, Client } from 'colyseus';
import { Schema, type, MapSchema } from '@colyseus/schema';

// Player schema for state synchronization
class Player extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("boolean") isSpeaking: boolean = false;
  @type("string") name: string = "";
}

// Game state schema
class VibeTownState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

// VibeTownRoom implementation
export class VibeTownRoom extends Room<VibeTownState> {
  // Maximum number of clients allowed in this room
  maxClients = 16;

  onCreate(options: any) {
    console.log("VibeTownRoom created!", options);

    // Initialize room state
    this.setState(new VibeTownState());

    // Set simulation interval for game loop (60 fps)
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), 1000 / 60);

    // Register message handlers with error handling
    this.onMessage("move", (client, data) => {
      try {
        const player = this.state.players.get(client.sessionId);
        if (player) {
          player.x = data.x;
          player.y = data.y;
        }
      } catch (error) {
        console.error("Error handling move message:", error);
      }
    });

    this.onMessage("speak", (client, data) => {
      try {
        const player = this.state.players.get(client.sessionId);
        if (player) {
          player.isSpeaking = data.isSpeaking;
        }
      } catch (error) {
        console.error("Error handling speak message:", error);
      }
    });
  }

  // Game update loop
  update(deltaTime: number) {
    // Implement game logic here if needed
    // This runs on the server at 60fps
  }

  onJoin(client: Client, options: any) {
    console.log("Client joined:", client.sessionId);
    
    // Create a new player for this client
    const player = new Player();
    
    // Set initial position (can be random or predefined)
    player.x = Math.floor(Math.random() * 400) + 50;
    player.y = Math.floor(Math.random() * 400) + 50;
    
    // Set player name if provided
    if (options.name) {
      player.name = options.name;
    }
    
    // Add player to the room state
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log("Client left:", client.sessionId);
    
    // Remove player from the room state
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("Room disposed");
  }
}
