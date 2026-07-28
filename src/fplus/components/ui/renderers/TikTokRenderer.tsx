import { useState } from 'react';
import { LazyMedia } from '../LazyMedia';
import { Heart, MessageCircle, Bookmark, Share2, Music } from 'lucide-react';
import { ContentType } from '../../../types';

interface RendererProps {
  tipo: ContentType;
  mediaUrls: string[];
  mediaTipo: 'imagen' | 'video' | 'pdf' | 'audio' | 'otro';
  copy: string;
  clientNombre: string;
  clientLogo?: string;
  initials: string;
  cleanHandle: string;
}

export function TikTokRenderer({
  mediaUrls,
  copy,
  clientNombre,
  clientLogo,
  initials,
  cleanHandle,
}: RendererProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const activeMediaUrl = mediaUrls[0] || '';

  return (
    <div className="w-full max-w-[340px] mx-auto aspect-[9/16] bg-black rounded-[32px] overflow-hidden border-[6px] border-slate-900 shadow-2xl relative select-none flex flex-col">
      {/* Top Header Platforms */}
      <div className="absolute top-5 left-0 right-0 z-20 flex justify-center gap-4 text-xs font-semibold text-white/70">
        <span>Siguiendo</span>
        <span className="text-white border-b-2 border-white pb-0.5">Para ti</span>
      </div>

      {/* Media Background */}
      <div className="flex-1 bg-slate-950 flex items-center justify-center relative">
        {activeMediaUrl ? (
          <LazyMedia
            src={activeMediaUrl}
            typeHint="video"
            className="w-full h-full object-cover"
            autoPlay
            controls={false}
            loop
          />
        ) : (
          <div className="text-center p-6 text-slate-600 flex flex-col items-center gap-2">
            <span className="text-4xl">🎵</span>
            <p className="text-xs font-semibold">Previsualización de TikTok</p>
          </div>
        )}
      </div>

      {/* Bottom Left Info Overlay */}
      <div className="absolute bottom-6 left-4 right-14 z-20 text-white space-y-2 text-xs">
        <p className="font-bold flex items-center gap-1.5">
          @{cleanHandle}
          <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold scale-90">Seguir</span>
        </p>
        <p className="text-[11px] text-white/90 line-clamp-2 leading-relaxed">
          {copy || 'Este es el copy sugerido para TikTok.'}
        </p>
        <div className="flex items-center gap-2 bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-full w-fit">
          <Music className="w-3 h-3 animate-pulse" />
          <span className="text-[10px] font-medium truncate max-w-[150px]">Sonido original - {clientNombre}</span>
        </div>
      </div>

      {/* Right Side Overlay Action Icons */}
      <div className="absolute right-3.5 bottom-8 z-20 flex flex-col items-center gap-4.5 text-white">
        {/* Profile Circle */}
        <div className="relative w-10 h-10 rounded-full border border-white bg-slate-700 flex items-center justify-center">
          {clientLogo ? (
            <img src={clientLogo} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-[11px] font-bold">{initials}</span>
          )}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-[10px] shadow">
            +
          </div>
        </div>

        {/* Actions */}
        <button onClick={() => setLiked(!liked)} className="flex flex-col items-center gap-1 group">
          <div className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center hover:bg-black/40">
            <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
          </div>
          <span className="text-[10px] font-semibold">{liked ? '1,241' : '1,240'}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center hover:bg-black/40">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold">148</span>
        </button>

        <button onClick={() => setBookmarked(!bookmarked)} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center hover:bg-black/40">
            <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </div>
          <span className="text-[10px] font-semibold">89</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center hover:bg-black/40">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold">24</span>
        </button>

        {/* Spinning Vinyl Disc */}
        <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center animate-spin [animation-duration:4s] shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
        </div>
      </div>
    </div>
  );
}
