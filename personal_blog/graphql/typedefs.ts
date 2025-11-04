import { gql } from "graphql_tag";

export const typeDefs = gql`
  type Post {
    id: ID!
    title: String!
    content: String!
    author: String
    publish_date: String
  }

  type Query {
    posts: [Post]
    post(id: ID!): Post
    trophies(username: String!): String
  }

  type Mutation {
    createPost(title: String!, content: String!, author: String): Post
    updatePost(id: ID!, title: String, content: String, author: String): Post
    deletePost(id: ID!): Post
  }
`;