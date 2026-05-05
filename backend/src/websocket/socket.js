import { verifyToken } from '../utils/jwt.js';

export function setupSocketIO(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Missing authentication token'));
    }

    try {
      const decoded = verifyToken(token);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✓ User ${socket.user.userId} connected via WebSocket`);

    // Join room for specific user
    socket.join(`user:${socket.user.userId}`);

    // Join room for HRD dashboard
    if (socket.user.role === 'hrd' || socket.user.role === 'admin') {
      socket.join('hrd-dashboard');
    }

    // Listen for attendance events
    socket.on('attendance:check-in', (data) => {
      console.log(`Check-in from ${socket.user.userId}:`, data);
      // Broadcast to HRD dashboard
      io.to('hrd-dashboard').emit('attendance:checked-in', {
        userId: socket.user.userId,
        userName: `${socket.user.username}`,
        checkInTime: data.checkInTime,
        status: data.status,
        penalty: data.penalty,
      });
    });

    socket.on('attendance:check-out', (data) => {
      console.log(`Check-out from ${socket.user.userId}:`, data);
      io.to('hrd-dashboard').emit('attendance:checked-out', {
        userId: socket.user.userId,
        checkOutTime: data.checkOutTime,
      });
    });

    socket.on('disconnect', () => {
      console.log(`✗ User ${socket.user.userId} disconnected`);
    });
  });
}
