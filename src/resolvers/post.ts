import { Resolver, Query, Ctx, Arg, Mutation } from "type-graphql";

import { Post } from "./../entities/Post";
import { MyContext } from "./../types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Resolver()
export class PostResolver {
  @Query(() => [Post]) // The `posts` resolver will return an array of posts.
  posts(@Ctx() ctx: MyContext): Promise<Post[]> {
    return ctx.em.find(Post, {});
  }

  @Query(() => Post, { nullable: true }) // The `post` resolver will return a post specified by ID and allow nullable result
  post(@Arg("id") id: number, @Ctx() ctx: MyContext): Promise<Post | null> {
    return ctx.em.findOne(Post, { id });
  }

  @Mutation(() => Post) // The `createPost` resolver is a mutation which allows us create new post
  async createPost(
    @Arg("title") title: string,
    @Ctx() ctx: MyContext
  ): Promise<Post> {
    const newPost = ctx.em.create(Post, { title });
    await ctx.em.persistAndFlush(newPost);
    return newPost;
  }

  @Mutation(() => Post, { nullable: true }) // The `updatePost` resolver is a mutation which allows us update current post
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Ctx() ctx: MyContext
  ): Promise<Post | null> {
    const currPost = await ctx.em.findOne(Post, { id });
    if (!currPost) {
      return null;
    }
    if (typeof title !== "undefined") {
      currPost.title = title;
      await ctx.em.persistAndFlush(currPost);
    }
    return currPost;
  }

  @Mutation(() => Boolean) // The `deletePost` resolver is a mutation which allows us delete specific post (by ID)
  async deletePost(
    @Arg("id") id: number,
    @Ctx() ctx: MyContext
  ): Promise<boolean> {
    try {
      await ctx.em.nativeDelete(Post, { id });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}
