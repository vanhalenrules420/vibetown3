Vibe Town - Product Requirements Document (AI-Assisted Development - Prompts Only)
This PRD is designed for a junior engineer using AI coding assistants (like Windsurf, GitHub Copilot, or ChatGPT) to build Vibe Town. It's structured for iterative development, starting with a minimal viable product (V0) and expanding in later versions.
Each feature includes:
	•	Description: Explains what the feature does.
	•	Build Prompt: Instructions to copy and paste into your AI assistant to generate the code.
	•	Test Prompt: Instructions to copy and paste into your AI assistant to generate a unit test for the feature.
	•	User Action: Steps that must be performed by the developer.
Tech Stack:
	•	Frontend: Phaser 3 (game engine), React (UI), TypeScript
	•	Backend: Colyseus (multiplayer server), Firebase (Hosting), PeerJS (WebRTC wrapper)
	•	Testing: Vitest (unit testing)
	•	Deployment: Firebase Hosting (client), Heroku (server)

1. Initial Project Setup
1.1 Project Initialization
User Actions:
	1	Install Node.js and npm (if you haven't already). You can download them from nodejs.org.
Git
Initialize a new Git repository in the current directory. Create a .gitignore file and add 'node_modules' and 'dist' to it. Make an initial commit with the message "Initial commit".
Build Prompt 1 (Project Setup):
Create a new Vite project with React and TypeScript named 'vibetown':
Then, navigate into the newly created project directory:
Install Colyseus, PeerJS, and Phaser as project dependencies.

Test Prompt 1 (Project Setup Verification):
Verify that the following files and directories exist:
- vibetown/package.json
- vibetown/tsconfig.json
- vibetown/src
- vibetown/public
Verify that "colyseus.js", "peerjs", and "phaser" are listed as dependencies in package.json.

Build Prompt 2 (Basic Folder Structure):
Inside the 'src' directory of the 'vibetown' project, create the following folder structure:
- components/ (for React components)
    - Game.tsx (for the main Phaser game component)
    - ChatIndicator.tsx (for visual proximity feedback)
- scenes/ (for Phaser scenes)
    - MainScene.ts
- server/ (for Colyseus server code)
    - room.ts (for the VibeTownRoom)
    - index.ts (for the server entry point)
- utils/
- assets/
    - maps/
    - (other asset folders as needed)

Test Prompt 2 (Folder Structure Verification):
Verify that the specified folder structure (components, scenes, server, utils, assets, etc.) exists within the 'src' directory of the 'vibetown' project. Check for the existence of the specific files listed (Game.tsx, ChatIndicator.tsx, MainScene.ts, room.ts, index.ts).

2. Map Creation (Tiled)
User Actions:
	1	Download and install the Tiled Map Editor.
	2	Create a new map:
	◦	Map Size: Start with a small map, e.g., 50x50 tiles.
	◦	Tile Size: 32x32 pixels.
	◦	Orientation: Orthogonal.
	3	Create a new tileset:
	◦	Use a simple, free tileset for now. You can find many online (e.g., on itch.io). A good search term is "top-down RPG tileset."
	◦	Set the tile width and height to 32x32.
	4	Create at least two layers:
	◦	Ground: Use this layer to draw the walkable areas of your map.
	◦	Walls: Use this layer to draw obstacles (walls, furniture, etc.). Make sure these tiles are different from the ground tiles.
	5	Draw a simple room layout (e.g., a lobby or a coffee shop). This will be the initial space for V0.
	6	Export the map as a JSON file (File > Export As > JSON map files (\*.json)). Save it as src/assets/maps/vibetown.json.
	7	Download the tileset and place in src/assets/
3. Colyseus Server Setup
3.1 Server Entry Point
Description: Sets up the basic Colyseus server using Express, defines the room, and handles basic CORS.
Build Prompt 3 (Server Entry Point - server/index.ts):
Create a file 'server/index.ts'.  Use Express and the 'http' module to create a basic HTTP server.
Initialize a Colyseus Server instance, attaching it to the HTTP server.
Import the VibeTownRoom (which you'll define next) from './room'.
Define a room type named 'vibe_town' using the VibeTownRoom class.
Set up basic CORS configuration to allow all origins ('*') for development.  This is important for the client to connect.
Make the server listen on port 2567 (or the PORT environment variable if available).
Log a message to the console indicating the server is listening.

Test Prompt 3 (Server Startup):
Write a test using Vitest that attempts to start the Colyseus server (defined in server/index.ts) and checks if it starts without throwing any errors.  This is a basic smoke test to ensure the server initializes correctly.  Do not test for specific game logic here, just server startup.

3.2 VibeTownRoom (Colyseus Room)
Description: Defines the VibeTownRoom, the core of the multiplayer logic. Handles player joining, leaving, movement, nickname assignment, and PeerJS ID management.
Build Prompt 4 (VibeTownRoom - server/room.ts):
Create a file 'server/room.ts'.
Define a Colyseus Schema class named 'Player' with the following properties:
  - x: number (initial value 0)
  - y: number (initial value 0)
  - nickname: string (initial value "")
  - peerId: string (initial value "") - For PeerJS integration
  - muted: boolean (initial value false)
Define a Colyseus Schema class named 'State' that contains a MapSchema of 'Player' objects, keyed by string (the player's sessionId).
Create a class named 'VibeTownRoom' that extends Colyseus.Room<State>.
Implement the 'onCreate' method:
    - Initialize the room state with a new 'State' instance.
    - Set up message handlers for 'move', 'setNickname', 'peerId', and 'mute' messages.
Implement the 'onJoin' method:
  - Create a new 'Player' instance and add it to the 'players' map in the room state, using the client's sessionId as the key.
Implement the 'onLeave' method:
  - Remove the player from the 'players' map in the room state.
Implement the 'move' message handler:
  - Retrieve the player from the 'players' map using the client's sessionId.
  - Update the player's 'x' and 'y' properties with the values received in the message.
Implement the 'setNickname' message handler:
  - Retrieve the player.
  - Validate the nickname (3-16 characters).
  - Check for nickname uniqueness against *other* players in the room.
  - If unique, set the player's 'nickname'.
  - If not unique, optionally send an error message back to the client with a suggested alternative.
Implement the 'peerId' message handler:
  - Retrieve the player.
  - Set the player's 'peerId' property with the value from the message.
Implement the 'mute' message handler:
  - Retrieve the player.
  - Set the player's 'muted' property to the value provided in the message.

**Additionally, here is more prompt
Test Prompt 4 (VibeTownRoom Tests - tests/room.test.ts):**
Implement the 'onCreate' method:
	•	Initialize the room state with a new 'State' instance.
	•	Set up message handlers for 'move', 'setNickname', 'peerId', and 'mute' messages. Wrap the code inside each handler in a try-catch block to catch and log any errors. Implement the 'move' message handler:
	•	Retrieve the player from the 'players' map using the client's sessionId: const player = this.state.players.get(client.sessionId);
	•	Add a null check: if (player) { ... } This prevents errors if the player somehow isn't found.
	•	Update the player's 'x' and 'y' properties with the values received in the message data. // ... (rest of Prompt 5) ...
Create tests using Vitest to thoroughly test the 'VibeTownRoom' class:
- Test 'onJoin': Ensure a new player is added to the 'players' map upon joining.
- Test 'onLeave': Ensure the player is removed from the 'players' map upon leaving.
- Test 'move' message: Verify that a player's 'x' and 'y' coordinates are correctly updated in the room state when a 'move' message is received.
- Test 'setNickname' message:
    - Verify a valid and unique nickname is set correctly.
    - Verify a nickname that is too short or too long is rejected.
    - Verify a duplicate nickname is rejected, and optionally that a suggestion is sent back.
- Test 'peerId' message: Verify that a player's 'peerId' is correctly stored in the room state.
- Test 'mute' message: Verify that a player's 'muted' status is correctly updated.
Use mock Client objects as needed for testing interactions with the room.

Additional test:
	•	Test 'move' message:
	◦	Create a mock Client object.
	◦	Call room.onJoin with the mock client.
	◦	Call room.onMessage with the 'move' message type, the mock client, and a payload containing new x and y coordinates.
	◦	Use expect(player.x).toBe(expectedX) and expect(player.y).toBe(expectedY) to verify that the player's position was updated correctly. Use specific values for expectedX and expectedY. // ... (rest of Test Prompt 4 - with similar improvements for other tests) ... // --- Mocking --- At the beginning of your test files be sure to mock any modules/classes that are not the primary target of the test. For instance, if testing room.ts, you might mock the Client class from Colyseus: vi.mock('colyseus', () => ({ Client: vi.fn(), // Mock the Client class Room: vi.fn().mockImplementation(() => ({ // Mock the Room class state: { players: new Map(), }, onMessage: vi.fn(), setState: vi.fn(), })), }));
4. Client-Side Implementation (Phaser + React)
4.1 MainScene (Phaser Scene)
Description: The Phaser scene handles rendering the game world, player sprites, movement, and interaction with the Colyseus server. It also manages PeerJS connections.
Build Prompt 5 (MainScene - src/scenes/MainScene.ts):
Create a file 'src/scenes/MainScene.ts'.
Create a class 'MainScene' that extends Phaser.Scene.
In the 'preload' method:
  - Load the Tiled map JSON file ('assets/maps/vibetown.json').
  - Load the tileset image (e.g., 'assets/tileset.png').
  - Load a spritesheet for the player character (e.g., 'assets/player.png').  Define frame width and height.
In the 'create' method:
  - Initialize a Colyseus Client instance, connecting to 'ws://localhost:2567' (or the appropriate server URL).
  - Attempt to join or create a room of type 'vibe_town'.
  - Set up event listeners for changes in the room state:
    - 'onAdd' for players:
      - Create a Phaser sprite for the new player at the player's initial x and y coordinates.
      - Add the sprite to a map (playerSprites) keyed by the player's sessionId.
      - Create a text object to display the player's nickname above the sprite. Add this to a separate map (playerNicknames).
      - If the added player is the *local* player:
        - Store a reference to the local player object.
        - Set the camera to follow the local player's sprite.
        - Set a comfortable zoom level (e.g., 1.5).
        - Prompt the user for a nickname and send a 'setNickname' message to the server.
      - If the added player is a *remote* player, and they have a 'peerId', initiate a PeerJS call (see PeerJS section below).
    - 'onChange' for players:
      - Smoothly interpolate the position of the corresponding sprite to the updated x and y coordinates.
      - Update text object with nickname position.
    - 'onRemove' for players:
      - Destroy the corresponding sprite and nickname text object.
      - Remove them from their respective maps.
      - Close any PeerJS connections associated with that player (see PeerJS section below).
  - Set up keyboard input (WASD or arrow keys) for the local player's movement.
  - On each movement input, send a 'move' message to the Colyseus room with the *intended* new x and y coordinates.  Implement client-side prediction.
  - Create the tilemap layers ('Ground', 'Walls').
  - Set up collision detection between the player sprites and the 'Walls' layer.

  // --- PeerJS Integration ---
  - Initialize a PeerJS instance *after* joining the Colyseus room.
  - On 'peer.on('open')':  Send the PeerJS ID to the Colyseus room using a 'peerId' message.
  - On 'peer.on('call')':
    - Answer the incoming call.
    - Get the local audio stream (microphone).
    - Send the local audio stream to the caller.
    - When the remote stream is received, create an HTML audio element and play the remote stream.  Attach this audio element to the DOM (but keep it hidden visually).  *Do not* create a Phaser sound object.
  - Create a function 'initiateCall(sessionId, peerId)' that:
    - Connects to the remote peer using `peer.connect(peerId);`
    - Establishes audio call by using `peer.call(peerId, stream);`
  - Create a function `closeConnection(sessionId)` to handle closing PeerJS connections and removing associated audio elements.
- Create a function to add an audio stream to the game. This function should create an HTMLAudioElement, set its source to the provided stream, and append it to the document body (but visually hidden).
- Store connections by sessionId in a map to track connections.

Add a mute/unmute button (visual toggle).  When clicked, send a 'mute' message to the server with the new mute state (true/false).  Stop sending the audio stream when muted.

Additional prompt
// ... (rest of Prompt 7) ... // --- Movement Handling ---
	•	On each movement input (key press):
	◦	Immediately update the local player sprite's position (client-side prediction).
	◦	Send a 'move' message to the Colyseus room with the intended new x and y coordinates.
	•	In the 'update' method of the scene (Phaser's update loop):
	◦	For the local player:
	▪	Check if the local player's sprite position differs significantly from the position in the Colyseus room state. If it does, smoothly correct the sprite's position to match the server state (reconciliation). This handles cases where the server rejects a move (e.g., collision).
	◦	For remote players:
	▪	Smoothly interpolate their sprite positions towards the positions received from the Colyseus room state (as you already have). // ... (rest of Prompt 7) ... // --- PeerJS Error Handling ---
	•	Add an error handler to the PeerJS instance: peer.on('error', (err) => { /* Handle the error (e.g., log it, show a message to the user) */ });
	•	Add error handling to the initiateCall and call answering logic. For example, handle cases where navigator.mediaDevices.getUserMedia fails. // --- Camera Functionality --- In the create() method.
	•	Set the camera to follow the local player, using startFollow().
Test
Create tests for 'src/scenes/MainScene.ts' using Vitest and a mocking library (like ts-mockito or similar) to mock Phaser and Colyseus objects:
- Test that the scene loads the required assets (tileset, tilemap, player sprite).
- Test that the Colyseus client attempts to connect to the correct server address.
- Test that joining a room triggers the appropriate callbacks and creates player sprites.
- Test that player movement updates are sent to the server.
- Test that remote player sprites are created and updated based on room state changes.
- Test that the camera follows the local player's sprite.
- Test the nickname prompt displays.
- Test that the PeerJS instance is initialized.
- Test that sending the 'peerId' message works.
- Test that initiating and answering calls work as expected (you'll need to mock the PeerJS connection and stream events).
- Test the mute/unmute functionality.
- These tests will be complex and require careful mocking. Focus on testing the interactions between Phaser, Colyseus, and PeerJS.

User Action:
	•	Provide a placeholder tileset image and a player sprite and place them in src/assets.
4.2 ChatIndicator (React Component)
Description: A small React component that displays a visual indicator (e.g., a chat bubble icon) above players who are within voice chat range.
Build Prompt 6 (ChatIndicator - src/components/ChatIndicator.tsx):
Create a React component named 'ChatIndicator' in 'src/components/ChatIndicator.tsx'.
This component should accept the following props:
  - inRange: boolean (true if the player is in voice chat range, false otherwise)
  - x: number (the player's x coordinate)
  - y: number (the player's y coordinate)
If 'inRange' is true, render a small chat bubble icon (or other visual indicator) at the provided (x, y) coordinates, offset slightly above the player's head. Use CSS for positioning.
If 'inRange' is false, render nothing (null).
Use CSS to style the indicator (size, color, etc.).

Test Prompt 6 (ChatIndicator Tests):
Create tests for 'src/components/ChatIndicator.tsx' using Vitest and a React testing library (like @testing-library/react):
- Test that the indicator is rendered when 'inRange' is true.
- Test that the indicator is *not* rendered when 'inRange' is false.
- Test that the indicator is positioned correctly based on the provided 'x' and 'y' props.

User Actions:
	•	Provide a small chat bubble icon image (e.g., a 16x16 PNG) and place it in the src/assets folder.
4.3 Game Component (React Component)
Description: A simple React component that initializes and contains the Phaser game.
Build Prompt 7 (Game Component - src/components/Game.tsx):
Create a React component named 'Game' in 'src/components/Game.tsx'.
Inside this component, use the 'useEffect' hook to initialize the Phaser game *after* the component has mounted.
Create a new Phaser.Game instance, configuring it with:
  - type: Phaser.AUTO (let Phaser choose the renderer)
  - width: (a reasonable initial width, e.g., 800)
  - height: (a reasonable initial height, e.g., 600)
  - scene: [MainScene] (the scene you created earlier)
  - parent: (a DOM element ID where Phaser will create the canvas - you can use a ref for this)
  - physics: { default: 'arcade', arcade: { gravity: { y: 0 } } } // No gravity
Render a <div> element with a unique ID that will serve as the container for the Phaser canvas.

Test Prompt 7 (Game Component Tests):
