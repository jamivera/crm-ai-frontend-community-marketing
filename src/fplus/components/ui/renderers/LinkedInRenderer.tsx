import { useState } from 'react';
import { LazyMedia } from '../LazyMedia';
import { ThumbsUp, MessageSquare, Share2, Send, Globe, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
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

export function LinkedInRenderer({
  tipo,
  mediaUrls,
  mediaTipo,
  copy,
  clientNombre,
  clientLogo,
  initials,
}: RendererProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [recommended, setRecommended] = useState(false);
  const activeMediaUrl = mediaUrls[activeSlide] || mediaUrls[0] || '';
  const isDocument = tipo === 'carrusel'; // LinkedIn document carousel style

  return (
    <div className="w-full max-w-[420px] mx-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shadow-sm">
            {clientLogo ? (
              <img src={clientLogo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-white font-bold">{initials}</span>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-none">
              {clientNombre}
              <PlatformIcon platform="linkedin" showLabel={false} size={11} />
            </p>
            <p className="text-[9px] text-slate-400 mt-1 leading-none">
              Desarrollador estratégico · 2d · <Globe className="w-2.5 h-2.5 inline" />
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-700">
          <MoreHorizontal className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Copy / Post Content */}
      <div className="px-3.5 pb-3 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
        {copy || 'Este es el copy sugerido para LinkedIn.'}
      </div>

      {/* Media Block / Document Viewer */}
      <div className="relative aspect-video w-full bg-slate-100 flex items-center justify-center overflow-hidden border-y border-slate-200">
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
          <div className="text-center p-6 text-slate-400 flex flex-col items-center gap-2">
            <span className="text-5xl">📄</span>
            <p className="text-xs font-semibold">Previsualización de LinkedIn</p>
          </div>
        )}

        {/* Carousel PDF-style slides indicator */}
        {isDocument && mediaUrls.length > 0 && (
          <div className="absolute top-3 right-3 bg-black/75 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
            Página {activeSlide + 1} de {mediaUrls.length}
          </div>
        )}

        {isDocument && mediaUrls.length > 1 && (
          <>
            {activeSlide > 0 && (
              <button
                onClick={() => setActiveSlide(s => s - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center z-20 shadow"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {activeSlide < mediaUrls.length - 1 && (
              <button
                onClick={() => setActiveSlide(s => s + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center z-20 shadow"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Bottom stats indicators */}
      <div className="px-3.5 py-2 flex items-center justify-between border-b border-slate-100 text-[10px] text-slate-400 font-medium">
        <div className="flex items-center gap-1">
          <span className="text-[10px] shadow-sm bg-blue-100 rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">
            👏
          </span>
          <span>{recommended ? '46' : '45'} recomendaciones</span>
        </div>
        <div>
          <span>8 comentarios · 2 veces compartido</span>
        </div>
      </div>

      {/* Action Rows */}
      <div className="px-1 py-1 flex justify-around text-xs font-semibold text-slate-500">
        <button
          onClick={() => setRecommended(!recommended)}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors ${
            recommended ? 'text-blue-600' : ''
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Recomendar</span>
        </button>
        <button className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span>Comentar</span>
        </button>
        <button className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors">
          <Share2 className="w-4 h-4" />
          <span>Compartir</span>
        </button>
        <button className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors">
          <Send className="w-4 h-4 -rotate-12" />
          <span>Enviar</span>
        </button>
      </div>
    </div>
  );
}
