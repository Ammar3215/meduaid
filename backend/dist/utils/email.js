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
exports.sendVerificationEmail = sendVerificationEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
console.log('Loaded Gmail credentials:', process.env.GMAIL_USER, process.env.GMAIL_PASS ? '✅' : '❌');
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});
function sendVerificationEmail(to, token) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('sendVerificationEmail called with:');
        console.log('To:', to);
        console.log('Token:', token);
        const verificationUrl = `http://localhost:5173/verify-email?token=${token}`;
        console.log('Verification link:', verificationUrl);
        const info = yield transporter.sendMail({
            from: 'no-reply@meduaid.com',
            to,
            subject: 'Verify your email',
            html: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.<br/><br/>Or copy and paste this link in your browser:<br/>${verificationUrl}</p>`
        }).catch((err) => {
            console.error('Email send failed:', err);
        });
        return info;
    });
}
