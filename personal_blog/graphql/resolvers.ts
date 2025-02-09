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

export const resolvers = {
    Query: {
        posts: () => getPosts(),
        post: (_: any, args: any) => getPost(args),
    },
    Mutation: {
        createPost: (_: any, args: any) => createPost(args),
    },
};