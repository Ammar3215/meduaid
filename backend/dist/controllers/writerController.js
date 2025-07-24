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
const OsceStation_1 = __importDefault(require("../models/OsceStation"));
const getStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'writer') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const writerId = user.id;
        // SBA
        const sbaDocs = yield Submission_1.default.find({ writer: writerId });
        const sba = sbaDocs.map(sub => (Object.assign(Object.assign({}, sub.toObject()), { type: 'SBA' })));
        // OSCE
        const osceDocs = yield OsceStation_1.default.find({ writer: writerId });
        const osce = osceDocs.map(station => (Object.assign(Object.assign({}, station.toObject()), { type: 'OSCE' })));
        // Merge and sort
        const recentSubmissions = [...sba, ...osce].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // Stats
        const totalSubmissions = recentSubmissions.length;
        const submissionsByStatus = recentSubmissions.reduce((acc, q) => {
            acc[q.status] = (acc[q.status] || 0) + 1;
            return acc;
        }, {});
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
