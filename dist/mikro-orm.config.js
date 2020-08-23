"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const Post_1 = require("./entities/Post");
const User_1 = require("./entities/User");
const constants_1 = require("./constants");
exports.default = {
    entities: [Post_1.Post, User_1.User],
    dbName: "redditclone",
    type: "postgresql",
    user: constants_1.__prod__ ? process.env.DB_USERNAME : "chaudinh",
    password: constants_1.__prod__ ? process.env.DB_PASSWORD : "katetsui1995",
    debug: !constants_1.__prod__,
    migrations: {
        path: path_1.default.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.[tj]s$/,
    },
};
//# sourceMappingURL=mikro-orm.config.js.map