import { Room, Client } from 'colyseus';
import { Schema, type, MapSchema } from '@colyseus/schema';

/**
 * Player schema for state synchronization
 * Represents a player in the Vibe Town virtual world
 */
class Player extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("string") nickname: string = "";
  @type("string") peerId: string = "";  // For PeerJS voice chat integration
  @type("boolean") muted: boolean = false;
}

/**
 * Game state schema
 * Contains all players in the room
 */
class State extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

/**
 * VibeTownRoom implementation
 * Handles player connections, state synchronization, and message handling
 */
export class VibeTownRoom extends Room<State> {
  // Maximum number of clients allowed in this room
  maxClients = 16;

  onCreate(options: any) {
    console.log("VibeTownRoom created!", options);

    // Initialize room state
    this.setState(new State());

    // Register message handlers with error handling
    this.onMessage("move", (client, data) => {
      try {
        this.handleMove(client, data);
      } catch (error) {
        console.error("Error handling move message:", error);
      }
    });

    this.onMessage("setNickname", (client, data) => {
      try {
        this.handleSetNickname(client, data);
      } catch (error) {
        console.error("Error handling setNickname message:", error);
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

  onJoin(client: Client, options: any) {
    console.log("Client joined:", client.sessionId);
    
    // Create a new player for this client
    const player = new Player();
    
    // Set initial position (can be random or predefined)
    player.x = Math.floor(Math.random() * 400) + 50;
    player.y = Math.floor(Math.random() * 400) + 50;
    
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

  /**
   * Handle player movement
   * Updates the player's position in the game world
   */
  private handleMove(client: Client, data: { x: number, y: number }) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.x = data.x;
      player.y = data.y;
    }
  }

  /**
   * Handle nickname setting
   * Validates nickname length and uniqueness
   */
  private handleSetNickname(client: Client, data: { nickname: string }) {
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
  }

  /**
   * Handle PeerJS ID setting
   * Updates the player's PeerJS ID for voice chat
   */
  private handlePeerId(client: Client, data: { peerId: string }) {
    const player = this.state.players.get(client.sessionId);
    if (player && data.peerId) {
      player.peerId = data.peerId;
    }
  }

  /**
   * Handle mute status
   * Updates the player's mute status for voice chat
   */
  private handleMute(client: Client, data: { muted: boolean }) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.muted = data.muted;
    }
  }
}
