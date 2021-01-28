import { createPublicationLoader } from "./utils/createPublicationLoader";
import { createPostLoader } from "./utils/createPostLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";
import { Request, Response } from "express";
import { Redis } from "ioredis";
import { createUserLoader } from "./utils/createUserLoader";

export type MyContext = {
  req: Request & { session: Express.Session };
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>;
  updootLoader: ReturnType<typeof createUpdootLoader>;
  postLoader: ReturnType<typeof createPostLoader>;
  publicationLoader: ReturnType<typeof createPublicationLoader>;
};
