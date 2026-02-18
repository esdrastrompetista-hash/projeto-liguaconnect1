import { Request, Response } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, loginWithGoogle, refreshAccessToken, logoutUser } from '../services/auth';
import { db } from '../config/database';
import { users } from '../config/schema';
import { eq } from 'drizzle-orm';
import type { AuthRequest } from '../middleware/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  age: z.number().min(13).max(100).optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  nativeLanguage: z.string().optional(),
  learningLanguages: z.array(z.object({
    language: z.string(),
    level: z.string(),
  })).optional(),
  bio: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const googleLoginSchema = z.object({
  googleId: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().optional(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const { user, tokens } = await registerUser(data);

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        country: user.country,
        nativeLanguage: user.nativeLanguage,
        learningLanguages: user.learningLanguages,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isOnline: user.isOnline,
      },
      tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const { user, tokens } = await loginUser(data);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        country: user.country,
        nativeLanguage: user.nativeLanguage,
        learningLanguages: user.learningLanguages,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isOnline: user.isOnline,
      },
      tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const data = googleLoginSchema.parse(req.body);
    const { user, tokens } = await loginWithGoogle(data);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        country: user.country,
        nativeLanguage: user.nativeLanguage,
        learningLanguages: user.learningLanguages,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isOnline: user.isOnline,
      },
      tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token não fornecido' });
    }

    const { accessToken } = refreshAccessToken(refreshToken);
    res.json({ accessToken });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user) {
      await logoutUser(req.user.id);
    }
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      country: user.country,
      nativeLanguage: user.nativeLanguage,
      learningLanguages: user.learningLanguages,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
