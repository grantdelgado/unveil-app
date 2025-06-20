'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import type { Database } from '@/app/reference/supabase.types';
import { PhotoUpload } from './index';

type Media = Database['public']['Tables']['media']['Row'];

interface GuestPhotoGalleryProps {
  eventId: string;
  currentUserId: string | null;
}

function GuestPhotoGallery({ eventId, currentUserId }: GuestPhotoGalleryProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 12;

  const fetchMedia = useCallback(async (offset = 0, append = false) => {
    try {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (error) {
        console.error('❌ Error fetching media:', error);
        return;
      }

      const newMedia = data || [];
      
      if (append) {
        setMedia(prev => [...prev, ...newMedia]);
      } else {
        setMedia(newMedia);
      }

      // Check if there are more items
      setHasMore(newMedia.length === ITEMS_PER_PAGE);
    } catch (err) {
      console.error('❌ Unexpected error fetching media:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [eventId]);

  // Load more when scrolling near bottom
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchMedia(media.length, true);
    }
  }, [fetchMedia, media.length, loadingMore, hasMore]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  const handleUploadComplete = useCallback(async () => {
    // Refresh media list when upload completes
    await fetchMedia();
  }, [fetchMedia]);

  const handleUploadError = useCallback((error: string) => {
    console.error('❌ Upload error:', error);
    // Error is already shown by PhotoUpload component
  }, []);

  const getMediaUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('event-media')
      .getPublicUrl(storagePath);

    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="bg-app rounded-xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-medium text-stone-800 mb-4">Moments</h2>
        <div className="bg-stone-50 rounded-lg p-8 text-center">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-600">Loading moments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-app rounded-xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium text-stone-800">Moments</h2>
        <span className="text-sm text-stone-500">{media.length} shared</span>
      </div>

      {/* Upload Section */}
      {currentUserId && (
        <div className="mb-6">
          <PhotoUpload
            eventId={eventId}
            userId={currentUserId}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            maxFiles={3}
          />
        </div>
      )}

      {/* Media Grid */}
      {media.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item, index) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square bg-stone-100 rounded-lg overflow-hidden relative">
                  {item.media_type === 'image' ? (
                    <Image
                      src={getMediaUrl(item.storage_path)}
                      alt={item.caption || 'Wedding moment'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      priority={index < 4} // Prioritize first 4 images
                      loading={index < 4 ? 'eager' : 'lazy'} // Lazy load images after the first 4
                    />
                  ) : (
                    <video
                      src={getMediaUrl(item.storage_path)}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                  )}
                  
                  {/* Media type indicator */}
                  {item.media_type === 'video' && (
                    <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                      Video
                    </div>
                  )}
                </div>
                
                {item.caption && (
                  <p className="text-sm text-stone-600 mt-2 truncate">
                    {item.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          {/* Load More Trigger */}
          {hasMore && (
            <div 
              ref={loadMoreRef} 
              className="flex justify-center py-8"
            >
              {loadingMore ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin mr-3" />
                  <span className="text-stone-600">Loading more moments...</span>
                </div>
              ) : (
                <button
                  onClick={loadMore}
                  className="px-6 py-2 text-stone-600 hover:text-stone-800 border border-stone-300 hover:border-stone-400 rounded-lg transition-colors"
                >
                  Load More
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-stone-50 rounded-lg p-8 text-center">
          <p className="text-stone-600 mb-1">
            No memories yet—but they&apos;re coming.
          </p>
          <p className="text-stone-500 text-sm">
            Be the first to share a moment from this special day.
          </p>
        </div>
      )}
    </div>
  );
}

export default memo(GuestPhotoGallery);
