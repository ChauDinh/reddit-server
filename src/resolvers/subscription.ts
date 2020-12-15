import { MyContext } from "./../types";
import { isAuth } from "./../middlewares/isAuth";
import { Subscription } from "./../entities/Subscription";
import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";

@Resolver(Subscription)
export class SubscriptionResolver {
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async subscribe(
    @Arg("subscribedId", () => Int) subscribedId: number,
    @Ctx() { req }: MyContext
  ) {
    if (!req.session.userId) {
      throw new Error("Not Authenticated!");
    }
    const { userId } = req.session;
    const subscription = await Subscription.findOne({
      where: { subscriberId: userId, subscribedId: subscribedId },
    });

    if (!subscription) {
      console.log(`[NEW SUBSCRIPTION]: (${userId}, ${subscribedId})`);
      await getConnection().transaction(async (transaction) => {
        await transaction.query(
          `
          insert into subscription ("subscriberId", "subscribedId")
          values ($1, $2)
        `,
          [userId, subscribedId]
        );
      });
      return true;
    } else if (subscription) {
      console.log("You've unsubscribed this author!");
      await getConnection().transaction(async (transaction) => {
        await transaction.query(
          `
          delete from subscription
          where "subscriberId" = $1 and "subscribedId" = $2
        `,
          [userId, subscribedId]
        );
      });
      return true;
    }
    return false;
  }

  @Query(() => [Number], { nullable: true }) // return all users that someone subscribes
  async subscribed(
    @Arg("subscriberId", () => Int) subscriberId: number
  ): Promise<number[]> {
    let results = await Subscription.find({
      where: {
        subscriberId,
      },
    });
    console.log(results);
    return results.map((result) => result.subscribedId);
  }

  @Query(() => [Number], { nullable: true }) // return all users that subscribe to someone
  async subscriber(
    @Arg("subscribedId", () => Int) subscribedId: number
  ): Promise<number[]> {
    let results = await Subscription.find({
      where: {
        subscribedId,
      },
    });
    console.log(results);
    return results.map((result) => result.subscriberId);
  }
}
