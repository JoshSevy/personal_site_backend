import { Server } from "https://deno.land/std@0.166.0/http/server.ts";
import { GraphQLHTTP } from "gql";
import { makeExecutableSchema } from "graphql_tools";
import { resolvers } from "./graphql/resolvers.ts";
import { typeDefs } from "./graphql/typedefs.ts";

const BASE_URL = "https://api.joshuasevy.com";
const ALLOWED_ORIGINS = [
    "https://joshuasevy.com",
    "http://localhost:3000",
    "http://localhost:4000" // For development
];

function handleCors(req: Request): Headers {
    const headers = new Headers();
    const origin = req.headers.get("origin");
    
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers.set("Access-Control-Allow-Origin", origin);
    }
    
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Max-Age", "86400"); // 24 hours
    return headers;
}

// Custom error class for GraphQL errors
class GraphQLError extends Error {
    constructor(message: string, public code: string, public statusCode: number = 400) {
        super(message);
        this.name = "GraphQLError";
    }
}

// Function to fetch blog posts (replace with actual data fetching logic)
async function fetchBlogPosts() {
    // Mocked data for demonstration
    return [
        { id: "1", title: "Getting Started with Angular", publishDate: "2025-02-08" },
        { id: "2", title: "Improving App Performance", publishDate: "2025-01-15" },
    ];
}

// Function to generate the sitemap XML
async function generateSitemap() {
    const staticPages = [
        { path: "/", priority: "1.0", lastmod: '' },
        { path: "/about", priority: "0.8", lastmod: '' },
        { path: "/resume", priority: "0.8", lastmod: '' },
        { path: "/contact", priority: "0.6", lastmod: '' },
        { path: "/blog", priority: "0.7", lastmod: '' },
    ];

    const blogPosts = await fetchBlogPosts();
    const dynamicPages = blogPosts.map(post => ({
        path: `/blog/${post.id}`,
        priority: "0.6",
        lastmod: post.publishDate,
    }));

    const allPages = [...staticPages, ...dynamicPages];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages
        .map(
            ({ path, priority, lastmod }) => `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${lastmod || new Date().toISOString().split("T")[0]}</lastmod>
    <priority>${priority}</priority>
  </url>
  `
        )
        .join("\n")}
</urlset>`;
}

// GraphQL Schema
const schema = makeExecutableSchema({ 
    resolvers, 
    typeDefs,
    // Add error handling to the schema
    formatError: (error) => {
        console.error("GraphQL Error:", error);
        
        // Handle custom GraphQLError
        if (error.originalError instanceof GraphQLError) {
            return {
                message: error.message,
                code: error.originalError.code,
                statusCode: error.originalError.statusCode
            };
        }
        
        // Handle validation errors
        if (error.extensions?.code === "GRAPHQL_VALIDATION_FAILED") {
            return {
                message: "Invalid input data",
                code: "VALIDATION_ERROR",
                statusCode: 400
            };
        }
        
        // Default error response
        return {
            message: "An unexpected error occurred",
            code: "INTERNAL_SERVER_ERROR",
            statusCode: 500
        };
    }
});

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
                try {
                    // Extract Authorization header
                    const authHeader = req.headers.get("Authorization");
                    const token = authHeader?.startsWith("Bearer ")
                        ? authHeader.substring(7)
                        : null;

                    const response = await GraphQLHTTP<Request>({
                        schema,
                        context: () => ({ authToken: token }),
                    })(req);

                    // Apply CORS headers to GraphQL responses
                    return new Response(response.body, {
                        ...response,
                        headers: corsHeaders,
                    });
                } catch (error) {
                    console.error("GraphQL Processing Error:", error);
                    return new Response(
                        JSON.stringify({
                            errors: [{
                                message: "Error processing GraphQL request",
                                code: "PROCESSING_ERROR",
                                statusCode: 500
                            }]
                        }),
                        {
                            headers: {
                                ...corsHeaders,
                                "Content-Type": "application/json"
                            },
                            status: 500
                        }
                    );
                }
            }

            return new Response("Method Not Allowed", {
                headers: corsHeaders,
                status: 405,
            });
        }

        // Sitemap Endpoint
        if (pathname === "/sitemap") {
            const corsHeaders = handleCors(req);

            if (req.method === "GET") {
                const sitemap = await generateSitemap();
                return new Response(sitemap, {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/xml",
                    },
                    status: 200,
                });
            }

            return new Response("Method Not Allowed", { headers: corsHeaders, status: 405 });
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