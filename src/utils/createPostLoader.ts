import { Post } from "./../entities/Post";
import DataLoader from "dataloader";

export const createPostLoader = () =>
  new DataLoader<number, Post>(async (postIds) => {
    const posts = await Post.findByIds(postIds as number[]);
    const postIdToPost: Record<number, Post> = {};
    posts.forEach((p) => {
      postIdToPost[p.id] = p;
    });

    return postIds.map((postId) => postIdToPost[postId]);
  });
