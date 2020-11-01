import { User } from "../entities/User";
import { MyContext } from "./../types";
import { isAuth } from "./../middlewares/isAuth";
import { Comment } from "./../entities/Comment";
import {
  InputType,
  Field,
  Mutation,
  Resolver,
  UseMiddleware,
  Arg,
  Ctx,
  Query,
  ObjectType,
  FieldResolver,
  Root,
} from "type-graphql";

@InputType()
class CommentInput {
  @Field()
  text: string;

  @Field()
  postId: number;
}

@ObjectType()
class CommentResults {
  @Field(() => [Comment])
  comments: Comment[];
}

@Resolver(Comment)
export class CommentResolver {
  @FieldResolver(() => User)
  commentCreator(@Root() comment: Comment, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(comment.creatorId);
  }

  @Mutation(() => Comment)
  @UseMiddleware(isAuth)
  async createComment(
    @Arg("input") input: CommentInput,
    @Ctx() { req }: MyContext
  ) {
    return Comment.create({
      ...input,
      creatorId: req.session!.userId,
      postId: input.postId,
    }).save();
  }

  @Query(() => CommentResults, { nullable: true })
  async comments(@Arg("postId") postId: number): Promise<CommentResults> {
    let results = await Comment.find({
      where: {
        postId,
      },
      order: {
        createdAt: "ASC",
      },
    });
    console.log(results);
    return {
      comments: results,
    };
  }
}
