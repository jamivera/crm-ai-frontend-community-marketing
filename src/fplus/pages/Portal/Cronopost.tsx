import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle2, ImageIcon, Layers, ArrowRight } from 'lucide-react';
import { mockContent } from '../../mock';
import { CONTENT_STATE_LABELS, CONTENT_TYPE_LABELS } from '../../constants';
import type { ContentState, ContentType } from '../../types';

const PORTAL_CLIENT_ID = '1';

type FilterTab = 'todos' | 'aprobar' | 'cambios' | 'aprobado' | 'publicado';

const PORTAL_VISIBLE_STATES: ContentState[] = [
  'enviado_cliente',
  'en_revision_cliente',
  'cambios_solicitados',
  'aprobado_cliente',
  'aprobado_final',
  'publicado',
];

const FILTER_STATE_MAP: Record<FilterTab, ContentState[]> = {
  todos: PORTAL_VISIBLE_STATES,
  aprobar: ['enviado_cliente', 'en_revision_cliente'],
  cambios: ['cambios_solicitados'],
  aprobado: ['aprobado_cliente', 'aprobado_final'],
  publicado: ['publicado'],
};

function getPortalStatus(state: ContentState): {
  label: string;
  colorClass: string;
  icon: React.ReactNode;
  cta?: string;
} {
  switch (state) {
    case 'enviado_cliente':
    case 'en_revision_cliente':
      return {
        label: 'Pendiente tu aprobación',
        colorClass: 'bg-amber-50 border-amber-200 text-amber-700',
        icon: <Clock className="w-3.5 h-3.5" />,
        cta: 'Revisar ahora',
      };
    case 'cambios_solicitados':
      return {
        label: 'Cambios en proceso',
        colorClass: 'bg-orange-50 border-orange-200 text-orange-700',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
      };
    case 'aprobado_cliente':
    case 'aprobado_final':
      return {
        label: 'Aprobado',
        colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    case 'publicado':
      return {
        label: 'Publicado',
        colorClass: 'bg-blue-50 border-blue-200 text-blue-700',
        icon: <ImageIcon className="w-3.5 h-3.5" />,
      };
    default:
      return {
        label: CONTENT_STATE_LABELS[state],
        colorClass: 'bg-slate-50 border-slate-200 text-slate-600',
        icon: <Layers className="w-3.5 h-3.5" />,
      };
  }
}

const TYPE_ICON_COLORS: Partial<Record<ContentType, string>> = {
  reel: 'bg-pink-100 text-pink-600',
  carrusel: 'bg-violet-100 text-violet-600',
  historia: 'bg-amber-100 text-amber-600',
  historia_video: 'bg-amber-100 text-amber-600',
  post_imagen: 'bg-blue-100 text-blue-600',
  post_video: 'bg-blue-100 text-blue-600',
  tiktok: 'bg-slate-100 text-slate-700',
};

export default function Cronopost() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todos');

  const allPieces = mockContent
    .filter(cp => cp.client_id === PORTAL_CLIENT_ID && PORTAL_VISIBLE_STATES.includes(cp.estado))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const filtered = allPieces.filter(cp => FILTER_STATE_MAP[activeFilter].includes(cp.estado));

  const counts: Record<FilterTab, number> = {
    todos: allPieces.length,
    aprobar: allPieces.filter(cp => FILTER_STATE_MAP.aprobar.includes(cp.estado)).length,
    cambios: allPieces.filter(cp => FILTER_STATE_MAP.cambios.includes(cp.estado)).length,
    aprobado: allPieces.filter(cp => FILTER_STATE_MAP.aprobado.includes(cp.estado)).length,
    publicado: allPieces.filter(cp => FILTER_STATE_MAP.publicado.includes(cp.estado)).length,
  };

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'aprobar', label: 'Por aprobar' },
    { key: 'cambios', label: 'Con cambios' },
    { key: 'aprobado', label: 'Aprobado' },
    { key: 'publicado', label: 'Publicado' },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-lg font-bold text-slate-800">Cronopost</h1>
        <p className="text-xs text-slate-400 mt-0.5">Tu contenido en producción</p>
      </div>

      {/* Filter tabs — horizontal scroll */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-1.5 ${activeFilter === tab.key ? 'text-blue-200' : 'text-slate-400'}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="px-4 space-y-3 pb-4">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay piezas en esta categoría.</p>
          </div>
        )}
        {filtered.map(cp => {
          const status = getPortalStatus(cp.estado);
          const typeColor = TYPE_ICON_COLORS[cp.tipo] ?? 'bg-slate-100 text-slate-500';
          const updatedAgo = timeAgo(cp.updated_at);
          const isOverdue = cp.fecha_limite && new Date(cp.fecha_limite) < new Date() && status.cta;

          return (
            <div
              key={cp.id}
              onClick={() => navigate(`/fplus/portal/approvals/${cp.id}`)}
              className={`bg-white rounded-2xl border overflow-hidden active:scale-[0.98] transition-transform cursor-pointer ${
                status.cta ? 'border-amber-200 shadow-sm shadow-amber-100' : 'border-slate-100'
              }`}
            >
              {/* Thumbnail placeholder */}
              <div className={`h-36 flex items-center justify-center ${typeColor.split(' ')[0].replace('text', 'bg').replace('600', '50').replace('700', '50')}`}>
                <div className={`w-14 h-14 rounded-2xl ${typeColor} flex items-center justify-center`}>
                  <span className="text-2xl">{getTypeEmoji(cp.tipo)}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                {/* Estado chip */}
                <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border mb-2 ${status.colorClass}`}>
                  {status.icon}
                  {status.label}
                </div>

                <h3 className="font-semibold text-slate-800 text-sm leading-snug">{cp.nombre}</h3>

                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 flex-wrap">
                  <span className="capitalize">{CONTENT_TYPE_LABELS[cp.tipo]}</span>
                  {cp.pilar && (
                    <>
                      <span>·</span>
                      <span>{cp.pilar}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>Actualizado {updatedAgo}</span>
                </div>

                {/* Copy preview */}
                {cp.copy_activo && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 bg-slate-50 rounded-lg p-2">
                    {cp.copy_activo}
                  </p>
                )}

                {/* Deadline warning */}
                {isOverdue && cp.fecha_limite && (
                  <p className="text-xs text-red-600 font-medium mt-2">
                    ⚠ Vencido el {new Date(cp.fecha_limite).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </p>
                )}

                {/* CTA */}
                {status.cta && (
                  <div className="mt-3 flex items-center justify-between">
                    <span />
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                      {status.cta}
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getTypeEmoji(tipo: ContentType): string {
  const map: Partial<Record<ContentType, string>> = {
    reel: '🎬',
    carrusel: '🖼️',
    historia: '📱',
    historia_video: '📱',
    post_imagen: '🖼️',
    post_video: '🎥',
    tiktok: '🎵',
    video_youtube: '▶️',
    banner: '🎨',
    infografia: '📊',
    blog: '📝',
  };
  return map[tipo] ?? '📄';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'hace unos minutos';
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}
