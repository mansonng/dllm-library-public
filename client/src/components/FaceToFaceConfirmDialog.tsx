import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Modal,
  Backdrop,
  Fade,
} from "@mui/material";
import {
  ArrowBack,
  LocationOn as LocationOnIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Schedule as ScheduleIcon,
  SwapHoriz as TransferIcon,
  GetApp as ReceiveIcon,
  Home as NewHolderIcon,
  Close as CloseIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  PushPin as PinIcon,
  SwapHoriz, // Add this import
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// Add this new component before ItemDetail or in a separate file
interface FaceToFaceConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  itemName: string;
}

const FaceToFaceConfirmDialog: React.FC<FaceToFaceConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading,
  itemName,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 500 },
            maxHeight: "90vh",
            overflow: "auto",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <SwapHoriz color="primary" sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h5" component="h2">
              {t("item.faceToFaceTransfer", "Face-to-Face Transfer")}
            </Typography>
          </Box>

          {/* Item Name */}
          <Box sx={{ mb: 3, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
            <Typography variant="body1" fontWeight="medium">
              {t("item.itemName", "Item")}: {itemName}
            </Typography>
          </Box>

          {/* Warning Alert */}
          <Alert severity="warning" icon={<ScheduleIcon />} sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              {t(
                "item.quickTransferExpiry",
                "This transfer will expire in 1 hour"
              )}
            </Typography>
            <Typography variant="body2">
              {t(
                "item.quickTransferExpiryDescription",
                "The recipient must confirm receipt within 1 hour, or the transaction will be automatically cancelled."
              )}
            </Typography>
          </Alert>

          {/* Instructions */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {t("item.faceToFaceInstructions", "How it works:")}
            </Typography>
            <Box component="ol" sx={{ pl: 2, mb: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                {t(
                  "item.faceToFaceStep1",
                  "A quick transaction will be created immediately"
                )}
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                {t(
                  "item.faceToFaceStep2",
                  "Hand over the item to the recipient in person"
                )}
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                {t(
                  "item.faceToFaceStep3",
                  "The recipient confirms receipt within 1 hour"
                )}
              </Typography>
              <Typography component="li" variant="body2">
                {t(
                  "item.faceToFaceStep4",
                  "The transaction is completed, and the recipient becomes the new holder"
                )}
              </Typography>
            </Box>
          </Box>

          {/* Important Notice */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {t(
                "item.faceToFaceNotice",
                "Make sure you are physically present with the recipient before creating this transaction."
              )}
            </Typography>
          </Alert>

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={loading}
              size="large"
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={onConfirm}
              disabled={loading}
              size="large"
              startIcon={
                loading ? <CircularProgress size={20} /> : <SwapHoriz />
              }
            >
              {loading
                ? t("item.creating", "Creating...")
                : t("item.confirmTransfer", "Confirm Transfer")}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default FaceToFaceConfirmDialog;
