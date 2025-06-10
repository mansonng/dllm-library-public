import React, { useState } from "react";
import { gql } from "@apollo/client";
import { User } from "./generated/graphql";
import { CreateNewsPostMutation } from "./generated/graphql";
import RecentNewsBanner from "./components/RecentNewsBanner";
import RecentNewsPage from "./components/RecentNewsPage";

const NEWS_RECENT_QUERY = gql`
  query NewsRecentPosts($limit: Int, $offset: Int) {
    newsRecentPosts(limit: $limit, offset: $offset) {
      id
      title
      images
      createdAt
      tags
    }
  }
`;

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

interface NewsProps {
  user: User | undefined;
}

const News: React.FC<NewsProps> = ({ user }) => {
  const [showAllNews, setShowAllNews] = useState(false);

  const handleNewsCreated = (data: CreateNewsPostMutation) => {
    console.log("News post created:", data.createNewsPost);
  };

  const handleShowAllNews = () => {
    setShowAllNews(true);
  };

  const handleBackToSingle = () => {
    setShowAllNews(false);
  };

  if (showAllNews) {
    return (
      <RecentNewsPage 
        user={user}
        onBack={handleBackToSingle}
        onNewsCreated={handleNewsCreated}
      />
    );
  }

  return (
    <RecentNewsBanner 
      user={user}
      onShowAllNews={handleShowAllNews}
      onNewsCreated={handleNewsCreated}
    />
  );
};

export default News;