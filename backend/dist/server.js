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
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
// Add error handlers to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
const PORT = process.env.PORT || 5050;
const MONGO_URI = process.env.MONGO_URI || '';
// Validate critical environment variables
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not set');
    process.exit(1);
}
if (process.env.JWT_SECRET === 'your_jwt_secret_here' || process.env.JWT_SECRET === 'secret') {
    console.error('FATAL ERROR: JWT_SECRET is using default/weak value. Please set a strong, random secret.');
    process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
    console.error('FATAL ERROR: JWT_SECRET must be at least 32 characters long');
    process.exit(1);
}
console.log('Attempting to connect to MongoDB...');
function connectToMongoDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(MONGO_URI);
            console.log('Connected to MongoDB successfully');
            console.log(`Starting server on port ${PORT}...`);
            const server = app_1.default.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
            server.on('error', (error) => {
                console.error('Server failed to start:', error);
            });
        }
        catch (err) {
            console.error('Failed to connect to MongoDB:', err);
            process.exit(1);
        }
    });
}
connectToMongoDB();
