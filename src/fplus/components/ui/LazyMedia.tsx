import { useState, useEffect, useRef } from 'react';
import { getMediaFile } from '../../utils/db';
import { Film, Image as ImageIcon, Loader2 } from 'lucide-react';

interface LazyMediaProps {
  src?: string;
  alt?: string;
  className?: string;
  typeHint?: 'imagen' | 'video' | 'pdf' | 'audio' | 'otro';
  controls?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
}

export function LazyMedia({
  src,
  alt = '',
  className = '',
  typeHint,
  controls = false,
  muted = true,
  autoPlay = false,
  loop = true,
}: LazyMediaProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!src) {
      setResolvedSrc(null);
      return;
    }

    if (src.startsWith('indexeddb:')) {
      const fileId = src.replace('indexeddb:', '');
      setLoading(true);
      setError(false);
      getMediaFile(fileId)
        .then(data => {
          if (data) {
            setResolvedSrc(data);
          } else {
            setError(true);
          }
        })
        .catch(() => {
          setError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setResolvedSrc(src);
      setLoading(false);
      setError(false);
    }
  }, [src]);

  // Determinar si es video
  const isVideo =
    typeHint === 'video' ||
    (resolvedSrc && resolvedSrc.startsWith('data:video/')) ||
    (src && /\.(mp4|mov|webm)/i.test(src));

  const handleMouseEnter = () => {
    if (isVideo && videoRef.current && !controls) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (isVideo && videoRef.current && !controls) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-50 text-slate-400 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin opacity-50" />
      </div>
    );
  }

  if (error || !src || (!resolvedSrc && !loading)) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-50 text-slate-300 gap-1.5 ${className}`}>
        {typeHint === 'video' ? (
          <Film className="w-5 h-5 opacity-40" />
        ) : (
          <ImageIcon className="w-5 h-5 opacity-40" />
        )}
        <span className="text-[10px] text-slate-400 font-medium">Sin previsualización</span>
      </div>
    );
  }

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        src={resolvedSrc!}
        controls={controls}
        muted={muted}
        autoPlay={autoPlay}
        loop={loop}
        playsInline
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`object-cover bg-slate-900 ${className}`}
      />
    );
  }

  return (
    <img
      src={resolvedSrc!}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
}
