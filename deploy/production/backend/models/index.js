"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Violation = exports.ViolationWord = exports.Notification = exports.EmailVerification = exports.UserInteraction = exports.Like = exports.Comment = exports.Post = exports.User = exports.sequelize = exports.initializeModels = void 0;
const database_1 = require("../config/database");
Object.defineProperty(exports, "sequelize", { enumerable: true, get: function () { return database_1.sequelize; } });
const User_1 = __importDefault(require("./User"));
exports.User = User_1.default;
const Post_1 = __importDefault(require("./Post"));
exports.Post = Post_1.default;
const Comment_1 = __importDefault(require("./Comment"));
exports.Comment = Comment_1.default;
const Like_1 = __importDefault(require("./Like"));
exports.Like = Like_1.default;
const UserInteraction_1 = __importDefault(require("./UserInteraction"));
exports.UserInteraction = UserInteraction_1.default;
const EmailVerification_1 = __importDefault(require("./EmailVerification"));
exports.EmailVerification = EmailVerification_1.default;
const Notification_1 = __importDefault(require("./Notification"));
exports.Notification = Notification_1.default;
const ViolationWord_1 = require("./ViolationWord");
const Violation_1 = require("./Violation");
const ViolationWord = (0, ViolationWord_1.initViolationWord)(database_1.sequelize);
exports.ViolationWord = ViolationWord;
const Violation = (0, Violation_1.initViolation)(database_1.sequelize);
exports.Violation = Violation;
const models = {
    User: User_1.default,
    Post: Post_1.default,
    Comment: Comment_1.default,
    Like: Like_1.default,
    UserInteraction: UserInteraction_1.default,
    EmailVerification: EmailVerification_1.default,
    Notification: Notification_1.default,
    ViolationWord,
    Violation,
};
const initializeModels = () => {
    Object.values(models).forEach((model) => {
        if (typeof model.associate === 'function') {
            model.associate(models);
        }
    });
};
exports.initializeModels = initializeModels;
exports.default = models;
//# sourceMappingURL=index.js.map