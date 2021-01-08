import { Arg, Ctx, FieldResolver, Root } from "type-graphql";
import { MyContext } from "./../types";
import { isAuth } from "./../middlewares/isAuth";
import { Mutation, Resolver, UseMiddleware } from "type-graphql";
import { DirectMessage } from "./../entities/DirectMessage";
import { User } from "./../entities/User";

@Resolver(DirectMessage)
export class DirectMessageResolver {
  @FieldResolver(() => User)
  async sender(
    @Root() directMessage: DirectMessage,
    @Ctx() { userLoader }: MyContext
  ) {
    return await userLoader.load(directMessage.senderId);
  }

  @FieldResolver(() => User)
  async receiver(
    @Root() directMessage: DirectMessage,
    @Ctx() { userLoader }: MyContext
  ) {
    return await userLoader.load(directMessage.receiverId);
  }

  @Mutation(() => DirectMessage)
  @UseMiddleware(isAuth)
  async createMessage(
    @Ctx() { req }: MyContext,
    @Arg("receiverId") receiverId: number,
    @Arg("text") text: string
  ): Promise<DirectMessage | null> {
    if (!req.session.userId) throw new Error("Not authenticated");

    if (!text) throw new Error("Text field is required!");

    return DirectMessage.create({
      text: text,
      senderId: req.session.userId,
      receiverId: receiverId,
    }).save();
  }
}
