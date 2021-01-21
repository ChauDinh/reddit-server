import { MyContext } from "../../types";
import { isAuth } from "../../middlewares/isAuth";
import { Publication } from "../../entities/Publication";
import { Arg, Mutation, UseMiddleware, Resolver, Ctx } from "type-graphql";

@Resolver(Publication)
export class PublicationResolver {
  @Mutation(() => Publication)
  @UseMiddleware(isAuth)
  async createPublication(
    @Arg("title") title: string,
    @Ctx() { req }: MyContext
  ): Promise<Publication> {
    if (!req.session.userId) throw new Error("Not Authenticated!");

    // checking whether the publication exist
    const isExist = await Publication.find({
      where: { title: title },
    });

    if (isExist.length !== 0)
      throw new Error("The publication name has already be existed");

    return await Publication.create({
      title: title,
      creatorId: req.session.userId,
    }).save();
  }
}
