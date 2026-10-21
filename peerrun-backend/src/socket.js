import { Server } from 'socket.io';
import { verifyToken } from './middleware/auth.js';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' } });

  // Handshake: the client sends { auth: { token } }. No valid JWT, no connection.
  io.use((socket, next) => {
    try {
      socket.userId = verifyToken(socket.handshake.auth?.token).id;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  // Each user joins a private room, so an event can be sent to exactly one person.
  io.on('connection', (socket) => socket.join(`user:${socket.userId}`));
  return io;
}

export function notifyUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}
