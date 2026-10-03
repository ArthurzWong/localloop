"use client";

import { useState } from "react";

/**
 * Business photo with a graceful, on-brand fallback.
 * Demo listings point at a seeded photo service; if that is unreachable we
 * fall back to a warm gradient + the business emoji rather than a broken image.
 */
export default function Photo({
  src,
  alt,
  emoji,
  className = "",
  sizes = "(min-width: 768px) 640px, 100vw",
}: {
  src?: string;
  alt: string;
  emoji: string;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div className={`relative overflow-hidden bg-parchment ${className}`}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="ll-photo-fallback flex h-full w-full items-center justify-center">
          <span aria-hidden className="text-5xl drop-shadow-sm">
            {emoji}
          </span>
        </div>
      )}
    </div>
  );
}