import { Redis } from "ioredis";
import { Request, Response } from "express";

export type MyContext = {
  req: Request & { session: Express.Session };
  res: Response;
  redis: Redis;
};
