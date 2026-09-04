import React, { useState } from "react";
import { Box, Button, Dialog, DialogContent, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";
import { useTranslation } from "react-i18next";
import { clearPendingSignupOnboarding } from "../utils/signupOnboarding";
import { semanticTokens } from "../styles/semanticTokens";
import EmailVerificationForm from "./EmailVerificationForm";

interface SignupOnboardingDialogProps {
  open: boolean;
  onClose: () => void;
  onAddAddress: () => void;
}

const SignupOnboardingDialog: React.FC<SignupOnboardingDialogProps> = ({
  open,
  onClose,
  onAddAddress,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const verificationStep = 3;
  const completeStep = 4;
  const isVerification = step === verificationStep;
  const isComplete = step === completeStep;

  const closeAndReset = () => {
    setStep(0);
    onClose();
  };

  const finishOnboarding = () => {
    clearPendingSignupOnboarding();
    closeAndReset();
  };

  const handleDismiss = () => {
    // Closing signup onboarding is treated the same as deferring it. This
    // prevents the signup-only modal from unexpectedly covering Profile later.
    clearPendingSignupOnboarding();
    closeAndReset();
  };

  const handlePrimaryAction = () => {
    if (isComplete) {
      finishOnboarding();
      return;
    }

    setStep((currentStep) => currentStep + 1);
  };

  const handleAddAddressNow = () => {
    clearPendingSignupOnboarding();
    closeAndReset();
    onAddAddress();
  };

  const handleVerificationDone = () => {
    setStep(completeStep);
  };

  const stepCopy = [
    {
      title: t("onboarding.signup.step1.title"),
      body: t("onboarding.signup.step1.body"),
      action: t("onboarding.signup.continue"),
    },
    {
      title: t(
        "onboarding.signup.transactionIntro.title",
        "Browse first, verify before a transaction",
      ),
      body: t(
        "onboarding.signup.transactionIntro.body",
        "You can browse books, open your profile, and view holdings now. BookGuide will require email verification before you start or progress a book transaction.",
      ),
      action: t("onboarding.signup.continue"),
    },
    {
      title: t("onboarding.signup.step3.title"),
      body: t("onboarding.signup.step3.body"),
      action: t("onboarding.signup.continue"),
    },
    {
      title: t("onboarding.signup.emailVerification.title", "Verify your email"),
      body: t(
        "onboarding.signup.emailVerification.body",
        "Verify now with a 6-digit code, or do it later. You can still browse BookGuide, but email verification is required before a book transaction.",
      ),
      action: "",
    },
    {
      title: t(
        "onboarding.signup.complete4.title",
        "You're all set.",
      ),
      body: t("onboarding.signup.complete.body"),
      action: t("onboarding.signup.browseBooks"),
    },
  ][step];

  return (
    <Dialog
      open={open}
      onClose={handleDismiss}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: semanticTokens.color.bgSurface,
          color: semanticTokens.color.textPrimary,
        },
      }}
    >
      <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
        {isComplete ? (
          <Box
            sx={{
              width: 44,
              height: 44,
              mb: 2,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(semanticTokens.color.brandPrimary, 0.08),
              color: semanticTokens.color.brandPrimary,
            }}
          >
            <CheckIcon />
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 0.75, mb: 2.5 }}>
            {[0, 1, 2, 3].map((progressStep) => (
              <Box
                key={progressStep}
                sx={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  bgcolor:
                    progressStep <= step
                      ? semanticTokens.color.brandPrimary
                      : semanticTokens.color.borderSubtle,
                }}
              />
            ))}
          </Box>
        )}

        {!isComplete && (
          <Typography
            variant="overline"
            sx={{
              display: "block",
              mb: 1.5,
              color: semanticTokens.color.brandPrimary,
              fontWeight: 600,
            }}
          >
            {t("onboarding.signup.stepLabel4", {
              step: step + 1,
              defaultValue: "Step {{step}} of 4",
            })}
          </Typography>
        )}

        <Typography
          variant="h6"
          sx={{
            mb: 1.25,
            color: semanticTokens.color.textPrimary,
            fontFamily: '"Noto Serif TC", serif',
            fontWeight: 700,
          }}
        >
          {stepCopy.title}
        </Typography>

        {isVerification ? (
          <>
            <Typography
              sx={{
                mb: 2,
                color: semanticTokens.color.textSecondary,
                lineHeight: 1.7,
              }}
            >
              {stepCopy.body}
            </Typography>
            <EmailVerificationForm onVerified={handleVerificationDone} />
            <Button
              fullWidth
              variant="text"
              onClick={() => setStep(completeStep)}
              sx={{ mt: 1 }}
            >
              Later
            </Button>
          </>
        ) : (
          <>
            <Typography
              sx={{
                minHeight: isComplete ? undefined : { xs: 120, sm: 140 },
                color: semanticTokens.color.textSecondary,
                lineHeight: 1.7,
                whiteSpace: "pre-line",
              }}
            >
              {stepCopy.body}
            </Typography>

            <Button
              fullWidth
              variant="contained"
              onClick={handlePrimaryAction}
              sx={{ mt: 2.5 }}
            >
              {stepCopy.action}
            </Button>

            {step === 2 && (
              <Button
                fullWidth
                variant="text"
                onClick={handleAddAddressNow}
                sx={{ mt: 1 }}
              >
                {t("onboarding.signup.addAddress", "Add exchange address")}
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignupOnboardingDialog;
