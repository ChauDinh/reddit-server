import { MyContext } from "./../../types";
import { isAuth } from "./../../middlewares/isAuth";
import { Arg, Ctx, Mutation, UseMiddleware, Resolver } from "type-graphql";
import { PostCategory } from "../../entities/PostCategory";

@Resolver(PostCategory)
export class PostCategoryResolver {
  @Mutation(() => PostCategory)
  @UseMiddleware(isAuth)
  async createPostCategory(
    @Arg("postId") postId: number,
    @Arg("categoryId") categoryId: number,
    @Ctx() { req }: MyContext
  ): Promise<PostCategory | null> {
    if (!req.session.userId) throw new Error("Not Authenticated!");
    return await PostCategory.create({
      postId,
      categoryId,
    }).save();
  }
}
