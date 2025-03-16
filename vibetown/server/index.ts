import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'colyseus';
import { VibeTownRoom } from './room';

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
