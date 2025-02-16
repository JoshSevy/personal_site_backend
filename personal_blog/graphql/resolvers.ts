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

export const resolvers = {
    Query: {
        posts: () => getPosts(),
        post: (_: any, args: any) => getPost(args),
    },
    Mutation: {
        createPost: (_: any, args: any) => createPost(args),
        updatePost : (_: any, args: any) => updatePost(args),
        deletePost: (_: any, args: any) => deletePost(args),
    },
};