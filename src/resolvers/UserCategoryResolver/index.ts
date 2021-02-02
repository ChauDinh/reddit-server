import { MyContext } from "./../../types";
import { isAuth } from "./../../middlewares/isAuth";
import { UserCategory } from "./../../entities/UserCategory";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";

@Resolver(Boolean)
export class UserCategoryResolver {
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async createUserCategory(
    @Arg("categoryId") categoryId: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    if (!req.session.userId) throw new Error("Not Authenticated!");

    // checking if the user follow the category or not
    let isFollowCategory = await UserCategory.find({
      where: {
        userId: req.session.userId,
        categoryId,
      },
    });

    // user has followed, we delete the follow
    if (isFollowCategory.length !== 0) {
      await UserCategory.delete({
        userId: req.session.userId,
        categoryId,
      }).catch((err) => {
        console.error(err);
        return false;
      });
    } else {
      // create new follow
      await UserCategory.create({
        categoryId,
        userId: req.session.userId,
      })
        .save()
        .catch((err) => {
          console.error(err);
          return false;
        });
    }
    return true;
  }
}
