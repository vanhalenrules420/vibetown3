# Vibe Town

A 2D multiplayer virtual world where users can move around, interact, and chat with each other in real-time.

## Technology Stack

- **Frontend**: Phaser 3 (game engine), React (UI), TypeScript
- **Backend**: Colyseus (multiplayer server), Node.js, PeerJS (WebRTC wrapper)
- **Deployment**: Vercel (client), Heroku (server)
- **Testing**: Vitest

## Project Structure

The project follows a modular architecture with clear separation of concerns:

```
vibetown/
├── src/                  # Client-side code
│   ├── components/       # React UI components
│   ├── scenes/           # Phaser game scenes
│   ├── utils/            # Shared utility functions
│   └── assets/           # Game assets (maps, sprites, audio)
├── server/               # Server-side code
│   ├── rooms/            # Colyseus room implementations
│   └── schema/           # State schema definitions
└── public/               # Static assets
```

## Key Architectural Principles

1. **Modularity**: Independent, reusable components
2. **Clear separation** between game logic (Phaser) and UI (React)
3. **Server authority** via Colyseus for game state
4. **P2P audio chat** using PeerJS
5. **Client-side prediction** and server reconciliation for smooth movement

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd vibetown
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. In a separate terminal, start the Colyseus server:
   ```
   npm run server
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Development Guidelines

- Follow TypeScript best practices with proper typing
- Keep components small and focused on a single responsibility
- Use Colyseus for all game state management
- Handle errors appropriately at all levels
- Write tests for critical functionality

## License

MIT
