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
  it("me and update profile resolvers", async () => {
    const response = await graphqlCall({
      source: meProfileQuery,
      userId: 1,
    });

    console.log("[Response Me Profile]: ", response);

    expect(response).toMatchObject({
      data: {
        meProfile: {
          userId: 1,
          isPremium: false,
        },
      },
    });

    const mockerProfile = {
      status: faker.lorem.text(10),
      age: faker.random.number(99),
      nation: "chinese",
    };

    const updateProfileResponse = await graphqlCall({
      source: updateProfileMutation,
      variableValues: {
        options: mockerProfile,
      },
      userId: 1,
    });

    expect(updateProfileResponse).toMatchObject({
      data: {
        updateProfile: true,
      },
    });

    const dbProfileAfterUpdate = await UserProfile.findOne({
      where: {
        userId: 1,
      },
    });

    console.log("[User Profile Updated]: ", dbProfileAfterUpdate);

    expect(dbProfileAfterUpdate!.age).toEqual(mockerProfile.age);
    expect(dbProfileAfterUpdate?.nation).toEqual(mockerProfile.nation);
    expect(dbProfileAfterUpdate?.status).toEqual(mockerProfile.status);
  });
});
