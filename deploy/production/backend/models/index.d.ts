import { sequelize } from '../config/database';
import User from './User';
import Post from './Post';
import Comment from './Comment';
import Like from './Like';
import UserInteraction from './UserInteraction';
import EmailVerification from './EmailVerification';
import Notification from './Notification';
declare const ViolationWord: typeof import("./ViolationWord").default;
declare const Violation: typeof import("./Violation").default;
export interface Models {
    User: typeof User;
    Post: typeof Post;
    Comment: typeof Comment;
    Like: typeof Like;
    UserInteraction: typeof UserInteraction;
    EmailVerification: typeof EmailVerification;
    Notification: typeof Notification;
    ViolationWord: typeof ViolationWord;
    Violation: typeof Violation;
}
declare const models: Models;
export declare const initializeModels: () => void;
export { sequelize, User, Post, Comment, Like, UserInteraction, EmailVerification, Notification, ViolationWord, Violation };
export default models;
//# sourceMappingURL=index.d.ts.map