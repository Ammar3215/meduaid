"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const writerController_1 = require("../controllers/writerController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/stats', auth_1.authenticate, writerController_1.getStats);
router.get('/penalties', auth_1.authenticate, writerController_1.getPenalties);
exports.default = router;
