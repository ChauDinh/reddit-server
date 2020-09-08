import DataLoader from "dataloader";
import { User } from "./../entities/User";

/**
 * createCreatorLoader batches creator queries at one
 *
 * userIds: [1, 7, 8, 10, 9]
 * users: [{id: 1, username: "ben"}, {id: 7, username: "bob"}, {...}]
 */
export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]);
    const userIdToUser: Record<number, User> = {};
    users.forEach((u) => {
      userIdToUser[u.id] = u;
    });

    return userIds.map((userId) => userIdToUser[userId]);
  });
