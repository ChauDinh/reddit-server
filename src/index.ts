import { MikroORM } from "@mikro-orm/core";

import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import mikroConfig from "./mikro-orm.config";

const main = async () => {
  // Create MikroORM instance
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up();
  const post = orm.em.create(Post, { title: "my first test post" });
  await orm.em.persistAndFlush(post);

  const posts = await orm.em.find(Post, {});
  console.log(posts);
};

main().catch((err) => {
  console.error(err);
});
