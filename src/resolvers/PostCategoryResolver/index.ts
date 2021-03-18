import { Post } from "./../../entities/Post";
import { MyContext } from "./../../types";
import { isAuth } from "./../../middlewares/isAuth";
import {
  Arg,
  Ctx,
  Mutation,
  UseMiddleware,
  Resolver,
  FieldResolver,
  Root,
  Query,
} from "type-graphql";
import { PostCategory } from "../../entities/PostCategory";
import { Category } from "../../entities/Category";

@Resolver(PostCategory)
export class PostCategoryResolver {
  @FieldResolver(() => Category)
  async categories(
    @Root() postCategory: PostCategory,
    @Ctx() { categoryLoader }: MyContext
  ) {
    return await categoryLoader.load(postCategory.categoryId);
  }

  @FieldResolver(() => Post)
  async post(
    @Root() postCategory: PostCategory,
    @Ctx() { postLoader }: MyContext
  ) {
    return await postLoader.load(postCategory.postId);
  }

  @FieldResolver(() => Category)
  async category(
    @Root() postCategory: PostCategory,
    @Ctx() { categoryLoader }: MyContext
  ) {
    return await categoryLoader.load(postCategory.categoryId);
  }

  @Query(() => [PostCategory], { nullable: true })
  async postCategories(): Promise<PostCategory[] | null> {
    return await PostCategory.find();
  }

  @Query(() => [PostCategory], { nullable: true })
  async postCategoriesByPostId(
    @Arg("postId") postId: number
  ): Promise<PostCategory[] | null> {
    return await PostCategory.find({
      where: {
        postId: postId,
      },
    });
  }

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
