'use client';

import { useState } from 'react';

interface PhotoGalleryProps {
  images: string[];
}

export function PhotoGalleryWithIntent({ images }: PhotoGalleryProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const nextImage = () => {
    // If we reach image 3, dispatch an intent event for the Lead Capture Modal to listen to
    if (currentIdx === 2) {
      const intentEvent = new CustomEvent('lead-capture-intent', { detail: { trigger: 'photo_view' } });
      window.dispatchEvent(intentEvent);
    }

    if (currentIdx < images.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const prevImage = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden group">
      <img
        src={images[currentIdx]}
        alt={`Property view ${currentIdx + 1}`}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            disabled={currentIdx === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
          >
            ←
          </button>
          <button
            onClick={nextImage}
            disabled={currentIdx === images.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
          >
            →
          </button>
          <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full">
            {currentIdx + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
