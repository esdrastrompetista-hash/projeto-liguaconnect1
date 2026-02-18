import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { users } from '../config/schema';
import { eq, or } from 'drizzle-orm';
import { env } from '../config/env';
import type { User } from '../config/schema';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  age?: number;
  gender?: string;
  country?: string;
  nativeLanguage?: string;
  learningLanguages?: { language: string; level: string }[];
  bio?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateTokens = (user: User): Tokens => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

export const registerUser = async (data: RegisterData): Promise<{ user: User; tokens: Tokens }> => {
  // Verificar se email já existe
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existingUser) {
    throw new Error('Email já cadastrado');
  }

  // Hash da senha
  const passwordHash = await hashPassword(data.password);

  // Criar usuário
  const [newUser] = await db.insert(users).values({
    name: data.name,
    email: data.email,
    passwordHash,
    age: data.age,
    gender: data.gender,
    country: data.country,
    nativeLanguage: data.nativeLanguage,
    learningLanguages: data.learningLanguages || [],
    bio: data.bio,
    isOnline: true,
    lastSeen: new Date(),
  }).returning();

  const tokens = generateTokens(newUser);

  return { user: newUser, tokens };
};

export const loginUser = async (data: LoginData): Promise<{ user: User; tokens: Tokens }> => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (!user || !user.passwordHash) {
    throw new Error('Email ou senha incorretos');
  }

  const isValidPassword = await verifyPassword(data.password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error('Email ou senha incorretos');
  }

  // Atualizar status online
  await db.update(users)
    .set({ isOnline: true, lastSeen: new Date() })
    .where(eq(users.id, user.id));

  const tokens = generateTokens(user);

  return { user, tokens };
};

export const loginWithGoogle = async (googleData: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<{ user: User; tokens: Tokens }> => {
  // Verificar se usuário já existe com Google ID
  let user = await db.query.users.findFirst({
    where: or(
      eq(users.googleId, googleData.googleId),
      eq(users.email, googleData.email)
    ),
  });

  if (user) {
    // Atualizar Google ID se não tiver
    if (!user.googleId) {
      [user] = await db.update(users)
        .set({ googleId: googleData.googleId, avatarUrl: googleData.avatarUrl || user.avatarUrl })
        .where(eq(users.id, user.id))
        .returning();
    }
  } else {
    // Criar novo usuário
    [user] = await db.insert(users).values({
      name: googleData.name,
      email: googleData.email,
      googleId: googleData.googleId,
      avatarUrl: googleData.avatarUrl,
      isOnline: true,
      lastSeen: new Date(),
    }).returning();
  }

  // Atualizar status online
  await db.update(users)
    .set({ isOnline: true, lastSeen: new Date() })
    .where(eq(users.id, user.id));

  const tokens = generateTokens(user);

  return { user, tokens };
};

export const refreshAccessToken = (refreshToken: string): { accessToken: string } => {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string; type: string };
    
    if (decoded.type !== 'refresh') {
      throw new Error('Token inválido');
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return { accessToken };
  } catch {
    throw new Error('Token de refresh inválido');
  }
};

export const logoutUser = async (userId: string): Promise<void> => {
  await db.update(users)
    .set({ isOnline: false, lastSeen: new Date() })
    .where(eq(users.id, userId));
};
