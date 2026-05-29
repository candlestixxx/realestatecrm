export type ListingStage = 'COMING_SOON' | 'JUST_LISTED' | 'OPEN_HOUSE' | 'PRICE_IMPROVEMENT' | 'JUST_SOLD';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';

export type ImageVariant = {
  id: string;
  sourceUrl: string;
  generatedUrl: string | null;
  stage: ListingStage;
  ratio: AspectRatio;
  style: 'DAY' | 'NIGHT';
  status: 'PENDING' | 'GENERATING' | 'REVIEW' | 'APPROVED' | 'REJECTED';
  prompt: string;
  caption: string | null;
};

export type VideoVariant = {
  id: string;
  sourceClips: string[];
  generatedUrl: string | null;
  stage: ListingStage;
  ratio: AspectRatio;
  type: 'PROMO' | 'WALKTHROUGH' | 'TEASER';
  status: 'PENDING' | 'GENERATING' | 'REVIEW' | 'APPROVED' | 'REJECTED';
  caption: string | null;
  includeMusic: boolean;
  includeVoiceover: boolean;
};

export type SocialPost = {
  id: string;
  platform: 'FACEBOOK' | 'LINKEDIN' | 'INSTAGRAM';
  mediaUrl: string;
  caption: string;
  status: 'DRAFT' | 'QUEUED' | 'PUBLISHED';
  scheduledAt?: string;
};

export type MediaPipelineSession = {
  sessionId: string;
  propertyId: string;
  address: string;
  images: ImageVariant[];
  videos: VideoVariant[];
  socialPosts: SocialPost[];
  loftyLandingPageUrl: string | null;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
};

export function createEmptyMediaSession(propertyId: string, address: string): MediaPipelineSession {
  return {
    sessionId: crypto.randomUUID(),
    propertyId,
    address,
    images: [],
    videos: [],
    socialPosts: [],
    loftyLandingPageUrl: null,
    status: 'DRAFT',
  };
}
