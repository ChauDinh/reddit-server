import DataLoader from "dataloader";
import { Updoot } from "./../entities/Updoot";

/**
 * createUpdootLoader batches voteStatus queries at one
 *
 * {userId, postId}
 * [{postId: 5, userId: 10}, ...]
 * then return: [{postId: 5, userId: 10, value: 1}, ...] // the value
 */
export const createUpdootLoader = () =>
  new DataLoader<{ userId: number; postId: number }, Updoot | null>(
    async (keys) => {
      const updoots = await Updoot.findByIds(keys as any);
      const updootIdsToUpdoot: Record<string, Updoot> = {};
      updoots.forEach((updoot) => {
        updootIdsToUpdoot[`${updoot.userId}|${updoot.postId}`] = updoot;
      });
      return keys.map(
        (key) => updootIdsToUpdoot[`${key.userId}|${key.postId}`]
      );
    }
  );
