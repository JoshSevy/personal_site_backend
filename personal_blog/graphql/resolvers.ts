import { supabase, createAuthenticatedClient } from "../supabaseClient.ts";

function getClient(authToken?: string | null) {
    if (authToken) {
        return createAuthenticatedClient(authToken);
    }
    return supabase;
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
    if (!context?.authToken) {
        throw new Error("Authentication required to create posts");
    }
    const client = getClient(context.authToken);
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
    if (!context?.authToken) {
        throw new Error("Authentication required to update posts");
    }
    const id = args.id as string;
    const updates = pickDefinedPostFields(args);
    if (Object.keys(updates).length === 0) {
        const client = getClient(context.authToken);
        const { data, error } = await client.from("posts").select("*").eq("id", id).single();
        if (error) throw new Error(error.message);
        return data;
    }

    const client = getClient(context.authToken);
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
    if (!context?.authToken) {
        throw new Error("Authentication required to delete posts");
    }
    const client = getClient(context.authToken);
    const { data, error } = await client
        .from("posts")
        .delete()
        .eq("id", args.id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

const fetchGitHubTrophies = async (username: string): Promise<string> => {
    try {
        console.log(`Fetching GitHub trophies for username: ${username}`);
        const url =
            `https://github-profile-trophy.vercel.app/?username=${encodeURIComponent(username)}&theme=onedark`;
        const response = await fetch(url, {
            headers: {
                Accept: "image/svg+xml,text/html;q=0.9,*/*;q=0.8",
                "User-Agent": "personal-site-backend/1.0 (+https://api.joshuasevy.com)",
            },
        });

        if (!response.ok) {
            console.error(`Failed to fetch trophies. Status: ${response.status}, StatusText: ${response.statusText}`);
            throw new Error("Failed to fetch trophies from GitHub Profile Trophy.");
        }

        const data = await response.text();
        console.log("Fetched trophies successfully");
        return data;
    } catch (error) {
        console.error("Error in fetchGitHubTrophies:", error);
        throw error;
    }
};

export const resolvers = {
    Query: {
        posts: (_: unknown, args: { publishedOnly?: boolean | null }, context: { authToken?: string | null }) =>
            getPosts(_, args, context),
        post: (_: unknown, args: { id: string }, context: { authToken?: string | null }) => getPost(_, args, context),
        postBySlug: (_: unknown, args: { slug: string }, context: { authToken?: string | null }) =>
            getPostBySlug(_, args, context),
        trophies: async (_: unknown, args: { username: string }) => {
            return await fetchGitHubTrophies(args.username);
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
