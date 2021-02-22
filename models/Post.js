const { model, Schema } = require('mongoose');

// No need to specify that the field is required,
// because this will be handled at the graphql layer,
// not at the mongoDB layer.
const postSchema = new Schema({
    body: String,
    username: String,
    createdAt: String,
    images: [
      {
        public_id: String,
        url: String,
        gif: String,
        mimetype: String,
        mp4: String,
      }
    ],
    comments: [
      {
        body: String,
        username: String,
        createdAt: String
      }
    ],
    likes: [
      {
        username: String,
        createdAt: String,
      }
    ],
    // reference to user's objectId (like foreign key)
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users'
    }
});

module.exports = model('Post', postSchema);
