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

## Deployment 

Deno is recommended for deploying the API. To deploy with Deno:

1. Set up your project on Deno Deploy.
2. Add your Supabase credentials as environment variables.
3. Deploy the API.

## Supabase

This project uses Supabase for the backend. You can sign up for a free account at [Supabase](https://supabase.io/).