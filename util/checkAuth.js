const { AuthenticationError } = require('apollo-server');
const jwt = require('jsonwebtoken');

const { SECRET_KEY } = require('../config');

const checkAuth = (context) => {
  // 'Authorization: Bearer <token>' in the req header
  const authHeader = context.req.headers.authorization;
  if(authHeader) {
    const token = authHeader.split('Bearer ')[1];
    if(token) {
      try {
        // verify the token
        const user = jwt.verify(token, SECRET_KEY);
        return user;
      } catch(err) {
        throw new AuthenticationError('Invalid/Expired token');
      }
    }
    throw new Error('Authorization token must be \'Bearer [token]');
  }

  throw new Error('Authorization header must be provided');
}

const validateToken = authToken => {
  return new Promise((resolve, reject) => {
    try {
      const user = jwt.verify(authToken, SECRET_KEY);
      resolve(user);
    } catch(err) {
      reject(new AuthenticationError('Invalid/Expired token'));
    }
  });
};

module.exports = {
  checkAuth,
  validateToken
}
