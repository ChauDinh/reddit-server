import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import { createConnection } from "typeorm";

import { __prod__, COOKIE_NAME } from "./constants";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import { MyContext } from "./types";

const PORT = process.env.PORT || 4000;

/**
 * Connect to PostgreSQL database with mikro-orm
 * Initialize express server
 * Initialize Apollo Server for sending data to client
 * Config mikro-orm
 */
const main = async () => {
  // Initialize and connect to PG database with type-orm config
  const conn = await createConnection({
    type: "postgres",
    database: "redditclone",
    username: process.env.DB_USERNAME || "chaudinh",
    password: process.env.DB_PASSWORD || "katetsui1995",
    logging: true,
    synchronize: true,
    entities: [User, Post],
  });

  // Initialize express server
  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis();
  app.use(
    cors({
      origin: "http://localhost:3000",
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
      secret: process.env.REDIS_SECRET || "qwiwircrkiywty",
      resave: false,
      name: COOKIE_NAME,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        secure: __prod__, // cookie only works in https except (localhost http)
        sameSite: "lax", // CSRF
      },
    })
  );

  // Initialize apollo server
  const apolloServer = new ApolloServer({
    // graphql schema
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    // context - a special object that is accessible by all resolvers
    // we pass our ORM into the context so that our resolvers can work with database
    context: ({ req, res }) => ({ req, res, redis }),
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
