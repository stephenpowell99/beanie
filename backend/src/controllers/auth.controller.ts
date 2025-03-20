import { Request, Response } from 'express';
import prisma from '../prisma';
import { hashPassword, verifyPassword, generateToken, excludePassword } from '../utils/auth';

// Register user with email and password
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // Generate token
    const token = generateToken(excludePassword(user));

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: excludePassword(user),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Login with email and password
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(excludePassword(user));

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: excludePassword(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Handle Google OAuth callback
export const googleCallback = (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    // Get the state parameter for the original URL
    const state = req.query.state as string;
    const frontendURL = state || process.env.FRONTEND_URL || 'https://beanie-six.vercel.app';
    
    console.log('Google OAuth callback. State:', state, 'Frontend URL:', frontendURL);
    
    if (!user) {
      return res.redirect(`${frontendURL}/auth/login?error=Authentication failed`);
    }

    // Generate token
    const token = generateToken(excludePassword(user));
    
    // Redirect to frontend with token
    return res.redirect(`${frontendURL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const state = req.query.state as string;
    const frontendURL = state || process.env.FRONTEND_URL || 'https://beanie-six.vercel.app';
    return res.redirect(`${frontendURL}/auth/login?error=Authentication failed`);
  }
};

// Handle Microsoft OAuth callback
export const microsoftCallback = (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    // Get the state parameter for the original URL
    const state = req.query.state as string;
    const frontendURL = state || process.env.FRONTEND_URL || 'https://beanie-six.vercel.app';
    
    console.log('Microsoft OAuth callback. State:', state, 'Frontend URL:', frontendURL);
    
    if (!user) {
      return res.redirect(`${frontendURL}/auth/login?error=Authentication failed`);
    }

    // Generate token
    const token = generateToken(excludePassword(user));
    
    // Redirect to frontend with token
    return res.redirect(`${frontendURL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    const state = req.query.state as string;
    const frontendURL = state || process.env.FRONTEND_URL || 'https://beanie-six.vercel.app';
    return res.redirect(`${frontendURL}/auth/login?error=Authentication failed`);
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: excludePassword(user) });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 