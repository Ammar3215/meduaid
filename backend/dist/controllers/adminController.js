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
exports.getAllSubmissions = exports.deletePenalty = exports.getWriters = exports.createPenalty = exports.getRecentPenalties = exports.getStats = void 0;
const User_1 = __importDefault(require("../models/User"));
const Submission_1 = __importDefault(require("../models/Submission"));
const Penalty_1 = __importDefault(require("../models/Penalty"));
const OsceStation_1 = __importDefault(require("../models/OsceStation"));
const mongoose_1 = __importDefault(require("mongoose"));
const getStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const totalUsers = yield User_1.default.countDocuments();
        // Fetch both types
        const sba = yield Submission_1.default.find().populate('writer', 'name email');
        const osce = yield OsceStation_1.default.find().populate('writer', 'name email');
        // Tag and merge
        const sbaWithType = sba.map((q) => (Object.assign(Object.assign({}, q.toObject()), { type: 'SBA' })));
        const osceWithType = osce.map((q) => (Object.assign(Object.assign({}, q.toObject()), { type: 'OSCE' })));
        const all = [...sbaWithType, ...osceWithType].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // Stats by status (merged)
        const submissionsByStatus = all.reduce((acc, q) => {
            acc[q.status] = (acc[q.status] || 0) + 1;
            return acc;
        }, {});
        const totalSubmissions = all.length;
        const allSubmissions = all;
        const recentSubmissions = all.slice(0, 5);
        res.json({
            totalUsers,
            totalSubmissions,
            submissionsByStatus,
            recentSubmissions,
            allSubmissions
        });
        return;
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
        return;
    }
});
exports.getStats = getStats;
const getRecentPenalties = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const penalties = yield Penalty_1.default.find().sort({ createdAt: -1 }).populate('writer', 'name email');
        res.json({ penalties });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getRecentPenalties = getRecentPenalties;
const createPenalty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('POST /api/admin/penalties', req.body);
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const { writer, reason, type, amount } = req.body;
        if (!writer || !reason || !type) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (type === 'monetary' && (amount === undefined || amount === null || amount === '')) {
            res.status(400).json({ message: 'Amount is required for monetary penalties' });
            return;
        }
        // Find writer by email or id (only use _id if valid ObjectId)
        let writerQuery = [{ email: writer }];
        if (mongoose_1.default.Types.ObjectId.isValid(writer)) {
            writerQuery.unshift({ _id: writer });
        }
        const writerUser = yield User_1.default.findOne({ $or: writerQuery });
        if (!writerUser) {
            res.status(404).json({ message: 'Writer not found' });
            return;
        }
        // Create penalty
        const penaltyData = {
            writer: writerUser._id,
            reason,
            type,
        };
        if (type === 'monetary') {
            penaltyData.amount = Number(amount);
        }
        const penalty = yield Penalty_1.default.create(penaltyData);
        const populatedPenalty = yield Penalty_1.default.findById(penalty._id).populate('writer', 'name email');
        res.status(201).json(populatedPenalty);
    }
    catch (err) {
        console.error('Error in createPenalty:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createPenalty = createPenalty;
const getWriters = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const writers = yield User_1.default.find({ role: 'writer' }).select('name email');
        res.json(writers);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getWriters = getWriters;
const deletePenalty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const { id } = req.params;
        const penalty = yield Penalty_1.default.findByIdAndDelete(id);
        if (!penalty) {
            res.status(404).json({ message: 'Penalty not found' });
            return;
        }
        res.status(200).json({ message: 'Penalty removed' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.deletePenalty = deletePenalty;
// New endpoint: Get all submissions (SBA + OSCE)
const getAllSubmissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        // Fetch both types
        const sba = yield Submission_1.default.find().populate('writer', 'name email');
        const osce = yield OsceStation_1.default.find().populate('writer', 'name email');
        // Normalize and tag type
        const sbaWithType = sba.map((q) => (Object.assign(Object.assign({}, q.toObject()), { type: 'SBA' })));
        const osceWithType = osce.map((q) => (Object.assign(Object.assign({}, q.toObject()), { type: 'OSCE' })));
        // Merge and sort by createdAt desc
        const all = [...sbaWithType, ...osceWithType].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json({ submissions: all });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getAllSubmissions = getAllSubmissions;
