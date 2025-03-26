import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import prisma from './prisma';
import config from './config';
import { errorHandler } from './middleware/errorHandler.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import xeroRoutes from './routes/xero.routes';
import aiRoutes from './routes/ai.routes';

// Initialize passport
import './config/passport';

// Initialize environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Get CORS allowed origins from environment variable or default to an array
const getAllowedOrigins = (): string[] => {
  const originsFromEnv = process.env.CORS_ORIGINS;
  const defaultOrigins = [
    'https://beanie-six.vercel.app',
    'https://beanie.vercel.app',
    'http://localhost:5173',  // Vite default port
    'http://localhost:3000',  // Another common frontend port
  ];

  if (originsFromEnv) {
    return originsFromEnv.split(',');
  }
  
  return defaultOrigins;
};

// CORS configuration
const allowedOrigins = getAllowedOrigins();

console.log('CORS allowed origins:', allowedOrigins);
console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('Frontend URL:', process.env.FRONTEND_URL);

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    console.log('Request origin:', origin);
    
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) {
      console.log('No origin, allowing request');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      console.log('Origin allowed by CORS:', origin);
      callback(null, true);
    } else {
      console.log('Origin rejected by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
  name: config.session.cookieName,
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/xero', xeroRoutes);
app.use('/api/ai', aiRoutes);

// User routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 