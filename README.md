# Personal Blog API

This is the API for the Personal Blog project, built with TypeScript and using Supabase for the backend.

## Prerequisites

- Node.js
- npm or yarn
- Deno (if deploying with Deno)
- Supabase account

## Setup

1. Clone the repository:

    ```sh
    git clone https://github.com/yourusername/personal_blog.git
    cd personal_blog
    ```

2. Install dependencies:

    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add your Supabase credentials:

    ```dotenv
    SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4. Load environment variables:

    ```typescript
    import { config } from "dotenv";
    config();
    ```

## Usage

To start the development server:

```sh
npm run dev
```

### Running with Deno

To run the server locally in development mode:

```sh
cd personal_blog
deno task dev
```

This will run the server with file watching enabled.

### Environment Variables

Ensure you have a `.env` file in the `personal_blog` directory with the following variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `APOLLO_KEY` (for Apollo Studio reporting)
- `APOLLO_GRAPH_REF` (for Apollo Studio reporting)

### Apollo Studio Schema Reporting

This project uses `ApolloServerPluginSchemaReporting` to automatically push schema changes to Apollo Studio.

When running in development mode (`deno task dev`):
1. The server watches for file changes.
2. When you modify `graphql/typedefs.ts`, the server restarts.
3. The new schema is automatically reported to Apollo Studio on startup.

You can view your graph at: https://studio.apollographql.com/graph/Joshua-Sevys-Team@current/

## Deployment

Deno is recommended for deploying the API. To deploy with Deno:

1. Set up your project on Deno Deploy.
2. Add your Supabase credentials as environment variables.
3. Deploy the API.

## Supabase

This project uses Supabase for the backend. You can sign up for a free account at [Supabase](https://supabase.io/).
