import React, { useState } from "react";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { auth } from "../firebase";
import {
  confirmEmailVerificationCode,
  requestEmailVerificationCode,
} from "../utils/emailVerification";

interface EmailVerificationFormProps {
  onVerified?: () => void;
  description?: string;
}

const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  onVerified,
  description,
}) => {
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const email = auth.currentUser?.email || "your email";

  const handleSend = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await requestEmailVerificationCode();
      setSent(true);
      setSuccess("Verification code sent. Check your inbox.");
    } catch (err: any) {
      setError(err?.message || "Unable to send verification code");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    setSuccess(null);
    try {
      await confirmEmailVerificationCode(code.trim());
      setSuccess("Email verified successfully.");
      onVerified?.();
    } catch (err: any) {
      setError(err?.message || "Unable to verify email");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {description ||
          `We'll send a 6-digit verification code to ${email}. The code expires in 10 minutes.`}
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Button
        variant={sent ? "outlined" : "contained"}
        onClick={handleSend}
        disabled={sending || verifying}
      >
        {sending
          ? "Sending..."
          : sent
            ? "Resend verification code"
            : "Send verification code"}
      </Button>

      <TextField
        label="6-digit verification code"
        value={code}
        onChange={(event) =>
          setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
        }
        inputProps={{ inputMode: "numeric", maxLength: 6 }}
        disabled={verifying}
        fullWidth
      />

      <Button
        variant="contained"
        onClick={handleVerify}
        disabled={code.length !== 6 || verifying}
      >
        {verifying ? "Verifying..." : "Verify"}
      </Button>
    </Stack>
  );
};

export default EmailVerificationForm;
