import { Router } from 'express';
import { getUsers, getUserById, updateProfile, deleteAccount } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getUsers);
router.get('/:id', authMiddleware, getUserById);
router.put('/profile', authMiddleware, updateProfile);
router.delete('/account', authMiddleware, deleteAccount);

export default router;
