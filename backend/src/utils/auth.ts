import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';
import { User } from '@prisma/client';

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

// Password verification
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (user: Omit<User, 'password'>): string => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  // @ts-ignore - Temporarily ignore type errors
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// Verify JWT token
export const verifyToken = (token: string) => {
  try {
    // @ts-ignore - Temporarily ignore type errors
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

// Exclude password field from user object
export const excludePassword = (user: any) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}; 