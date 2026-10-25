import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { supabase, supabaseUrl } from '../lib/supabase';

interface BookCoverProps {
  coverPath?: string | null;
  title: string;
  author?: string;
  category?: string;
  className?: string;
  aspectClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Resolves a cover_path to a reliable image URL.
 * Handles:
 * - Direct full URLs (https://...)
 * - Local storage paths or filenames (e.g. "cover_123.jpg")
 * - Paths prefixed with "book-covers/"
 */
export const resolveCoverUrl = (path?: string | null): string => {
  if (!path || !path.trim()) return '';
  const clean = path.trim();

  // If already a full HTTP or data URL
  if (
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('data:') ||
    clean.startsWith('blob:')
  ) {
    return clean;
  }

  // Strip leading slash or bucket name if present
  const relative = clean.replace(/^(\/)?(book-covers\/)?/, '');
  if (!relative) return '';

  const { data } = supabase.storage.from('book-covers').getPublicUrl(relative);
  return data?.publicUrl || `${supabaseUrl}/storage/v1/object/public/book-covers/${relative}`;
};

export const BookCover: React.FC<BookCoverProps> = ({
  coverPath,
  title,
  author,
  category,
  className = '',
  aspectClassName = 'aspect-[3/4]',
  size = 'md',
}) => {
  const [imageError, setImageError] = useState(false);
  const [triedProxy, setTriedProxy] = useState(false);
  const resolvedUrl = resolveCoverUrl(coverPath);

  // Reset error state whenever the coverPath prop updates
  useEffect(() => {
    setImageError(false);
    setTriedProxy(false);
  }, [coverPath]);

  const hasValidCover = Boolean(resolvedUrl && !imageError);

  if (hasValidCover) {
    return (
      <div className={`relative ${aspectClassName} bg-gray-100 overflow-hidden ${className}`}>
        <img
          src={resolvedUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // If direct Supabase domain fails (e.g. adblocker or firewall), try local proxy
            if (!triedProxy && resolvedUrl.includes('supabase.co/storage/v1/object/public/book-covers/')) {
              setTriedProxy(true);
              const proxyUrl = resolvedUrl.replace(
                'https://pkrevkitxefvyozcvgrz.supabase.co/storage/v1/object/public/book-covers/',
                '/api/supabase/storage/v1/object/public/book-covers/'
              );
              (e.target as HTMLImageElement).src = proxyUrl;
            } else {
              setImageError(true);
            }
          }}
        />
      </div>
    );
  }

  // Clean, neutral BOOK-TIIS digital book cover placeholder
  // Used only when a real book has no uploaded cover or image fails to load
  return (
    <div
      className={`relative ${aspectClassName} bg-gradient-to-br from-[#0c5932] via-[#087A43] to-[#054323] text-white p-4 flex flex-col justify-between overflow-hidden select-none border-l-4 border-emerald-400/40 shadow-inner ${className}`}
      role="img"
      aria-label={`Jeldiga buugga: ${title}`}
    >
      {/* Decorative Book Spine & Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />

      {/* Top Banner: Logo & Category */}
      <div className="relative z-10 flex items-center justify-between gap-1 border-b border-white/15 pb-2">
        <span className="text-[9px] font-black tracking-widest uppercase text-emerald-200">
          BOOK-TIIS
        </span>
        {category && (
          <span className="text-[8px] font-bold uppercase tracking-wider bg-white/15 px-1.5 py-0.5 rounded text-white/90 truncate max-w-[80px]">
            {category}
          </span>
        )}
      </div>

      {/* Middle: Title & Emblem */}
      <div className="relative z-10 my-auto py-2 text-center flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-2 text-emerald-200">
          <BookOpen className="w-4 h-4" />
        </div>
        <h4 className={`font-black text-white leading-snug line-clamp-3 uppercase tracking-tight text-shadow-sm ${
          size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-lg sm:text-xl' : 'text-xs sm:text-sm'
        }`}>
          {title}
        </h4>
      </div>

      {/* Bottom: Author & Footer Tag */}
      <div className="relative z-10 border-t border-white/15 pt-2 text-center">
        {author && (
          <p className="text-[10px] font-medium text-emerald-100/90 line-clamp-1 italic">
            {author}
          </p>
        )}
        <span className="text-[8px] text-emerald-300/70 font-semibold uppercase tracking-wider block mt-0.5">
          Qoraal Dijitaal ah
        </span>
      </div>
    </div>
  );
};
