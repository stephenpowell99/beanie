import dotenv from 'dotenv';
dotenv.config();

export default {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '1d',
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
  },
  microsoft: {
    clientID: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3001/api/auth/microsoft/callback',
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'session-secret',
    cookieName: 'beanie.sid',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
}; 