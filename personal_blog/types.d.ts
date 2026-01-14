// Minimal module declarations for imports that lack published type definitions
// This keeps type-checking happy while using the runtime implementations from the URLs/import map.

declare module "std/http/server" {
  export { Server } from "https://deno.land/std@0.166.0/http/server.ts";
}

declare module "gql" {
  // GraphQLHTTP is a handler factory; type it loosely to avoid blocking checks
  export function GraphQLHTTP<T = unknown>(opts: any): (req: Request) => Promise<Response>;
}

declare module "graphql_tools" {
  export function makeExecutableSchema(opts: any): any;
}

