import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { Link } from "react-router";
import {
  useNewsRecentPostsQuery,
  NewsRecentPostsQueryVariables,
  User,
  Role,
} from "../generated/graphql";
import NewsForm from "./NewsForm";
import NewsDetail from "./NewsDetail";
import NewsPost from "./NewsPost";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

interface RecentNewsBannerProps {
  user: User | undefined;
}

const RecentNewsBanner: React.FC<RecentNewsBannerProps> = ({ user }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [cardsPerView, setCardsPerView] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Media queries for responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const isLandscape = useMediaQuery("(orientation: landscape)");

  const { data, loading, error, refetch } = useNewsRecentPostsQuery({
    variables: {
      tags: [],
      limit: 10,
      offset: 0,
    } as NewsRecentPostsQueryVariables,
  });

  // Calculate responsive dimensions and cards per view
  useEffect(() => {
    const calculateLayout = () => {
      let cards = 4;

      if (isMobile) {
        if (isPortrait) {
          cards = window.innerWidth < 400 ? 2 : 3; // 2-3 cards for mobile portrait
        } else {
          cards = Math.min(4, Math.floor(window.innerWidth / 200)); // At least 3 for landscape
          cards = Math.max(3, cards);
        }
      } else {
        // Desktop/tablet landscape
        cards = Math.floor(window.innerWidth / 250);
        cards = Math.max(3, Math.min(6, cards));
      }

      const maxCards = data?.newsRecentPosts.length || 10;
      setCardsPerView(Math.max(1, Math.min(cards, maxCards)));
    };

    calculateLayout();
    window.addEventListener("resize", calculateLayout);

    return () => window.removeEventListener("resize", calculateLayout);
  }, [data?.newsRecentPosts.length, isMobile, isPortrait, isLandscape]);

  // Calculate container height based on device and orientation
  const getContainerHeight = () => {
    const vh = window.innerHeight;

    if (isMobile) {
      if (isPortrait) {
        return Math.max(150, Math.min(vh * 0.35, 250)); // 25-35% of screen height
      } else {
        return Math.max(180, Math.min(vh * 0.45, 250)); // Less than 50% for landscape
      }
    }

    // Desktop
    return Math.max(250, Math.min(vh * 0.4, 350));
  };

  const containerHeight = getContainerHeight();

  // Calculate card dimensions
  const getCardDimensions = () => {
    const gap = 8;
    const arrowSpace = 40;
    const availableWidth =
      (scrollContainerRef.current?.offsetWidth || window.innerWidth) -
      arrowSpace;
    const cardWidth =
      (availableWidth - (cardsPerView - 1) * gap) / cardsPerView;

    return {
      width: `${cardWidth}px`,
      height: `${containerHeight}px`,
    };
  };

  const cardDimensions = getCardDimensions();

  const handleNewsCreated = () => {
    refetch();
  };

  const handleNewsItemClick = (newsId: string) => {
    navigate(`/news/${newsId}`);
  };

  const handleCloseDialog = () => {
    setSelectedNewsId(null);
  };

  const scrollLeft = () => {
    const newIndex = Math.max(0, currentIndex - cardsPerView);
    setCurrentIndex(newIndex);
  };

  const scrollRight = () => {
    const maxIndex = Math.max(
      0,
      (data?.newsRecentPosts.length || 0) - cardsPerView
    );
    const newIndex = Math.min(maxIndex, currentIndex + cardsPerView);
    setCurrentIndex(newIndex);
  };

  // Check if we can scroll left or right
  const canScrollLeft = currentIndex > 0;
  const canScrollRight = data?.newsRecentPosts.length
    ? currentIndex + cardsPerView < data.newsRecentPosts.length
    : false;

  if (loading) return <Typography>{t("common.loading")}</Typography>;
  if (error) return <Typography>Error: {error.message}</Typography>;

  return (
    <>
      <Box sx={{ mb: 4, width: "100%" }}>
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
            px: 1,
          }}
        >
          <Typography
            variant={isMobile ? "h6" : "h5"}
            component={Link}
            to="/news/all"
            sx={{
              textDecoration: "none",
              color: "primary.main",
              fontWeight: "bold",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            {t("news.trending")}
          </Typography>
          {user?.role === Role.Admin && (
            <NewsForm onNewsCreated={handleNewsCreated} />
          )}
        </Box>

        {/* Scrollable News Container */}
        {data && data.newsRecentPosts.length > 0 && (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: `${containerHeight}px`,
              overflow: "hidden",
            }}
          >
            {/* Left Arrow */}
            {canScrollLeft && (
              <IconButton
                onClick={scrollLeft}
                sx={{
                  position: "absolute",
                  left: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                  backgroundColor: "background.paper",
                  boxShadow: 2,
                  width: 32,
                  height: 32,
                  "&:hover": {
                    backgroundColor: "background.paper",
                    boxShadow: 4,
                  },
                }}
              >
                <ArrowBackIos fontSize="small" />
              </IconButton>
            )}

            {/* News Cards Container */}
            <Box
              ref={scrollContainerRef}
              sx={{
                display: "flex",
                overflowX: "hidden",
                scrollBehavior: "smooth",
                gap: 1,
                px: canScrollLeft || canScrollRight ? 5 : 1,
                width: "100%",
                height: "100%",
              }}
            >
              {data.newsRecentPosts.map(
                (news, index) =>
                  index >= currentIndex &&
                  index < currentIndex + cardsPerView && (
                    <Box
                      key={news.id}
                      sx={{
                        opacity:
                          index >= currentIndex &&
                            index < currentIndex + cardsPerView
                            ? 1
                            : 0,
                        visibility:
                          index >= currentIndex &&
                            index < currentIndex + cardsPerView
                            ? "visible"
                            : "hidden",
                        transition: "opacity 0.3s ease-in-out",
                      }}
                    >
                      <NewsPost
                        news={{
                          id: news.id,
                          title: news.title,
                          images: news.images,
                          createdAt: news.createdAt,
                          tags: news.tags,
                        }}
                        width={cardDimensions.width}
                        height={cardDimensions.height}
                        showImage={true}
                        onClick={handleNewsItemClick}
                        isPortrait={isMobile && isPortrait}
                      />
                    </Box>
                  )
              )}
            </Box>

            {/* Right Arrow */}
            {canScrollRight && (
              <IconButton
                onClick={scrollRight}
                sx={{
                  position: "absolute",
                  right: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                  backgroundColor: "background.paper",
                  boxShadow: 2,
                  width: 32,
                  height: 32,
                  "&:hover": {
                    backgroundColor: "background.paper",
                    boxShadow: 4,
                  },
                }}
              >
                <ArrowForwardIos fontSize="small" />
              </IconButton>
            )}
          </Box>
        )}

        {/* Pagination Dots */}
        {data && data.newsRecentPosts.length > cardsPerView && (
          <Box
            sx={{ display: "flex", justifyContent: "center", mt: 2, gap: 1 }}
          >
            {Array.from({
              length: Math.ceil(data.newsRecentPosts.length / cardsPerView),
            }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor:
                    Math.floor(currentIndex / cardsPerView) === index
                      ? "primary.main"
                      : "grey.300",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onClick={() => {
                  const newIndex = index * cardsPerView;
                  setCurrentIndex(newIndex);
                }}
              />
            ))}
          </Box>
        )}

        {/* See All Link */}
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Typography
            variant="body2"
            component={Link}
            to="/news/all"
            sx={{
              color: "primary.main",
              textDecoration: "none",
              fontWeight: "medium",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            {t("news.viewAll")} →
          </Typography>
        </Box>
      </Box>

      <NewsDetail
        newsId={selectedNewsId}
        open={!!selectedNewsId}
        onClose={handleCloseDialog}
      />
    </>
  );
};

export default RecentNewsBanner;
