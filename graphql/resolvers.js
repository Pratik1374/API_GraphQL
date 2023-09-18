const admin = require("../firebase_initialization");

const resolvers = {
  hello: (args,req) => {
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
  
    const {
      email,
      name,
      user_id,
      mobile,
      profile_image,
      gender,
      bio,
    } = args.userInput;
  
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
  
      // Create a user document in Firestore
      const userData = {
        email,
        name,
        user_id,
        mobile,
        profile_image,
        gender,
        bio,
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
  
    const {
      prompt,
      category,
      description,
      output_url,
      public,
      timestamp,
      ai_model_tags,
    } = args.postInput;
  
    try {
      // Ensure that all required fields are provided
      if (!prompt || !category || !output_url || !timestamp) {
        throw new Error("All required fields must be provided.");
      }
  
      // Get the user's UID from the authenticated request
      const userUID = req.user.uid;
  
      // Reference to the user's "Posts" subcollection
      const userPostsCollectionRef = admin
        .firestore()
        .collection("All_Posts")
        .doc(userUID)
        .collection("Posts");
  
      // Create a new post document with an auto-generated ID within the user's "Posts" subcollection
      const newPostRef = await userPostsCollectionRef.add({
        prompt,
        category,
        description,
        output_url,
        public,
        timestamp,
        ai_model_tags,
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
  
    const { post_user_id, post_document_id, comment, timestamp } = args.commentInput;
  
    try {
      // Ensure that all required fields are provided
      if (!post_user_id || !post_document_id || !comment || !timestamp) {
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
  
      // Create a new comment document with an auto-generated ID within the "Comments" subcollection
      const commentRef = await postRef.collection("All_Comments").doc(userUID).collection("Comments").add({
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
      const userDoc = await admin.firestore().collection("Users").doc(userUID).get();
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
  
    try {
      // Get the UID of the user who is going to follow
      const userUID = req.user.uid;
  
      // Reference to the user's "User_Stat" document
      const userStatRef = admin.firestore().collection("User_Stat").doc(follower_uid);
  
      // Reference to the "Followers" subcollection inside the "User_Stat" document
      const followersCollectionRef = userStatRef.collection("Followers");
  
      // Add new follower
      const following_from = new Date().toISOString();
  
      await followersCollectionRef.doc(userUID).set({
        following_from,
      });
  
      // Reference to the user going to follow someone
      const followedUserStatRef = admin.firestore().collection("User_Stat").doc(userUID);
  
      // Reference to the "Following" subcollection inside the followed user's "User_Stat" document
      const followingCollectionRef = followedUserStatRef.collection("Following");
  
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
  }
  

  
};

module.exports = resolvers;
