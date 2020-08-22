import { Resolver, Query } from "type-graphql";

@Resolver()
export class HelloResolver {
  // The resolver methods can be mutation or query
  // This example is a query method (just return a string)
  @Query(() => String) // we can declare what the query returns
  hello() {
    return "Hello, World from Hello Graphql Resolver";
  }
}
