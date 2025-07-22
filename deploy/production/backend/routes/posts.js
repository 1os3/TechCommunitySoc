"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postController_1 = require("../controllers/postController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const validation_2 = require("../utils/validation");
const router = (0, express_1.Router)();
// Create a new post (authenticated users only)
router.post('/', auth_1.authenticateToken, (0, validation_1.validateRequest)(validation_2.postCreationSchema), postController_1.PostController.createPost);
// Search posts (public endpoint)
router.get('/search', auth_1.optionalAuth, postController_1.PostController.searchPosts);
// Get all posts (public endpoint with optional authentication for enhanced features)
router.get('/', auth_1.optionalAuth, postController_1.PostController.getPostList);
// Get hot/trending posts (public endpoint)
router.get('/hot', postController_1.PostController.getHotPosts);
// Get a specific post by ID (public endpoint, but view count incremented if ?view=true)
router.get('/:id', auth_1.optionalAuth, postController_1.PostController.getPost);
// Update a specific post (authenticated users only, author only)
router.put('/:id', auth_1.authenticateToken, (0, validation_1.validateRequest)(validation_2.postUpdateSchema), postController_1.PostController.updatePost);
// Delete a specific post (authenticated users only, author only)
router.delete('/:id', auth_1.authenticateToken, postController_1.PostController.deletePost);
// Get posts by a specific user (public endpoint)
router.get('/user/:userId', postController_1.PostController.getUserPosts);
exports.default = router;
//# sourceMappingURL=posts.js.map