import { Server } from "https://deno.land/std@0.166.0/http/server.ts";
import { GraphQLHTTP } from "https://deno.land/x/gql@1.1.2/mod.ts";
import { makeExecutableSchema } from "https://deno.land/x/graphql_tools@0.0.2/mod.ts";
import { resolvers } from "./graphql/resolvers.ts";
import { typeDefs } from "./graphql/typedefs.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || (() => { throw new Error("SUPABASE_URL is not defined") })();
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || (() => { throw new Error("SUPABASE_ANON_KEY is not defined") })();

console.log("Supabase URL:", SUPABASE_URL);
console.log("Supabase Anon Key:", SUPABASE_ANON_KEY);

function handleCors(req: Request, res: Response) {
    const headers = new Headers(res.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return new Response(null, { headers });
    }

    return new Response(res.body, { ...res, headers });
}

const schema = makeExecutableSchema({ resolvers, typeDefs });

const server = new Server({
    handler: async (req) => {
        try {
            console.log(`Handling request: ${req.method} ${req.url}`);
            const { pathname } = new URL(req.url);

            if (pathname === "/") {
                return new Response(
                    JSON.stringify({ message: "API is running. Use /graphql for queries." }),
                    {
                        headers: { "Content-Type": "application/json" },
                        status: 200,
                    }
                );
            }

            if (pathname === "/graphql") {
                if (req.method === "OPTIONS") {
                    return new Response(null, { headers: handleCORS(req) });
                }

                if (req.method === "POST") {
                    return await GraphQLHTTP<Request>({ schema })(req);
                }

                return new Response("Method Not Allowed", { status: 405 });
            }

            if (pathname === "/health") {
                return new Response("OK", { status: 200 });
            }

            return new Response("Not Found", { status: 404 });
        } catch (error) {
            console.error("Internal Server Error:", error);
            return new Response("Internal Server Error", { status: 500 });
        }
    },
    port: 3000,
});

server.listenAndServe();