import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as serviceWorker from './serviceWorker';
import './index.css';
import client from './apollo';
import {
  split,
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  ApolloProvider
} from "@apollo/client";

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App/>
    </ApolloProvider>
  </React.StrictMode>
);

// Register the Service Worker for PWA features
serviceWorker.register({
  onSuccess: () => console.log('Service Worker registered successfully'),
  onUpdate: (registration) => {
    console.log('New Service Worker version available');
    // Optionally prompt user to reload
    const waitingWorker = registration.waiting;
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  },
});