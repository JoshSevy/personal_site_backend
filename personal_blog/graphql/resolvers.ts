import { supabase, createAuthenticatedClient } from "../supabaseClient.ts";
import type { SupabaseClient } from "supabase";

function getClient(authToken?: string | null) {
    if (authToken) {
        return createAuthenticatedClient(authToken);
    }
    return supabase;
}

/**
 * Verifies the caller is signed in AND flagged as a blog admin, mirroring
 * isBlogAdminUser() in the frontend (src/app/auth/blog-admin.ts). RLS enforces
 * this at the database level too, but checking here gives a clear error
 * instead of an opaque Postgres permission-denied response.
 */
async function requireBlogAdmin(context: { authToken?: string | null }): Promise<SupabaseClient> {
    if (!context?.authToken) {
        throw new Error("Authentication required");
    }
    const client = createAuthenticatedClient(context.authToken);
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) {
        throw new Error("Authentication required");
    }
    const meta = (data.user.app_metadata ?? {}) as Record<string, unknown>;
    if (meta["blog_admin"] !== true && meta["admin"] !== true) {
        throw new Error("Not authorized: blog admin access required");
    }
    return client;
}

const POST_WRITE_FIELDS = [
    "title",
    "slug",
    "content",
    "excerpt",
    "author",
    "published",
    "tags",
    "hero_image_url",
] as const;

function pickDefinedPostFields(args: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of POST_WRITE_FIELDS) {
        if (args[key] !== undefined) {
            out[key] = args[key];
        }
    }
    return out;
}

const getPosts = async (_: unknown, args: { publishedOnly?: boolean | null }, context: { authToken?: string | null }) => {
    const client = getClient(context?.authToken);
    let query = client.from("posts").select("*");
    if (args?.publishedOnly === true) {
        query = query.eq("published", true);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
};

const getPost = async (_: unknown, args: { id: string }, context: { authToken?: string | null }) => {
    const client = getClient(context?.authToken);
    const { data, error } = await client
        .from("posts")
        .select("*")
        .eq("id", args.id)
        .single();
    if (error) throw new Error(error.message);
    return data;
};

const getPostBySlug = async (_: unknown, args: { slug: string }, context: { authToken?: string | null }) => {
    const client = getClient(context?.authToken);
    const { data, error } = await client
        .from("posts")
        .select("*")
        .eq("slug", args.slug)
        .single();
    if (error) throw new Error(error.message);
    return data;
};

const createPost = async (_: unknown, args: Record<string, unknown>, context: { authToken?: string | null }) => {
    const client = await requireBlogAdmin(context);
    const row: Record<string, unknown> = {
        title: args.title,
        slug: args.slug,
        content: args.content,
    };
    for (const key of POST_WRITE_FIELDS) {
        if (key === "title" || key === "slug" || key === "content") continue;
        if (args[key] !== undefined) row[key] = args[key];
    }
    const { data, error } = await client
        .from("posts")
        .insert([row])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

const updatePost = async (_: unknown, args: Record<string, unknown>, context: { authToken?: string | null }) => {
    const client = await requireBlogAdmin(context);
    const id = args.id as string;
    const updates = pickDefinedPostFields(args);
    if (Object.keys(updates).length === 0) {
        const { data, error } = await client.from("posts").select("*").eq("id", id).single();
        if (error) throw new Error(error.message);
        return data;
    }

    const { data, error } = await client
        .from("posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating post:", error);
        throw new Error("Failed to update post");
    }

    return data;
};

const deletePost = async (_: unknown, args: { id: string }, context: { authToken?: string | null }) => {
    const client = await requireBlogAdmin(context);
    // maybeSingle(): deleting an id that is already gone returns null rather
    // than throwing "no rows returned", so repeat deletes are a no-op.
    const { data, error } = await client
        .from("posts")
        .delete()
        .eq("id", args.id)
        .select()
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
};

interface GithubStats {
    username: string;
    publicRepos: number;
    sourceRepos: number;
    memberSince: string;
    topLanguages: { name: string; repoCount: number }[];
}

// GitHub allows 60 unauthenticated requests/hour per IP, and Deno Deploy
// shares egress IPs, so results are cached to stay well clear of that. Set
// GITHUB_TOKEN to raise the ceiling to 5000/hour.
const STATS_CACHE_TTL_MS = 60 * 60 * 1000;
const statsCache = new Map<string, { at: number; value: GithubStats }>();

function githubHeaders(): HeadersInit {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "personal-site-backend/1.0 (+https://api.joshuasevy.com)",
    };
    const token = Deno.env.get("GITHUB_TOKEN");
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

async function githubJson(url: string): Promise<unknown> {
    const response = await fetch(url, { headers: githubHeaders() });
    if (!response.ok) {
        throw new Error(`GitHub API ${response.status} for ${url}`);
    }
    return await response.json();
}

const fetchGithubStats = async (username: string): Promise<GithubStats> => {
    const cached = statsCache.get(username);
    if (cached && Date.now() - cached.at < STATS_CACHE_TTL_MS) {
        return cached.value;
    }

    const base = "https://api.github.com";
    const user = await githubJson(
        `${base}/users/${encodeURIComponent(username)}`,
    ) as { public_repos?: number; created_at?: string };

    // public_repos can exceed one page, so walk until a short page comes back.
    const repos: { fork?: boolean; language?: string | null }[] = [];
    for (let page = 1; page <= 5; page++) {
        const batch = await githubJson(
            `${base}/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&type=owner`,
        ) as { fork?: boolean; language?: string | null }[];
        repos.push(...batch);
        if (batch.length < 100) break;
    }

    const sources = repos.filter((r) => !r.fork);
    const counts = new Map<string, number>();
    for (const repo of sources) {
        if (!repo.language) continue;
        counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    }
    const topLanguages = [...counts.entries()]
        .map(([name, repoCount]) => ({ name, repoCount }))
        .sort((a, b) => b.repoCount - a.repoCount || a.name.localeCompare(b.name))
        .slice(0, 8);

    const value: GithubStats = {
        username,
        publicRepos: user.public_repos ?? repos.length,
        sourceRepos: sources.length,
        memberSince: (user.created_at ?? "").slice(0, 4),
        topLanguages,
    };

    statsCache.set(username, { at: Date.now(), value });
    return value;
};

export const resolvers = {
    Query: {
        posts: (_: unknown, args: { publishedOnly?: boolean | null }, context: { authToken?: string | null }) =>
            getPosts(_, args, context),
        post: (_: unknown, args: { id: string }, context: { authToken?: string | null }) => getPost(_, args, context),
        postBySlug: (_: unknown, args: { slug: string }, context: { authToken?: string | null }) =>
            getPostBySlug(_, args, context),
        githubStats: async (_: unknown, args: { username: string }) => {
            return await fetchGithubStats(args.username);
        },
    },
    Mutation: {
        createPost: (_: unknown, args: Record<string, unknown>, context: { authToken?: string | null }) =>
            createPost(_, args, context),
        updatePost: (_: unknown, args: Record<string, unknown>, context: { authToken?: string | null }) =>
            updatePost(_, args, context),
        deletePost: (_: unknown, args: { id: string }, context: { authToken?: string | null }) =>
            deletePost(_, args, context),
    },
};
