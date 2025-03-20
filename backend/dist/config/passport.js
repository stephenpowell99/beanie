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
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_microsoft_1 = require("passport-microsoft");
const passport_local_1 = require("passport-local");
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../utils/auth");
const config_1 = __importDefault(require("../config"));
// Email/password authentication
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: 'email',
    passwordField: 'password',
}, 
// @ts-ignore - Ignore TypeScript errors for now
(email, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore - Ignore TypeScript errors for now
        const user = yield prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user || !user.password) {
            return done(null, false, { message: 'Invalid credentials' });
        }
        // @ts-ignore - Ignore TypeScript errors for now
        const isValidPassword = yield (0, auth_1.verifyPassword)(password, user.password);
        if (!isValidPassword) {
            return done(null, false, { message: 'Invalid credentials' });
        }
        return done(null, user);
    }
    catch (error) {
        return done(error);
    }
})));
// Google OAuth - Only set up if credentials exist
if (config_1.default.google.clientID && config_1.default.google.clientSecret) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: config_1.default.google.clientID,
        clientSecret: config_1.default.google.clientSecret,
        callbackURL: config_1.default.google.callbackURL,
    }, 
    // @ts-ignore - Ignore TypeScript errors for now
    (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        try {
            // @ts-ignore - Ignore TypeScript errors for now
            let user = yield prisma_1.default.user.findFirst({
                where: {
                    accounts: {
                        some: {
                            provider: 'google',
                            providerAccountId: profile.id,
                        },
                    },
                },
            });
            if (!user) {
                // @ts-ignore - Ignore TypeScript errors for now
                const existingUser = yield prisma_1.default.user.findUnique({
                    where: { email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value },
                });
                if (existingUser) {
                    // @ts-ignore - Ignore TypeScript errors for now
                    yield prisma_1.default.account.create({
                        data: {
                            provider: 'google',
                            providerAccountId: profile.id,
                            type: 'oauth',
                            userId: existingUser.id,
                        },
                    });
                    user = existingUser;
                }
                else {
                    // @ts-ignore - Ignore TypeScript errors for now
                    const newUser = yield prisma_1.default.user.create({
                        data: {
                            email: ((_d = (_c = profile.emails) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || `google_${profile.id}@example.com`,
                            name: profile.displayName,
                            image: (_f = (_e = profile.photos) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.value,
                            accounts: {
                                create: {
                                    provider: 'google',
                                    providerAccountId: profile.id,
                                    type: 'oauth',
                                },
                            },
                        },
                        include: {
                            accounts: true,
                        },
                    });
                    user = newUser;
                }
            }
            return done(null, user);
        }
        catch (error) {
            return done(error);
        }
    })));
}
else {
    console.warn('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable it.');
}
// Microsoft OAuth - Only set up if credentials exist
if (config_1.default.microsoft.clientID && config_1.default.microsoft.clientSecret) {
    passport_1.default.use(new passport_microsoft_1.Strategy({
        clientID: config_1.default.microsoft.clientID,
        clientSecret: config_1.default.microsoft.clientSecret,
        callbackURL: config_1.default.microsoft.callbackURL,
        tenant: config_1.default.microsoft.tenantId,
    }, 
    // @ts-ignore - Ignore TypeScript errors for now
    function (accessToken, refreshToken, profile, done) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                // @ts-ignore - Ignore TypeScript errors for now
                let user = yield prisma_1.default.user.findFirst({
                    where: {
                        accounts: {
                            some: {
                                provider: 'microsoft',
                                providerAccountId: profile.id,
                            },
                        },
                    },
                });
                if (!user) {
                    // @ts-ignore - Ignore TypeScript errors for now
                    const existingUser = yield prisma_1.default.user.findUnique({
                        where: { email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value },
                    });
                    if (existingUser) {
                        // @ts-ignore - Ignore TypeScript errors for now
                        yield prisma_1.default.account.create({
                            data: {
                                provider: 'microsoft',
                                providerAccountId: profile.id,
                                type: 'oauth',
                                userId: existingUser.id,
                            },
                        });
                        user = existingUser;
                    }
                    else {
                        // @ts-ignore - Ignore TypeScript errors for now
                        const newUser = yield prisma_1.default.user.create({
                            data: {
                                email: ((_d = (_c = profile.emails) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || `microsoft_${profile.id}@example.com`,
                                name: profile.displayName,
                                image: (_e = profile._json) === null || _e === void 0 ? void 0 : _e.imageUrl,
                                accounts: {
                                    create: {
                                        provider: 'microsoft',
                                        providerAccountId: profile.id,
                                        type: 'oauth',
                                    },
                                },
                            },
                            include: {
                                accounts: true,
                            },
                        });
                        user = newUser;
                    }
                }
                return done(null, user);
            }
            catch (error) {
                return done(error);
            }
        });
    }));
}
else {
    console.warn('Microsoft OAuth is not configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in .env to enable it.');
}
// Serialize and deserialize user
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.default.user.findUnique({
            where: { id },
        });
        done(null, user);
    }
    catch (error) {
        done(error);
    }
}));
