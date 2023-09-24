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
    timestamp: String
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
    id: ID!
    prompt: String!
    category: String!
    description: String!
    output_url: String!
    public: Boolean!
    timestamp: String!
    ai_model_tags: [String]
    creator_id: String!
  }

  input PostInput {
    prompt: String!
    category: String!
    description: String
    output_url: String!
    public: Boolean!
    ai_model_tags: [String]
  }

  type Comment {
    id: ID!
    timestamp: String!
    comment: String!
    commenter_id: String!
  }

  input CommentInput {
    post_user_id: String!  # The UID of the user who posted the original post
    post_document_id: String!  # The document ID of the post being commented on
    comment: String!
  }

  type Like {
    id: ID!
    timestamp: String!
    user_id: String!
  }
  
  input LikeInput {
    post_user_id: String!  # The UID of the user who posted the original post
    post_document_id: String!  # The document ID of the post being commented on
  }

  type UserStat {
    id: String!
    user_id: String!
  }
  
  input FollowerInput {
    follower_uid: String!  # UID of user to whom this user wants to follow
  }

  input GetSinglePostInput {
    post_document_id: String!
  }

  input UpdateUserInput {
    name: String
    mobile: String
    profile_image: String
    gender: String
    bio: String
  }

  input UnfollowInput {
    user_id_to_unfollow: String!
  }
  
  type UnfollowResponse {
    id: String! # ID of the user performing the unfollow operation
    message: String! # A message indicating the result of the unfollow operation
  }
  
  type RemoveLikeResponse {
    post_document_id: String!
    message: String!
  }  

  input DeletePostInput {
    post_user_id: String!
    post_document_id: String!
  }

  type DeletePostResponse {
    post_document_id: String!
    message: String!
  }

  input DeleteCommentInput {
    post_document_id: ID!
    comment_id: ID!
  }
  
  type DeleteCommentResponse {
    id: ID!
    message: String!
  }

  type GetPostResponse {
    id: ID
    prompt: String
    category: String
    description: String
    output_url: String
    public: Boolean
    timestamp: String
    ai_model_tags: [String]
    creator_id: String
  }

  type RootQuery {
    hello: String
    getSinglePost(singlePostInput: GetSinglePostInput): Post
    getUser: User
    getMyPosts: [Post]
    getPostsByCreation: [GetPostResponse]
  }
  
  type RootMutation {
    createUser(userInput: UserInput): User
    createPost(postInput: PostInput): User
    createComment(commentInput: CommentInput): Comment
    createLike(likeInput: LikeInput): Like
    createFollower(followerInput: FollowerInput): UserStat
    updateUser(updateUserInput: UpdateUserInput): User
    unfollowUser(unfollowInput: UnfollowInput!): UnfollowResponse
    removeLike(likeInput: LikeInput!): RemoveLikeResponse
    deletePost(deletePostInput: DeletePostInput!): DeletePostResponse
    deleteComment(deleteCommentInput: DeleteCommentInput!): DeleteCommentResponse
  }
  
  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);

module.exports = schema;
