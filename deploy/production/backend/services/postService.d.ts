import Post from '../models/Post';
export interface CreatePostData {
    title: string;
    content: string;
    author_id: number;
}
export interface UpdatePostData {
    title?: string;
    content?: string;
}
export interface PostResult {
    success: boolean;
    post?: Post;
    message?: string;
    error?: string;
}
export interface PostListResult {
    success: boolean;
    posts?: Post[];
    total?: number;
    message?: string;
    error?: string;
}
export interface SearchPostsParams {
    query?: string;
    authorId?: number;
    page?: number;
    limit?: number;
    orderBy?: string;
}
export interface SearchUsersParams {
    query: string;
    page?: number;
    limit?: number;
}
export interface UserSearchResult {
    success: boolean;
    users?: Array<{
        id: number;
        username: string;
        avatar_url?: string;
        post_count?: number;
    }>;
    total?: number;
    message?: string;
    error?: string;
}
export declare class PostService {
    static createPost(postData: CreatePostData): Promise<PostResult>;
    static getPostById(id: number, incrementView?: boolean, userId?: number): Promise<PostResult>;
    static updatePost(postId: number, userId: number, updateData: UpdatePostData): Promise<PostResult>;
    static deletePost(postId: number, userId: number): Promise<PostResult>;
    static adminDeletePost(postId: number, adminId: number): Promise<PostResult>;
    static getPostList(page?: number, limit?: number, orderBy?: string): Promise<PostListResult>;
    static getUserPosts(userId: number, page?: number, limit?: number): Promise<PostListResult>;
    static getHotPosts(limit?: number): Promise<PostListResult>;
    static searchPosts(params: SearchPostsParams): Promise<PostListResult>;
    static searchUsers(params: SearchUsersParams): Promise<UserSearchResult>;
}
//# sourceMappingURL=postService.d.ts.map