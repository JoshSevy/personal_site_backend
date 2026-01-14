/// <reference lib="es2015" />
/// <reference lib="es2020" />
/// <reference path="./types.d.ts" />
import { Server } from "std/http/server";
import { GraphQLHTTP } from "gql";
import { makeExecutableSchema } from "graphql_tools";
import { resolvers } from "./graphql/resolvers";
import { typeDefs } from "./graphql/typedefs";

const BASE_URL = "https://api.joshuasevy.com";
const ALLOWED_ORIGINS = [
    "https://joshuasevy.com",
	"https://www.joshuasevy.com",
    "http://localhost:3000",
	"http://localhost:4000", // For development
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:5174"
];

function isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return false;
    for (let i = 0; i < ALLOWED_ORIGINS.length; i++) {
        if (ALLOWED_ORIGINS[i] === origin) return true;
    }
    return false;
}

function handleCors(req: Request): Headers {
    const headers = new Headers();
    const origin = req.headers.get("origin");

	// Ensure caches vary properly: only include preflight-related headers for OPTIONS
	if (req.method === "OPTIONS") {
		headers.set(
			"Vary",
			"Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
		);
	} else {
		headers.set("Vary", "Origin");
	}

    if (isAllowedOrigin(origin)) {
        headers.set("Access-Control-Allow-Origin", origin || "");
		// Allow credentialed requests (cookies, Authorization) for approved origins
		headers.set("Access-Control-Allow-Credentials", "true");
    }

	headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	// Echo requested headers when present to satisfy preflight checks from various clients
	const requestedHeaders = req.headers.get("access-control-request-headers");
	headers.set(
		"Access-Control-Allow-Headers",
		requestedHeaders || "Content-Type, Authorization",
	);
	// Make common headers visible to clients
	headers.set("Access-Control-Expose-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Max-Age", "86400"); // 24 hours
    return headers;
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
      lastmod: post.publishDate || '',
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
  typeDefs,
  resolvers,
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
			return new Response(null, { headers: corsHeaders, status: 204 });
            }

            // Handle POST (GraphQL Queries/Mutations)
          if (req.method === "POST") {
            try {
              // Extract Authorization header
              const authHeader = req.headers.get("Authorization");
              const token = authHeader && authHeader.indexOf("Bearer ") === 0
                            ? authHeader.substring(7)
                            : null;

              const response = await GraphQLHTTP<Request>({
                schema,
                context: (request: Request) => ({ request, authToken: token })
              })(req);

              // merge CORS headers etc (existing logic)
              const mergedHeaders = new Headers(response.headers);
              // copy known CORS headers from corsHeaders into mergedHeaders
              const corsHeaderNames = [
                  "Access-Control-Allow-Origin",
                  "Access-Control-Allow-Credentials",
                  "Access-Control-Allow-Methods",
                  "Access-Control-Allow-Headers",
                  "Access-Control-Expose-Headers",
                  "Access-Control-Max-Age",
                  "Vary",
              ];
              for (let i = 0; i < corsHeaderNames.length; i++) {
                  const name = corsHeaderNames[i];
                  const val = corsHeaders.get(name);
                  if (val !== null) mergedHeaders.set(name, val);
              }
              return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: mergedHeaders,
              });
            } catch (error) {
                    console.error("GraphQL Processing Error:", error);
				const errorHeaders = new Headers(corsHeaders);
				errorHeaders.set("Content-Type", "application/json");
                    return new Response(
                        JSON.stringify({
                            errors: [{
                                message: "Error processing GraphQL request",
                                code: "PROCESSING_ERROR",
                                statusCode: 500
                            }]
                        }),
                        {
					headers: errorHeaders,
					status: 500,
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
// deno-lint-ignore no-unused-vars
const server = new Server({ handler, port: 3000 });

server.listenAndServe();
