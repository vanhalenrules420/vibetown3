import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { Server } from 'colyseus';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Room } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';

/**
 * Server Smoke Test
 * 
 * This test verifies that the Colyseus server can initialize properly without throwing any errors.
 * It doesn't test specific game logic, just ensures the server can start and stop correctly.
 * 
 * The test follows these steps:
 * 1. Create an Express app and HTTP server
 * 2. Initialize a Colyseus server with the HTTP server
 * 3. Define a simple test room
 * 4. Start the server on a test port
 * 5. Verify the server started without errors
 */

// Create a simple test room for the smoke test
class TestRoom extends Room {
  onCreate(options: any) {
    console.log("TestRoom created!", options);
  }

  onJoin(client: any, options: any) {
    console.log("Client joined:", client.sessionId);
  }

  onLeave(client: any) {
    console.log("Client left:", client.sessionId);
  }
}

describe('Colyseus Server Initialization', () => {
  // Test variables
  let app: express.Express;
  let server: http.Server;
  let gameServer: Server;
  const TEST_PORT = 2568; // Use a different port than the main server

  // Mock process.exit to prevent it from actually exiting during tests
  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      console.log(`Mock process.exit called with code: ${code}`);
      return undefined as never;
    });

    // Create Express app
    app = express();
    app.use(cors());
    app.use(express.json());

    // Create HTTP server
    server = http.createServer(app);

    // Create Colyseus server with WebSocketTransport (following deprecation warning)
    gameServer = new Server({
      transport: new WebSocketTransport({
        server: server
      })
    });

    // Define the test room
    gameServer.define('test_room', TestRoom);
  });

  // Clean up after each test
  afterEach(async () => {
    // Shut down the server if it's running
    if (gameServer) {
      try {
        await gameServer.gracefullyShutdown();
      } catch (error) {
        console.log('Error during shutdown (expected in tests):', error);
      }
    }
    
    // Restore mocks
    vi.restoreAllMocks();
  });

  // Smoke test - verify server can start without errors
  it('should start without errors', async () => {
    // The test passes if this doesn't throw an error
    await expect(gameServer.listen(TEST_PORT)).resolves.not.toThrow();
    
    // Verify the server has a transport (indicating it's running)
    expect(gameServer.transport).toBeDefined();
    
    console.log(`Server successfully started on test port ${TEST_PORT}`);
  });
});
