"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const app_1 = __importDefault(require("./app"));
const mongoose_1 = __importDefault(require("mongoose"));
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
mongoose_1.default.connect(MONGO_URI)
    .then(() => {
    console.log('Connected to MongoDB');
    app_1.default.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});
