const { AuthenticationError, UserInputError } = require('apollo-server');

const Post = require('../../models/Post');
const { checkAuth } = require('../../util/checkAuth');

module.exports = {
  Mutation: {
    createComment: async (parent, { postId, body }, context) => {
      // check if user is authenticated
      const { username } = checkAuth(context);
      // check if the comment is valid
      if(body.trim() === '') {
        throw new UserInputError('Empty comment', {
          errors: {
            body: 'Comment can not be empty'
          }
        });
      }

      // find the post and add the comment
      const post = await Post.findById(postId);
      if(post) {
          post.comments.unshift({
            body,
            username,
            createdAt: new Date().toISOString()
          });

          await post.save();
          return post;
      }
      else throw new UserInputError('Post not found');
    },

    deleteComment: async (parent, { postId, commentId }, context) => {
      const { username } = checkAuth(context);

      const post = await Post.findById(postId);
      if(post) {
        const commentIndex = post.comments.findIndex(comment => comment.id === commentId);
        if(commentIndex === -1) {
          throw new UserInputError('Comment not found');
        }

        // make sure this comment belongs to the user
        if(post.comments[commentIndex].username === username) {
          // remove the comment
          post.comments.splice(commentIndex, 1);
          // update the post
          await post.save();
          return post;
        }
        else throw new AuthenticationError('Unauthorized action');
      }
      else throw new UserInputError('Post not found');
    }
  }
}
