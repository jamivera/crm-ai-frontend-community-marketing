import { useState } from 'react';
import { LazyMedia } from '../LazyMedia';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { PlatformIcon } from '../PlatformIcon';
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

export function InstagramRenderer({
  tipo,
  mediaUrls,
  mediaTipo,
  copy,
  clientLogo,
  initials,
  cleanHandle,
}: RendererProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const activeMediaUrl = mediaUrls[activeSlide] || mediaUrls[0] || '';
  const isStories = tipo === 'historia' || tipo === 'historia_video';
  const isReel = tipo === 'reel';

  // ─── INSTAGRAM STORIES ──────────────────────────────────────────────────────
  if (isStories) {
    return (
      <div className="w-full max-w-[340px] mx-auto aspect-[9/16] bg-slate-950 rounded-[32px] overflow-hidden border-[6px] border-slate-900 shadow-2xl relative select-none flex flex-col">
        {/* Top Progress Bar */}
        <div className="absolute top-3 left-4 right-4 z-20 flex gap-1">
          {mediaUrls.length > 1 ? (
            mediaUrls.map((_, i) => (
              <div key={i} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div className={`h-full bg-white transition-all duration-300 ${i <= activeSlide ? 'w-full' : 'w-0'}`} />
              </div>
            ))
          ) : (
            <div className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white w-full" />
            </div>
          )}
        </div>

        {/* Top User Header */}
        <div className="absolute top-6 left-4 right-4 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-slate-800 flex items-center justify-center">
              {clientLogo ? (
                <img src={clientLogo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-white font-bold">{initials}</span>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-white leading-none flex items-center gap-1">
                {cleanHandle}
                <span className="text-[10px] text-white/60 font-normal">· 3h</span>
              </p>
            </div>
          </div>
          <button className="text-white hover:text-slate-200">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Media Background */}
        <div className="flex-1 bg-slate-900 flex items-center justify-center relative">
          {activeMediaUrl ? (
            <LazyMedia
              src={activeMediaUrl}
              typeHint={mediaTipo === 'video' || tipo === 'historia_video' ? 'video' : 'imagen'}
              className="w-full h-full object-cover"
              autoPlay
              controls={false}
              loop
            />
          ) : (
            <div className="text-center p-6 text-slate-500 flex flex-col items-center gap-2">
              <span className="text-4xl">📱</span>
              <p className="text-xs font-semibold">Previsualización de Historia</p>
            </div>
          )}

          {/* Swipe Controls */}
          {mediaUrls.length > 1 && (
            <>
              {activeSlide > 0 && (
                <button
                  onClick={() => setActiveSlide(s => s - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center z-20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {activeSlide < mediaUrls.length - 1 && (
                <button
                  onClick={() => setActiveSlide(s => s + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center z-20"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Bottom Interactive Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-3">
          <div className="flex-1 bg-black/25 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center">
            <input
              type="text"
              readOnly
              placeholder="Enviar mensaje..."
              className="bg-transparent text-xs text-white placeholder-white/80 outline-none w-full cursor-not-allowed"
            />
          </div>
          <button onClick={() => setLiked(!liked)} className="text-white hover:scale-105 active:scale-95 transition-transform">
            <Heart className={`w-6 h-6 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
          <button className="text-white hover:scale-105 active:scale-95 transition-transform">
            <Send className="w-5 h-5 -rotate-12" />
          </button>
        </div>
      </div>
    );
  }

  // ─── INSTAGRAM REEL ────────────────────────────────────────────────────────
  if (isReel) {
    return (
      <div className="w-full max-w-[340px] mx-auto aspect-[9/16] bg-black rounded-[32px] overflow-hidden border-[6px] border-slate-900 shadow-2xl relative select-none flex flex-col">
        <div className="absolute top-5 left-0 right-0 z-20 flex justify-center gap-4 text-xs font-semibold text-white/70">
          <span className="text-white border-b-2 border-white pb-0.5">Reels</span>
        </div>

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
              <span className="text-4xl">🎬</span>
              <p className="text-xs font-semibold">Previsualización de Reel</p>
            </div>
          )}
        </div>

        <div className="absolute bottom-6 left-4 right-14 z-20 text-white space-y-2 text-xs">
          <p className="font-bold flex items-center gap-1.5">
            @{cleanHandle}
            <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold scale-90">Seguir</span>
          </p>
          <p className="text-[11px] text-white/90 line-clamp-2 leading-relaxed">
            {copy || 'Este es el copy sugerido para el Reel, diseñado para enganchar y retener.'}
          </p>
        </div>

        <div className="absolute right-3.5 bottom-8 z-20 flex flex-col items-center gap-4.5 text-white">
          <div className="w-10 h-10 rounded-full border border-white bg-slate-700 flex items-center justify-center">
            {clientLogo ? (
              <img src={clientLogo} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold">{initials}</span>
            )}
          </div>

          <button onClick={() => setLiked(!liked)} className="flex flex-col items-center gap-1">
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
        </div>
      </div>
    );
  }

  // ─── INSTAGRAM STANDARD POST / CAROUSEL ────────────────────────────────────
  return (
    <div className="w-full max-w-[420px] mx-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col select-none">
      <div className="flex items-center justify-between p-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
            {clientLogo ? (
              <img src={clientLogo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-slate-500 font-bold">{initials}</span>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              {cleanHandle}
              <PlatformIcon platform="instagram" showLabel={false} size={11} />
            </p>
            <p className="text-[9px] text-slate-400 leading-none mt-0.5">Instagram</p>
          </div>
        </div>
        <button className="text-slate-500 hover:text-slate-800">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="relative aspect-square w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {activeMediaUrl ? (
          <LazyMedia
            src={activeMediaUrl}
            typeHint={mediaTipo}
            className="w-full h-full object-cover animate-fade-in"
            autoPlay
            controls={false}
            loop
          />
        ) : (
          <div className="text-center p-6 text-slate-500 flex flex-col items-center gap-2">
            <span className="text-5xl">📸</span>
            <p className="text-xs font-semibold">Previsualización de Publicación</p>
          </div>
        )}

        {mediaUrls.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20">
            {activeSlide + 1}/{mediaUrls.length}
          </div>
        )}

        {mediaUrls.length > 1 && (
          <>
            {activeSlide > 0 && (
              <button
                onClick={() => setActiveSlide(s => s - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/75 hover:bg-white text-slate-700 flex items-center justify-center shadow z-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {activeSlide < mediaUrls.length - 1 && (
              <button
                onClick={() => setActiveSlide(s => s + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/75 hover:bg-white text-slate-700 flex items-center justify-center shadow z-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      <div className="p-3.5 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setLiked(!liked)} className="hover:scale-105 transition-transform text-slate-700 hover:text-red-500">
              <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button className="hover:scale-105 transition-transform text-slate-700">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="hover:scale-105 transition-transform text-slate-700">
              <Send className="w-4.5 h-4.5 -rotate-12" />
            </button>
          </div>
          {mediaUrls.length > 1 && (
            <div className="flex gap-1">
              {mediaUrls.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === activeSlide ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          )}
          <button onClick={() => setBookmarked(!bookmarked)} className="hover:scale-105 transition-transform text-slate-700">
            <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-slate-800 text-slate-800' : ''}`} />
          </button>
        </div>

        <p className="text-[11px] font-extrabold text-slate-800 leading-none">
          Les gusta a {liked ? '985' : '984'} personas
        </p>

        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-extrabold text-slate-800 mr-1.5">@{cleanHandle}</span>
          <span className="whitespace-pre-line">{copy}</span>
        </div>
      </div>
    </div>
  );
}
