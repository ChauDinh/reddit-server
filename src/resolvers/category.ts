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
} from "type-graphql";

@Resolver(Category)
export class CategoryResolver {
  @Query(() => [Category], { nullable: true })
  async categories(): Promise<Category[] | null> {
    return Category.find();
  }

  @Mutation(() => Category, { nullable: true })
  @UseMiddleware(isAuth)
  async createCategory(
    @Arg("title", () => String) title: string,
    @Ctx() { req }: MyContext
  ): Promise<Category | null> {
    if (!req.session.userId) throw new Error("Not Authenticated");
    return Category.create({
      title: title,
    }).save();
  }
}
