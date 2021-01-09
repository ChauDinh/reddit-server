import { MyContext } from "./../types";
import { isAuth } from "./../middlewares/isAuth";
import { Category } from "./../entities/Category";
import {
  Arg,
  Ctx,
  Mutation,
  Resolver,
  UseMiddleware,
  Query,
  FieldResolver,
  Root,
} from "type-graphql";

import { User } from "../entities/User";

@Resolver(Category)
export class CategoryResolver {
  @FieldResolver(() => User)
  async creator(@Root() category: Category, @Ctx() { userLoader }: MyContext) {
    return await userLoader.load(category.creatorId);
  }

  @Query(() => [Category], { nullable: true })
  async categories(): Promise<Category[] | null> {
    return Category.find();
  }

  @Mutation(() => Category)
  @UseMiddleware(isAuth)
  async createCategory(
    @Arg("title", () => String) title: string,
    @Ctx() { req }: MyContext
  ): Promise<Category | null> {
    if (!req.session.userId) throw new Error("Not Authenticated");

    let isExist = Category.find({
      where: { title: title },
    });

    // checking category exist or not by title
    if (isExist) throw new Error("The category has already existed");

    return Category.create({
      title: title,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteCategory(
    @Arg("categoryId") categoryId: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    if (!req.session.userId) throw new Error("Not Authenticated");

    await Category.delete({
      id: categoryId,
      creatorId: req.session.userId, // you can only delete category you created
    }).catch((err) => {
      console.error(err);
      return false;
    });

    return true;
  }
}
