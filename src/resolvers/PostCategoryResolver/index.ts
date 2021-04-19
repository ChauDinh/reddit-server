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
import { getConnection } from "typeorm";

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

  @Query(() => [PostCategory], { nullable: true })
  async postCategoriesByCategoryId(
    @Arg("categoryId") categoryId: number
  ): Promise<PostCategory[] | null> {
    return await PostCategory.find({
      where: {
        categoryId: categoryId,
      },
    });
  }

  @Query(() => [PostCategory], { nullable: true })
  async search(@Arg("tokens") tokens: string): Promise<PostCategory[] | null> {
    if (tokens.length === 0) return null;
    return await getConnection().query(
      `
        select * from post_category
        where document_with_weights @@ plainto_tsquery('${tokens}')
        order by ts_rank_cd(document_with_weights, plainto_tsquery('${tokens}')) desc;
      `
    );
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async createPostCategory(
    @Arg("postId") postId: number,
    @Arg("categoryId") categoryId: number,
    @Arg("postTitle") postTitle: string,
    @Arg("categoryTitle") categoryTitle: string,
    @Arg("creator") creator: string,
    @Ctx() { req }: MyContext
  ) {
    if (!req.session.userId) throw new Error("Not Authenticated!");

    await getConnection().query(
      `
      insert into post_category ("postId", "categoryId", "postTitle", "categoryTitle", "document_with_weights")
      values ($1, $2, $3, $4, setweight(to_tsvector('${postTitle}'), 'A') || setweight(to_tsvector('${creator}'), 'B') || setweight(to_tsvector(coalesce('${categoryTitle}', '')), 'C'))
    `,
      [postId, categoryId, postTitle, categoryTitle]
    );

    return true;
  }
}
