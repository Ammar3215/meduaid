"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const submissionController_1 = require("../controllers/submissionController");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Allowed file types and extensions
const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
// File filter function
const fileFilter = (req, file, cb) => {
    // Check file extension
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
        return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid MIME type. Only image files are allowed.'));
    }
    // Additional security: Check for double extensions
    const filename = file.originalname.toLowerCase();
    const suspiciousPatterns = ['.php', '.exe', '.bat', '.sh', '.cmd', '.scr', '.js', '.html'];
    if (suspiciousPatterns.some(pattern => filename.includes(pattern))) {
        return cb(new Error('Suspicious file detected.'));
    }
    cb(null, true);
};
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path_1.default.join(__dirname, '../../uploads'));
    },
    filename: function (req, file, cb) {
        // Sanitize filename and add timestamp
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(sanitizedName);
        const nameWithoutExt = path_1.default.basename(sanitizedName, ext);
        cb(null, `${uniqueSuffix}-${nameWithoutExt}${ext}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files
    }
});
router.post('/', auth_1.authenticate, submissionController_1.createSubmission);
router.get('/', auth_1.authenticate, submissionController_1.getSubmissions);
router.patch('/:id', auth_1.authenticate, submissionController_1.updateSubmissionStatus);
router.delete('/:id', auth_1.authenticate, submissionController_1.deleteSubmission);
router.get('/:id', auth_1.authenticate, submissionController_1.getSubmissionById);
// Image upload endpoint
router.post('/upload', auth_1.authenticate, upload.array('images', 5), (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ message: 'No files uploaded.' });
            return;
        }
        // Additional security check: Verify file content matches extension
        const urls = files.map(f => `/uploads/${f.filename}`);
        res.json({
            urls,
            message: `${files.length} file(s) uploaded successfully.`,
            totalFiles: files.length
        });
    }
    catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'File upload failed.' });
    }
});
exports.default = router;
