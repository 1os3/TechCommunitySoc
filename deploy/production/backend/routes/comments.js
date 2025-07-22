"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commentController_1 = require("../controllers/commentController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const validation_2 = require("../utils/validation");
const router = (0, express_1.Router)();
// Create a new comment for a post (authenticated users only)
router.post('/posts/:postId', auth_1.authenticateToken, (0, validation_1.validateRequest)(validation_2.commentCreationSchema), commentController_1.CommentController.createComment);
// Get all comments for a specific post (public endpoint)
router.get('/posts/:postId', auth_1.optionalAuth, commentController_1.CommentController.getPostComments);
// Get comments with hierarchical tree structure (public endpoint)
router.get('/posts/:postId/tree', auth_1.optionalAuth, commentController_1.CommentController.getPostCommentsTree);
// Get comments in flattened structure with level indicators (public endpoint)
router.get('/posts/:postId/flattened', auth_1.optionalAuth, commentController_1.CommentController.getPostCommentsFlattened);
// Get sorted comments with different strategies (public endpoint)
router.get('/posts/:postId/sorted', auth_1.optionalAuth, commentController_1.CommentController.getPostCommentsSorted);
// Get a specific comment by ID (public endpoint)
router.get('/:id', auth_1.optionalAuth, commentController_1.CommentController.getComment);
// Get replies to a specific comment (public endpoint)
router.get('/:id/replies', auth_1.optionalAuth, commentController_1.CommentController.getCommentReplies);
// Update a specific comment (authenticated users only, author only)
router.put('/:id', auth_1.authenticateToken, (0, validation_1.validateRequest)(validation_2.commentUpdateSchema), commentController_1.CommentController.updateComment);
// Delete a specific comment (authenticated users only, author only)
router.delete('/:id', auth_1.authenticateToken, commentController_1.CommentController.deleteComment);
// Get comments by a specific user (public endpoint)
router.get('/user/:userId', auth_1.optionalAuth, commentController_1.CommentController.getUserComments);
exports.default = router;
//# sourceMappingURL=comments.js.map