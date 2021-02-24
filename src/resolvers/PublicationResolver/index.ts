import { User } from "../../entities/User";
import { MyContext } from "../../types";
import { isAuth } from "../../middlewares/isAuth";
import { Publication } from "../../entities/Publication";
import {
  Arg,
  Mutation,
  UseMiddleware,
  Resolver,
  Ctx,
  Query,
  Root,
  FieldResolver,
} from "type-graphql";

@Resolver(Publication)
export class PublicationResolver {
  @FieldResolver(() => User)
  async creator(
    @Root() publication: Publication,
    @Ctx() { userLoader }: MyContext
  ): Promise<User> {
    return await userLoader.load(publication.creatorId);
  }

  @Query(() => [Publication])
  async publications(): Promise<Publication[]> {
    return await Publication.find();
  }

  @Mutation(() => Publication)
  @UseMiddleware(isAuth)
  async createPublication(
    @Arg("title") title: string,
    @Arg("isPrivate", { defaultValue: false }) isPrivate: boolean,
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
      isPrivate,
    }).save();
  }
}
