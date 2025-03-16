import { Room, Client } from 'colyseus';
import { VibeTownState, Player } from '../schema/VibeTownState';

// VibeTownRoom is the central authority for game state
// It handles:
// 1. Player connections and disconnections
// 2. Processing player messages
// 3. Maintaining and synchronizing game state
export class VibeTownRoom extends Room<VibeTownState> {
  // Maximum number of clients allowed in this room
  maxClients = 16;
  
  // Called when the room is created
  onCreate(options: any) {
    console.log('VibeTownRoom created!', options);
    
    // Initialize the room state
    this.setState(new VibeTownState());
    
    // Set up message handlers
    this.setupMessageHandlers();
    
    // Set up a simulation interval for future game logic
    // This could handle NPC movement, events, etc.
    this.setSimulationInterval(() => this.update(), 1000 / 30);
  }
  
  // Called when a client joins the room
  onJoin(client: Client, options: any) {
    console.log(`Client joined: ${client.sessionId}`);
    
    try {
      // Create a new player in the state
      const player = new Player();
      
      // Set initial position (random for now)
      player.x = Math.floor(Math.random() * 400) + 200;
      player.y = Math.floor(Math.random() * 300) + 150;
      
      // Set player name (from options or default)
      player.name = options.name || `Player${Math.floor(Math.random() * 1000)}`;
      
      // Add the player to the state
      this.state.players.set(client.sessionId, player);
    } catch (error) {
      console.error('Error adding player:', error);
      throw error;
    }
  }
  
  // Called when a client leaves the room
  onLeave(client: Client, consented: boolean) {
    console.log(`Client left: ${client.sessionId}`);
    
    try {
      // Remove the player from the state
      if (this.state.players.has(client.sessionId)) {
        this.state.players.delete(client.sessionId);
      }
    } catch (error) {
      console.error('Error removing player:', error);
    }
  }
  
  // Called when the room is disposed
  onDispose() {
    console.log('VibeTownRoom disposed!');
  }
  
  // Set up message handlers for client messages
  private setupMessageHandlers() {
    // Handle player movement
    this.onMessage('move', (client, message) => {
      try {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        
        // Update player position
        player.x = message.x;
        player.y = message.y;
      } catch (error) {
        console.error('Error handling move message:', error);
      }
    });
    
    // Handle voice chat status
    this.onMessage('speaking', (client, isSpeaking) => {
      try {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        
        // Update speaking status
        player.isSpeaking = isSpeaking;
      } catch (error) {
        console.error('Error handling speaking message:', error);
      }
    });
  }
  
  // Game update loop
  private update() {
    // This will be used for future game logic
    // For now, it's just a placeholder
  }
}
