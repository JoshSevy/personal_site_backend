# Authentication Setup Guide

## ✅ What's Been Set Up

1. **Database Authentication Policies**: Row Level Security (RLS) is configured to require authentication for mutations
2. **Server-Side Auth Extraction**: The GraphQL server extracts JWT tokens from the `Authorization` header
3. **Authenticated Supabase Client**: Resolvers use authenticated clients when a token is provided
4. **Protected Mutations**: Create, Update, and Delete operations require authentication

## 🔧 Configuration Steps

### Step 1: Disable Email Confirmation (For Testing)

To test authentication without dealing with email confirmation:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `personal-site-backend`
3. Navigate to **Authentication** > **Providers**
4. Click on **Email**
5. **Disable** "Confirm email" (toggle it off)
6. Save the changes

This allows users to sign up and immediately use their account without email verification.

### Step 2: Create a Test User

Run the test script to create a test user:

```bash
# Using a real email address
deno run --allow-net --allow-env --allow-read test-auth.ts your-email@example.com YourPassword123!

# Or let it generate a test email (if email confirmation is disabled)
deno run --allow-net --allow-env --allow-read test-auth.ts
```

The script will:
- Create a new user account
- Sign them in
- Display the JWT token you can use for testing

### Step 3: Test Authenticated Mutations

Once you have a JWT token, test it with curl:

```bash
# Replace YOUR_JWT_TOKEN with the token from the test script
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query":"mutation { createPost(title: \"My First Post\", content: \"This is a test post!\", author: \"Test Author\") { id title content author publish_date } }"}'
```

## 🧪 Testing Checklist

- [ ] Email confirmation disabled (if testing)
- [ ] Test user created successfully
- [ ] JWT token received
- [ ] Can query posts without auth (should work)
- [ ] Cannot create post without auth (should fail)
- [ ] Can create post with valid JWT (should work)
- [ ] Can update post with valid JWT (should work)
- [ ] Can delete post with valid JWT (should work)

## 📝 How Authentication Works

### Public Access (No Auth Required)
- `posts` query - Anyone can read posts
- `post(id)` query - Anyone can read a single post
- `trophies(username)` query - Public GitHub trophies endpoint

### Protected Operations (Auth Required)
- `createPost` - Requires valid JWT token
- `updatePost` - Requires valid JWT token
- `deletePost` - Requires valid JWT token

### Request Format

Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## 🔒 Security Notes

1. **RLS Policies**: Database-level security ensures only authenticated users can mutate data
2. **Token Validation**: Supabase automatically validates JWT tokens
3. **Token Expiration**: JWT tokens expire after 1 hour by default
4. **Refresh Tokens**: Use Supabase's refresh token mechanism for long-lived sessions

## 🚀 Next Steps for Production

1. **Enable Email Confirmation**: Re-enable email confirmation for production
2. **Configure SMTP**: Set up a custom SMTP server for production emails
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **User Management**: Build user management UI in your frontend
5. **Token Refresh**: Implement token refresh logic in your frontend

## 🆘 Troubleshooting

### "Email address is invalid"
- Make sure you're using a valid email format
- Or disable email confirmation in Supabase settings

### "Authentication required to create posts"
- This is expected! Make sure you're including the `Authorization: Bearer <token>` header

### "Invalid token" or "Token expired"
- Get a fresh token by signing in again
- Tokens expire after 1 hour

### Can't create user
- Check if email confirmation is enabled and you need to verify the email
- Make sure password meets requirements (usually 6+ characters)
