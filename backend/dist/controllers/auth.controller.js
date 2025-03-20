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
exports.getCurrentUser = exports.microsoftCallback = exports.googleCallback = exports.login = exports.register = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../utils/auth");
// Register user with email and password
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name } = req.body;
        // Check if user already exists
        const existingUser = yield prisma_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Hash password
        const hashedPassword = yield (0, auth_1.hashPassword)(password);
        // Create user
        const user = yield prisma_1.default.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });
        // Generate token
        const token = (0, auth_1.generateToken)((0, auth_1.excludePassword)(user));
        return res.status(201).json({
            message: 'User registered successfully',
            token,
            user: (0, auth_1.excludePassword)(user),
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.register = register;
// Login with email and password
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Find user
        const user = yield prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Verify password
        const isValidPassword = yield (0, auth_1.verifyPassword)(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Generate token
        const token = (0, auth_1.generateToken)((0, auth_1.excludePassword)(user));
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: (0, auth_1.excludePassword)(user),
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.login = login;
// Handle Google OAuth callback
const googleCallback = (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=Authentication failed`);
        }
        // Generate token
        const token = (0, auth_1.generateToken)((0, auth_1.excludePassword)(user));
        // Redirect to frontend with token
        return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    }
    catch (error) {
        console.error('Google OAuth callback error:', error);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=Authentication failed`);
    }
};
exports.googleCallback = googleCallback;
// Handle Microsoft OAuth callback
const microsoftCallback = (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=Authentication failed`);
        }
        // Generate token
        const token = (0, auth_1.generateToken)((0, auth_1.excludePassword)(user));
        // Redirect to frontend with token
        return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    }
    catch (error) {
        console.error('Microsoft OAuth callback error:', error);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=Authentication failed`);
    }
};
exports.microsoftCallback = microsoftCallback;
// Get current user
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const user = yield prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ user: (0, auth_1.excludePassword)(user) });
    }
    catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getCurrentUser = getCurrentUser;
