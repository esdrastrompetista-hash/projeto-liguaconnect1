import { Response } from 'express';
import { z } from 'zod';
import { db } from '../config/database';
import { conversations, messages, users } from '../config/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import type { AuthRequest } from '../middleware/auth';

const createMessageSchema = z.object({
  content: z.string().min(1, 'Mensagem não pode estar vazia'),
  type: z.enum(['text', 'audio']).default('text'),
});

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const userId = req.user.id;

    // Buscar todas as conversas do usuário
    const userConversations = await db.query.conversations.findMany({
      where: or(
        eq(conversations.userOneId, userId),
        eq(conversations.userTwoId, userId)
      ),
      with: {
        userOne: true,
        userTwo: true,
      },
    });

    // Para cada conversa, buscar a última mensagem
    const conversationsWithLastMessage = await Promise.all(
      userConversations.map(async (conv) => {
        const otherUser = conv.userOneId === userId ? conv.userTwo : conv.userOne;
        
        const lastMessage = await db.query.messages.findFirst({
          where: eq(messages.conversationId, conv.id),
          orderBy: desc(messages.createdAt),
        });

        // Contar mensagens não lidas
        const unreadCount = await db.select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.senderId, otherUser.id),
              eq(messages.isRead, false)
            )
          );

        return {
          id: conv.id,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            avatarUrl: otherUser.avatarUrl,
            isOnline: otherUser.isOnline,
          },
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            type: lastMessage.type,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
            isRead: lastMessage.isRead,
          } : null,
          unreadCount: unreadCount[0]?.count || 0,
          createdAt: conv.createdAt,
        };
      })
    );

    // Ordenar por última mensagem
    conversationsWithLastMessage.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt || a.createdAt;
      const dateB = b.lastMessage?.createdAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    res.json(conversationsWithLastMessage);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { conversationId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    // Verificar se usuário pertence à conversa
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    if (conversation.userOneId !== req.user.id && conversation.userTwoId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const conversationMessages = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: desc(messages.createdAt),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    // Marcar mensagens como lidas
    await db.update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.senderId, conversation.userOneId === req.user.id ? conversation.userTwoId : conversation.userOneId),
          eq(messages.isRead, false)
        )
      );

    res.json(conversationMessages.reverse());
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const createConversation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    // Verificar se conversa já existe
    const existingConversation = await db.query.conversations.findFirst({
      where: or(
        and(
          eq(conversations.userOneId, req.user.id),
          eq(conversations.userTwoId, userId)
        ),
        and(
          eq(conversations.userOneId, userId),
          eq(conversations.userTwoId, req.user.id)
        )
      ),
    });

    if (existingConversation) {
      return res.json({ id: existingConversation.id });
    }

    // Criar nova conversa
    const [newConversation] = await db.insert(conversations).values({
      userOneId: req.user.id,
      userTwoId: userId,
    }).returning();

    res.status(201).json({ id: newConversation.id });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { conversationId } = req.params;
    const data = createMessageSchema.parse(req.body);

    // Verificar se conversa existe e usuário pertence a ela
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    if (conversation.userOneId !== req.user.id && conversation.userTwoId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const [newMessage] = await db.insert(messages).values({
      conversationId,
      senderId: req.user.id,
      content: data.content,
      type: data.type,
    }).returning();

    res.status(201).json(newMessage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
