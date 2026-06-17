import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { usePortalContext } from './PortalContext';
import { useFplusStore } from '../../store';
import { CONTENT_STATE_LABELS, CONTENT_TYPE_LABELS } from '../../constants';
import type { ContentType, ContentState } from '../../types';

const PORTAL_VISIBLE_STATES: ContentState[] = [
  'enviado_cliente', 'en_revision_cliente', 'cambios_solicitados',
  'aprobado_cliente', 'aprobado_final', 'publicado',
];

type FilterTab = 'todos' | 'reel' | 'carrusel' | 'historia' | 'post_imagen' | 'publicado';

const TABS: { key: FilterTab; label: string; emoji: string }[] = [
  { key: 'todos', label: 'Todos', emoji: '🗂️' },
  { key: 'reel', label: 'Reels', emoji: '🎬' },
  { key: 'carrusel', label: 'Carruseles', emoji: '🖼️' },
  { key: 'historia', label: 'Historias', emoji: '📱' },
  { key: 'post_imagen', label: 'Posts', emoji: '📸' },
  { key: 'publicado', label: 'Publicados', emoji: '✅' },
];

const TYPE_GRADIENTS: Partial<Record<ContentType, string>> = {
  reel: 'from-pink-100 to-pink-200',
  carrusel: 'from-violet-100 to-violet-200',
  historia: 'from-amber-100 to-amber-200',
  historia_video: 'from-amber-100 to-amber-200',
  post_imagen: 'from-blue-100 to-blue-200',
  post_video: 'from-blue-100 to-blue-200',
  tiktok: 'from-slate-100 to-slate-200',
};

const STATE_ICON: Partial<Record<ContentState, React.ReactNode>> = {
  aprobado_final: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  aprobado_cliente: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  publicado: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />,
  enviado_cliente: <Clock className="w-3.5 h-3.5 text-amber-500" />,
  en_revision_cliente: <Clock className="w-3.5 h-3.5 text-amber-500" />,
};

export default function PortalMultimedia() {
  const navigate = useNavigate();
  const { clientId } = usePortalContext();
  const contentPieces = useFplusStore(s => s.contentPieces);
  const [activeTab, setActiveTab] = useState<FilterTab>('todos');
  const [preview, setPreview] = useState<typeof pieces[0] | null>(null);

  const pieces = contentPieces.filter(
    cp => cp.client_id === clientId && PORTAL_VISIBLE_STATES.includes(cp.estado)
  );

  const filtered = pieces.filter(cp => {
    if (activeTab === 'todos') return true;
    if (activeTab === 'publicado') return cp.estado === 'publicado';
    if (activeTab === 'historia') return cp.tipo === 'historia' || cp.tipo === 'historia_video';
    return cp.tipo === activeTab;
  });

  const counts = Object.fromEntries(
    TABS.map(t => [
      t.key,
      t.key === 'todos' ? pieces.length :
      t.key === 'publicado' ? pieces.filter(cp => cp.estado === 'publicado').length :
      t.key === 'historia' ? pieces.filter(cp => cp.tipo === 'historia' || cp.tipo === 'historia_video').length :
      pieces.filter(cp => cp.tipo === t.key).length,
    ])
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-lg font-bold text-slate-800">Archivos</h1>
        <p className="text-xs text-slate-400 mt-0.5">Tu biblioteca de contenido</p>
      </div>

      {/* Filter tabs */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`${activeTab === tab.key ? 'text-blue-200' : 'text-slate-400'}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="px-4 pb-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-sm">No hay contenido en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(cp => {
              const gradient = TYPE_GRADIENTS[cp.tipo] ?? 'from-slate-100 to-slate-200';
              const isPending = cp.estado === 'enviado_cliente' || cp.estado === 'en_revision_cliente';

              return (
                <div
                  key={cp.id}
                  onClick={() => setPreview(cp)}
                  className={`rounded-2xl overflow-hidden border cursor-pointer active:scale-[0.97] transition-transform ${
                    isPending ? 'border-amber-200' : 'border-slate-100'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className={`aspect-square bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
                    <span className="text-4xl">{getTypeEmoji(cp.tipo)}</span>
                    {isPending && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="bg-white px-2.5 py-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">{cp.nombre}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {STATE_ICON[cp.estado]}
                      <span className="text-[10px] text-slate-400 truncate capitalize">
                        {CONTENT_STATE_LABELS[cp.estado]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80" onClick={() => setPreview(null)}>
          <div
            className="mt-auto bg-white rounded-t-3xl overflow-hidden max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-800">{preview.nombre}</p>
                <p className="text-xs text-slate-400 capitalize">{CONTENT_TYPE_LABELS[preview.tipo]}</p>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-4 space-y-4">
              {/* Preview */}
              <div className={`rounded-2xl h-48 bg-gradient-to-br ${TYPE_GRADIENTS[preview.tipo] ?? 'from-slate-100 to-slate-200'} flex items-center justify-center`}>
                <span className="text-6xl">{getTypeEmoji(preview.tipo)}</span>
              </div>

              {/* State */}
              <div className="flex items-center gap-2">
                {STATE_ICON[preview.estado]}
                <span className="text-sm text-slate-600">{CONTENT_STATE_LABELS[preview.estado]}</span>
              </div>

              {/* Copy */}
              {preview.copy_activo && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium mb-1">Copy</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{preview.copy_activo}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pb-2">
                {(preview.estado === 'enviado_cliente' || preview.estado === 'en_revision_cliente') && (
                  <button
                    onClick={() => {
                      setPreview(null);
                      navigate(`/fplus/portal/approvals/${preview.id}`);
                    }}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold"
                  >
                    Revisar y aprobar
                  </button>
                )}
                <button
                  onClick={() => {
                    setPreview(null);
                    navigate(`/fplus/portal/approvals/${preview.id}`);
                  }}
                  className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium"
                >
                  <MessageSquare className="w-4 h-4" />
                  Comentar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTypeEmoji(tipo: ContentType): string {
  const map: Partial<Record<ContentType, string>> = {
    reel: '🎬', carrusel: '🖼️', historia: '📱', historia_video: '📱',
    post_imagen: '📸', post_video: '🎥', tiktok: '🎵', video_youtube: '▶️',
    banner: '🎨', infografia: '📊', blog: '📝',
  };
  return map[tipo] ?? '📄';
}
