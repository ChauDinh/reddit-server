### Explain session

We store some data (here is user.id) into session: req.session.userId = user.id

Since we use redis to store our sessions, it would look something like this: `{userId: 1}`

- Redis is a key-value store which means you would have a key to lookup value. In
  this case, our key would be: `sess:REDIS_SECRET_KEY` -> `{userId: 1}`

- The `express-session` will set a cookie in my browser (in header actually), which is a `signed` version
  of `REDIS_SECRET_KEY`

- When user makes a request, the `signed REDIS_SECRET_KEY` will be sent to the
  server

- The server decrypt the signed cookie to the key `sess:REDIS_SECRET_KEY`

- The server makes a request to redis server with the decrypt key above and look
  up data with that key.

- Now, the server will send `{userId: 1}` to client and store it in
  `req.session`.

### Explain SSR cookie

- The first time we go to the page (index.js), it is server side rendering
  (ssr):

browser => nextjs server => graphql apis

browser sends the cookie to next.js server

- Later requests are client side rendering:

browser => graphql apis

browser sends the cookie to graphql apis.

### Data Loader for GraphQL queries

In this project, we have `Post` entity which includes a view called `creator`
representing the post creator information: username, id, etc. At the first time,
I write an inner join within `SQL` query to get the creator information, but I
think the `creator` would not be needed for every query related to post. And the
`creator` may be duplicated in `posts` query and `post` query.

According to Ben's video, I've learnt a practice that we can split our big query
into smaller parts. In this case, I can split the `creator` view as a
`@FieldResolver()` so that when a request need `creator`, it will fetch the data
for us:

```TypeScript
@FieldResolver()
creator(@Root() post: Post) {
  return User.findOne(post.creatorId);
}
```

So I can grip out `inner join` part in `posts` query, `post` query and the
result in logging console when I refresh the home page would be something likes
this:

![logging console](https://res.cloudinary.com/dnlthcx1a/image/upload/v1604429235/Screen_Shot_2020-11-04_at_01.46.19_lzr0ik.png)

As you can see, if there are 15 - 20 posts in our homepage, there are 15 - 20
queries for fetch `creator`. Moreover, in our case, we have at least two
sections `Popular` posts and `Recent` posts so it would be duplicated the number
of query `creator`, which could lead our performance downward. That's why `Data Loader` comes in.

Actually, with Data Loader, our system will cache the `creator` query, reducing
the number of total queries we would have to fetch.

```TypeScript
  @FieldResolver(() => User)
  async creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return await userLoader.load(post.creatorId);
  }
```

We create `userLoader` for caching the `creator` requests and pass it to our
context so that we can call it at anywhere else.

```TypeScript
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

```

Now we can refresh the home page and our `creator` query is cached successfully.

![with
dataloader](https://res.cloudinary.com/dnlthcx1a/image/upload/v1604478837/Screen_Shot_2020-11-04_at_15.33.29_nn7ea2.png)
