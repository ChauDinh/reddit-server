import { Stream } from "stream";
import { createPublicationLoader } from "./utils/createPublicationLoader";
import { createPostLoader } from "./utils/createPostLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";
import { Request, Response } from "express";
import { Redis } from "ioredis";
import { createUserLoader } from "./utils/createUserLoader";
import { createCategoryLoader } from "./utils/createCategoryLoader";

export type MyContext = {
  req: Request & { session: Express.Session };
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>;
  updootLoader: ReturnType<typeof createUpdootLoader>;
  postLoader: ReturnType<typeof createPostLoader>;
  publicationLoader: ReturnType<typeof createPublicationLoader>;
  categoryLoader: ReturnType<typeof createCategoryLoader>;
};

export interface AvatarUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => Stream;
}
