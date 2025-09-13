import { ItemCommentsConnection, ItemCommentPageInfo, ItemComment } from "./generated/graphql";

export class CommentService {
  private dummyComments: ItemComment[];

  constructor() {
    // Generate 100 dummy comments
    this.dummyComments = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      content: `Dummy comment #${i}`,
    }));
  }

  commentsByItemId(
    itemId: string,
    first: number = 10,
    after?: string
  ): ItemCommentsConnection {
    // Find the starting index based on after cursor
    let startIdx = 0;
    if (after) {
      const idx = parseInt(after, 10);
      if (!isNaN(idx) && idx >= 0 && idx < this.dummyComments.length) {
        startIdx = idx + 1;
      }
    }

    const comments = this.dummyComments.slice(startIdx, startIdx + first);
    const endIdx = startIdx + comments.length - 1;

    const pageInfo: ItemCommentPageInfo = {
      startCursor: String(startIdx),
      endCursor: String(endIdx),
      hasNextPage: endIdx < this.dummyComments.length - 1,
    };

    return {
      comments,
      pageInfo,
    };
  }
}