import { useMemo, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as jdenticon from "jdenticon";
import { avatarRefreshManager } from "@/utils/avatarRefresh";

interface UserAvatarProps {
  src?: string | null;
  username: string;
  size?: number;
  className?: string;
}

export const UserAvatar = ({ src, username, size = 40, className }: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [refreshTimestamp, setRefreshTimestamp] = useState(avatarRefreshManager.getRefreshTimestamp());

  // Subscribe to global avatar refresh events
  useEffect(() => {
    const unsubscribe = avatarRefreshManager.subscribe(() => {
      setRefreshTimestamp(avatarRefreshManager.getRefreshTimestamp());
      setImageError(false); // Reset error state on refresh
      if (src) {
        setImageLoading(true);
      }
    });

    return unsubscribe;
  }, [src]);

  // Reset error state and set loading when src changes
  useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoading(true);
    } else {
      // When src becomes null/undefined, immediately reset states
      setImageError(false);
      setImageLoading(false);
    }
  }, [src]);

  // Generate Jdenticon SVG as fallback
  const jdenticonSvg = useMemo(() => {
    const svgString = jdenticon.toSvg(username, size);
    return `data:image/svg+xml;base64,${btoa(svgString)}`;
  }, [username, size]);

  // Process profile picture URLs with cache-busting
  const profileImageSrc = useMemo(() => {
    if (!src || imageError) return null;

    try {
      // Handle both absolute URLs and relative paths
      let imageUrl: string;
      if (src.startsWith('http')) {
        imageUrl = src;

        // For external URLs (like Google avatars), return as-is without modification
        // to avoid breaking external image services
        if (src.includes('googleusercontent.com') || src.includes('lh3.google')) {
          return imageUrl;
        }
      } else {
        // Clean the src path and construct proper URL
        const cleanSrc = src.startsWith('/') ? src : `/${src}`;
        // Use the API base URL for relative paths
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        imageUrl = new URL(cleanSrc, apiBaseUrl).toString();
      }

      // Add cache-busting with refreshTimestamp to ensure immediate updates
      // Only for internal URLs (not external avatar providers)
      const url = new URL(imageUrl);
      if (src) {
        // Use a combination of src hash and refreshTimestamp for immediate cache invalidation
        const cacheKey = btoa(src.slice(-20)).replace(/[+/=]/g, '').slice(0, 8);
        url.searchParams.set('v', `${cacheKey}_${refreshTimestamp}`);
        url.searchParams.set('t', 'square');
      }

      return url.toString();
    } catch (error) {
      console.warn('UserAvatar - Invalid image URL:', src, error);
      return null;
    }
  }, [src, imageError, refreshTimestamp]);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <Avatar className={className} style={{ width: size, height: size }} key={`avatar-${username}-${refreshTimestamp}`}>
      {src && profileImageSrc && !imageError && (
        <AvatarImage
          src={profileImageSrc}
          alt={`${username}'s avatar`}
          className="object-cover w-full h-full"
          style={{
            aspectRatio: '1 / 1',
            objectPosition: 'center',
          }}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}
      {/* Show fallback when no profile image src, image failed to load, or src is explicitly null */}
      {(!src || !profileImageSrc || imageError) && (
        <AvatarFallback className="bg-transparent p-0">
          <img
            src={jdenticonSvg}
            alt={`${username}'s default avatar`}
            className="w-full h-full object-cover"
            style={{
              aspectRatio: '1 / 1',
            }}
          />
        </AvatarFallback>
      )}
    </Avatar>
  );
};
