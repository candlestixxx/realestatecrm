export type ImageVariant = 'ORIGINAL' | 'ENHANCED' | 'WATERMARKED' | 'SOCIAL_SQUARE' | 'VIRTUAL_STAGED';

export interface ProcessedImage {
  id: string;
  url: string;
  variant: ImageVariant;
  createdAt: Date;
}
