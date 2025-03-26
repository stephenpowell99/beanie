"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const config_1 = __importDefault(require("../config"));
const router = express_1.default.Router();
// Email/password auth routes
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
// Google OAuth routes - Only set up if credentials exist
if (config_1.default.google.clientID && config_1.default.google.clientSecret) {
    router.get('/google', (req, res, next) => {
        const state = req.query.state;
        const authOptions = {
            scope: ['profile', 'email'],
            state: state || undefined
        };
        passport_1.default.authenticate('google', authOptions)(req, res, next);
    });
    router.get('/google/callback', passport_1.default.authenticate('google', {
        session: false,
        failureRedirect: '/login',
        // Pass through the state parameter
        passReqToCallback: true
    }), auth_controller_1.googleCallback);
}
// Microsoft OAuth routes - Only set up if credentials exist
if (config_1.default.microsoft.clientID && config_1.default.microsoft.clientSecret) {
    router.get('/microsoft', (req, res, next) => {
        const state = req.query.state;
        const authOptions = {
            scope: ['user.read'],
            state: state || undefined
        };
        passport_1.default.authenticate('microsoft', authOptions)(req, res, next);
    });
    router.get('/microsoft/callback', passport_1.default.authenticate('microsoft', {
        session: false,
        failureRedirect: '/login',
        // Pass through the state parameter
        passReqToCallback: true
    }), auth_controller_1.microsoftCallback);
}
// Protected routes
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.getCurrentUser);
exports.default = router;
