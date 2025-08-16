"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    var _a;
    // Try to get token from Authorization header first (primary method), then fallback to cookies
    let token;
    let tokenSource = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        tokenSource = 'Bearer header';
    }
    // Fallback to cookie if no Authorization header
    if (!token) {
        token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.jwt;
        if (token) {
            tokenSource = 'httpOnly cookie';
        }
    }
    if (!token) {
        console.log(`[AUTH] No token found - User-Agent: ${req.get('User-Agent')}, IP: ${req.ip}, Path: ${req.path}`);
        res.status(401).json({
            message: 'Authentication required. Please log in again.',
            error: 'NO_TOKEN',
            details: 'No authentication token found in request headers or cookies'
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id, role: decoded.role };
        console.log(`[AUTH] Success - User: ${decoded.id}, Role: ${decoded.role}, Source: ${tokenSource}, Path: ${req.path}`);
        next();
    }
    catch (err) {
        const errorType = err instanceof jsonwebtoken_1.default.TokenExpiredError ? 'EXPIRED_TOKEN' :
            err instanceof jsonwebtoken_1.default.JsonWebTokenError ? 'INVALID_TOKEN' : 'TOKEN_ERROR';
        console.log(`[AUTH] Failed - Error: ${errorType}, Source: ${tokenSource}, User-Agent: ${req.get('User-Agent')}, IP: ${req.ip}, Path: ${req.path}`);
        res.status(401).json({
            message: errorType === 'EXPIRED_TOKEN' ? 'Your session has expired. Please log in again.' :
                'Invalid authentication token. Please log in again.',
            error: errorType,
            details: err instanceof Error ? err.message : 'Token verification failed'
        });
    }
};
exports.authenticate = authenticate;
