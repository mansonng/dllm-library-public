import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import EmailVerificationForm from "./EmailVerificationForm";

const EmailVerificationDialog: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
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

  const handleVerified = () => {
    setOpen(false);
    window.location.reload();
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Verify your email</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <EmailVerificationForm
          onVerified={handleVerified}
          description="Verify your email before starting or completing a book transaction."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Later</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailVerificationDialog;
