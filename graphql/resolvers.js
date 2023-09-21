const admin = require("../firebase_initialization");

const resolvers = {
  hello: (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }
    return "Hello, World!";
  },

  ///when user registers first time
  createUser: async (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }

    const { email, name, user_id, mobile, profile_image, gender, bio } =
      args.userInput;

    let userRecord; // Declare userRecord variable to be accessible outside the try block

    try {
      // Validate that all required fields are provided
      if (!email || !name || !user_id || !mobile || !gender || !profile_image) {
        throw new Error("All required fields must be provided.");
      }

      // Check if a document with the same user_id already exists in the Users collection
      const existingUserSnapshot = await admin
        .firestore()
        .collection("Users")
        .where("user_id", "==", user_id)
        .get();

      if (!existingUserSnapshot.empty) {
        throw new Error(
          "User with the same user_id already exists. Choose another user_id."
        );
      }

      const timestamp = new Date().toISOString();
      // Create a user document in Firestore
      const userData = {
        email,
        name,
        user_id,
        mobile,
        profile_image,
        gender,
        bio,
        timestamp,
      };

      // If Firestore document creation is successful, create the Firebase Authentication user
      userRecord = await admin.auth().getUserByEmail(email);

      // Attempt to create the Firestore document
      await admin
        .firestore()
        .collection("Users")
        .doc(userRecord.uid) // Use user_id as the Firestore document ID
        .set(userData);

      return {
        id: userRecord.uid,
        email: userRecord.email,
      };
    } catch (error) {
      // Handle and log errors
      console.error("Error in creating user:", error);

      // Delete the Firebase Authentication user if it was created
      if (userRecord && userRecord.uid) {
        await admin.auth().deleteUser(userRecord.uid);
      }

      throw error; // Re-throw the error to propagate it to the client
    }
  },

  ///when user makes a post
  createPost: async (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }

    const { prompt, category, description, output_url, public, ai_model_tags } =
      args.postInput;

    try {
      // Ensure that all required fields are provided
      if (!prompt || !category || !output_url) {
        throw new Error("All required fields must be provided.");
      }

      // Get the user's UID from the authenticated request
      const userUID = req.user.uid;

      // Reference to the user's "Posts" subcollection
      const initialRef = admin.firestore().collection("All_Posts").doc(userUID);
      await initialRef.set({
        id: userUID,
      }); ///dont keep document empty(if doc is empty issue arrises while deleting)

      // Reference to the user's "Posts" subcollection
      const userPostsCollectionRef = admin
        .firestore()
        .collection("All_Posts")
        .doc(userUID)
        .collection("Posts");

      const timestamp = new Date().toISOString();

      // Create a new post document with an auto-generated ID within the user's "Posts" subcollection
      const newPostRef = await userPostsCollectionRef.add({
        prompt,
        category,
        description,
        output_url,
        public,
        timestamp,
        ai_model_tags,
        timestamp,
      });

      // If successful, return the ID of the created post
      return {
        id: newPostRef.id,
      };
    } catch (error) {
      // Handle and log errors
      console.error("Error in creating post:", error);
      throw error; // Re-throw the error to propagate it to the client
    }
  },

  ///when someone comments on particular post
  createComment: async (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }

    const { post_user_id, post_document_id, comment } = args.commentInput;

    if (post_user_id === req.user.uid) {
      throw new Error("User can't comment on his own post");
    }

    try {
      // Ensure that all required fields are provided
      if (!post_user_id || !post_document_id || !comment) {
        throw new Error("All required fields must be provided.");
      }

      // Get the user's UID from the authenticated request
      const userUID = req.user.uid;

      // Reference to the user's post document
      const postRef = admin
        .firestore()
        .collection("All_Posts")
        .doc(post_user_id)
        .collection("Posts")
        .doc(post_document_id);

      const timestamp = new Date().toISOString();

      const initialRef = postRef.collection("All_Comments").doc(userUID);
      await initialRef.set({ id: userUID });

      // Create a new comment document with an auto-generated ID within the "Comments" subcollection
      const commentRef = await postRef
        .collection("All_Comments")
        .doc(userUID)
        .collection("Comments")
        .add({
          timestamp,
          comment,
        });

      // If successful, return the ID of the created comment
      return {
        id: commentRef.id,
        timestamp,
        comment,
      };
    } catch (error) {
      // Handle and log errors
      console.error("Error in creating comment:", error);
      throw error; // Re-throw the error to propagate it to the client
    }
  },

  ///when someone like particular post
  createLike: async (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }

    const { post_user_id, post_document_id } = args.likeInput;

    if (post_user_id === req.user.uid) {
      throw new Error("User can't like his own post");
    }

    try {
      // Get the user's UID from the authenticated request
      const userUID = req.user.uid;

      // Reference to the comment's "Likes" subcollection
      const likesCollectionRef = admin
        .firestore()
        .collection("All_Posts")
        .doc(post_user_id)
        .collection("Posts")
        .doc(post_document_id)
        .collection("Likes");

      // Check if the user has already liked the comment (optional)
      const existingLikeDoc = await likesCollectionRef.doc(userUID).get();
      if (existingLikeDoc.exists) {
        throw new Error("User has already liked this comment.");
      }

      // Fetch the user's user_id from the "Users" collection
      const userDoc = await admin
        .firestore()
        .collection("Users")
        .doc(userUID)
        .get();
      if (!userDoc.exists) {
        throw new Error("User not found in the Users collection.");
      }

      const user_id = userDoc.data().user_id; // Get the user_id

      // Add a new like document with the current timestamp and user_id
      const liked_at = new Date().toISOString();

      await likesCollectionRef.doc(userUID).set({
        liked_at,
        user_id, // Store the user_id
      });

      // Return the like document as part of the response
      return {
        id: userUID, // Use the user's UID as the like document ID
        liked_at,
        user_id, // Return the user_id
      };
    } catch (error) {
      // Handle and log errors
      console.error("Error in creating like:", error);
      throw error; // Re-throw the error to propagate it to the client
    }
  },

  createFollower: async (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }

    const { follower_uid } = args.followerInput;

    if (follower_uid === req.user.uid) {
      throw new Error("User can't follow himself");
    }

    try {
      // Get the UID of the user who is going to follow
      const userUID = req.user.uid;

      // Reference to the user's "User_Stat" document
      const userStatRef = admin
        .firestore()
        .collection("User_Stat")
        .doc(follower_uid);
      await userStatRef.set({id:follower_uid})

      // Reference to the "Followers" subcollection inside the "User_Stat" document
      const followersCollectionRef = userStatRef.collection("Followers");

      // Add new follower
      const following_from = new Date().toISOString();

      await followersCollectionRef.doc(userUID).set({
        following_from,
      });

      // Reference to the user going to follow someone
      const followedUserStatRef = admin
        .firestore()
        .collection("User_Stat")
        .doc(userUID);
      await followedUserStatRef.set({id:userUID});

      // Reference to the "Following" subcollection inside the followed user's "User_Stat" document
      const followingCollectionRef =
        followedUserStatRef.collection("Following");

      // Add a new document in P2's "Following" collection with the current timestamp
      await followingCollectionRef.doc(follower_uid).set({
        following_from,
      });

      return {
        id: userUID,
      };
    } catch (error) {
      // Handle and log errors
      console.error("Error in creating follower:", error);
      throw error; // Re-throw the error to propagate it to the client
    }
  },

  /// when user clicks on particular post
  getSinglePost: async (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }

    const { post_user_id, post_document_id } = args.singlePostInput;

    try {
      // Reference to the specific post document
      const postRef = admin
        .firestore()
        .collection("All_Posts")
        .doc(post_user_id)
        .collection("Posts")
        .doc(post_document_id);

      // Fetch the post document
      const postDoc = await postRef.get();

      if (!postDoc.exists) {
        throw new Error("Post not found.");
      }

      // Get the post data
      const post = postDoc.data();

      return {
        id: postDoc.id,
        ...post, // Include other post fields here
      };
    } catch (error) {
      // Handle and log errors
      console.error("Error in fetching single post:", error);
      throw error; // Re-throw the error to propagate it to the client
    }
  },

  /// when user goes to his profile ,get all user profile data
  getUser: async (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }

    const uid = req.user.uid;

    try {
      // Reference to the user document in Firestore using UID
      const userRef = admin.firestore().collection("Users").doc(uid);

      // Fetch the user document
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error("User not found.");
      }

      // Get the user data
      let userData = {
        id: userDoc.id,
        ...userDoc.data(), // Include other user fields here
      };

      return userData;
    } catch (error) {
      // Handle and log errors
      console.error("Error in fetching user:", error);
      throw error; // Re-throw the error to propagate it to the client
    }
  },

  /// all posts of particular user will be returned
  getMyPosts: async (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }

    // Get the user's UID from the authenticated request
    const userUID = req.user.uid;

    try {
      // Reference to the user's "Posts" subcollection
      const userPostsCollectionRef = admin
        .firestore()
        .collection("All_Posts")
        .doc(userUID)
        .collection("Posts");

      // Query documents and order them by the "timestamp" field in descending order
      const query = userPostsCollectionRef.orderBy("timestamp", "desc");

      // Execute the query
      const userPostsSnapshot = await query.get();

      // Map the user's posts to an array
      const userPosts = userPostsSnapshot.docs.map((postDoc) => ({
        id: postDoc.id,
        ...postDoc.data(),
      }));

      return userPosts;
    } catch (error) {
      // Handle and log errors
      console.error("Error in fetching user's posts:", error);
      throw error; // Re-throw the error to propagate it to the client
    }
  },

  /// in profile section when user want to update something
  updateUser: async (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }

    // Get the user's UID from the authenticated request
    const userUID = req.user.uid;

    try {
      // Reference to the user's document in Firestore
      const userDocRef = admin.firestore().collection("Users").doc(userUID);

      // Get the current user data
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        throw new Error("User not found.");
      }

      // Update the user fields if they are provided in the input
      const updateUserInput = args.updateUserInput;
      const updatedUserData = {};

      if (updateUserInput.name !== undefined) {
        updatedUserData.name = updateUserInput.name;
      }

      if (updateUserInput.mobile !== undefined) {
        updatedUserData.mobile = updateUserInput.mobile;
      }

      if (updateUserInput.gender !== undefined) {
        updatedUserData.gender = updateUserInput.gender;
      }

      if (updateUserInput.bio !== undefined) {
        updatedUserData.bio = updateUserInput.bio;
      }

      if (updateUserInput.profile_image !== undefined) {
        updatedUserData.profile_image = updateUserInput.profile_image;
      }

      // Update the user data in Firestore
      await userDocRef.update(updatedUserData);

      // Return the updated user data
      return {
        id: userUID,
        ...updatedUserData,
      };
    } catch (error) {
      // Handle and log errors
      console.error("Error in updating user:", error);
      throw error; // Re-throw the error to propagate it to the client
    }
  },

  /// when user wants to unfollow someone
  unfollowUser: async (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }

    const { user_id_to_unfollow } = args.unfollowInput;
    const userUID = req.user.uid;

    try {
      // Reference to the user's "User_Stat" document
      const userStatRef = admin
        .firestore()
        .collection("User_Stat")
        .doc(userUID);

      // Reference to the "Following" subcollection inside the user's "User_Stat" document
      const followingCollectionRef = userStatRef.collection("Following");

      // Reference to the followed user's "User_Stat" document
      const followedUserStatRef = admin
        .firestore()
        .collection("User_Stat")
        .doc(user_id_to_unfollow);

      // Reference to the "Followers" subcollection inside the followed user's "User_Stat" document
      const followersCollectionRef =
        followedUserStatRef.collection("Followers");

      // Remove the follower from the user's "Following" subcollection
      await followingCollectionRef.doc(user_id_to_unfollow).delete();

      // Remove the user from the followed user's "Followers" subcollection
      await followersCollectionRef.doc(userUID).delete();

      return {
        id: userUID,
        message: `You have unfollowed user with user_id: ${user_id_to_unfollow}`,
      };
    } catch (error) {
      // Handle and log errors
      console.error("Error in unfollowing user:", error);
      throw error; // Re-throw the error to propagate it to the client
    }
  },

  /// when user wants to remove like from the post he liked
  // Resolver for removing a like from a post
  removeLike: async (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }

    const { post_user_id, post_document_id } = args.likeInput;
    const userUID = req.user.uid;

    try {
      // Reference to the comment's "Likes" subcollection
      const likesCollectionRef = admin
        .firestore()
        .collection("All_Posts")
        .doc(post_user_id)
        .collection("Posts")
        .doc(post_document_id)
        .collection("Likes");

      // Check if the user has liked the post
      const existingLikeDoc = await likesCollectionRef.doc(userUID).get();

      if (!existingLikeDoc.exists) {
        throw new Error("User has not liked this post.");
      }

      // Remove the like document
      await likesCollectionRef.doc(userUID).delete();

      return {
        post_document_id, // Include the post_document_id in the response
        message: "Like removed successfully.",
      };
    } catch (error) {
      // Handle and log errors
      console.error("Error in removing like:", error);
      throw error; // Re-throw the error to propagate it to the client
    }
  },

  // Resolver for deleting a post
  deletePost: async (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }

    const { post_user_id, post_document_id } = args.deletePostInput;
    console.log("pdi", post_document_id);

    if (post_user_id !== req.user.uid) {
      throw new Error("You can only delete your own posts");
    }

    try {
      // Get references to the post, comments, and likes
      const postRef = admin
        .firestore()
        .collection("All_Posts")
        .doc(post_user_id)
        .collection("Posts")
        .doc(post_document_id);

      const commentsRef = postRef.collection("All_Comments");
      const likesRef = postRef.collection("Likes");

      // Delete the post document
      await postRef.delete();

      // Delete the associated comments
      const commentDocs = await commentsRef.get();
      const commentDeletionPromises = [];

      commentDocs.forEach(async (commentDoc) => {
        const subCommentsRef = commentDoc.ref.collection("Comments");
        const subCommentDocs = await subCommentsRef.get();

        // Delete the comments within the subcollection
        subCommentDocs.forEach((subCommentDoc) => {
          commentDeletionPromises.push(subCommentDoc.ref.delete());
        });

        // Delete the main comment document
        commentDeletionPromises.push(commentDoc.ref.delete());
      });

      // Delete the likes
      const likeDocs = await likesRef.get();
      const likeDeletionPromises = [];
      likeDocs.forEach((doc) => {
        likeDeletionPromises.push(doc.ref.delete());
      });

      // Wait for all deletions to complete
      await Promise.all(commentDeletionPromises);
      await Promise.all(likeDeletionPromises);

      return {
        post_document_id: post_document_id,
        message: "Post, comments, and likes have been deleted successfully",
      };
    } catch (error) {
      console.error("Error in deleting post:", error);
      throw error;
    }
  },

  //Resolver for deleting comment
  deleteComment: async (args, req) => {
    if (!req.user) {
      throw new Error("Authentication required to access this resource");
    }
  
    const { post_user_id, post_document_id, comment_id } = args.deleteCommentInput;
  
    try {
      // Get the user's UID from the authenticated request
      const userUID = req.user.uid;
  
      // Reference to the user's post document
      const postRef = admin
        .firestore()
        .collection("All_Posts")
        .doc(post_user_id)
        .collection("Posts")
        .doc(post_document_id);
      console.log("uid",userUID)
  
      // Reference to the comment document to be deleted
      const commentRef = postRef
        .collection("All_Comments")
        .doc(userUID)
        .collection("Comments")
        .doc(comment_id);
  
      // Check if the comment exists
      const commentDoc = await commentRef.get();
      if (!commentDoc.exists) {
        throw new Error("Comment not found");
      }
  
      // Delete the comment document
      await commentRef.delete();
  
      return {
        id: comment_id,
        message: "Comment has been deleted successfully",
      };
    } catch (error) {
      // Handle and log errors
      console.error("Error in deleting comment:", error);
      throw error; // Re-throw the error to propagate it to the client
    }
  },
  
};

module.exports = resolvers;
