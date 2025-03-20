import express from 'express';
import passport from 'passport';
import { register, login, googleCallback, microsoftCallback, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { RequestHandler } from 'express';
import config from '../config';

const router = express.Router();

// Email/password auth routes
router.post('/register', register as unknown as RequestHandler);
router.post('/login', login as unknown as RequestHandler);

// Google OAuth routes - Only set up if credentials exist
if (config.google.clientID && config.google.clientSecret) {
  router.get(
    '/google',
    (req, res, next) => {
      const state = req.query.state as string;
      const authOptions = { 
        scope: ['profile', 'email'],
        state: state || undefined
      };
      passport.authenticate('google', authOptions)(req, res, next);
    }
  );
  
  router.get(
    '/google/callback',
    passport.authenticate('google', { 
      session: false, 
      failureRedirect: '/login',
      // Pass through the state parameter
      passReqToCallback: true 
    }),
    googleCallback as unknown as RequestHandler
  );
}

// Microsoft OAuth routes - Only set up if credentials exist
if (config.microsoft.clientID && config.microsoft.clientSecret) {
  router.get(
    '/microsoft',
    (req, res, next) => {
      const state = req.query.state as string;
      const authOptions = { 
        scope: ['user.read'],
        state: state || undefined
      };
      passport.authenticate('microsoft', authOptions)(req, res, next);
    }
  );
  
  router.get(
    '/microsoft/callback',
    passport.authenticate('microsoft', { 
      session: false, 
      failureRedirect: '/login',
      // Pass through the state parameter
      passReqToCallback: true 
    }),
    microsoftCallback as unknown as RequestHandler
  );
}

// Protected routes
router.get('/me', authenticate as unknown as RequestHandler, getCurrentUser as unknown as RequestHandler);

export default router; 