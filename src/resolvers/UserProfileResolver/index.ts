import { GraphQLUpload } from "graphql-upload";
import { getConnection } from "typeorm";
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
import { AvatarUpload, MyContext } from "./../../types";
import { createWriteStream } from "fs";

@InputType()
export class UserProfileInput {
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

  @Query(() => UserProfile, { nullable: true })
  async profileById(
    @Ctx() { req }: MyContext,
    @Arg("userId") userId: number
  ): Promise<UserProfile | undefined> {
    if (!req.session.userId) throw new Error("Not authenticated!");
    return await UserProfile.findOne({
      where: {
        userId: userId,
      },
    });
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

  @Mutation(() => Boolean)
  async uploadAvatar(
    @Arg("picture", () => GraphQLUpload)
    { filename, createReadStream }: AvatarUpload
  ): Promise<boolean> {
    return new Promise(async (resolve, reject) =>
      createReadStream()
        .pipe(
          createWriteStream(__dirname + `/../../../images/avatars/${filename}`)
        )
        .on("finish", () => resolve(true))
        .on("error", (err) => {
          console.error(err);
          reject(false);
        })
    );
  }
}
