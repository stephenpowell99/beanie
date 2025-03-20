"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Email/password auth routes
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
// Google OAuth routes
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/login' }), auth_controller_1.googleCallback);
// Microsoft OAuth routes
router.get('/microsoft', passport_1.default.authenticate('microsoft', {
    scope: ['user.read']
}));
router.get('/microsoft/callback', passport_1.default.authenticate('microsoft', { session: false, failureRedirect: '/login' }), auth_controller_1.microsoftCallback);
// Protected routes
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.getCurrentUser);
exports.default = router;
