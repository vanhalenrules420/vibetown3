import { Schema, type, MapSchema } from '@colyseus/schema';

// Player schema defines the properties of each player
// Following single responsibility principle - only contains player data
export class Player extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("string") name: string = "";
  @type("boolean") isSpeaking: boolean = false;
}

// Room state schema defines the overall state of the VibeTownRoom
// This is the central authority for game state
export class VibeTownState extends Schema {
  // Using MapSchema for efficient additions/removals of players
  @type({ map: Player }) players = new MapSchema<Player>();
}
