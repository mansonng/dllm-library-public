import React from "react";
import { Box, Typography, Container } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { User } from "../generated/graphql";
import RecentNewsBanner from "../components/RecentNewsBanner";

interface OutletContext {
  email?: string | undefined | null;
  emailVerified?: boolean | undefined | null;
  user?: User;
}

const NewsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useOutletContext<OutletContext>();

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        {t("navigation.news", "News")}
      </Typography>
      <RecentNewsBanner user={user} />
    </Container>
  );
};

export default NewsPage;
