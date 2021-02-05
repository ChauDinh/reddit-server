import { UserProfile } from "./../../entities/UserProfile";
import faker from "faker";
import { graphqlCall } from "./../../__test__/graphqlCall";
import { testConfig } from "./../../__test__/testConfig";
import { Connection } from "typeorm";

let connection: Connection;
beforeAll(async () => {
  connection = await testConfig();
});

afterAll(async () => {
  await connection.close();
});

const meProfileQuery = `
  query MeProfile {
    meProfile {
      userId
      isPremium
      age
      status
      nation
    }
  }
`;

const updateProfileMutation = `
  mutation UpdateProfile($options: UserProfileInput!) {
    updateProfile(options: $options)
  }
`;

describe("User Profile resolvers", () => {
  it("me profile query", async () => {
    const response = await graphqlCall({
      source: meProfileQuery,
      userId: 1,
    });

    expect(response).toMatchObject({
      data: {
        meProfile: {
          userId: 1,
          isPremium: false,
        },
      },
    });
  });

  it("update profile", async () => {
    const mockProfile = {
      status: faker.lorem.text(10),
      age: faker.random.number(99),
      nation: "vietnam",
    };

    const response = await graphqlCall({
      source: updateProfileMutation,
      variableValues: {
        options: mockProfile,
      },
      userId: 1,
    });

    expect(response).toMatchObject({
      data: {
        updateProfile: true,
      },
    });

    const dbProfileAfterUpdate = await UserProfile.findOne({
      where: {
        userId: 1,
      },
    });

    expect(dbProfileAfterUpdate!.age).toEqual(mockProfile.age);
    expect(dbProfileAfterUpdate!.nation).toEqual(mockProfile.nation);
    expect(dbProfileAfterUpdate!.status).toEqual(mockProfile.status);
  });
});
