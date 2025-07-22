import { sequelize } from '../config/database';
import User from './User';
import Post from './Post';
import Comment from './Comment';
import Like from './Like';
import UserInteraction from './UserInteraction';
import EmailVerification from './EmailVerification';
import Notification from './Notification';
import { initViolationWord } from './ViolationWord';
import { initViolation } from './Violation';

const ViolationWord = initViolationWord(sequelize);
const Violation = initViolation(sequelize);

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

const models: Models = {
  User,
  Post,
  Comment,
  Like,
  UserInteraction,
  EmailVerification,
  Notification,
  ViolationWord,
  Violation,
};

export const initializeModels = (): void => {
  Object.values(models).forEach((model) => {
    if (typeof model.associate === 'function') {
      model.associate(models);
    }
  });
};

export { sequelize, User, Post, Comment, Like, UserInteraction, EmailVerification, Notification, ViolationWord, Violation };
export default models;