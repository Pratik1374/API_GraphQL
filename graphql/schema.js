const { buildSchema } = require("graphql");

const schema = buildSchema(`
  type User {
    id: String!
    email: String!
    name: String!
    user_id: String!
    mobile: String
    profile_image: String!
    gender: String
    bio: String
  }
  
  input UserInput {
    email: String!
    name: String!
    user_id: String!
    mobile: String
    profile_image: String!
    gender: String
    bio: String
  }

  type Post {
    id: ID
    prompt: String
    category: String
    description: String
    output_url: String
    public: Boolean
    timestamp: String
    ai_model_tags: [String]
  }

  input PostInput {
    prompt: String!
    category: String!
    description: String
    output_url: String!
    public: Boolean!
    timestamp: String!
    ai_model_tags: [String]
  }

  type Comment {
    id: ID!
    timestamp: String!
    comment: String!
  }

  input CommentInput {
    post_user_id: String!  # The UID of the user who posted the original post
    post_document_id: String!  # The document ID of the post being commented on
    comment: String!
    timestamp: String!  # You can use a scalar like String or DateTime for timestamps
  }

  type Like {
    id: ID!
    liked_at: String!
    user_id: String!
  }
  
  input LikeInput {
    post_user_id: String!  # The UID of the user who posted the original post
    post_document_id: String!  # The document ID of the post being commented on
  }

  type UserStat {
    id: String!
  }
  
  input FollowerInput {
    follower_uid: String!  # UID of user to whom this user wants to follow
  }

  input GetSinglePostInput {
    post_user_id: String!
    post_document_id: String!
  }

  input UpdateUserInput {
    name: String
    mobile: String
    profile_image: String
    gender: String
    bio: String
  }
  

  type RootQuery {
    hello: String
    getSinglePost(singlePostInput: GetSinglePostInput): Post
    getUser: User
    getMyPosts: [Post]
  }
  
  type RootMutation {
    createUser(userInput: UserInput): User
    createPost(postInput: PostInput): User
    createComment(commentInput: CommentInput): Comment
    createLike(likeInput: LikeInput): Like
    createFollower(followerInput: FollowerInput): UserStat
    updateUser(updateUserInput: UpdateUserInput): User
  }
  
  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);

module.exports = schema;
