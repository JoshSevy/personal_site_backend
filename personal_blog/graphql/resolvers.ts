import { supabase, createAuthenticatedClient } from "../supabaseClient.ts";

// Helper to get the appropriate Supabase client (authenticated if token provided)
function getClient(authToken?: string | null) {
    if (authToken) {
        return createAuthenticatedClient(authToken);
    }
    return supabase;
}

const getPosts = async (_: any, __: any, context: any) => {
    const client = getClient(context?.authToken);
    const { data, error } = await client.from("posts").select("*");
    if (error) throw new Error(error.message);
    return data;
};

const getPost = async (_: any, args: any, context: any) => {
    const client = getClient(context?.authToken);
    const { data, error } = await client
        .from("posts")
        .select("*")
        .eq("id", args.id)
        .single();
    if (error) throw new Error(error.message);
    return data;
};

const createPost = async (_: any, args: any, context: any) => {
    if (!context?.authToken) {
        throw new Error("Authentication required to create posts");
    }
    const client = getClient(context.authToken);
    const { data, error } = await client
        .from("posts")
        .insert([{ title: args.title, content: args.content, author: args.author }])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

const updatePost = async (_: any, args: any, context: any) => {
    if (!context?.authToken) {
        throw new Error("Authentication required to update posts");
    }
    const { id, title, content, author } = args;
    console.log(`Updating post with id: ${id}, title: ${title}, content: ${content}, author: ${author}`);

    const client = getClient(context.authToken);
    const { data, error } = await client
        .from('posts')
        .update({ title, content, author })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating post:", error);
        throw new Error("Failed to update post");
    }

    console.log("Update successful:", data);
    return data;
};

const deletePost = async (_: any, args: any, context: any) => {
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
}

const fetchGitHubTrophies = async (username: string): Promise<string> => {
    try {
        console.log(`Fetching GitHub trophies for username: ${username}`);
		const response = await fetch(
			`https://github-profile-trophy.vercel.app/?username=${username}&theme=darkhub`,
			{
				// Some providers require explicit Accept and a non-empty UA
				headers: {
					"Accept": "image/svg+xml,text/html;q=0.9,*/*;q=0.8",
					"User-Agent": "personal-site-backend/1.0 (+https://api.joshuasevy.com)",
				},
			},
		);

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
        posts: (_: any, __: any, context: any) => getPosts(_, __, context),
        post: (_: any, args: any, context: any) => getPost(_, args, context),
        trophies: async (_: any, args: { username: string }) => {
            return await fetchGitHubTrophies(args.username);
        },
    },
    Mutation: {
        createPost: (_: any, args: any, context: any) => createPost(_, args, context),
        updatePost: (_: any, args: any, context: any) => updatePost(_, args, context),
        deletePost: (_: any, args: any, context: any) => deletePost(_, args, context),
    },
};