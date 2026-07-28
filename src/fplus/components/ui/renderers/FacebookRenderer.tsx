import { useState } from 'react';
import { LazyMedia } from '../LazyMedia';
import { Share2, ThumbsUp, MessageSquare, Globe, MoreHorizontal } from 'lucide-react';
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

export function FacebookRenderer({
  mediaUrls,
  mediaTipo,
  copy,
  clientNombre,
  clientLogo,
  initials,
}: RendererProps) {
  const [liked, setLiked] = useState(false);
  const activeMediaUrl = mediaUrls[0] || '';

  return (
    <div className="w-full max-w-[420px] mx-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg border border-slate-100 overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm">
            {clientLogo ? (
              <img src={clientLogo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-slate-500 font-bold">{initials}</span>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
              {clientNombre}
              <PlatformIcon platform="facebook" showLabel={false} size={11} />
            </p>
            <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
              Hace un momento · <Globe className="w-2.5 h-2.5" />
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-700">
          <MoreHorizontal className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Caption Copy text (above media in FB style) */}
      <div className="px-3.5 pb-3 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
        {copy || 'Este es el copy sugerido para Facebook.'}
      </div>

      {/* Main Media Block */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden border-y border-slate-100">
        {activeMediaUrl ? (
          <LazyMedia
            src={activeMediaUrl}
            typeHint={mediaTipo}
            className="w-full h-full object-cover"
            autoPlay
            controls={false}
            loop
          />
        ) : (
          <div className="text-center p-6 text-slate-500 flex flex-col items-center gap-2">
            <span className="text-5xl">📸</span>
            <p className="text-xs font-semibold">Previsualización de Facebook</p>
          </div>
        )}
      </div>

      {/* Bottom FB Stats */}
      <div className="px-3.5 py-2 flex items-center justify-between border-b border-slate-100 text-[10px] text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <div className="w-4.5 h-4.5 bg-blue-500 rounded-full flex items-center justify-center text-[9px] text-white shadow-sm font-bold">
            👍
          </div>
          <span>{liked ? '121' : '120'} personas</span>
        </div>
        <div>
          <span>15 comentarios · 4 veces compartido</span>
        </div>
      </div>

      {/* Bottom Action buttons */}
      <div className="px-1 py-1 flex justify-around text-xs font-bold text-slate-500">
        <button
          onClick={() => setLiked(!liked)}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors ${
            liked ? 'text-blue-600' : ''
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Me gusta</span>
        </button>
        <button className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span>Comentar</span>
        </button>
        <button className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors">
          <Share2 className="w-4 h-4" />
          <span>Compartir</span>
        </button>
      </div>
    </div>
  );
}
