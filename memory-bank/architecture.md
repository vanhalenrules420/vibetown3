Below is an **architecture document** for Vibe Town. It describes each major component (client, server, data storage, voice chat, etc.) and explains how they communicate. You can give this to any developer or stakeholder for a clear overview of the system's design.

---

# **Vibe Town – Architecture Document**

## **1. High-Level Overview**

Vibe Town is a **real-time multiplayer** "virtual office" application with the following core pieces:

1. **Client (Browser)**  
   - **Phaser** for rendering a large 2D map, collisions, and a permanently zoomed "camera."  
   - **Socket.io Client** for real-time movement/position updates.  
   - **PeerJS** for proximity-based audio chat.  
   - **Firebase JS SDK** for user authentication and data retrieval/storage.

2. **Server (Node.js + Express + Socket.io)**  
   - **Express** hosts static files (the client's HTML/JS) and exposes an HTTP endpoint.  
   - **Socket.io** manages real-time events (player movement, state updates).  
   - Stores active players' ephemeral state (x,y, conference-room membership, etc.) in memory.

3. **Firebase**  
   - **Authentication** (Email/Password, Twitter, etc.) for creating/logging in users.  
   - **Firestore** for persistent data (user profiles, conversation logs, item ownership, etc.).  
   - Optional **Cloud Functions** for advanced backend logic (invite codes, external APIs), though you can handle logic directly in Node if desired.

4. **PeerJS Server** (optional standalone or integrated)  
   - Facilitates peer-to-peer audio connections.  
   - Each user gets a unique "peer ID." When two users are near each other, they call one another directly for audio.

---

## **2. Client Architecture**

### **2.1 Phaser**

- **Role**: Renders the 2D map (e.g., 800×800 or bigger), handles collision with walls/objects, animates player sprites, and moves the camera around the player's position.  
- **Zoom**: Permanently set (e.g., 1.5×) so only the local region near the player is visible.  
- **Collision**: If you have a Tiled-based map, certain tiles are marked "collidable." Phaser's Arcade Physics checks these, preventing the player sprite from walking through them.

### **2.2 Socket.io Client**

- **Role**:  
  - Connects to the Node/Express server over WebSockets.  
  - Sends the player's updated position (x,y) on movement.  
  - Listens for "stateUpdate" messages about other players' positions.

### **2.3 PeerJS (Proximity Voice)**

- **Role**:  
  - Browser obtains the microphone stream via `getUserMedia({ audio: true })`.  
  - The client has a unique peer ID (e.g., `user.uid` from Firebase).  
  - On each "stateUpdate," if we see a user within 50 px, we attempt to connect or keep the audio call active. If they're out of range, we end or mute the call.

### **2.4 Firebase JS SDK**

- **Role**:  
  - On initial load (login page), handles sign-up/log-in via Email/Password, Twitter, etc.  
  - After login, obtains a user ID (`user.uid`).  
  - Queries/updates Firestore for persistent data (nickname, conversation logs, NFT ownership, etc.).

### **2.5 UI Components (HTML/CSS)**

- **Login/Sign-Up Page**: A form for email/password (or "Sign in with Twitter").  
- **Game Page**: Contains the Phaser canvas plus any UI overlays for chat, settings, bottom bar, notifications, etc.  
- **Mobile Joystick**: (If the user agent is mobile) a small on-screen joystick for movement.  

---

## **3. Server Architecture**

### **3.1 Express.js**

- **Serves Static Files**: The `/public` folder, which has `index.html` or `game.html` plus `phaser-game.js`.  
- **Possible REST Endpoints**: If needed for external requests or debugging.

### **3.2 Socket.io (Real-Time)**

- **Connection**: On `io.on('connection', socket => { ... })`, the server logs each user.  
- **Player State Storage**:  
  - A simple in-memory object like `players[socket.id] = { x, y, nickname, ... }`.  
  - Data only persists while the server is running.  
- **Broadcasting**:  
  - The server can send `io.emit('stateUpdate', { ...allPlayers })` or room-based emits every 50ms–100ms.  
  - Each client draws all players in Phaser accordingly.

### **3.3 Interaction with Firebase**

- **No Full "Serverless"** approach for the real-time side. Instead, we have a persistent Node server.  
- **User Data**:  
  - The server can occasionally query or update Firestore if needed (e.g., pulling user inventory, saving lecture hall membership).  
  - For authentication tokens, the server might verify them if you want extra security, but typically the client handles auth.  

### **3.4 PeerJS Server (Optional)**

- You can run an additional PeerJS server instance (`const { PeerServer } = require('peer');`).  
- The Node server or a separate process manages the signaling for P2P connections.  
- Alternatively, you might use a hosted PeerJS or a free TURN/STUN service.

---

## **4. Data Storage**

### **4.1 Firestore**

- **Collections**:
  1. **users**: One doc per user (`users/{uid}`) storing nickname, color, current outfit, friends list, or any persistent data.  
  2. **npcChats**: Keyed by NPC ID + user ID, storing conversation logs with each NPC.  
  3. **lectures** (if using lecture halls): Stores configuration (isPublic, code, startTime, participants, leaderUID).  
  4. **artworks** (if doing NFTs): Each doc has metadata, price, current owner.  
  5. **storeItems** (if AI clerk store is used): Items available for purchase.  

- **Uses**:  
  - Login flow (Firebase Auth).  
  - Long-term data like NFT ownership, conversation logs, user preferences, etc.

### **4.2 Server In-Memory State**

- **Players**: A dictionary keyed by `socket.id` or `user.uid`, containing ephemeral fields:  
  - `x, y` (current position)  
  - `focusMode` (boolean)  
  - `conferenceRoom` (string or null)  
  - `peerID` (for PeerJS calls)  
- **Why**: Real-time performance is faster in memory than writing Firestore on every movement.

---

## **5. Voice Chat & Video Calls**

### **5.1 PeerJS Flow**

1. **Initialization**: Each user, upon loading the game, creates a `new Peer(userID, { ... })`.  
2. **Local Audio Stream**: The client obtains mic access.  
3. **Distance Check**: On receiving a new `stateUpdate`, compare your position to each other player's. If distance <50 px, call them. If already connected, stay connected. If distance >50 px, end or mute.  
4. **Conference Rooms**: In a room, you can do a group logic: each user calls every other user in that room, or the server sets up some bridging approach.

### **5.2 Handling Mute/Focus**

- If `focusMode=true`, the user's track is disabled or the call is never established.  
- In conference rooms, you might default everyone to muted, and they click "Unmute" to enable.

---

## **6. Flow of a Typical Session**

1. **User Visits** `/login.html`.  
2. **Firebase Auth**: The user signs in with email/password or Twitter.  
3. **Load Game**: The user's doc in Firestore is fetched to get nickname, color, etc.  
4. **Socket.io Connection**: The user's browser pings the Node server, sending `registerPlayer` with their data. The server logs them in memory.  
5. **Phaser**: The map loads, spawns the player at (100,100). The camera follows them at a set zoom.  
6. **Movement**: The user moves with arrow keys. The client sends `playerMove` events; the server updates global state, broadcasts `stateUpdate`.  
7. **Voice**: If another user is within 50 px, a P2P call is established. If the user has `focusMode=true`, no call occurs.  
8. **Additional Features**: The user might join a conference room, talk to an NPC, buy an NFT in the gallery, or watch a live concert, etc.  
9. **Disconnect**: On page close or refresh, the server removes the user from `players`. The user can rejoin if they revisit.  
10. **Persistent Data**: As needed, certain states (e.g., nickname, conversation logs, NFT ownership) are written to Firestore for next session.

---

## **7. Deployment**

- **Single Node.js App** on a platform that supports persistent WebSockets (Railway, Render, Heroku Hobby).  
- **Firebase** is separate, running in Google's cloud, requiring only config in your app.  
- **PeerJS** server can be on the same Node process or a separate instance.  
- **Static Frontend** is served from `/public`. The user loads `index.html`, which references Phaser scripts, Socket.io client, PeerJS client, and firebase.js config.

---

## **8. Scalability & Future Considerations**

1. **Horizontal Scaling**: If concurrency grows large, you'll need multiple Node processes or containers. Use a load balancer with sticky sessions for Socket.io, and a shared data store (Redis) for cross-instance coordination.  
2. **Colyseus**: If you adopt advanced multiplayer frameworks, you might replace in-memory logic with Colyseus rooms.  
3. **Database Load**: Firestore usage might increase with user logs, NFT transactions, AI staff logs. Watch for read/write costs at scale.  
4. **TURN Servers**: For robust audio, you might need a TURN server if many users are behind restrictive NATs. This can be part of the PeerJS setup.

---

## **9. Summary**

- **Client**: Phaser, Socket.io client, PeerJS, Firebase JS.  
- **Server**: Node, Express, Socket.io, optional PeerJS.  
- **Data**: Ephemeral state in memory, persistent state (user info, logs, items) in Firestore.  
- **Workflow**: Users authenticate via Firebase, connect via Socket.io for movement, use PeerJS for voice, and store everything important in Firestore.

This architecture ensures a **simple but scalable** structure, letting you ship quickly while leaving room to expand or optimize later.
