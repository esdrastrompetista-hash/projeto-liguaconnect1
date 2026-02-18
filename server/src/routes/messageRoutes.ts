import { Router } from 'express';
import { getConversations, getMessages, createConversation, sendMessage } from '../controllers/messageController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/conversations', authMiddleware, getConversations);
router.post('/conversations', authMiddleware, createConversation);
router.get('/conversations/:conversationId/messages', authMiddleware, getMessages);
router.post('/conversations/:conversationId/messages', authMiddleware, sendMessage);

export default router;
