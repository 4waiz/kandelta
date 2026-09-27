// Raw Oriane API types (subset we use). See docs/ORIANE_API_NOTES.md.

export type Platform = "instagram" | "tiktok";
export type Projection = "basic" | "default" | "full";

export interface TextOperand {
  values: string[];
  operator?: "and" | "or";
}

export interface TextFilter {
  exactMatch?: TextOperand;
  includesExactly?: TextOperand;
  includesFuzzy?: TextOperand;
  excludesExactly?: TextOperand;
}

export interface VisualValue {
  assetId: string;
  minScore?: number;
  maxScore?: number;
}

export interface ContentFilters {
  platform?: { includes?: Platform[]; excludes?: Platform[] };
  format?: { includes?: ("video" | "image" | "carousel")[] };
  profileId?: { includes?: string[]; excludes?: string[] };
  id?: { includes?: string[] };
  caption?: TextFilter;
  transcript?: TextFilter;
  hashtags?: TextFilter;
  mentionHandles?: TextFilter;
  captionLanguage?: { includes?: string[]; excludes?: string[] };
  publishedAt?: { after?: string; before?: string };
  profileFollowersCount?: { min?: number; max?: number };
  viewsCount?: { min?: number; max?: number };
  audioCopyrighted?: boolean;
  hasCoAuthors?: boolean;
  hasMentions?: boolean;
  visualSimilarity?: { includes?: { values: VisualValue[]; operator?: "and" | "or" } };
}

export interface ContentQuery {
  operator: "and" | "or";
  name?: string;
  filters?: ContentFilters;
  queries?: ContentQuery[];
}

export interface SearchParams {
  limit: number;
  offset: number;
  projection: Projection;
  sort?: string;
}

export interface RawTranscriptChunk {
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export interface RawFrame {
  id: string;
  position: number;
  timestampSeconds: number;
  visualSimilarityScore?: number;
  url: string;
}

export interface RawComment {
  content: string;
  likesCount: number;
  repliesCount: number;
  profileHandle: string | null;
  publishedAt: string;
}

export interface RawContent {
  id: string;
  platform: Platform;
  profileHandle: string;
  profileDisplayName: string | null;
  format: "video" | "image" | "carousel";
  caption: string | null;
  captionLanguage: string | null;
  publishedAt: string;
  thumbnailMediaUrl?: string | null;
  profileId?: string | null;
  viewsCount?: number;
  likesCount?: number;
  sharesCount?: number;
  commentsCount?: number;
  interactionsCount?: number;
  engagementRatePerViews?: number | null;
  engagementRatePerFollowers?: number | null;
  profileFollowersCount?: number;
  profilePostsCount?: number;
  duration?: number | null;
  hashtags?: string[];
  mentions?: { profileHandle: string }[];
  coAuthors?: { profileHandle: string }[];
  platformId?: string;
  profilePictureUrl?: string;
  profileBio?: string | null;
  profileVerified?: boolean;
  transcript?: string | null;
  transcriptLanguage?: string | null;
  transcriptChunks?: RawTranscriptChunk[];
  frames?: RawFrame[];
  audioTitle?: string | null;
  audioType?: string | null;
  audioCopyrighted?: boolean | null;
  popularComments?: RawComment[];
}

export interface RawAggregations {
  totalViewsCount: number;
  totalInteractionsCount?: number;
  totalEngagementRatePerViews?: number | null;
  totalEngagementRatePerFollowers?: number | null;
}

export interface RawSearchResponse {
  data: { results: RawContent[]; aggregations: RawAggregations };
  metadata: {
    requestId: string;
    executionTime: number;
    timestamp: number;
    pagination?: { offset: number; limit: number; totalCount: number; aiSearchAnchor?: string };
  };
}

/** Where a response came from — surfaced in the UI so cached data is never passed off as live. */
export type DataSource = "live" | "cache" | "stale-cache";
