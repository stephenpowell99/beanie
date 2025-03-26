"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const prisma_1 = __importDefault(require("./prisma"));
const config_1 = __importDefault(require("./config"));
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const xero_routes_1 = __importDefault(require("./routes/xero.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
// Initialize passport
require("./config/passport");
// Initialize environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Get CORS allowed origins from environment variable or default to an array
const getAllowedOrigins = () => {
    const originsFromEnv = process.env.CORS_ORIGINS;
    const defaultOrigins = [
        'https://beanie-six.vercel.app',
        'https://beanie.vercel.app',
        'http://localhost:5173', // Vite default port
        'http://localhost:3000', // Another common frontend port
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
app.use((0, cors_1.default)({
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
        }
        else {
            console.log('Origin rejected by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Session configuration
app.use((0, express_session_1.default)({
    secret: config_1.default.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
    name: config_1.default.session.cookieName,
}));
// Initialize passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Routes
app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});
// API routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/xero', xero_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
// User routes
app.get('/api/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.default.user.findMany();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});
// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
