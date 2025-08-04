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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubmissionById = exports.deleteSubmission = exports.updateSubmissionStatus = exports.getSubmissions = exports.createSubmission = void 0;
const Submission_1 = __importDefault(require("../models/Submission"));
// Writer submits a question
const createSubmission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { category, subject, topic, subtopic, question, choices, explanations, reference, difficulty, images, status, writer, correctChoice } = req.body;
        let writerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const user = req.user;
        // If admin and writer is provided, use that
        if ((user === null || user === void 0 ? void 0 : user.role) === 'admin' && writer) {
            writerId = writer;
        }
        const submission = yield Submission_1.default.create({
            writer: writerId,
            category,
            subject,
            topic,
            subtopic,
            question,
            choices,
            explanations,
            reference,
            difficulty,
            images: images || [],
            status: status === 'draft' ? 'draft' : 'pending',
            correctChoice,
        });
        res.status(201).json(submission);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createSubmission = createSubmission;
// Input sanitization helper
const sanitizeStringInput = (input) => {
    if (typeof input !== 'string' || input.trim() === '')
        return null;
    return input.trim();
};
// Get submissions (writer: own, admin: all, with filters)
const getSubmissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, subject, topic, status, writer } = req.query;
        const filter = {};
        const user = req.user;
        if ((user === null || user === void 0 ? void 0 : user.role) === 'writer') {
            filter.writer = user.id;
            if (status) {
                // Sanitize status input and support comma-separated values
                const sanitizedStatus = sanitizeStringInput(status);
                if (sanitizedStatus) {
                    const statusArr = sanitizedStatus.split(',').map(s => s.trim()).filter(s => ['pending', 'approved', 'rejected', 'draft'].includes(s));
                    if (statusArr.length > 0) {
                        filter.status = { $in: statusArr };
                    }
                }
            }
        }
        else if ((user === null || user === void 0 ? void 0 : user.role) === 'admin') {
            if (status) {
                // Sanitize status input for admin
                const sanitizedStatus = sanitizeStringInput(status);
                if (sanitizedStatus) {
                    const statusArr = sanitizedStatus.split(',').map(s => s.trim()).filter(s => ['pending', 'approved', 'rejected', 'draft'].includes(s));
                    if (statusArr.length > 0) {
                        if (!statusArr.includes('draft')) {
                            filter.status = { $in: statusArr.filter(s => s !== 'draft') };
                        }
                        else {
                            filter.status = { $in: statusArr };
                        }
                    }
                }
            }
            else {
                // By default, exclude drafts for admin
                filter.status = { $ne: 'draft' };
            }
            if (writer) {
                // Sanitize writer input - must be a valid string
                const sanitizedWriter = sanitizeStringInput(writer);
                if (sanitizedWriter) {
                    filter.writer = sanitizedWriter;
                }
            }
        }
        // Sanitize category, subject, topic inputs
        const sanitizedCategory = sanitizeStringInput(category);
        if (sanitizedCategory)
            filter.category = sanitizedCategory;
        const sanitizedSubject = sanitizeStringInput(subject);
        if (sanitizedSubject)
            filter.subject = sanitizedSubject;
        const sanitizedTopic = sanitizeStringInput(topic);
        if (sanitizedTopic)
            filter.topic = sanitizedTopic;
        const submissions = yield Submission_1.default.find(filter).populate('writer', 'name email');
        res.json(submissions);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getSubmissions = getSubmissions;
// Admin updates submission status
const updateSubmissionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        const _a = req.body, { status, rejectionReason } = _a, rest = __rest(_a, ["status", "rejectionReason"]);
        // Find the submission
        const submission = yield Submission_1.default.findById(id);
        if (!submission) {
            res.status(404).json({ message: 'Submission not found' });
            return;
        }
        // Admins can update any submission
        if ((user === null || user === void 0 ? void 0 : user.role) === 'admin') {
            // Validate status value if present
            const allowedStatuses = ['pending', 'approved', 'rejected'];
            if (status && !allowedStatuses.includes(status)) {
                // Invalid status value received
                res.status(400).json({ message: 'Invalid status value' });
                return;
            }
            // SECURITY FIX: Whitelist allowed fields instead of using spread operator
            const allowedFields = ['question', 'choices', 'explanations', 'reference', 'difficulty', 'category', 'subject', 'topic', 'subtopic'];
            const updateObj = {};
            // Only allow specific fields to be updated
            allowedFields.forEach(field => {
                if (rest[field] !== undefined) {
                    updateObj[field] = rest[field];
                }
            });
            // Add admin-specific fields
            if (status)
                updateObj.status = status;
            if (rejectionReason !== undefined)
                updateObj.rejectionReason = rejectionReason;
            // Admin PATCH request processed
            const updated = yield Submission_1.default.findByIdAndUpdate(id, updateObj, { new: true });
            // Submission updated successfully
            res.json(updated);
            return;
        }
        // Writers can update their own rejected or draft submissions
        if ((user === null || user === void 0 ? void 0 : user.role) === 'writer' &&
            submission.writer.toString() === user.id &&
            (submission.status === 'rejected' || submission.status === 'draft')) {
            let allowedFields = {};
            if (submission.status === 'rejected') {
                allowedFields.status = 'pending';
                allowedFields.rejectionReason = '';
            }
            else if (submission.status === 'draft') {
                // Allow status to be set to 'pending' (submit) or remain 'draft' (save as draft)
                allowedFields.status = status === 'pending' ? 'pending' : 'draft';
            }
            if (rest.question !== undefined)
                allowedFields.question = rest.question;
            if (rest.choices !== undefined)
                allowedFields.choices = rest.choices;
            if (rest.explanations !== undefined)
                allowedFields.explanations = rest.explanations;
            if (rest.reference !== undefined)
                allowedFields.reference = rest.reference;
            if (rest.difficulty !== undefined)
                allowedFields.difficulty = rest.difficulty;
            const updated = yield Submission_1.default.findByIdAndUpdate(id, allowedFields, { new: true });
            res.json(updated);
            return;
        }
        res.status(403).json({ message: 'Forbidden' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateSubmissionStatus = updateSubmissionStatus;
// Delete a submission (question)
const deleteSubmission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        const submission = yield Submission_1.default.findById(id);
        if (!submission) {
            res.status(404).json({ message: 'Submission not found' });
            return;
        }
        if ((user === null || user === void 0 ? void 0 : user.role) === 'admin') {
            yield Submission_1.default.findByIdAndDelete(id);
            res.json({ message: 'Submission deleted' });
            return;
        }
        if ((user === null || user === void 0 ? void 0 : user.role) === 'writer' &&
            submission.writer.toString() === user.id &&
            ['draft', 'rejected', 'pending'].includes(submission.status)) {
            yield Submission_1.default.findByIdAndDelete(id);
            res.json({ message: 'Submission deleted' });
            return;
        }
        res.status(403).json({ message: 'Forbidden' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.deleteSubmission = deleteSubmission;
// Get a single submission by ID
const getSubmissionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const submission = yield Submission_1.default.findById(id).populate('writer', 'name email');
        if (!submission) {
            res.status(404).json({ message: 'Submission not found' });
            return;
        }
        res.json(submission);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getSubmissionById = getSubmissionById;
