// Keep in sync with personal_site/src/app/graphql/schema.graphql (authoritative contract).

export const typeDefs = /* GraphQL */ `
  type Mutation {
    createPost(
      title: String!
      slug: String!
      content: String!
      excerpt: String
      author: String
      published: Boolean
      tags: [String!]
      hero_image_url: String
    ): Post
    updatePost(
      id: ID!
      title: String
      slug: String
      content: String
      excerpt: String
      author: String
      published: Boolean
      tags: [String!]
      hero_image_url: String
    ): Post
    deletePost(id: ID!): Post
  }

  type Post {
    id: ID!
    title: String!
    slug: String!
    content: String!
    excerpt: String
    author: String
    publish_date: String
    updated_at: String
    published: Boolean!
    tags: [String!]
    hero_image_url: String
  }

  type Query {
    posts(publishedOnly: Boolean): [Post]
    post(id: ID!): Post
    postBySlug(slug: String!): Post
    trophies(username: String!): String
  }
`;
