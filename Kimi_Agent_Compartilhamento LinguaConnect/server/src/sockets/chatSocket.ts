import { Server, Socket } from 'socket.io';
import { db } from '../config/database';
import { messages, conversations, users } from '../config/schema';
import { eq, and } from 'drizzle-orm';

interface UserSocket {
  userId: string;
  socketId: string;
}

// Mapa de usuários online
const onlineUsers = new Map<string, string>(); // userId -> socketId

export const setupChatSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Socket connected:', socket.id);

    // Autenticação do socket
    socket.on('authenticate', async (token: string) => {
      try {
        // Verificar token JWT (simplificado - em produção use jwt.verify)
        const jwt = require('jsonwebtoken');
        const { env } = require('../config/env');
        const decoded = jwt.verify(token, env.JWT_SECRET);
        
        socket.data.userId = decoded.userId;
        socket.data.userName = decoded.name;
        
        // Adicionar à lista de usuários online
        onlineUsers.set(decoded.userId, socket.id);
        
        // Atualizar status no banco
        await db.update(users)
          .set({ isOnline: true, lastSeen: new Date() })
          .where(eq(users.id, decoded.userId));
        
        // Entrar nas salas de conversas do usuário
        const userConversations = await db.query.conversations.findMany({
          where: eq(conversations.userOneId, decoded.userId),
        });
        
        const userConversations2 = await db.query.conversations.findMany({
          where: eq(conversations.userTwoId, decoded.userId),
        });
        
        [...userConversations, ...userConversations2].forEach(conv => {
          socket.join(`conversation:${conv.id}`);
        });
        
        // Notificar outros usuários que este usuário está online
        socket.broadcast.emit('user_online', { userId: decoded.userId });
        
        // Enviar lista de usuários online para o cliente
        socket.emit('online_users', Array.from(onlineUsers.keys()));
        
        console.log(`User ${decoded.userId} authenticated on socket ${socket.id}`);
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('auth_error', { message: 'Autenticação falhou' });
      }
    });

    // Entrar em uma conversa
    socket.on('join_conversation', async (conversationId: string) => {
      try {
        const userId = socket.data.userId;
        if (!userId) return;

        // Verificar se usuário pertence à conversa
        const conversation = await db.query.conversations.findFirst({
          where: eq(conversations.id, conversationId),
        });

        if (conversation && 
            (conversation.userOneId === userId || conversation.userTwoId === userId)) {
          socket.join(`conversation:${conversationId}`);
          console.log(`User ${userId} joined conversation ${conversationId}`);
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    // Sair de uma conversa
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Enviar mensagem
    socket.on('send_message', async (data: {
      conversationId: string;
      content: string;
      type?: string;
    }) => {
      try {
        const userId = socket.data.userId;
        if (!userId) return;

        // Verificar se conversa existe
        const conversation = await db.query.conversations.findFirst({
          where: eq(conversations.id, data.conversationId),
          with: {
            userOne: true,
            userTwo: true,
          },
        });

        if (!conversation) {
          socket.emit('message_error', { error: 'Conversa não encontrada' });
          return;
        }

        if (conversation.userOneId !== userId && conversation.userTwoId !== userId) {
          socket.emit('message_error', { error: 'Acesso negado' });
          return;
        }

        // Salvar mensagem no banco
        const [newMessage] = await db.insert(messages).values({
          conversationId: data.conversationId,
          senderId: userId,
          content: data.content,
          type: data.type || 'text',
        }).returning();

        // Buscar dados do remetente
        const sender = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        // Emitir para todos na sala da conversa
        const messageData = {
          ...newMessage,
          sender: {
            id: sender?.id,
            name: sender?.name,
            avatarUrl: sender?.avatarUrl,
          },
        };

        io.to(`conversation:${data.conversationId}`).emit('new_message', messageData);

        // Notificar o outro usuário se estiver online
        const otherUserId = conversation.userOneId === userId 
          ? conversation.userTwoId 
          : conversation.userOneId;
        
        const otherSocketId = onlineUsers.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit('new_notification', {
            type: 'message',
            conversationId: data.conversationId,
            senderName: sender?.name,
            message: data.content.substring(0, 50),
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Erro ao enviar mensagem' });
      }
    });

    // Indicador de digitação
    socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
      const userId = socket.data.userId;
      if (!userId) return;

      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        userId,
        conversationId: data.conversationId,
        isTyping: data.isTyping,
      });
    });

    // Marcar mensagens como lidas
    socket.on('mark_as_read', async (data: { conversationId: string }) => {
      try {
        const userId = socket.data.userId;
        if (!userId) return;

        const conversation = await db.query.conversations.findFirst({
          where: eq(conversations.id, data.conversationId),
        });

        if (!conversation) return;

        const otherUserId = conversation.userOneId === userId 
          ? conversation.userTwoId 
          : conversation.userOneId;

        await db.update(messages)
          .set({ isRead: true })
          .where(
            and(
              eq(messages.conversationId, data.conversationId),
              eq(messages.senderId, otherUserId),
              eq(messages.isRead, false)
            )
          );

        // Notificar o remetente que as mensagens foram lidas
        const otherSocketId = onlineUsers.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit('messages_read', {
            conversationId: data.conversationId,
            by: userId,
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Desconexão
    socket.on('disconnect', async () => {
      console.log('Socket disconnected:', socket.id);
      
      const userId = socket.data.userId;
      if (userId) {
        onlineUsers.delete(userId);
        
        // Atualizar status no banco
        await db.update(users)
          .set({ isOnline: false, lastSeen: new Date() })
          .where(eq(users.id, userId));
        
        // Notificar outros usuários
        socket.broadcast.emit('user_offline', { userId });
      }
    });
  });
};

export const getOnlineUsers = () => Array.from(onlineUsers.keys());
