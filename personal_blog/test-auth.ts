import { createClient } from "supabase";
import { config } from "dotenv";

const env = config();
const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file");
    Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get email from command line - required for real email testing
// Usage: deno run --allow-net --allow-env --allow-read test-auth.ts <email> <password>
if (Deno.args.length < 2) {
    console.error("❌ Error: Email and password are required");
    console.error("\nUsage: deno run --allow-net --allow-env --allow-read test-auth.ts <email> <password>");
    console.error("\nExample:");
    console.error('  deno run --allow-net --allow-env --allow-read test-auth.ts user@example.com MyPassword123!');
    Deno.exit(1);
}

const testEmail = Deno.args[0];
const testPassword = Deno.args[1];

console.log("Creating test user...");
console.log(`Email: ${testEmail}`);
console.log(`Password: ${testPassword}`);

try {
    // First, try to sign in (in case user already exists)
    console.log("Attempting to sign in...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
    });

    if (!signInError && signInData.session?.access_token) {
        console.log("\n✅ Successfully signed in (user already exists)!");
        displayToken(signInData.session.access_token);
        Deno.exit(0);
    }

    // If sign in failed, try to sign up
    if (signInError) {
        console.log("User doesn't exist or sign in failed. Creating new user...");
        console.log("Sign in error:", signInError.message);
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
    });

    if (signUpError) {
        console.error("\n❌ Error signing up:", signUpError.message);
        
        // Provide helpful error messages
        if (signUpError.message.includes("already registered")) {
            console.error("\n💡 This email is already registered.");
            console.error("If you forgot your password, you can reset it in the Supabase dashboard.");
            console.error("Or, if the password is correct, try running this script again - it should sign you in.");
        } else if (signUpError.message.includes("password")) {
            console.error("\n💡 Password requirements not met.");
            console.error("Make sure your password is at least 6 characters long.");
        } else if (signUpError.message.includes("email")) {
            console.error("\n💡 Email format is invalid.");
            console.error("Please use a valid email address.");
        }
        
        Deno.exit(1);
    }

    console.log("\n✅ User created successfully!");
    console.log("User ID:", signUpData.user?.id);

    // Check if email confirmation is required
    if (signUpData.user && !signUpData.session) {
        console.log("\n⚠️  Email confirmation required!");
        console.log("Please check your email inbox and click the confirmation link.");
        console.log("After confirming, run this script again with the same credentials to sign in.");
        console.log("\nTo skip email confirmation for testing, disable it in:");
        console.log("Supabase Dashboard → Authentication → Providers → Email → Disable 'Confirm email'");
        Deno.exit(0);
    }

    // If we have a session, use it
    if (signUpData.session?.access_token) {
        const accessToken = signUpData.session.access_token;
        console.log("\n✅ Successfully authenticated (auto-confirmed)!");
        displayToken(accessToken);
        Deno.exit(0);
    }

    // Fallback: try to sign in one more time
    console.log("\nSigning in...");
    const { data: retrySignInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
    });

    if (retrySignInError) {
        console.error("❌ Error signing in:", retrySignInError.message);
        if (retrySignInError.message.includes("Email not confirmed")) {
            console.log("\n💡 Tip: Check your email for the confirmation link, or disable email confirmation in Supabase settings.");
        } else if (retrySignInError.message.includes("Invalid login credentials")) {
            console.log("\n💡 Tip: Double-check your email and password are correct.");
        }
        Deno.exit(1);
    }

    const accessToken = retrySignInData.session?.access_token;
    
    if (!accessToken) {
        console.error("❌ No access token received");
        Deno.exit(1);
    }

    displayToken(accessToken);

} catch (error) {
    console.error("❌ Unexpected error:", error);
    Deno.exit(1);
}

function displayToken(accessToken: string) {
    console.log("\n✅ Successfully authenticated!");
    console.log("\n📋 Your JWT Token:");
    console.log("─".repeat(80));
    console.log(accessToken);
    console.log("─".repeat(80));
    console.log("\n💡 Use this token in the Authorization header:");
    console.log(`Authorization: Bearer ${accessToken.substring(0, 50)}...`);
    console.log("\n🧪 Test with curl:");
    console.log(`curl -X POST http://localhost:3000/graphql \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Authorization: Bearer ${accessToken}" \\`);
    console.log(`  -d '{"query":"mutation { createPost(title: \\"Test Post\\", content: \\"Content\\", author: \\"Test Author\\") { id title } }"}'`);
    console.log("\n📝 Note: This token expires in 1 hour. Run this script again to get a new token.");
}
