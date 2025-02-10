import { Server } from "https://deno.land/std@0.166.0/http/server.ts";
import { GraphQLHTTP } from "https://deno.land/x/gql@1.1.2/mod.ts";
import { makeExecutableSchema } from "https://deno.land/x/graphql_tools@0.0.2/mod.ts";
import { resolvers } from "./graphql/resolvers.ts";
import { typeDefs } from "./graphql/typedefs.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || (() => { throw new Error("SUPABASE_URL is not defined") })();
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || (() => { throw new Error("SUPABASE_ANON_KEY is not defined") })();

function handleCors(req: Request): Headers {
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*"); // Use a specific domain in production
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return headers;
}

// GraphQL Schema
const schema = makeExecutableSchema({ resolvers, typeDefs });

// Define the handler function with proper typing
async function handler(req: Request): Promise<Response> {
    try {
        console.log(`Handling request: ${req.method} ${req.url}`);
        const { pathname } = new URL(req.url);

        // Root Endpoint
        if (pathname === "/") {
            return new Response(
                JSON.stringify({ message: "API is running. Use /graphql for queries." }),
                {
                    headers: handleCors(req),
                    status: 200,
                }
            );
        }

        // GraphQL Endpoint
        if (pathname === "/graphql") {
            const corsHeaders = handleCors(req);

            // Handle OPTIONS (CORS Preflight)
            if (req.method === "OPTIONS") {
                return new Response(null, { headers: corsHeaders });
            }

            // Handle POST (GraphQL Queries/Mutations)
            if (req.method === "POST") {
                const response = await GraphQLHTTP<Request>({
                    schema,
                })(req);

                // Apply CORS headers to GraphQL responses
                return new Response(response.body, {
                    ...response,
                    headers: corsHeaders,
                });
            }

            return new Response("Method Not Allowed", {
                headers: corsHeaders,
                status: 405,
            });
        }

        // Health Check
        if (pathname === "/health") {
            return new Response("OK", { headers: handleCors(req), status: 200 });
        }

        // Not Found
        return new Response("Not Found", {
            headers: handleCors(req),
            status: 404,
        });
    } catch (error) {
        console.error("Internal Server Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

// Create the server
const server = new Server({ handler, port: 3000 });

server.listenAndServe();