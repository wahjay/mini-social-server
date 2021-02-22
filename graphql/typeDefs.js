const gql = require('graphql-tag');

// specify what to return from the query and mutation
module.exports = gql`
  type Post {
    id: ID!
    body: String!
    images: [File]!
    createdAt: String!
    username: String!
    comments: [Comment]!
    likes: [Like]!
    likeCount: Int!
    commentCount: Int!
  }

  type Comment {
    id: ID!
    body: String!
    username: String!
    createdAt: String!
  }

  type Like {
    id: ID!
    username: String!
    createdAt: String!
  }

  type User {
    id: ID!
    email: String!
    token: String!
    username: String!
    createdAt: String!
  }

  type File {
    mimetype: String!
    public_id: String
    url: String!
    mp4: String
    gif: String
  }

  input FileInput {
    mimetype: String!
    public_id: String
    url: String!
    mp4: String
    gif: String
  }

  input RegisterInput {
    username: String!
    password: String!
    confirmPassword: String!
    email: String!
  }

  type Query {
    getPosts: [Post]
    getPost(postId: ID!): Post
    fetchLikes(postId: ID!): Post!
  }

  type Mutation {
    register(registerInput: RegisterInput): User!
    login(username: String!, password: String!): User!
    createPost(body: String, images: [FileInput]): Post!
    deletePost(postId: ID!): String!
    likePost(postId: ID!): Post!
    createComment(postId: ID!, body: String!): Post!
    deleteComment(postId: ID!, commentId: ID!): Post!
    uploadPostImages(files: [Upload!]!): [File!]!
    deletePostImages(public_ids: [String!]!): String!
  }

  type Subscription {
    newPost(username: String!): Post!
    likeAdded(postId: ID!): Post!
  }
`;
