"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Post_1 = __importDefault(require("../../src/models/Post"));
const User_1 = __importDefault(require("../../src/models/User"));
const database_1 = require("../../src/config/database");
const models_1 = require("../../src/models");
describe('Post Model', () => {
    let testUser;
    beforeAll(async () => {
        await database_1.sequelize.sync({ force: true });
        (0, models_1.initializeModels)();
        testUser = await User_1.default.create({
            username: 'testuser',
            email: 'test@example.com',
            password_hash: 'hashedpassword123',
        });
    });
    afterEach(async () => {
        await Post_1.default.destroy({ where: {}, force: true });
    });
    describe('Post Creation', () => {
        it('should create a post with valid data', async () => {
            const postData = {
                title: 'Test Post',
                content: 'This is test content',
                author_id: testUser.id,
            };
            const post = await Post_1.default.create(postData);
            expect(post.id).toBeDefined();
            expect(post.title).toBe(postData.title);
            expect(post.content).toBe(postData.content);
            expect(post.author_id).toBe(testUser.id);
            expect(post.view_count).toBe(0);
            expect(post.like_count).toBe(0);
            expect(post.comment_count).toBe(0);
            expect(post.hotness_score).toBe(0);
            expect(post.is_deleted).toBe(false);
            expect(post.created_at).toBeInstanceOf(Date);
            expect(post.updated_at).toBeInstanceOf(Date);
        });
        it('should require title and content', async () => {
            const postDataWithoutTitle = {
                content: 'This is test content',
                author_id: testUser.id,
            };
            await expect(Post_1.default.create(postDataWithoutTitle)).rejects.toThrow();
            const postDataWithoutContent = {
                title: 'Test Post',
                author_id: testUser.id,
            };
            await expect(Post_1.default.create(postDataWithoutContent)).rejects.toThrow();
        });
        it('should validate title length', async () => {
            const postData = {
                title: '', // Empty title
                content: 'This is test content',
                author_id: testUser.id,
            };
            await expect(Post_1.default.create(postData)).rejects.toThrow();
        });
        it('should validate content length', async () => {
            const postData = {
                title: 'Test Post',
                content: '', // Empty content
                author_id: testUser.id,
            };
            await expect(Post_1.default.create(postData)).rejects.toThrow();
        });
    });
    describe('Post Methods', () => {
        let testPost;
        beforeEach(async () => {
            testPost = await Post_1.default.create({
                title: 'Test Post',
                content: 'This is test content',
                author_id: testUser.id,
            });
        });
        describe('incrementViewCount', () => {
            it('should increment view count', async () => {
                const initialCount = testPost.view_count;
                await testPost.incrementViewCount();
                await testPost.reload();
                expect(testPost.view_count).toBe(initialCount + 1);
            });
        });
        describe('incrementLikeCount', () => {
            it('should increment like count', async () => {
                const initialCount = testPost.like_count;
                await testPost.incrementLikeCount();
                await testPost.reload();
                expect(testPost.like_count).toBe(initialCount + 1);
            });
        });
        describe('decrementLikeCount', () => {
            it('should decrement like count', async () => {
                await testPost.update({ like_count: 5 });
                await testPost.decrementLikeCount();
                await testPost.reload();
                expect(testPost.like_count).toBe(4);
            });
        });
        describe('updateHotnessScore', () => {
            it('should calculate and update hotness score', async () => {
                await testPost.update({
                    like_count: 10,
                    comment_count: 5,
                    view_count: 100,
                });
                await testPost.updateHotnessScore();
                await testPost.reload();
                expect(testPost.hotness_score).toBeGreaterThan(0);
            });
        });
        describe('softDelete', () => {
            it('should mark post as deleted', async () => {
                await testPost.softDelete();
                await testPost.reload();
                expect(testPost.is_deleted).toBe(true);
            });
        });
    });
    describe('Static Methods', () => {
        let testPost;
        beforeEach(async () => {
            testPost = await Post_1.default.create({
                title: 'Test Post',
                content: 'This is test content',
                author_id: testUser.id,
            });
        });
        describe('findActivePostById', () => {
            it('should find active post by id', async () => {
                const found = await Post_1.default.findActivePostById(testPost.id);
                expect(found).toBeTruthy();
                expect(found?.id).toBe(testPost.id);
            });
            it('should not find deleted post', async () => {
                await testPost.softDelete();
                const found = await Post_1.default.findActivePostById(testPost.id);
                expect(found).toBeNull();
            });
        });
        describe('findActivePosts', () => {
            it('should find active posts', async () => {
                const posts = await Post_1.default.findActivePosts(10, 0);
                expect(posts).toHaveLength(1);
                expect(posts[0].id).toBe(testPost.id);
            });
            it('should not return deleted posts', async () => {
                await testPost.softDelete();
                const posts = await Post_1.default.findActivePosts(10, 0);
                expect(posts).toHaveLength(0);
            });
            it('should support pagination', async () => {
                await Post_1.default.create({
                    title: 'Test Post 2',
                    content: 'This is test content 2',
                    author_id: testUser.id,
                });
                const firstPage = await Post_1.default.findActivePosts(1, 0);
                const secondPage = await Post_1.default.findActivePosts(1, 1);
                expect(firstPage).toHaveLength(1);
                expect(secondPage).toHaveLength(1);
                expect(firstPage[0].id).not.toBe(secondPage[0].id);
            });
        });
        describe('findHotPosts', () => {
            it('should find posts ordered by hotness score', async () => {
                const hotPost = await Post_1.default.create({
                    title: 'Hot Post',
                    content: 'This is hot content',
                    author_id: testUser.id,
                    hotness_score: 100,
                });
                const posts = await Post_1.default.findHotPosts(10);
                expect(posts).toHaveLength(2);
                expect(posts[0].id).toBe(hotPost.id);
            });
        });
    });
});
//# sourceMappingURL=Post.test.js.map