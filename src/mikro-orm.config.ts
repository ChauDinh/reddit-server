import { MikroORM } from "@mikro-orm/core";
import path from "path";

import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { __prod__ } from "./constants";

export default {
  entities: [Post, User],
  dbName: "redditclone",
  type: "postgresql", // one of `mongo` | `mysql` | `mariadb` | `postgresql` | `sqlite`
  user: __prod__ ? process.env.DB_USERNAME : "chaudinh",
  password: __prod__ ? process.env.DB_PASSWORD : "katetsui1995",
  debug: !__prod__,
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
} as Parameters<typeof MikroORM.init>[0];
