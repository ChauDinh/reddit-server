import { Member } from "./../../entities/Member";
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
  Field,
  ObjectType,
} from "type-graphql";

@ObjectType()
export class CreatePublicationFieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class CreatePublicationResponse {
  @Field(() => [CreatePublicationFieldError], { nullable: true })
  errors?: CreatePublicationFieldError[];

  @Field(() => Publication, { nullable: true })
  publication?: Publication;
}

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

  @Query(() => CreatePublicationResponse)
  async publicationById(
    @Arg("publicationId") publicationId: number,
    @Ctx() { req }: MyContext
  ): Promise<CreatePublicationResponse> {
    const publication = await Publication.findOne({
      where: { id: publicationId },
    });

    const isPrivate = publication?.isPrivate;
    if (isPrivate) {
      // publication is private

      // checking whether user login or not
      if (!req.session.userId) {
        return {
          errors: [
            {
              field: "authentication",
              message: "You have to login to see publication's content!",
            },
          ],
        };
      }

      // checking whether user is a member or not
      const userId = req.session.userId;
      const isMember = await Member.findOne({
        where: {
          userId: userId,
          publicationId: publicationId,
        },
      });
      if (!isMember) {
        return {
          errors: [
            {
              field: "authorization",
              message: "This publication is for members only!",
            },
          ],
        };
      }
      return { publication };
    } else {
      // publication is public
      return { publication };
    }
  }

  @Mutation(() => CreatePublicationResponse)
  @UseMiddleware(isAuth)
  async createPublication(
    @Arg("title") title: string,
    @Arg("isPrivate", { defaultValue: false }) isPrivate: boolean,
    @Ctx() { req }: MyContext
  ): Promise<CreatePublicationResponse> {
    if (!req.session.userId) throw new Error("Not Authenticated!");

    if (title.length <= 2) {
      return {
        errors: [
          {
            field: "title",
            message: "The publication title is too short!",
          },
        ],
      };
    }

    // checking whether the publication exist
    const isExist = await Publication.find({
      where: { title: title },
    });

    if (isExist.length !== 0) {
      return {
        errors: [
          {
            field: "title",
            message: "The publication has already been existed!",
          },
        ],
      };
    }

    const response = await Publication.create({
      title: title,
      creatorId: req.session.userId,
      isPrivate,
    }).save();

    return { publication: response };
  }
}
