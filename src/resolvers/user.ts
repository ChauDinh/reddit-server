import {
  Resolver,
  Mutation,
  InputType,
  Field,
  Arg,
  Ctx,
  ObjectType,
} from "type-graphql";
import argon2 from "argon2";

import { MyContext } from "./../types";
import { User } from "./../entities/User";

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

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse, { nullable: true })
  async register(
    @Arg("options") options: RegisterInput,
    @Ctx() ctx: MyContext
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

    // create new user
    const newUser = ctx.em.create(User, {
      username: options.username,
      email: options.email,
      password: hashedPassword,
    });

    // add new user to database
    try {
      await ctx.em.persistAndFlush(newUser);
      return { user: newUser };
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
      return {
        errors: [
          {
            field: "username/email/password",
            message: "Invalid register",
          },
        ],
      };
    } finally {
      console.log("");
    }
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
              field: "username/email",
              message: "The username/email doesn't exist",
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
              message: "invalid login",
            },
          ],
        };
      }

      // if username/email and password are correct, return user
      return { user };
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      console.log("");
    }
  }
}
