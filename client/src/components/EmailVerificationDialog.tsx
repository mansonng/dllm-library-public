import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { auth } from "../firebase";
import {
  confirmEmailVerificationCode,
  requestEmailVerificationCode,
} from "../utils/emailVerification";

const EmailVerificationDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setCode("");
      setError(null);
      setSuccess(null);
    };
    window.addEventListener(
      "bookguide:email-verification-required",
      handleOpen as EventListener,
    );
    return () =>
      window.removeEventListener(
        "bookguide:email-verification-required",
        handleOpen as EventListener,
      );
  }, []);

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
      setTimeout(() => {
        setOpen(false);
        window.location.reload();
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Unable to verify email");
    } finally {
      setVerifying(false);
    }
  };

  const email = auth.currentUser?.email || "your email";

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Verify your email</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Verify {email} before starting or completing a book transaction.
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
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)} disabled={verifying}>
          Later
        </Button>
        <Button
          variant="contained"
          onClick={handleVerify}
          disabled={code.length !== 6 || verifying}
        >
          {verifying ? "Verifying..." : "Verify"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailVerificationDialog;
