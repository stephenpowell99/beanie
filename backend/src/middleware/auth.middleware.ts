import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  console.log('Auth middleware called');
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No Bearer token found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);
    console.log('Token verification result:', decoded ? 'Valid' : 'Invalid');

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Attach user to request
    (req as any).user = decoded;
    console.log('User attached to request:', decoded);

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}; 