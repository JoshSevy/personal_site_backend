import { supabase } from "../supabaseClient.ts";

const getPosts = async () => {
    const { data, error } = await supabase.from("posts").select("*");
    if (error) throw new Error(error.message);
    return data;
};

const getPost = async (args: any) => {
    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", args.id)
        .single();
    if (error) throw new Error(error.message);
    return data;
};

const createPost = async (args: any) => {
    const { data, error } = await supabase
        .from("posts")
        .insert([{ title: args.title, content: args.content, author: args.author }])
        .single();
    if (error) throw new Error(error.message);
    return data;
};

const updatePost = async (_: any, { id, title, content, author }: { id: string, title: string, content: string, author: string }) => {
    console.log(`Updating post with id: ${id}, title: ${title}, content: ${content}, author: ${author}`);

    const { data, error } = await supabase
        .from('posts')
        .update({ title, content, author })
        .eq('id', id)
        .single();

    if (error) {
        console.error("Error updating post:", error);
        throw new Error("Failed to update post");
    }

    console.log("Update successful:", data);
    return data;
};

const deletePost = async (args: any) => {
    const { data, error } = await supabase
        .from("posts")
        .delete()
        .eq("id", args.id)
        .single();
    if (error) throw new Error(error.message);
    return data;
}

const fetchGitHubTrophies = async (username: string): Promise<string> => {
    try {
        console.log(`Fetching GitHub trophies for username: ${username}`);
        const response = await fetch(`https://github-profile-trophy.vercel.app/?username=${username}&theme=darkhub`);

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
        posts: () => getPosts(),
        post: (_: any, args: any) => getPost(args),
        trophies: async (_: any, args: { username: string }) => {
            return await fetchGitHubTrophies(args.username);
        },
    },
    Mutation: {
        createPost: (_: any, args: any) => createPost(args),
        updatePost : (_: any, args: any) => updatePost(_, args),
        deletePost: (_: any, args: any) => deletePost(args),
    },
};