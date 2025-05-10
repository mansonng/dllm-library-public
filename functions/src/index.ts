import * as functions from 'firebase-functions';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { WebSocketServer } from 'ws';
//import { useServer } from 'graphql-ws/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import http from 'http';
import cors from 'cors';
import { resolvers } from './resolver';
import { readFileSync } from "fs";

const typeDefs = readFileSync("./schema.graphql", { encoding: "utf-8" });

const PORT = process.env.PORT || 4000;

async function startApolloServer() {
    const app = express();
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
    const httpServer = http.createServer(app);
    const schema = makeExecutableSchema({ typeDefs, resolvers });
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
    const server = new ApolloServer({
        schema,
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
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
    app.use(
        '/graphql',
        cors<cors.CorsRequest>(),
        express.json(),
        /*
        expressMiddleware(server, {
            context: async ({ req }) => ({ token: req.headers.token }),
        })
        */
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
        }));

    await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    return { server, app };
}

startApolloServer();