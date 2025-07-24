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
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const submissionController_1 = require("../controllers/submissionController");
const Submission_1 = __importDefault(require("../models/Submission"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path_1.default.join(__dirname, '../../uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = (0, multer_1.default)({ storage });
router.post('/', auth_1.authenticate, submissionController_1.createSubmission);
router.get('/', auth_1.authenticate, submissionController_1.getSubmissions);
router.patch('/:id', auth_1.authenticate, submissionController_1.updateSubmissionStatus);
router.delete('/:id', auth_1.authenticate, submissionController_1.deleteSubmission);
// GET /api/submissions/:id - fetch a single submission by ID
router.get('/:id', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
// Image upload endpoint
router.post('/upload', upload.array('images', 5), (req, res) => {
    const files = req.files;
    const urls = files.map(f => `/uploads/${f.filename}`);
    res.json({ urls });
});
router.get('/:id', auth_1.authenticate, submissionController_1.getSubmissionById);
exports.default = router;
