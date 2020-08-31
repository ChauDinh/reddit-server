import { getConnection } from "typeorm";
import {
  Resolver,
  Query,
  Arg,
  Mutation,
  InputType,
  Field,
  Ctx,
  UseMiddleware,
  Int,
} from "type-graphql";

import { Post } from "./../entities/Post";
import { MyContext } from "./../types";
import { isAuth } from "./../middlewares/isAuth";

@InputType()
class PostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}

@Resolver()
export class PostResolver {
  @Query(() => [Post]) // The `posts` resolver will return an array of posts.
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null // cursor here is the date a post was created
  ): Promise<Post[]> {
    const realLimit = Math.min(50, limit);
    const queryBuilder = getConnection()
      .getRepository(Post)
      .createQueryBuilder("p")
      .orderBy('"createdAt"', "DESC") // the newest would be displayed on the top
      .take(realLimit);

    if (cursor) {
      queryBuilder.where('"createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }

    return queryBuilder.getMany();
  }

  @Query(() => Post, { nullable: true }) // The `post` resolver will return a post specified by ID and allow nullable result
  async post(@Arg("id") id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post) // The `createPost` resolver is a mutation which allows us create new post
  @UseMiddleware(isAuth) // The isAuth middleware authenticates whether creator logged in or not
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    if (!req.session?.userId) {
      throw new Error("Not Authenticated!");
    }
    return Post.create({ ...input, creatorId: req.session!.userId }).save();
  }

  @Mutation(() => Post, { nullable: true }) // The `updatePost` resolver is a mutation which allows us update current post
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const currPost = await Post.findOne({ where: { id } });
    if (!currPost) {
      return null;
    }
    if (typeof title !== "undefined") {
      currPost.title = title;
      await Post.update({ id }, { title });
    }
    return currPost;
  }

  @Mutation(() => Boolean) // The `deletePost` resolver is a mutation which allows us delete specific post (by ID)
  async deletePost(@Arg("id") id: number): Promise<boolean> {
    try {
      await Post.delete(id);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}
