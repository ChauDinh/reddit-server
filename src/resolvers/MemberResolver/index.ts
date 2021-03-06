import {
  Arg,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { MyContext } from "./../../types";
import { isAuth } from "./../../middlewares/isAuth";
import { Member } from "./../../entities/Member";
import { getConnection } from "typeorm";
import { User } from "../../entities/User";

@Resolver(Member)
export class MemberResolver {
  @FieldResolver(() => User)
  async user(
    @Root() member: Member,
    @Ctx() { userLoader }: MyContext
  ): Promise<User> {
    return await userLoader.load(member.userId);
  }

  @Query(() => [Member])
  // @UseMiddleware(isAuth)
  async members(
    @Arg("publicationId") publicationId: number
    // @Ctx() { req }: MyContext
  ): Promise<Member[]> {
    // if (!req.session.userId) throw new Error("Not authenticated!");

    return await Member.find({
      where: {
        publicationId,
      },
    });
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async createMember(
    @Arg("publicationId") publicationId: number,
    @Ctx() { req }: MyContext
  ) {
    if (!req.session.userId) throw new Error("Not authenticated!");

    const isMember = await Member.find({
      where: {
        userId: req.session.userId,
        publicationId: publicationId,
      },
    });

    if (isMember.length !== 0) {
      // member has subscribed the publication
      await getConnection().transaction(async (transaction) => {
        await transaction.query(
          `
          delete from member
          where "publicationId" = $1 and "userId" = $2
        `,
          [publicationId, req.session.userId]
        );
      });
      return true;
    } else if (isMember.length === 0) {
      // member has not subscribed the publication
      await getConnection().transaction(async (transaction) => {
        await transaction.query(
          `
          insert into member ("userId", "publicationId")
          values ($1, $2)
        `,
          [req.session.userId, publicationId]
        );
      });
      return true;
    }
    return false;
  }
}
