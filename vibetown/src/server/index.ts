import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { monitor } from '@colyseus/monitor';
import { VibeTownRoom } from './room';

// Create Express app
const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create Colyseus server
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: server
  })
});

// Register VibeTownRoom
gameServer.define('vibetown', VibeTownRoom);

// Register Colyseus monitor (admin panel)
app.use('/colyseus', monitor());

// Serve static files from the public directory
app.use(express.static('public'));

// Define port
const port = process.env.PORT || 3000;

// Start server
gameServer.listen(Number(port)).then(() => {
  console.log(`Vibe Town server is running on http://localhost:${port}`);
  console.log(`Colyseus monitor available at http://localhost:${port}/colyseus`);
}).catch(err => {
  console.error('Error starting server:', err);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  gameServer.gracefullyShutdown().then(() => {
    console.log('Server shut down successfully');
    process.exit(0);
  }).catch(err => {
    console.error('Error shutting down server:', err);
    process.exit(1);
  });
});
