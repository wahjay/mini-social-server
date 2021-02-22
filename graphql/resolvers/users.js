const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserInputError } = require('apollo-server');

const { validateRegisterInput, validateLoginInput } = require('../../util/validators');
const { SECRET_KEY } = require('../../config');
const User = require('../../models/User');

const generateToken = (user) => {
  return jwt.sign({
    id: user.id,
    email: user.email,
    username: user.username
  }, SECRET_KEY);
}


module.exports = {
  Mutation: {
    // resolver for handling user register.
    async register(parent,
      { registerInput: { username, email, password, confirmPassword } }, context, info) {
      // Validate user input
      const { valid, errors } = validateRegisterInput(username, email, password, confirmPassword);
      if(!valid) {
          throw new UserInputError('Invalid input', { errors });
      }

      // Make sure user doesnt already exist in the database
      const user = await User.findOne({ username });
      if(user) {
          // (message, payload)
          throw new UserInputError('Username is taken', {
            errors: {
              username: 'This username is taken'
            }
          });
      }

      // Make sure email hasn't already been taken
      const sameEmail = await User.findOne({ email });
      if(sameEmail) {
          throw new UserInputError('Email is taken', {
            errors: {
              email: 'This email is taken'
            }
          });
      }

      // hash the password
      password = await bcrypt.hash(password, 12);

      // create a new user object
      const newUser = new User({
        email,
        username,
        password,
        createdAt: new Date().toISOString()
      });

      // save the new user object
      const res = await newUser.save();

      // create a token for the new user
      const token = generateToken(res);

      // return the user info along with the token
      return {
        ...res._doc,
        id: res._id,
        token
      };
    },

    async login(parent, { username, password }, context, info) {
      // validate user login input
      const { valid, errors } = validateLoginInput(username, password);
      if(!valid) {
        throw new UserInputError('Invalid input', { errors });
      }

      // check if user exists
      const user = await User.findOne({ username });
      if(!user) {
        errors.general = 'User not found';
        throw new UserInputError('User not found', { errors });
      }

      // check if password is correct
      const match = await bcrypt.compare(password, user.password);
      if(!match) {
        errors.general = 'Wrong credentials';
        throw new UserInputError('Wrong credentials', { errors });
      }

      // generate token for the authenticated user
      const token = generateToken(user);

      return {
        ...user._doc,
        id: user._id,
        token
      };
    }
  }
}
