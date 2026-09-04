import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { db, LoginUser, sendEmailWithOptions } from "./platform";

const userCollection = db.collection("users");

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

type EmailVerificationState = {
  codeHash: string;
  salt: string;
  expiresAt: Timestamp;
  attempts: number;
  lastSentAt: Timestamp;
};

function hashCode(code: string, salt: string): Buffer {
  return scryptSync(code, salt, 32);
}

export class EmailVerificationService {
  async requestCode(loginUser: LoginUser | null): Promise<boolean> {
    if (!loginUser) throw new Error("Not authenticated");
    if (!loginUser.email) throw new Error("Authenticated account has no email");

    const userRef = userCollection.doc(loginUser.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new Error("User profile not found");
    }

    const userData = userDoc.data() as {
      isVerified?: boolean;
      emailVerification?: EmailVerificationState;
    };

    if (userData.isVerified) return true;

    const previous = userData.emailVerification;
    if (
      previous?.lastSentAt &&
      Date.now() - previous.lastSentAt.toMillis() < OTP_RESEND_COOLDOWN_MS
    ) {
      throw new Error("Please wait before requesting another verification code");
    }

    const code = randomInt(0, 10 ** OTP_LENGTH)
      .toString()
      .padStart(OTP_LENGTH, "0");
    const salt = randomBytes(16).toString("hex");
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(Date.now() + OTP_TTL_MS);
    const codeHash = hashCode(code, salt).toString("hex");

    await userRef.update({
      emailVerification: {
        codeHash,
        salt,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
      },
    });

    try {
      await sendEmailWithOptions({
        to: [loginUser.email],
        subject: "Your BookGuide verification code",
        text: `Your BookGuide verification code is ${code}.\n\nThis code expires in 10 minutes. If you did not request this code, you can ignore this email.`,
      });
    } catch (error) {
      // Do not leave the user stuck behind the resend cooldown when delivery
      // itself failed.
      await userRef.update({ emailVerification: FieldValue.delete() });
      throw error;
    }

    return true;
  }

  async confirmCode(
    loginUser: LoginUser | null,
    code: string,
  ): Promise<boolean> {
    if (!loginUser) throw new Error("Not authenticated");
    if (!/^\d{6}$/.test(code)) {
      throw new Error("Verification code must be 6 digits");
    }

    const userRef = userCollection.doc(loginUser.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User profile not found");

    const userData = userDoc.data() as {
      isVerified?: boolean;
      emailVerification?: EmailVerificationState;
    };

    if (userData.isVerified) return true;

    const verification = userData.emailVerification;
    if (!verification) throw new Error("No verification code has been requested");

    if (verification.expiresAt.toMillis() < Date.now()) {
      await userRef.update({ emailVerification: FieldValue.delete() });
      throw new Error("Verification code has expired");
    }

    if ((verification.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      throw new Error("Too many verification attempts. Request a new code");
    }

    const suppliedHash = hashCode(code, verification.salt);
    const storedHash = Buffer.from(verification.codeHash, "hex");
    const isMatch =
      suppliedHash.length === storedHash.length &&
      timingSafeEqual(suppliedHash, storedHash);

    if (!isMatch) {
      await userRef.update({
        "emailVerification.attempts": FieldValue.increment(1),
      });
      throw new Error("Invalid verification code");
    }

    await userRef.update({
      isVerified: true,
      emailVerification: FieldValue.delete(),
    });

    // Keep Firebase Auth and the application profile aligned. The client
    // refreshes its token after confirmation so me() observes emailVerified.
    await getAuth().updateUser(loginUser.uid, { emailVerified: true });

    return true;
  }

  async assertVerified(loginUser: LoginUser | null): Promise<void> {
    if (!loginUser) throw new Error("Not authenticated");

    const userDoc = await userCollection.doc(loginUser.uid).get();
    if (!userDoc.exists) throw new Error("User profile not found");

    if (userDoc.data()?.isVerified !== true) {
      throw new Error(
        "Email verification required before starting or completing a transaction",
      );
    }
  }
}
