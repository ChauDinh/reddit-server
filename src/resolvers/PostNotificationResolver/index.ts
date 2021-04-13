import { MyContext } from "./../../types";
import {
  Arg,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";

import { PostNotification } from "./../../entities/PostNotification";
import { isAuth } from "./../../middlewares/isAuth";
import { Post } from "./../../entities/Post";
import { User } from "./../../entities/User";

@Resolver(PostNotification)
export class PostNotificationResolver {
  @FieldResolver(() => Post)
  async post(
    @Root() postNotification: PostNotification,
    @Ctx() { postLoader }: MyContext
  ) {
    return await postLoader.load(postNotification.postId);
  }

  @FieldResolver(() => User)
  async user(
    @Root() postNotification: PostNotification,
    @Ctx() { userLoader }: MyContext
  ) {
    return await userLoader.load(postNotification.userId);
  }

  @Query(() => [PostNotification])
  @UseMiddleware(isAuth)
  async notificationByPostId(
    @Arg("postId") postId: number,
    @Ctx() { req }: MyContext
  ): Promise<PostNotification[] | null> {
    if (!req.session.userId) {
      throw new Error("Not Authenticated!");
    }

    const results = await getConnection().query(
      `
        select * 
        from post_notification p
        where p."postId" = ${postId}
      `
    );

    return results;
  }

  @Mutation(() => PostNotification)
  @UseMiddleware(isAuth)
  async createNotification(
    @Arg("message") message: string,
    @Arg("postId") postId: number,
    @Ctx() { req }: MyContext
  ): Promise<PostNotification> {
    if (!req.session.userId) {
      throw new Error("Not Authenticated!");
    }

    return await PostNotification.create({
      message: message,
      userId: req.session.userId,
      postId: postId,
      isRead: false,
    }).save();
  }
}
