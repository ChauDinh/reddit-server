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
