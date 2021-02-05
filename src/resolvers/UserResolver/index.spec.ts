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

const helloQuery = `
  query Hello {
    hello
  }
`;

describe("Register resolver", () => {
  it("hello query", async () => {
    console.log(
      await graphqlCall({
        source: helloQuery,
      })
    );
  });

  it("create user", async () => {
    console.log(
      await graphqlCall({
        source: registerMutation,
        variableValues: {
          options: {
            username: "bob",
            email: "bob@bob.com",
            password: "bob@bob.com",
          },
        },
      })
    );
  });
});
