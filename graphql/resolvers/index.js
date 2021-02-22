const postsResolvers = require('./posts');
const usersResolvers = require('./users');
const commentsResolvers = require('./comments');

// combine all the resolvers into one
module.exports = {
  // for each query, mutation, subscription,
  // they will go through this modifier as well,
  // so we can update the likeCount and commentCount dynamically
  // parent: the previous resolver in the resolver chain
  // so parent holds the lastest change we made to a post
  Post: {
    likeCount: (parent) => parent.likes.length,
    commentCount: (parent) => parent.comments.length
  },

  Query: {
    ...postsResolvers.Query
  },

  Mutation: {
    ...usersResolvers.Mutation,
    ...postsResolvers.Mutation,
    ...commentsResolvers.Mutation
  },

  Subscription: {
    ...postsResolvers.Subscription
  }
};
