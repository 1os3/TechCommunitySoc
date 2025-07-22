// 基础帖子类型 - 完整帖子数据
export interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author: {
    id: number;
    username: string;
    avatar_url?: string;
  };
  view_count: number;
  like_count: number;
  comment_count: number;
  hotness_score: number;
  created_at: string;
  updated_at: string;
}

// 帖子列表项 - 用于列表显示，内容被截断
export interface PostListItem {
  id: number;
  title: string;
  content: string; // 截断到200字符，后加'...'
  author_id: number;
  author: {
    id: number;
    username: string;
    avatar_url?: string;
  };
  view_count: number;
  like_count: number;
  comment_count: number;
  hotness_score: number;
  created_at: string;
  updated_at: string;
}

// 创建帖子的数据
export interface CreatePostData {
  title: string;
  content: string;
}

// 更新帖子的数据
export interface UpdatePostData {
  title?: string;
  content?: string;
}

// 帖子查询参数
export interface PostFilters {
  page?: number; // 默认1
  limit?: number; // 默认20，最大100
  orderBy?: 'created_at' | 'updated_at' | 'hotness_score' | 'like_count' | 'view_count'; // 默认created_at
  author?: number; // 作者ID过滤
}

// 分页信息
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API统一响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp: string;
}

// API错误响应格式
export interface ApiError {
  error: {
    code: string;
    message: string;
    timestamp: string;
  };
}

// 获取单个帖子的响应
export interface PostResponse extends ApiResponse<{ post: Post }> {}

// 获取帖子列表的响应
export interface PostListResponse extends ApiResponse<{
  posts: PostListItem[];
  pagination: PaginationInfo;
}> {}

// 获取热门帖子的响应
export interface HotPostsResponse extends ApiResponse<{ posts: PostListItem[] }> {}

// 评论相关类型
export interface Comment {
  id: number;
  content: string;
  author_id: number;
  author: {
    id: number;
    username: string;
    avatar_url?: string;
  };
  post_id: number;
  parent_id?: number;
  like_count?: number;
  replies?: Comment[];
  level?: number;
  replyCount?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentData {
  content: string;
  parent_id?: number;
}

export interface CommentsResponse extends ApiResponse<Comment[]> {}

// 点赞相关类型
export interface LikeResponse extends ApiResponse<{
  liked: boolean;
  like_count: number;
}> {}

// 用户搜索相关类型
export interface UserSearchItem {
  id: number;
  username: string;
  avatar_url?: string;
  post_count: number;
}

export interface UserSearchResponse extends ApiResponse<{
  users: UserSearchItem[];
  pagination: PaginationInfo;
}> {}