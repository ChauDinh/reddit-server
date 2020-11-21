import { CommentResolver } from "./resolvers/comment";
import "reflect-metadata";
import "dotenv-safe/config";
import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { COOKIE_NAME, __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { Updoot } from "./entities/Updoot";
import { User } from "./entities/User";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { createUpdootLoader } from "./utils/createUpdootLoader";
import { createUserLoader } from "./utils/createUserLoader";
import { Comment } from "./entities/Comment";
import { Subscription } from "./entities/Subscription";
import { SubscriptionResolver } from "./resolvers/subscription";

const PORT = parseInt(process.env.PORT) || 4000;

/**
 * Connect to PostgreSQL database with mikro-orm
 * Initialize express server
 * Initialize Apollo Server for sending data to client
 * Config mikro-orm
 */
const main = async () => {
  // Initialize and connect to PG database with type-orm config
  let conn = await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: true,
    synchronize: true,
    // migrations: [path.join(__dirname, "./migrations/*")],
    entities: [User, Post, Updoot, Comment, Subscription],
  });

  // await Post.delete({});

  await conn.runMigrations();

  // Initialize express server
  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(
    session({
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "qwiwircrkiywty",
      resave: false,
      name: COOKIE_NAME,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        secure: __prod__, // cookie only works in https except (localhost http)
        sameSite: "lax", // CSRF
        domain: __prod__ ? ".amanlearnscode.com" : undefined,
      },
    })
  );

  // Initialize apollo server
  const apolloServer = new ApolloServer({
    // graphql schema
    schema: await buildSchema({
      resolvers: [
        HelloResolver,
        PostResolver,
        UserResolver,
        CommentResolver,
        SubscriptionResolver,
      ],
      validate: false,
    }),
    // context - a special object that is accessible by all resolvers
    // we pass our ORM into the context so that our resolvers can work with database
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      updootLoader: createUpdootLoader(),
    }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(PORT, () =>
    console.log(
      `Server started on ${
        __prod__ ? process.env.SERVER_URL : "localhost"
      }:${PORT}`
    )
  );
};

main().catch((err) => {
  console.error(err);
});
