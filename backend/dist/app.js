"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const submissions_1 = __importDefault(require("./routes/submissions"));
const admin_1 = __importDefault(require("./routes/admin"));
const writer_1 = __importDefault(require("./routes/writer"));
const osceStations_1 = __importDefault(require("./routes/osceStations"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://localhost:1573',
        'https://meduaid.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Rate limiting configurations
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window per IP
    message: {
        error: 'Too many authentication attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const strictAuthLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window per IP for sensitive operations
    message: {
        error: 'Too many failed attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window per IP
    message: {
        error: 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply rate limiting
app.use('/api/auth/login', strictAuthLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', strictAuthLimiter);
app.use('/api/auth/reset-password', strictAuthLimiter);
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);
app.get('/', (req, res) => {
    res.send('MeduAid QB Portal Backend is running');
});
app.use('/api/auth', auth_1.default);
app.use('/api/submissions', submissions_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/writer', writer_1.default);
app.use('/api/osce-stations', osceStations_1.default);
exports.default = app;
