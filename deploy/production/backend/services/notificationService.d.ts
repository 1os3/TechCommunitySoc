export interface NotificationResult {
    success: boolean;
    message: string;
    data?: any;
}
export declare class NotificationService {
    static createLikeNotification(senderId: number, postId: number, senderUsername: string, postTitle: string): Promise<NotificationResult>;
    static createCommentNotification(senderId: number, postId: number, commentId: number, senderUsername: string, postTitle: string): Promise<NotificationResult>;
    static createReplyNotification(senderId: number, postId: number, commentId: number, parentCommentId: number, senderUsername: string, postTitle: string): Promise<NotificationResult>;
    static getUserNotifications(userId: number, page?: number, limit?: number, onlyUnread?: boolean): Promise<NotificationResult>;
    static markNotificationAsRead(userId: number, notificationId: number): Promise<NotificationResult>;
    static markAllNotificationsAsRead(userId: number): Promise<NotificationResult>;
    static getUnreadNotificationCount(userId: number): Promise<NotificationResult>;
    static deleteNotification(userId: number, notificationId: number): Promise<NotificationResult>;
}
//# sourceMappingURL=notificationService.d.ts.map