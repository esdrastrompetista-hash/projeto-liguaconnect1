import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, Conversation } from '@/types';
import { socketService } from '@/services/socket';
import { messagesApi } from '@/services/api';

export function useSocket(userId: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Connect socket when user is authenticated
  useEffect(() => {
    if (!userId) {
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem('linguaconnect_access_token');
    if (token) {
      socketService.connect(token);
      setIsConnected(true);

      // Register user for call socket
      const socket = (socketService as unknown as { socket: { emit: (event: string, data: string) => void } }).socket;
      socket?.emit('register_user', userId);
    }

    return () => {
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [userId]);

  // Load conversations
  useEffect(() => {
    if (!userId) return;

    const loadConversations = async () => {
      try {
        const response = await messagesApi.getConversations();
        setConversations(response.data);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };

    loadConversations();
  }, [userId]);

  // Listen for socket events
  useEffect(() => {
    if (!userId) return;

    const unsubscribeMessage = socketService.onMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    const unsubscribeTyping = socketService.onTyping((data) => {
      setTypingUsers((prev) => ({ ...prev, [data.conversationId]: data.isTyping }));

      // Clear typing after 3 seconds
      if (typingTimeoutRef.current[data.conversationId]) {
        clearTimeout(typingTimeoutRef.current[data.conversationId]);
      }

      if (data.isTyping) {
        typingTimeoutRef.current[data.conversationId] = setTimeout(() => {
          setTypingUsers((prev) => ({ ...prev, [data.conversationId]: false }));
        }, 3000);
      }
    });

    const unsubscribeOnline = socketService.onOnlineUsers((userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeOnline();
    };
  }, [userId]);

  const joinConversation = useCallback((conversationId: string) => {
    socketService.joinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketService.leaveConversation(conversationId);
  }, []);

  const sendMessage = useCallback((conversationId: string, content: string, senderId: string) => {
    socketService.sendMessage(conversationId, content, 'text');

    // Optimistically add message to local state
    const newMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId,
      content,
      type: 'text',
      createdAt: new Date(),
      isRead: true,
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const sendTyping = useCallback((conversationId: string, _userId: string) => {
    socketService.sendTyping(conversationId, true);
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    socketService.markAsRead(conversationId);
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await messagesApi.getMessages(conversationId);
      setMessages(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }, []);

  const createConversation = useCallback(async (otherUserId: string) => {
    try {
      const response = await messagesApi.createConversation(otherUserId);
      return response.data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }, []);

  return {
    isConnected,
    messages,
    conversations,
    typingUsers,
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    markAsRead,
    loadMessages,
    createConversation,
  };
}
