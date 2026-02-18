import { Response } from 'express';
import { z } from 'zod';
import { db } from '../config/database';
import { users } from '../config/schema';
import { eq, and, or, like, sql } from 'drizzle-orm';
import type { AuthRequest } from '../middleware/auth';

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  age: z.number().min(13).max(100).optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  nativeLanguage: z.string().optional(),
  learningLanguages: z.array(z.object({
    language: z.string(),
    level: z.string(),
  })).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      search, 
      nativeLanguage, 
      learningLanguage, 
      gender, 
      minAge, 
      maxAge,
      excludeMe 
    } = req.query;

    let query = db.select().from(users);

    // Excluir usuário atual
    if (excludeMe === 'true' && req.user) {
      query = query.where(sql`${users.id} != ${req.user.id}`) as typeof query;
    }

    // Filtro por idioma nativo
    if (nativeLanguage && nativeLanguage !== 'todos') {
      query = query.where(sql`LOWER(${users.nativeLanguage}) = LOWER(${nativeLanguage as string})`) as typeof query;
    }

    // Filtro por gênero
    if (gender && gender !== 'todos') {
      query = query.where(eq(users.gender, gender as string)) as typeof query;
    }

    // Filtro por idade
    if (minAge) {
      query = query.where(sql`${users.age} >= ${parseInt(minAge as string)})`) as typeof query;
    }
    if (maxAge) {
      query = query.where(sql`${users.age} <= ${parseInt(maxAge as string)})`) as typeof query;
    }

    // Busca por nome ou país
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(users.name, searchTerm),
          like(users.country, searchTerm),
          like(users.nativeLanguage, searchTerm)
        )
      ) as typeof query;
    }

    const allUsers = await query;

    // Filtro por idioma que está aprendendo (precisa ser feito em memória)
    let filteredUsers = allUsers;
    if (learningLanguage && learningLanguage !== 'todos') {
      filteredUsers = allUsers.filter(user => 
        user.learningLanguages?.some(lang => 
          lang.language.toLowerCase() === (learningLanguage as string).toLowerCase()
        )
      );
    }

    // Remover campos sensíveis
    const sanitizedUsers = filteredUsers.map(user => ({
      id: user.id,
      name: user.name,
      age: user.age,
      gender: user.gender,
      country: user.country,
      nativeLanguage: user.nativeLanguage,
      learningLanguages: user.learningLanguages,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    }));

    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      id: user.id,
      name: user.name,
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

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const data = updateProfileSchema.parse(req.body);

    const [updatedUser] = await db.update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user.id))
      .returning();

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      age: updatedUser.age,
      gender: updatedUser.gender,
      country: updatedUser.country,
      nativeLanguage: updatedUser.nativeLanguage,
      learningLanguages: updatedUser.learningLanguages,
      bio: updatedUser.bio,
      avatarUrl: updatedUser.avatarUrl,
      isOnline: updatedUser.isOnline,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    await db.delete(users).where(eq(users.id, req.user.id));

    res.json({ message: 'Conta deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
