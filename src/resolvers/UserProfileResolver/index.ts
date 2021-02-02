import { getConnection } from "typeorm";
import { MyContext } from "./../../types";
import { UserProfile } from "./../../entities/UserProfile";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { isAuth } from "./../../middlewares/isAuth";

@InputType()
class UserProfileInput {
  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  nation?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  company?: string;

  @Field({ nullable: true })
  age?: number;
}

@Resolver(UserProfile)
export class UserProfileResolver {
  @Query(() => UserProfile, { nullable: true })
  async meProfile(@Ctx() { req }: MyContext): Promise<UserProfile | undefined> {
    if (!req.session.userId) throw new Error("Not authenticated!");
    const profile = await UserProfile.findOne({
      where: {
        userId: req.session.userId,
      },
    });
    return profile;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async updateProfile(
    @Ctx() { req }: MyContext,
    @Arg("options") options: UserProfileInput
  ) {
    if (!req.session.userId) throw new Error("Not authenticated!");

    try {
      await getConnection()
        .createQueryBuilder()
        .update(UserProfile)
        .set({
          ...options,
        })
        .where(`userId = ${req.session.userId}`) // you can only update your user profile
        .returning("*")
        .execute();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}
