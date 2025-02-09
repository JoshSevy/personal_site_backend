import { supabase } from "./supabaseClient.ts";

const seedData = async () => {
    const { data, error } = await supabase
        .from("posts")
        .insert([
            { title: "First Post", content: "This is the first post", author: "Author 1" },
            { title: "Second Post", content: "This is the second post", author: "Author 2" },
            { title: "Third Post", content: "This is the third post", author: "Author 3" },
        ]);

    if (error) {
        console.error("Error inserting data:", error.message);
    } else {
        console.log("Data inserted successfully:", data);
    }
};

seedData();