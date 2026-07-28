import { useState } from 'react';
import { Platform, ContentType } from '../../types';
import { InstagramRenderer } from './renderers/InstagramRenderer';
import { FacebookRenderer } from './renderers/FacebookRenderer';
import { LinkedInRenderer } from './renderers/LinkedInRenderer';
import { TikTokRenderer } from './renderers/TikTokRenderer';
import { PlatformIcon } from './PlatformIcon';
import {
  Target,
  Sparkles,
  Calendar,
  X,
  Clock,
  HardDrive,
  Cpu,
  Video,
  Image,
} from 'lucide-react';
import { CONTENT_TYPE_LABELS } from '../../constants';

interface SocialPreviewProps {
  tipo: ContentType;
  plataforma: Platform;
  mediaUrls?: string[];
  mediaTipo?: 'imagen' | 'video' | 'pdf' | 'audio' | 'otro';
  copy?: string;
  hashtags?: string[];
  clientNombre: string;
  clientLogo?: string;
  fechaProgramada?: string;
  horaProgramada?: string;
  objetivo?: string;
  etapaEmbudo?: string;
  cta?: string;
  razonEstrategica?: string;
  isClientView?: boolean;

  // Technical metadata props for Lightbox
  resolucion?: string;
  duracionSegundos?: number;
  pesoFormateado?: string;
  formato?: string;
  fechaCarga?: string;
}

export function SocialPreview({
  tipo,
  plataforma,
  mediaUrls = [],
  mediaTipo = 'imagen',
  copy = '',
  hashtags = [],
  clientNombre,
  clientLogo,
  fechaProgramada = '17/07/2026',
  horaProgramada = '18:30',
  objetivo = 'Conversión y generación de leads',
  etapaEmbudo = 'Consideración (MOFU)',
  cta = 'Escribe "MÁS" en comentarios para recibir la guía',
  razonEstrategica = 'Seleccionado para capturar la atención en LinkedIn en horario de salida laboral mediante un carrusel interactivo.',
  resolucion = '1080x1350 px',
  duracionSegundos,
  pesoFormateado = '3.8 MB',
  formato = 'PNG / JPEG',
  fechaCarga = 'Hace unos momentos',
  isClientView = false,
}: SocialPreviewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Common visual attributes
  const initials = clientNombre
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const cleanHandle = clientNombre.toLowerCase().replace(/\s+/g, '');

  const rendererProps = {
    tipo,
    mediaUrls,
    mediaTipo,
    copy,
    clientNombre,
    clientLogo,
    initials,
    cleanHandle,
  };

  const renderVisualMockup = () => {
    switch (plataforma) {
      case 'instagram':
        return <InstagramRenderer {...rendererProps} />;
      case 'facebook':
        return <FacebookRenderer {...rendererProps} />;
      case 'linkedin':
        return <LinkedInRenderer {...rendererProps} />;
      case 'tiktok':
        return <TikTokRenderer {...rendererProps} />;
      default:
        return <InstagramRenderer {...rendererProps} />;
    }
  };

  const getStageColor = (stage: string) => {
    const s = stage.toLowerCase();
    if (s.includes('reconocimiento') || s.includes('tofu')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (s.includes('consideracion') || s.includes('mofu')) return 'bg-violet-50 text-violet-700 border-violet-100';
    if (s.includes('conversion') || s.includes('bofu')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-amber-50 text-amber-700 border-amber-100';
  };

  return (
    <div className={isClientView ? "flex flex-col items-center justify-center w-full max-w-[460px] mx-auto space-y-4" : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"}>
      {/* Columna Izquierda: Visual Mockup de la Red Social con zoom Lightbox habilitado */}
      <div
        onClick={() => mediaUrls.length > 0 && setLightboxOpen(true)}
        className={isClientView ? "flex flex-col items-center justify-center cursor-zoom-in group relative w-full" : "lg:col-span-5 flex flex-col items-center justify-center cursor-zoom-in group relative w-full"}
      >
        <div className="absolute top-2.5 right-2.5 bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1 shadow-lg">
          🔍 Ver original y metadatos
        </div>
        <div className="w-full transform group-hover:scale-[1.01] transition-transform">
          {renderVisualMockup()}
        </div>
        {!isClientView && (
          <span className="text-[10px] text-slate-400 mt-2 hover:text-slate-600 transition-colors select-none text-center">
            💡 Haz clic en la vista previa para ampliar el archivo original y ver metadatos técnicos.
          </span>
        )}
      </div>

      {/* Columna Derecha: Ficha Estratégica (Strategic Context Panel) */}
      {!isClientView && (
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-500" />
                Ficha Estratégica de Publicación
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Analizado y programado por Andrómeda AI</p>
            </div>
            <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Borrador V1
            </span>
          </div>

          {/* Metadatos en Grid */}
          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Plataforma y Formato</p>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <PlatformIcon platform={plataforma} showLabel size={12} />
                <span className="text-slate-400 font-normal">/</span>
                <span className="capitalize">{CONTENT_TYPE_LABELS[tipo] || tipo}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Programación</p>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{fechaProgramada} @ {horaProgramada}</span>
              </div>
            </div>

            <div className="space-y-1 col-span-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Etapa del Embudo</p>
              <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold w-fit ${getStageColor(etapaEmbudo)}`}>
                {etapaEmbudo}
              </div>
            </div>

            <div className="space-y-1 col-span-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Objetivo de Marketing</p>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span>{objetivo}</span>
              </div>
            </div>

            {cta && (
              <div className="space-y-1 col-span-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Call-to-Action (CTA)</p>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 font-medium text-slate-700 text-[11px] leading-relaxed">
                  {cta}
                </div>
              </div>
            )}
          </div>

          {/* Copy & Hashtags Viewer */}
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Texto del Copy</p>
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs text-slate-600 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line">
              {copy}
              {hashtags.length > 0 && (
                <p className="text-violet-600 font-semibold mt-2.5 leading-relaxed">
                  {hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}
                </p>
              )}
            </div>
          </div>

          {/* Justificación de Andrómeda */}
          {razonEstrategica && (
            <div className="bg-gradient-to-r from-violet-500/5 to-indigo-500/5 border border-violet-100 rounded-2xl p-4 space-y-1.5 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-violet-500/10 opacity-30 select-none">
                <Sparkles className="w-16 h-16" />
              </div>
              <p className="text-[9px] font-bold text-violet-600 uppercase tracking-wide flex items-center gap-1">
                ✨ Justificación Algorítmica Andrómeda AI
              </p>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {razonEstrategica}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Visor Lightbox con Información Técnica Detallada (Observación 9) */}
      {lightboxOpen && mediaUrls.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col md:flex-row items-stretch overflow-hidden animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Botón de cierre absoluto */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-[110] p-2.5 rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-slate-800 transition-colors shadow-2xl"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Columna de Multimedia (Aspect Ratio Original) */}
          <div
            className="flex-1 flex items-center justify-center p-4 md:p-8"
            onClick={e => e.stopPropagation()}
          >
            {mediaTipo === 'video' ? (
              <video
                src={mediaUrls[0]}
                controls
                autoPlay
                loop
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/5"
              />
            ) : (
              <img
                src={mediaUrls[0]}
                alt="Visual Zoom"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/5"
              />
            )}
          </div>

          {/* Panel Lateral Técnico */}
          <div
            className="w-full md:w-[360px] bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto text-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Metadatos del Archivo</h4>
                <p className="text-xs text-slate-500 mt-1">Valores provistos por Supabase Storage API</p>
              </div>

              <div className="space-y-4">
                {/* Resolución */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Resolución de Salida</p>
                    <p className="text-sm font-semibold text-slate-200">{resolucion}</p>
                  </div>
                </div>

                {/* Formato */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-violet-400 shrink-0">
                    {mediaTipo === 'video' ? <Video className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Formato / Contenedor</p>
                    <p className="text-sm font-semibold text-slate-200 uppercase">{formato}</p>
                  </div>
                </div>

                {/* Peso */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Tamaño en Disco</p>
                    <p className="text-sm font-semibold text-slate-200">{pesoFormateado}</p>
                  </div>
                </div>

                {/* Duración (solo videos) */}
                {mediaTipo === 'video' && duracionSegundos !== undefined && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Duración del Clip</p>
                      <p className="text-sm font-semibold text-slate-200">{duracionSegundos} segundos</p>
                    </div>
                  </div>
                )}

                {/* Fecha Carga */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Fecha de Subida</p>
                    <p className="text-sm font-semibold text-slate-200">{fechaCarga}</p>
                  </div>
                </div>
              </div>

              {/* Nota sobre compresión */}
              <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
                <p className="text-[10px] text-slate-400 flex items-center gap-1.5 font-bold uppercase tracking-wide mb-1">
                  💡 Optimizador Activo
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Este archivo ha sido comprimido mediante WebP/H.264 para reducir tiempos de carga en red móvil sin sacrificar nitidez.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
              <span>FPlus Storage Node</span>
              <span>v1.0.0-beta</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
