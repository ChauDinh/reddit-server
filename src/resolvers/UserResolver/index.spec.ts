import { UserProfile } from "./../../entities/UserProfile";
import { User } from "./../../entities/User";
import faker from "faker";
import { graphqlCall } from "./../../__test__/graphqlCall";
import { Connection } from "typeorm";
import { testConfig } from "../../__test__/testConfig";

let connection: Connection;
beforeAll(async () => {
  connection = await testConfig();
});

afterAll(async () => {
  await connection.close();
});

const registerMutation = `
  mutation Register($options: RegisterInput!) {
    register(options: $options) {
      user {
        id
        username
        createdAt
        updatedAt
      }

      errors {
        field
        message
      }
    }
  }
`;

const loginMutation = `
  mutation Login($options: LoginInput!) {
    login(options: $options) {
      user {
        username
        id
        email
      }
    }
  }
`;

const helloQuery = `
  query Hello {
    hello
  }
`;

const meQuery = `
  query Me {
    me {
      username
      email
    }
  }
`;

describe("User resolvers", () => {
  it("hello query", async () => {
    const hello = await graphqlCall({
      source: helloQuery,
    });

    // TODO: checking hello query
    expect(hello).toMatchObject({
      data: {
        hello: "Hello, World from Hello Graphql Resolver",
      },
    });
  });

  it("register and login mutations", async () => {
    const mockUser = {
      username: `${faker.name.firstName()} ${faker.name.lastName()}`,
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    const response = await graphqlCall({
      source: registerMutation,
      variableValues: {
        options: mockUser,
      },
    });

    // TODO: checking for creat user success or not
    expect(response).toMatchObject({
      data: {
        register: {
          user: {
            id: 1,
            username: mockUser.username,
          },
        },
      },
    });

    const dbUser = await User.findOne({
      where: {
        id: 1,
      },
    });
    const dbUserProfile = await UserProfile.findOne({
      where: {
        userId: 1,
      },
    });

    // TODO: checking for writing user to database success or not
    expect(dbUser).toBeDefined();
    expect(dbUser!.username).toBe(mockUser.username);
    expect(dbUserProfile).toBeDefined();

    const loginResponse = await graphqlCall({
      source: loginMutation,
      variableValues: {
        options: {
          usernameOrEmail: mockUser.email,
          password: mockUser.password,
        },
      },
      userId: 1,
    });

    // TODO: checking for login registered user
    expect(loginResponse).toMatchObject({
      data: {
        login: {
          user: {
            username: mockUser.username,
            id: 1,
            email: mockUser.email,
          },
        },
      },
    });
  });

  it("me query", async () => {
    const user = await User.create({
      username: faker.name.firstName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    }).save();

    const response = await graphqlCall({
      source: meQuery,
      userId: user.id,
    });

    // TODO: checking me query with { req } context
    expect(response).toMatchObject({
      data: {
        me: {
          username: user.username,
          email: user.email,
        },
      },
    });
  });

  it("me query without req.session.userId in context", async () => {
    const response = await graphqlCall({
      source: meQuery,
    });

    expect(response).toMatchObject({
      data: {
        me: null,
      },
    });
  });
});
