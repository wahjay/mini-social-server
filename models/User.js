const { model, Schema } = require('mongoose');

// No need to specify that the field is required,
// because this will be handled at the graphql layer,
// not at the mongoDB layer.
const userSchema = new Schema({
    username: String,
    password: String,
    email: String,
    createdAt: String,
});

module.exports = model('User', userSchema);
