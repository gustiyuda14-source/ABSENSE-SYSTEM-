import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env, isDevelopment } from './config/environment.js';
import { initializeDatabase, closeDatabase } from './config/database.js';
import { setupSocketIO } from './websocket/socket.js';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.SECURITY.CORS_ORIGIN,
    credentials: true,
  },
});

// Setup Socket.IO
setupSocketIO(io);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});

async function start() {
  try {
    // Initialize database
    const dbReady = await initializeDatabase();
    if (!dbReady) {
      console.error('Failed to initialize database');
      process.exit(1);
    }

    // Start server
    server.listen(env.PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   D'AJIKS Attendance System API        ║
║   Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}       ║
║   Port: ${env.PORT}                          ║
║   ✓ Ready to accept requests           ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
