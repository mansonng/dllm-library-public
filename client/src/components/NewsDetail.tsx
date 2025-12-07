import React, { useState } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Modal,
  Backdrop,
  Fade,
  Grid,
  Paper,
} from "@mui/material";
import {
  Close,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
} from "@mui/icons-material";
import { gql, useQuery } from "@apollo/client";
import { useNewsPostQuery, NewsPostQueryVariables } from "../generated/graphql";
import SafeImage from "./SafeImage";
import { useTranslation } from "react-i18next";
import { convertLinksToClickable } from "../utils/helpers";

const DETAIL_NEWS_QUERY = gql`
  query NewsPost($newsPostId: ID!) {
    newsPost(id: $newsPostId) {
      id
      title
      content
      images
      relatedItems {
        id
        name
        category
        status
      }
      createdAt
      updatedAt
      tags
      user {
        id
        nickname
      }
    }
  }
`;
interface NewsDetailProps {
  newsId: string | null;
  open: boolean;
  onClose: () => void;
}

const NewsDetail: React.FC<NewsDetailProps> = ({ newsId, open, onClose }) => {
  const { t } = useTranslation();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data, loading, error } = useNewsPostQuery({
    variables: { newsPostId: newsId! } as NewsPostQueryVariables,
    skip: !newsId,
  });

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageModalOpen(true);
  };

  const handleCloseModal = () => {
    setImageModalOpen(false);
  };

  const handlePrevImage = () => {
    const images = data?.newsPost?.images || [];
    if (images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    const images = data?.newsPost?.images || [];
    if (images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: "80vh" },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography> {t("news.newsDetails")}</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t("news.error")}: {error.message}
            </Alert>
          )}

          {data?.newsPost && (
            <Box>
              <Typography variant="h4" gutterBottom>
                {data.newsPost.title}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("common.by")} {data.newsPost.user?.nickname || t("common.unknown")} • {t("common.created")}: {" "}
                  {new Date(data.newsPost.createdAt).toLocaleDateString()} •
                  {t("common.updated")}: {" "}
                  {new Date(data.newsPost.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ mb: 3, whiteSpace: "pre-wrap" }}>
                {convertLinksToClickable(data.newsPost.content)}
              </Typography>

              {data.newsPost.images && data.newsPost.images.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t("common.images")}
                  </Typography>
                  <Grid container spacing={2}>
                    {data.newsPost.images.map((image, index) => (
                      <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                        <Paper
                          elevation={2}
                          sx={{
                            overflow: "hidden",
                            cursor: "pointer",
                            transition: "transform 0.2s",
                            "&:hover": {
                              transform: "scale(1.05)",
                            },
                          }}
                          onClick={() => handleImageClick(index)}
                        >
                          <SafeImage
                            src={image}
                            alt={`News image ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "120px",
                              objectFit: "cover",
                            }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {data.newsPost.relatedItems &&
                data.newsPost.relatedItems.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {t("news.relatedItems")}
                    </Typography>
                    {data.newsPost.relatedItems.map((item) => (
                      <Box
                        key={item.id}
                        sx={{
                          p: 2,
                          border: "1px solid #ddd",
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t(item.status)}: {item.status} • {t(item.category)}:{" "}
                          {item.category.join(", ")}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

              {data.newsPost.tags && data.newsPost.tags.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t("common.tags")}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {data.newsPost.tags.map((tag, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        sx={{
                          bgcolor: "primary.main",
                          color: "white",
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                        }}
                      >
                        {tag}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} variant="contained">
            {t("common.close")}
          </Button>
        </DialogActions>
      </Dialog>
      <Modal
        open={imageModalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={imageModalOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: "90vw",
              maxHeight: "90vh",
              bgcolor: "background.paper",
              border: "2px solid #000",
              boxShadow: 24,
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Close Button */}
            <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
              <IconButton onClick={handleCloseModal} color="primary" aria-label="Close image modal">
                <Close />
              </IconButton>
            </Box>

            {/* Image Navigation */}
            {data?.newsPost && (
              <Box
                sx={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* Previous Button */}
                {data.newsPost.images && data.newsPost.images.length > 1 && (
                  <IconButton
                    onClick={handlePrevImage}
                    sx={{ position: "absolute", left: -50, zIndex: 1 }}
                    color="primary"
                    aria-label="Previous image"
                  >
                    <PrevIcon />
                  </IconButton>
                )}

                {/* Main Image */}
                <img
                  src={
                    (data.newsPost.images &&
                      data.newsPost.images[selectedImageIndex]) ||
                    ""
                  }
                  alt={`News - Image ${selectedImageIndex + 1}`}
                  style={{
                    maxWidth: "80vw",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />

                {/* Next Button */}
                {data.newsPost.images && data.newsPost.images.length > 1 && (
                  <IconButton
                    onClick={handleNextImage}
                    sx={{ position: "absolute", right: -50, zIndex: 1 }}
                    color="primary"
                    aria-label="Next image"
                  >
                    <NextIcon />
                  </IconButton>
                )}
              </Box>
            )}

            {/* Image Counter */}
            {data?.newsPost && data.newsPost.images && data.newsPost.images.length > 1 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {selectedImageIndex + 1} / {data.newsPost.images.length}
              </Typography>
            )}
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default NewsDetail;
