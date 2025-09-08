import { initializeApp } from "firebase/app";
import { getAuth, sendEmailVerification } from "firebase/auth";
import * as config from "./dllm-client-config.json";

const firebaseConfig = config;

const app = initializeApp(firebaseConfig);
console.log("Firebase app initialized:", app.name);

export const auth = getAuth(app);

export async function sendVerificationEmail() {
  const user = auth.currentUser;
  if (user) {
    return sendEmailVerification(user);
  }
}
