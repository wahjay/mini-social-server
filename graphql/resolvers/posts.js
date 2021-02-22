require('dotenv').config();
const { AuthenticationError, UserInputError, withFilter } = require('apollo-server');
const cloudinary = require('cloudinary').v2;

const Post = require('../../models/Post');
const { checkAuth } = require('../../util/checkAuth');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
})

// subscription events
const LIKE_ADDED = 'LIKE_ADDED';
const NEW_POST = 'NEW_POST';


module.exports = {
  Query: {
    async getPosts() {
      try {
        // fetch all the posts and order them from latest to oldest
        const posts = await Post.find().sort({ createdAt: 'desc' });
        return posts;
      } catch (err) {
        throw new Error(err);
      }
    },

    async getPost(parent, { postId }) {
      try {
        const post = await Post.findById(postId);
        if(post) {
          return post;
        }
        else {
          throw new Error('Post Not Found');
        }
      } catch (err) {
        throw new Error(err);
      }
    },

    async fetchLikes(parent, { postId }) {
      //return await getPost(parent, { postId });

      try {
        const post = await Post.findById(postId);
        if(post) {
          return post;
        }
        else {
          throw new Error('Post Not Found');
        }
      } catch (err) {
        throw new Error(err);
      }

    }
  },

  Mutation: {
    async createPost(parent, { body, images }, context) {
      const user = checkAuth(context);
      // no need to check if user is valid at this point,
      // if not, it will be thrown in checkAuth()

      if(body.trim() === '' && images.length === 0) {
        throw new UserInputError('Post body cannot be empty');
      }

      const newPost = new Post({
        username: user.username,
        user: user.id,
        body,
        images,
        createdAt: new Date().toISOString()
      });

      const post = await newPost.save();
      context.pubsub.publish(NEW_POST, { newPost: post });
      return post;
    },

    async deletePost(parent, { postId }, context) {
      const user = checkAuth(context);

      // make sure the post to be deleted exists
      const post = await Post.findById(postId);
      if(!post) {
        throw new UserInputError('Post Not Found');
      }

      // make sure the user owns this post
      if(user.username !== post.username) {
        throw new AuthenticationError('Unauthorized action');
      }

      // delete the post
      const res = await post.delete();
      return 'Post has been successfully deleted';
    },

    async likePost(parent, { postId }, context) {
      const { username } = checkAuth(context);

      // make sure the post to be liked exists
      const post = await Post.findById(postId);
      if(!post) {
        throw new UserInputError('Post Not Found');
      }

      const likeIndex = post.likes.findIndex(like => like.username === username);
      if(likeIndex >= 0) {
        // the post has been liked by this user, unlike it
        post.likes.splice(likeIndex, 1);
      }
      else {
        // first like
        post.likes.unshift({
          username,
          createdAt: new Date().toISOString()
        });
      }

      // update post
      await post.save();
      context.pubsub.publish(LIKE_ADDED, { likeAdded: post });
      return post;
    },

    async uploadPostImages(parent, { files }, context) {
      const { username } = checkAuth(context);

      const upload_file = async (file) => {
        const { mimetype, createReadStream } = await file;
        const stream = createReadStream();

        return await new Promise((resolve, reject) => {
          let _file = { mimetype };
          const options = {
            folder: "post_images",
          };

          const streamLoad = cloudinary.uploader.upload_stream(options, (err, res) => {
              if(err) {
                reject(err);
              }
              else if(res) {
                //_file.url = res.eager[0].secure_url;
                _file.url = res.secure_url;
                _file.public_id = res.public_id;
                resolve(_file);
              }
          });

          // take a readable stream and connect it to a writeable steam
          stream.pipe(streamLoad);
        });
      }

      return Promise.all(files.map(file => upload_file(file)))
        .then(res => { return res })
        .catch(err => { throw new Erorr(`Failed to upload images. Error: ${err}`) });
    },

    async deletePostImages(parent, { public_ids }, context) {
      const { username } = checkAuth(context);
      const pro = public_ids.map(id => cloudinary.uploader.destroy(id));
      return Promise.all(pro)
              .then(res => 'Images has been successfully deleted.')
              .catch(err => { throw new Error(`Failed to delete images. Error: ${err}`) });
    }
  },

  Subscription: {
    newPost: {
      // _1: dont care #1, _2: dont care #2
      subscribe:
        withFilter((_1, _2, { pubsub }) => pubsub.asyncIterator(NEW_POST),
          (payload, { username }) => {
            // let other users know except the user who create this post
            return payload.newPost.username !== username;
          }
        )
    },

    likeAdded: {
      subscribe:
        withFilter((_1, _2, { pubsub }) => pubsub.asyncIterator(LIKE_ADDED),
          (payload, { postId }) => {
            // only return the post info whose id === the given id
            return payload.likeAdded._id.toString() === postId;
          }
        )
    }
  }
};
