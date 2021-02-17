import argon2 from "argon2";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  Int,
} from "type-graphql";
import { getConnection } from "typeorm";
import { v4 } from "uuid";
import { sendEmail } from "../../utils/sendEmail";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../../constants";
import { User } from "../../entities/User";
import { UserProfile } from "./../../entities/UserProfile";
import { MyContext } from "../../types";

// We can define an input type class for arguments instead of using multiple
// @Arg() from type-graphql
@InputType()
export class RegisterInput {
  @Field()
  username: string;

  @Field()
  password: string;

  @Field()
  email: string;
}

@InputType()
export class LoginInput {
  @Field()
  usernameOrEmail: string;

  @Field()
  password: string;
}

@ObjectType()
export class RegisterFieldError {
  @Field()
  field: string; // show what field error occurs like: username/email, password

  @Field()
  message: string; // show the error message to display into the UI
}

@ObjectType()
class UserResponse {
  @Field(() => [RegisterFieldError], { nullable: true })
  errors?: RegisterFieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    // this is the current user and it's ok to show them their own email
    if (req.session.userId === user.id) {
      return user.email;
    }
    // current user can't see someone else email
    return "";
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext) {
    // check whether you login or not
    if (!req.session!.userId) {
      return null;
    }
    const user = await User.findOne({ id: req.session!.userId });
    return user;
  }

  // query a specific user with a given userId
  @Query(() => User, { nullable: true })
  async getUserById(@Arg("id", () => Int) id: number) {
    const result = await User.findOne({
      where: {
        id,
      },
    }).catch((err) => console.error(err));

    if (!result) return null;

    // if there is user, increase the viewed
    await getConnection()
      .createQueryBuilder()
      .update(UserProfile)
      .set({
        viewed: () => "viewed + 1",
      })
      .where("id = :id", { id })
      .returning("*")
      .execute();

    return result;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: RegisterInput
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
    // validate register email input (check the length)
    if (options.email.length <= 2) {
      return {
        errors: [
          {
            field: "email",
            message: "The email is too short",
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
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          email: options.email,
          password: hashedPassword,
        })
        .returning("*")
        .execute();
      user = result.raw[0];
    } catch (err) {
      console.error("Error: ", err);
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

    // add new user profile to database
    await getConnection()
      .createQueryBuilder()
      .insert()
      .into(UserProfile)
      .values({ userId: user.id })
      .returning("*")
      .execute();

    return { user };
  }

  @Mutation(() => UserResponse, { nullable: true })
  async login(@Arg("options") options: LoginInput, @Ctx() { req }: MyContext) {
    try {
      // lookup user by username or email typed from client
      let user;
      if (options.usernameOrEmail.includes("@")) {
        // if the input is email
        user = await User.findOne({
          where: { email: options.usernameOrEmail },
        });
      } else {
        // else, we understand the input is username
        user = await User.findOne({
          where: {
            username: options.usernameOrEmail,
          },
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

      req.session!.userId = user.id;

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

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
    // the email is not in database
    if (!user) {
      return true; // don't do anything with wrong email try to forgot password
    }

    // create token with uuid version 4
    const token = v4();

    // store token into ioredis
    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 // 1 day expire
    );

    await sendEmail(
      email,
      `
      <a href="http://localhost:3000/change-password/${token}">Click here to reset the password</a>
    `
    );
    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    // validate new password (check length <=2)
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "password is too short",
          },
        ],
      };
    }

    // check userId
    const key = FORGOT_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    const parsedUserId = parseInt(userId!);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }

    const user = await User.findOne(parsedUserId);
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }

    await User.update(
      { id: parsedUserId },
      { password: await argon2.hash(newPassword) }
    );

    await redis.del(key);

    // login user after change password
    req.session!.userId = user.id;

    return { user };
  }
}
