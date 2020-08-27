import {
  Resolver,
  Mutation,
  InputType,
  Field,
  Arg,
  Ctx,
  ObjectType,
  Query,
} from "type-graphql";
import argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";

import { MyContext } from "./../types";
import { User } from "./../entities/User";
import { COOKIE_NAME } from "./../constants";

// We can define an input type class for arguments instead of using multiple
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

@InputType()
class LoginInput {
  @Field()
  usernameOrEmail: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string; // show what field error occurs like: username/email, password

  @Field()
  message: string; // show the error message to display into the UI
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: MyContext) {
    // check whether you login or not
    if (!ctx.req.session!.userId) {
      return null;
    }
    const user = await ctx.em.findOne(User, { id: ctx.req.session!.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: RegisterInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    // validate register username input (check the length)
    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "The username is too short",
          },
        ],
      };
    }
    // validate register password input (check the length)
    if (options.password.length <= 2) {
      return {
        errors: [
          {
            field: "password",
            message: "The password is too short",
          },
        ],
      };
    }

    // hash password with argon2
    const hashedPassword = await argon2.hash(options.password);

    // add new user to database
    let user;
    try {
      const result = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: options.username,
          email: options.email,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*");
      user = result[0];
    } catch (err) {
      console.error(err);
      // if this is duplicate username or email error
      if (err.code === "23505" && err.detail.includes("username")) {
        return {
          errors: [
            {
              field: "username",
              message: "The username already exists",
            },
          ],
        };
      } else if (err.code === "23505" && err.detail.includes("email")) {
        return {
          errors: [
            {
              field: "email",
              message: "The email already exists",
            },
          ],
        };
      }
    }
    return { user };
  }

  @Mutation(() => UserResponse, { nullable: true })
  async login(@Arg("options") options: LoginInput, @Ctx() ctx: MyContext) {
    try {
      // lookup user by username or email typed from client
      let user;
      if (options.usernameOrEmail.includes("@")) {
        // if the input is email
        user = await ctx.em.findOne(User, { email: options.usernameOrEmail });
      } else {
        // else, we understand the input is username
        user = await ctx.em.findOne(User, {
          username: options.usernameOrEmail,
        });
      }

      // handle errors in case cannot find user by username or email
      if (!user) {
        return {
          errors: [
            {
              field: "usernameOrEmail",
              message: "Incorrect username or password",
            },
            {
              field: "password",
              message: "Incorrect username or password",
            },
          ],
        };
      }

      // if username/email is correct, then check the password
      const validPassword = await argon2.verify(
        user.password,
        options.password
      );
      if (!validPassword) {
        return {
          errors: [
            {
              field: "password",
              message: "Incorrect username or password",
            },
            {
              field: "usernameOrEmail",
              message: "Incorrect username or password",
            },
          ],
        };
      }

      // if username/email and password are correct, then create session and return user

      ctx.req.session!.userId = user.id;

      return { user };
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      console.log("");
    }
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve, reject) =>
      // clear cookie in reddit db
      req.session?.destroy((err) => {
        res.clearCookie(COOKIE_NAME); // clear cookie in browser
        if (err) {
          console.error(err);
          reject(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
