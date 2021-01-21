import { MyContext } from "./../../types";
import { isAuth } from "./../../middlewares/isAuth";
import { Story } from "./../../entities/Story";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";

@Resolver(Story)
export class StoryResolver {
  @Mutation(() => Story)
  @UseMiddleware(isAuth)
  async createStory(
    @Arg("text", { nullable: true }) text: string,
    @Arg("url", { nullable: true }) url: string,
    @Ctx() { req }: MyContext
  ): Promise<Story> {
    if (!req.session.userId) throw new Error("Not authenticated!");

    if (text === null && url === null) {
      console.log(text, url);
      throw new Error("Both fields cannot be null!");
    }

    return await Story.create({
      text: text,
      url: url,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteStory(
    @Arg("storyId") storyId: number,
    @Ctx() { req }: MyContext
  ): Promise<Boolean> {
    if (!req.session.userId) throw new Error("Not authenticated!");

    await Story.delete({
      id: storyId,
      creatorId: req.session.userId, // you can only delete story that you created
    }).catch((err) => {
      console.error(err);
      return false;
    });

    return true;
  }
}
