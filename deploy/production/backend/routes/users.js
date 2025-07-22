"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postController_1 = require("../controllers/postController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Search users (public endpoint)
router.get('/search', auth_1.optionalAuth, postController_1.PostController.searchUsers);
exports.default = router;
//# sourceMappingURL=users.js.map