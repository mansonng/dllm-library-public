import { auth } from "../firebase";
import * as config from "../dllm-client-config.json";

const graphqlUrl = String(config.graphql || "");
const apiBaseUrl = graphqlUrl.replace(/\/graphql\/?$/, "");

async function postVerification(path: string, body?: Record<string, unknown>) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in first");

  const token = await user.getIdToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body || {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success !== true) {
    throw new Error(payload?.error || "Email verification failed");
  }

  return true;
}

export async function requestEmailVerificationCode() {
  return postVerification("/email-verification/request");
}

export async function confirmEmailVerificationCode(code: string) {
  await postVerification("/email-verification/confirm", { code });
  await auth.currentUser?.getIdToken(true);
  return true;
}

export function openEmailVerificationDialog() {
  window.dispatchEvent(new CustomEvent("bookguide:email-verification-required"));
}
