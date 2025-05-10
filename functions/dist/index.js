"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
//import { useServer } from 'graphql-ws/use/ws';
const schema_1 = require("@graphql-tools/schema");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const resolver_1 = require("./resolver");
const fs_1 = require("fs");
const typeDefs = (0, fs_1.readFileSync)("./schema.graphql", { encoding: "utf-8" });
const PORT = process.env.PORT || 4000;
async function startApolloServer() {
    const app = (0, express_1.default)();
    /*
  app.use(
    '/',
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization || '';
        let user = null;
        if (token) {
          try {
            // Replace with admin.auth().verifyIdToken(token) for production
            user = { uid: 'sample-uid', email: 'user@example.com' };
          } catch (error) {
            console.error('Auth error:', error);
          }
        }
        return { user };
      },
    })
  );*/
    const httpServer = http_1.default.createServer(app);
    const schema = (0, schema_1.makeExecutableSchema)({ typeDefs, resolvers: resolver_1.resolvers });
    /*
    // Creating the WebSocket server
    const wsServer = new WebSocketServer({
        // This is the `httpServer` we created in a previous step.
        server: httpServer,
        // Pass a different path here if app.use
        // serves expressMiddleware at a different path
        //path: '/subscriptions',
    });
    // Hand in the schema we just created and have the
    // WebSocketServer start listening.
    const serverCleanup = useServer({ schema }, wsServer);
    */
    const server = new server_1.ApolloServer({
        schema,
        plugins: [
            (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
            // Proper shutdown for the WebSocket server.
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                        },
                    };
                },
            },
        ],
    });
    await server.start();
    app.use('/graphql', (0, cors_1.default)(), express_1.default.json(), 
    /*
    expressMiddleware(server, {
        context: async ({ req }) => ({ token: req.headers.token }),
    })
    */
    (0, express4_1.expressMiddleware)(server, {
        context: async ({ req }) => {
            const token = req.headers.authorization || '';
            let user = null;
            if (token) {
                try {
                    // Replace with admin.auth().verifyIdToken(token) for production
                    user = { uid: 'sample-uid', email: 'user@example.com' };
                }
                catch (error) {
                    console.error('Auth error:', error);
                }
            }
            return { user };
        },
    }));
    await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    return { server, app };
}
startApolloServer();
