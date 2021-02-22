const { ApolloServer, PubSub } = require('apollo-server');
const mongoose = require('mongoose');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { MONGODB } = require('./config');

const { checkAuth, validateToken } = require('./util/checkAuth');

const GRAPHQL_PORT = process.env.PORT || 5000;

const pubsub = new PubSub();
//pubsub.ee.setMaxListeners(72); // raise max listeners in event emitter

// A value which is provided to every resolver and holds
// important contextual information like the currently logged in user
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req, pubsub }),
  subscriptions: {
    onConnect: async (connectionParams, webSocket) => {
      if(!connectionParams || Object.keys(connectionParams).length === 0) return;

      if (connectionParams.authToken) {
        return await validateToken(connectionParams.authToken)
          .then(user => { currentUser: user })
          .catch(err => { throw new Error(`Wrong Credential. ${err}`)});
      }

      throw new Error('Missing auth token! / Subscription can only be sent through the frontend.');
    },
    onDisconnect: (websocket, context) => {
        context.initPromise
        .then(res => console.log(res))
        .catch(err => console.log(err))
    }
  },
});

// connect to mongoDB and start up the apollo server
mongoose.connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
     console.log('Connected to MongoDB successfully.');
     return server.listen({ port: GRAPHQL_PORT });
  })
  .then(res => {
    console.log(`🚀 Server ready at ${res.url}`);
    console.log(`🚀 Subscriptions ready at ${res.subscriptionsUrl}`);
  });
