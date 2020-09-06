import { getConnection } from "typeorm";
import {
  Resolver,
  Query,
  Arg,
  Mutation,
  InputType,
  Field,
  Ctx,
  UseMiddleware,
  Int,
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";

import { Post } from "./../entities/Post";
import { MyContext } from "./../types";
import { isAuth } from "./../middlewares/isAuth";
import { Updoot } from "./../entities/Updoot";

@InputType()
class PostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  // The textSnippet resolver for slicing the text of the post, @FieldResolver doesn't effect to database
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.length > 100
      ? root.text.slice(0, 100) + " ..."
      : root.text;
  }

  @Query(() => PaginatedPosts) // The `posts` resolver will return an array of posts.
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null, // cursor here is the date a post was created
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);

    const replacements: any[] = [realLimit + 1];

    if (req.session.userId) {
      replacements.push(req.session.userId);
    }

    let cursorIdx = 3;
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
      cursorIdx = replacements.length;
    }
    const posts = await getConnection().query(
      `
      select p.*, 
      json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email,
        'createdAt', u."createdAt",
        'updatedAt', u."updatedAt"
        ) creator,
      ${
        req.session.userId
          ? '(select value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus"'
          : 'null as "voteStatus"'
      }
      from post p 
      inner join "user" u on u.id = p."creatorId"
      ${
        cursor
          ? `
        where p."createdAt" < $${cursorIdx}
      `
          : ""
      }
      order by p."createdAt" DESC
      limit $1
    `,
      replacements
    );

    // const queryBuilder = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("p")
    //   .innerJoinAndSelect("p.creator", "u", 'u.id = p."creatorId"')
    //   .orderBy('p."createdAt"', "DESC") // the newest would be displayed on the top
    //   .take(realLimit + 1);

    // if (cursor) {
    //   queryBuilder.where('p."createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }

    // const posts = await queryBuilder.getMany();
    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimit + 1,
    };
  }

  @Query(() => Post, { nullable: true }) // The `post` resolver will return a post specified by ID and allow nullable result
  async post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id, { relations: ["creator"] });
  }

  @Mutation(() => Post) // The `createPost` resolver is a mutation which allows us create new post
  @UseMiddleware(isAuth) // The isAuth middleware authenticates whether creator logged in or not
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    if (!req.session?.userId) {
      throw new Error("Not Authenticated!");
    }
    return Post.create({ ...input, creatorId: req.session!.userId }).save();
  }

  @Mutation(() => Post, { nullable: true }) // The `updatePost` resolver is a mutation which allows us update current post
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Arg("text", () => String, { nullable: true }) text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();
    return result.raw[0];
  }

  @Mutation(() => Boolean) // The `deletePost` resolver is a mutation which allows us delete specific post (by ID)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    try {
      /**Not Cascading method */
      // const post = await Post.findOne(id);
      // if (!post) return false;
      // if (post.creatorId !== req.session.userId) {
      //   throw new Error("not authorized");
      // }

      // await Updoot.delete({ postId: id });
      // await Post.delete({ id });
      // return true;

      /**Cascading mathod */
      await Post.delete({ id, creatorId: req.session.userId });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session;
    const isUpdoot = value !== -1;
    const updootValue = isUpdoot ? 1 : -1;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // there are three stages of updoot
    if (updoot && updoot.value !== updootValue) {
      // the user has up voted on the post before and then down voted or down
      // voted then up voted
      await getConnection().transaction(async (transaction) => {
        await transaction.query(
          `
          update updoot
          set value = $1
          where "postId" = $2 and "userId" = $3
        `,
          [updootValue, postId, userId]
        );

        // update points of the post
        await transaction.query(
          `
          update post
          set points = points + $1
          where id = $2
        `,
          [2 * updootValue, postId]
        );
      });
    } else if (!updoot) {
      // the user has not voted the post yet
      await getConnection().transaction(async (transaction) => {
        await transaction.query(
          `
          insert into updoot ("userId", "postId", value)
          values ($1,$2,$3)
        `,
          [userId, postId, updootValue]
        );
        await transaction.query(
          `
          update post
          set points = points + $1
          where id = $2
        `,
          [updootValue, postId]
        );
      });
    }
    return true;
  }
}
