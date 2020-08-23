import { Resolver, Mutation, InputType, Field, Arg, Ctx } from "type-graphql";
import argon2 from "argon2";

import { MyContext } from "./../types";
import { User } from "./../entities/User";

// We ca define an input type class for arguments instead of using multiple
// @Arg() from type-graphql
@InputType()
class RegisterInput {
  @Field()
  username: string;
  @Field()
  password: string;
  @Field()
  email: string;
}

@Resolver()
export class UserResolver {
  @Mutation(() => User, { nullable: true })
  async register(
    @Arg("options") options: RegisterInput,
    @Ctx() ctx: MyContext
  ) {
    try {
      // hash password with argon2
      const hashedPassword = await argon2.hash(options.password);

      // create new user
      const newUser = ctx.em.create(User, {
        username: options.username,
        email: options.email,
        password: hashedPassword,
      });

      // add new user to database
      await ctx.em.persistAndFlush(newUser);
      return newUser;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}
