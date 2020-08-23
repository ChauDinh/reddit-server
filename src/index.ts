import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";

import { __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

const PORT = process.env.PORT || 4000;

/**
 * Connect to PostgreSQL database with mikro-orm
 * Initialize express server
 * Initialize Apollo Server for sending data to client
 * Config mikro-orm
 */
const main = async () => {
  // Initialize and connect to PG database with mikro-orm config
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up();

  // Initialize express server
  const app = express();

  // Initialize apollo server
  const apolloServer = new ApolloServer({
    // graphql schema
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    // context - a special object that is accessible by all resolvers
    // we pass our ORM into the context so that our resolvers can work with database
    context: () => ({ em: orm.em }),
  });

  apolloServer.applyMiddleware({ app });

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
