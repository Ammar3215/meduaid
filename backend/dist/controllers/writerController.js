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
exports.getPenalties = exports.getStats = void 0;
const Submission_1 = __importDefault(require("../models/Submission"));
const Penalty_1 = __importDefault(require("../models/Penalty"));
const mongoose_1 = __importDefault(require("mongoose"));
const getStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'writer') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const writerId = user.id;
        const totalSubmissions = yield Submission_1.default.countDocuments({ writer: writerId });
        const submissionsByStatus = yield Submission_1.default.aggregate([
            { $match: { writer: new mongoose_1.default.Types.ObjectId(writerId) } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const recentSubmissionsDocs = yield Submission_1.default.find({ writer: writerId }).sort({ createdAt: -1 });
        const recentSubmissions = recentSubmissionsDocs.map(sub => ({
            _id: sub._id,
            category: sub.category,
            subject: sub.subject,
            topic: sub.topic,
            question: sub.question,
            choices: sub.choices,
            explanations: sub.explanations,
            reference: sub.reference,
            images: sub.images,
            status: sub.status,
            rejectionReason: sub.rejectionReason,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
        }));
        res.json({
            totalSubmissions,
            submissionsByStatus,
            recentSubmissions
        });
        return;
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
        return;
    }
});
exports.getStats = getStats;
const getPenalties = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'writer') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const penalties = yield Penalty_1.default.find({ writer: user.id }).sort({ createdAt: -1 });
        res.json({ penalties });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getPenalties = getPenalties;
