import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../../entities/Post";
import { Updoot } from "../../entities/Updoot";
import { Publication } from "./../../entities/Publication";
import { User } from "../../entities/User";
import { isAuth } from "../../middlewares/isAuth";
import { MyContext } from "../../types";

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@ObjectType()
export class CreatePostFieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}
@ObjectType()
class CreatePostResponse {
  @Field(() => [CreatePostFieldError], { nullable: true })
  errors?: CreatePostFieldError[];

  @Field(() => Post, { nullable: true })
  post?: Post;
}

@InputType()
class PostInput {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  text: string;

  @Field(() => Number, { nullable: true })
  publicationId?: number;
}
@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => User)
  async creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return await userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { updootLoader, req }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }
    const updoot = await updootLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });

    return updoot ? updoot.value : null;
  }

  @FieldResolver(() => Publication)
  async publication(
    @Root() post: Post,
    @Ctx() { publicationLoader }: MyContext
  ) {
    return await publicationLoader.load(post.publicationId);
  }

  @Query(() => PaginatedPosts) // The `posts` resolver will return an array of posts.
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true })
    cursor: string | null // cursor here is the date a post was created
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);

    const replacements: any[] = [realLimit + 1];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }
    const posts = await getConnection().query(
      `
      select p.*
      from post p 
      where p."publicationId" IS NULL
      ${
        cursor
          ? `
        and p."createdAt" < $2
      `
          : ""
      }
      order by p."createdAt" DESC
      limit $1
    `,
      replacements
    );

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimit + 1,
    };
  }

  @Query(() => Post, { nullable: true }) // The `post` resolver will return a post specified by ID and allow nullable result
  async post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    const postResult = await Post.findOne(id);
    if (!postResult) return undefined;

    // if there is a post, increase the viewed
    await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ viewed: () => "viewed + 1" })
      .where("id = :id", { id: id })
      .returning("*")
      .execute();
    return postResult;
  }

  @Query(() => PaginatedPosts, { nullable: true })
  async postsByCreatorId(
    @Arg("creatorId", () => Int) creatorId: number,
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(10, limit);
    const replacement: any[] = [realLimit + 1];

    if (cursor) {
      replacement.push(new Date(parseInt(cursor)));
    }

    const postsByCreatorId = await getConnection().query(
      `
      select p.* 
      from post p
      where p."creatorId" = ${creatorId}
      and p."publicationId" IS NULL
      ${
        cursor
          ? `
        and p."createdAt" < $2
      `
          : ""
      }
      order by p."createdAt" DESC
      limit $1
    `,
      replacement
    );

    return {
      posts: postsByCreatorId.slice(0, realLimit),
      hasMore: postsByCreatorId.length === realLimit + 1,
    };
  }

  /**
   * TODO: return all posts in publications user following
   */
  @Query(() => PaginatedPosts, { nullable: true })
  @UseMiddleware(isAuth)
  async postsInFollowingPublications(
    @Ctx() { req }: MyContext,
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    if (!req.session.userId) throw new Error("Not authenticated!");

    const realLimit = Math.min(10, limit);
    const replacement: any[] = [realLimit + 1];
    const postIds: number[] = [];

    if (cursor) {
      replacement.push(new Date(parseInt(cursor)));
    }

    const postsInFollowingPublications = await getConnection().query(
      `
      select p.title as publication_title, array_agg(p2.id) as posts from member
      inner join publication p on member."publicationId" = p.id
      inner join public.user u on member."userId" = u.id
      inner join public.post p2 on p.id = p2."publicationId"
      where member."userId" = ${req.session.userId}
      group by p.title
    `
    );

    postsInFollowingPublications.map((response: any) =>
      response.posts.map((ids: any) => postIds.push(ids))
    );

    const postsResult = await getConnection().query(
      `
      select p.* from public.post p
      where p.id in (${postIds})
      ${cursor ? `and p."createdAt" < $2` : ""}
      order by p."createdAt" DESC
      limit $1
    `,
      replacement
    );

    return {
      posts: postsResult.slice(0, realLimit),
      hasMore: postsResult.length === realLimit + 1,
    };
  }

  @Query(() => PaginatedPosts, { nullable: true })
  async postsByPublicationId(
    @Arg("publicationId", () => Int) publicationId: number,
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    /**
     * TODO: query multiple posts from array of publicationIds
     */

    const realLimit = Math.min(10, limit);
    const replacement: any[] = [realLimit + 1];

    if (cursor) {
      replacement.push(new Date(parseInt(cursor)));
    }

    const postsByPublicationId = await getConnection().query(
      `
      select p.* 
      from post p
      where p."publicationId" = ${publicationId} 
      ${cursor ? `and p."createdAt" < $2` : ""}
      limit $1
    `,
      replacement
    );

    return {
      posts: postsByPublicationId.slice(0, realLimit),
      hasMore: postsByPublicationId.length === realLimit + 1,
    };
  }

  @Mutation(() => CreatePostResponse) // The `createPost` resolver is a mutation which allows us create new post
  @UseMiddleware(isAuth) // The isAuth middleware authenticates whether creator logged in or not
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<CreatePostResponse> {
    if (!req.session?.userId) {
      throw new Error("Not Authenticated!");
    }

    if (input.title.length <= 1) {
      return {
        errors: [
          {
            field: "title",
            message: "The title is too short",
          },
        ],
      };
    }

    if (input.text.length <= 1) {
      return {
        errors: [
          {
            field: "text",
            message: "The text can't be empty",
          },
        ],
      };
    }

    const postCreated = await Post.create({
      ...input,
      creatorId: req.session!.userId,
    }).save();

    // TODO: create post_category by postId

    return { post: postCreated };
  }

  @Mutation(() => CreatePostResponse) // The `updatePost` resolver is a mutation which allows us update current post
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<CreatePostResponse> {
    if (title.length <= 1) {
      return {
        errors: [
          {
            field: "title",
            message: "The title is too short",
          },
        ],
      };
    }

    if (text.length <= 1) {
      return {
        errors: [
          {
            field: "text",
            message: "The text can't be empty",
          },
        ],
      };
    }
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
    return {
      post: result.raw[0],
    };
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

      /**Cascading method */
      await Post.delete({
        id,
        creatorId: req.session.userId, // you can only delete post you created
      });
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

    const updoot = await Updoot.findOne({
      where: { postId, userId },
    });

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
