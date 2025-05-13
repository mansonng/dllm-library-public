import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Replace with your Firebase project config
  apiKey: 'AIzaSyCIytW9QU19vESoyJPO4xYaqtx-R5KC27c',
  authDomain: 'dllm-libray.web.app',
  projectId: 'dllm-libray',
  storageBucket: 'gs://dllm-libray.firebasestorage.app',
//  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'dllm-libray',
};


const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized:', app.name);

export const auth = getAuth(app);
