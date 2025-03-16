import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { monitor } from '@colyseus/monitor';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { VibeTownRoom } from './rooms/VibeTownRoom';

// Create an Express app for serving the Colyseus monitor and potential REST endpoints
const app = express();

// Apply CORS middleware for cross-origin requests
app.use(cors());
app.use(express.json());

// Create an HTTP server using the Express app
const server = createServer(app);

// Create a Colyseus server using WebSocket transport
const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
});

// Register the VibeTownRoom
gameServer.define('vibetown', VibeTownRoom);

// Set up the Colyseus monitor route (admin panel)
app.use('/colyseus', monitor());

// Start the server
const port = Number(process.env.PORT || 2567);
gameServer.listen(port).then(() => {
  console.log(`
🎮 Vibe Town Server is running!
🌐 Server listening on http://localhost:${port}
📊 Colyseus monitor available at http://localhost:${port}/colyseus
  `);
}).catch(err => {
  console.error('Error starting server:', err);
});

// Handle graceful shutdown
const gracefulShutdown = () => {
  console.log('Shutting down server gracefully...');
  gameServer.gracefullyShutdown()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error during shutdown:', err);
      process.exit(1);
    });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
