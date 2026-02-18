import { io, Socket } from 'socket.io-client';
import type { Message } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private messageListeners: ((message: Message) => void)[] = [];
  private typingListeners: ((data: { userId: string; conversationId: string; isTyping: boolean }) => void)[] = [];
  private onlineListeners: ((userIds: string[]) => void)[] = [];
  private notificationListeners: ((data: unknown) => void)[] = [];

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.socket?.emit('authenticate', token);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('new_message', (message: Message) => {
      this.messageListeners.forEach((listener) => listener(message));
    });

    this.socket.on('user_typing', (data: { userId: string; conversationId: string; isTyping: boolean }) => {
      this.typingListeners.forEach((listener) => listener(data));
    });

    this.socket.on('online_users', (userIds: string[]) => {
      this.onlineListeners.forEach((listener) => listener(userIds));
    });

    this.socket.on('user_online', (_data: { userId: string }) => {
      this.onlineListeners.forEach((listener) => listener([]));
    });

    this.socket.on('user_offline', (_data: { userId: string }) => {
      this.onlineListeners.forEach((listener) => listener([]));
    });

    this.socket.on('new_notification', (data: unknown) => {
      this.notificationListeners.forEach((listener) => listener(data));
    });

    this.socket.on('auth_error', (error: { message: string }) => {
      console.error('Socket auth error:', error.message);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('leave_conversation', conversationId);
  }

  sendMessage(conversationId: string, content: string, type: 'text' | 'audio' = 'text'): void {
    this.socket?.emit('send_message', { conversationId, content, type });
  }

  sendTyping(conversationId: string, isTyping: boolean): void {
    this.socket?.emit('typing', { conversationId, isTyping });
  }

  markAsRead(conversationId: string): void {
    this.socket?.emit('mark_as_read', { conversationId });
  }

  onMessage(listener: (message: Message) => void): () => void {
    this.messageListeners.push(listener);
    return () => {
      const index = this.messageListeners.indexOf(listener);
      if (index > -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  onTyping(listener: (data: { userId: string; conversationId: string; isTyping: boolean }) => void): () => void {
    this.typingListeners.push(listener);
    return () => {
      const index = this.typingListeners.indexOf(listener);
      if (index > -1) {
        this.typingListeners.splice(index, 1);
      }
    };
  }

  onOnlineUsers(listener: (userIds: string[]) => void): () => void {
    this.onlineListeners.push(listener);
    return () => {
      const index = this.onlineListeners.indexOf(listener);
      if (index > -1) {
        this.onlineListeners.splice(index, 1);
      }
    };
  }

  onNotification(listener: (data: unknown) => void): () => void {
    this.notificationListeners.push(listener);
    return () => {
      const index = this.notificationListeners.indexOf(listener);
      if (index > -1) {
        this.notificationListeners.splice(index, 1);
      }
    };
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
