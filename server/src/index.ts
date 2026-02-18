import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { env } from './config/env';
import { db } from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import messageRoutes from './routes/messageRoutes';
import { setupChatSocket } from './sockets/chatSocket';
import { setupCallSocket } from './sockets/callSocket';

const app = express();
const httpServer = createServer(app);

// Configurar CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Configurar Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Setup sockets
setupChatSocket(io);
setupCallSocket(io);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start server
const PORT = env.PORT;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${env.FRONTEND_URL}`);
});

export { io };
