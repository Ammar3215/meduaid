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
exports.deletePenalty = exports.getWriters = exports.createPenalty = exports.getRecentPenalties = exports.getStats = void 0;
const User_1 = __importDefault(require("../models/User"));
const Submission_1 = __importDefault(require("../models/Submission"));
const Penalty_1 = __importDefault(require("../models/Penalty"));
const mongoose_1 = __importDefault(require("mongoose"));
const getStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const totalUsers = yield User_1.default.countDocuments();
        const totalSubmissions = yield Submission_1.default.countDocuments();
        const submissionsByStatus = yield Submission_1.default.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const recentSubmissions = yield Submission_1.default.find().sort({ createdAt: -1 }).limit(5).populate('writer', 'name email');
        res.json({
            totalUsers,
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
