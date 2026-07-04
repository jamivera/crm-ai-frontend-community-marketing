import React, { useState, useRef } from 'react';
import { X, Plus, Upload, Sparkles, RotateCcw, Copy, Check } from 'lucide-react';
import { useFplusStore } from '../../store';
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS, getAllowedPlatforms } from '../../constants';
import { suggestHashtags } from '../../utils/hashtagSuggester';
import { generateCopy, type GeneratedCopy } from '../../utils/copyGenerator';
import type { ContentType, Platform, ContentState } from '../../types';

interface Props {
  clientId: string;
  clientNombre: string;
  defaultDate?: string; // YYYY-MM-DD
  onClose: () => void;
}

const TIPOS: ContentType[] = ['reel', 'carrusel', 'post_imagen', 'historia', 'historia_video', 'post_video', 'tiktok', 'diseno_comodin'];
const PLATAFORMAS: Platform[] = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter'];
const ESTADOS: { value: ContentState; label: string }[] = [
  { value: 'borrador',        label: 'Borrador' },
  { value: 'en_produccion',   label: 'En producción' },
  { value: 'enviado_cliente', label: 'Enviado al cliente' },
  { value: 'aprobado_final',  label: 'Aprobado' },
  { value: 'publicado',       label: 'Publicado' },
];

const TYPE_EMOJI: Record<string, string> = {
  reel: '🎬', carrusel: '🖼️', historia: '📱', historia_video: '📱',
  post_imagen: '🖼️', post_video: '🎥', tiktok: '🎵',
};

interface HashtagSuggestion {
  alcance: string[];
  nicho: string[];
  conversion: string[];
  marca: string[];
}

const CATEGORY_LABELS: Record<keyof HashtagSuggestion, { label: string; color: string }> = {
  alcance:    { label: 'Alcance',    color: 'bg-blue-50 text-blue-700' },
  nicho:      { label: 'Nicho',      color: 'bg-emerald-50 text-emerald-700' },
  conversion: { label: 'Conversión', color: 'bg-orange-50 text-orange-700' },
  marca:      { label: 'Marca',      color: 'bg-violet-50 text-violet-700' },
};

export function NewPieceModal({ clientId, clientNombre, defaultDate, onClose }: Props) {
  const createContent = useFplusStore(s => s.createContent);
  const briefs        = useFplusStore(s => s.briefs);
  const clients       = useFplusStore(s => s.clients);
  const brief         = briefs[clientId];
  const client        = clients.find(c => c.id === clientId);
  // Solo las plataformas contratadas en el plan del cliente
  const plataformasPermitidas = client ? getAllowedPlatforms(client) : PLATAFORMAS;

  // Form state
  const [nombre,       setNombre]       = useState('');
  const [tipo,         setTipo]         = useState<ContentType>('reel');
  const [plataforma,   setPlataforma]   = useState<Platform>(client && getAllowedPlatforms(client)[0] || 'instagram');
  const [fecha,        setFecha]        = useState(defaultDate ?? new Date().toISOString().slice(0, 10));
  const [hora,         setHora]         = useState('12:00');
  const [estado,       setEstado]       = useState<ContentState>('borrador');
  const [copy,         setCopy]         = useState('');
  const [hashtags,     setHashtags]     = useState<string[]>(brief?.hashtags_habituales ?? []);
  const [hashInput,    setHashInput]    = useState('');

  // File upload state
  const [filePreview,  setFilePreview]  = useState<string | null>(null);
  const [fileName,     setFileName]     = useState<string | null>(null);
  const [fileType,     setFileType]     = useState<'imagen' | 'video' | null>(null);
  const [dragging,     setDragging]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Validación
  const [errors, setErrors] = useState<Record<string, string>>({});

  // IA state
  const [iaLoading,    setIaLoading]    = useState(false);
  const [copyLoading,  setCopyLoading]  = useState(false);
  const [copyResult,   setCopyResult]   = useState<GeneratedCopy | null>(null);
  const [iaSuggestion, setIaSuggestion] = useState<HashtagSuggestion | null>(null);
  const [iaCopied,     setIaCopied]     = useState(false);

  // ─── File handling ─────────────────────────────────────────────────────────

  const handleFile = (file: File) => {
    setFileName(file.name);
    const isVideo = file.type.startsWith('video/');
    setFileType(isVideo ? 'video' : 'imagen');
    const reader = new FileReader();
    reader.onload = e => setFilePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ─── Hashtag helpers ────────────────────────────────────────────────────────

  const addHashtag = () => {
    const tag = hashInput.trim().startsWith('#')
      ? hashInput.trim()
      : `#${hashInput.trim()}`;
    if (tag.length > 1 && !hashtags.includes(tag)) {
      setHashtags(prev => [...prev, tag]);
    }
    setHashInput('');
  };

  const removeHashtag = (tag: string) => setHashtags(prev => prev.filter(t => t !== tag));

  // ─── IA hashtag suggestion ─────────────────────────────────────────────────

  const runIaSuggestion = async () => {
    setIaLoading(true);
    setIaSuggestion(null);
    try {
      const result = await suggestHashtags({
        copy,
        clientNombre,
        industria: client?.industria ?? '',
        tipo,
        plataforma,
        ciudad: 'Quito',
        pais:   'Ecuador',
      });
      setIaSuggestion(result);
    } finally {
      setIaLoading(false);
    }
  };

  const applyIaSuggestion = () => {
    if (!iaSuggestion) return;
    const all = [
      ...iaSuggestion.alcance,
      ...iaSuggestion.nicho,
      ...iaSuggestion.conversion,
      ...iaSuggestion.marca,
    ];
    setHashtags(prev => {
      const existing = new Set(prev);
      return [...prev, ...all.filter(t => !existing.has(t))];
    });
    setIaSuggestion(null);
  };

  const copyAllHashtags = () => {
    if (!iaSuggestion) return;
    const text = [
      ...iaSuggestion.alcance,
      ...iaSuggestion.nicho,
      ...iaSuggestion.conversion,
      ...iaSuggestion.marca,
    ].join(' ');
    navigator.clipboard.writeText(text).catch(() => {});
    setIaCopied(true);
    setTimeout(() => setIaCopied(false), 1800);
  };

  // ─── Save ──────────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombre.trim())  e.nombre = 'El nombre de la pieza es obligatorio.';
    if (!tipo)           e.tipo = 'Selecciona el formato.';
    if (!plataforma)     e.plataforma = 'Selecciona la plataforma.';
    if (!fecha)          e.fecha = 'Indica la fecha de publicación.';
    if (!filePreview)    e.archivo = 'Sube el archivo multimedia de la pieza.';
    if (!copy.trim())    e.copy = 'El copy es obligatorio.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = (estadoFinal: ContentState) => {
    if (!validate()) return;
    const estado = estadoFinal;
    const now = new Date().toISOString();
    createContent({
      id: `cp_${Date.now()}`,
      client_id: clientId,
      client_nombre: clientNombre,
      nombre: nombre.trim(),
      tipo,
      plataforma,
      fecha_publicacion: `${fecha}T${hora}:00.000Z`,
      estado,
      copy_activo: copy.trim() || undefined,
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      incluye_cta: false,
      iteraciones: 0,
      max_iteraciones: 3,
      account_manager_id: 'u1',
      account_manager_nombre: 'Andrea Solís',
      archivos: fileName && fileType ? [{
        id: `cf_${Date.now()}`,
        nombre: fileName,
        tipo: fileType,
        url: filePreview ?? '',
        thumbnail_url: fileType === 'imagen' ? (filePreview ?? undefined) : undefined,
        tamanio_bytes: 0,
        version: 1,
        es_version_activa: true,
        subido_por_nombre: 'Andrea Solís',
        created_at: now,
      }] : [],
      created_at: now,
      updated_at: now,
    });
    onClose();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">Nueva pieza de contenido</h2>
            <p className="text-xs text-slate-400 mt-0.5">{clientNombre}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body — two columns */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-0">

            {/* LEFT — Upload + meta */}
            <div className="px-5 py-4 space-y-4 border-b sm:border-b-0 sm:border-r border-slate-100">

              {/* Upload zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Archivo multimedia
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*,.pdf"
                  onChange={onFileChange}
                  className="hidden"
                />

                {filePreview ? (
                  <div className="relative rounded-xl overflow-hidden bg-slate-100 h-36">
                    {fileType === 'video' ? (
                      <video
                        src={filePreview}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img src={filePreview} alt={fileName ?? ''} className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => { setFilePreview(null); setFileName(null); setFileType(null); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full">
                      {fileName}
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <Upload className={`w-7 h-7 mx-auto mb-2 ${dragging ? 'text-blue-500' : 'text-slate-300'}`} />
                    <p className="text-xs font-medium text-slate-500">Arrastra o haz clic</p>
                    <p className="text-[10px] text-slate-400 mt-1">MP4 · MOV · JPG · PNG · PDF</p>
                  </div>
                )}
              </div>

              {/* Tipo + Plataforma */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Tipo</label>
                  <select
                    value={tipo}
                    onChange={e => setTipo(e.target.value as ContentType)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TIPOS.map(t => (
                      <option key={t} value={t}>{TYPE_EMOJI[t] ?? ''} {CONTENT_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Plataforma</label>
                  <select
                    value={plataforma}
                    onChange={e => setPlataforma(e.target.value as Platform)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {plataformasPermitidas.map(p => (
                      <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha + Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Hora</label>
                  <input
                    type="time"
                    value={hora}
                    onChange={e => setHora(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Nombre + Estado */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Nombre de la pieza *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Reel Cocina Abierta"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Estado inicial</label>
                <select
                  value={estado}
                  onChange={e => setEstado(e.target.value as ContentState)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ESTADOS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* RIGHT — Copy + Hashtags + IA */}
            <div className="px-5 py-4 space-y-4">

              {/* Copy */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Copy *</label>
                  <button
                    onClick={async () => {
                      if (!client) return;
                      setCopyLoading(true);
                      setCopyResult(null);
                      try {
                        const r = await generateCopy({
                          clientNombre,
                          industria: client.tipo_mercado ?? client.industria,
                          tipo,
                          plataforma,
                          objetivo: client.objetivo_marketing ?? 'alcance',
                          tema: nombre,
                        });
                        setCopy(r.copy);
                        setHashtags(prev => {
                          const ex = new Set(prev);
                          return [...prev, ...r.hashtags.filter(t => !ex.has(t))];
                        });
                        setCopyResult(r);
                      } finally {
                        setCopyLoading(false);
                      }
                    }}
                    disabled={copyLoading}
                    className="flex items-center gap-1 text-[10px] font-semibold bg-violet-600 text-white px-2.5 py-1 rounded-lg hover:bg-violet-700 disabled:opacity-60"
                  >
                    {copyLoading ? (
                      <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {copyLoading ? 'Generando…' : 'Generar Copy con IA'}
                  </button>
                </div>
                <textarea
                  value={copy}
                  onChange={e => setCopy(e.target.value)}
                  placeholder="Escribe el copy para esta publicación..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {copyResult && (
                  <div className="mt-2 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5 space-y-1.5">
                    <p className="text-[9px] font-bold text-violet-500 uppercase tracking-wide">Metodología Andrómeda</p>
                    <p className="text-[11px] text-slate-600"><strong className="text-violet-700">Hook:</strong> {copyResult.hook}</p>
                    <p className="text-[11px] text-slate-600"><strong className="text-violet-700">CTA:</strong> {copyResult.cta}</p>
                    <p className="text-[11px] text-slate-600"><strong className="text-violet-700">Ángulo de venta:</strong> {copyResult.angulo_venta}</p>
                    <p className="text-[11px] text-slate-600"><strong className="text-violet-700">Objetivo:</strong> {copyResult.objetivo_contenido}</p>
                  </div>
                )}
              </div>

              {/* Hashtags manuales */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Hashtags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={hashInput}
                    onChange={e => setHashInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }}
                    placeholder="#hashtag"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={addHashtag} className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {hashtags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {tag}
                        <button onClick={() => removeHashtag(tag)}>
                          <X className="w-2.5 h-2.5 opacity-50 hover:opacity-100" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* IA Hashtag Suggester */}
              <div className="bg-violet-50 border border-violet-100 rounded-xl overflow-hidden">
                <div className="px-3 py-2.5 flex items-center justify-between border-b border-violet-100">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    <span className="text-xs font-bold text-violet-700">Asistente IA</span>
                  </div>
                  <div className="flex gap-1.5">
                    {iaSuggestion && (
                      <>
                        <button
                          onClick={copyAllHashtags}
                          className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 hover:text-violet-800 bg-white px-2 py-1 rounded-lg border border-violet-200"
                        >
                          {iaCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {iaCopied ? 'Copiado' : 'Copiar'}
                        </button>
                        <button
                          onClick={runIaSuggestion}
                          className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 hover:text-violet-800 bg-white px-2 py-1 rounded-lg border border-violet-200"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Regenerar
                        </button>
                      </>
                    )}
                    <button
                      onClick={iaSuggestion ? applyIaSuggestion : runIaSuggestion}
                      disabled={iaLoading}
                      className="flex items-center gap-1 text-[10px] font-semibold bg-violet-600 text-white px-2.5 py-1 rounded-lg hover:bg-violet-700 disabled:opacity-60"
                    >
                      {iaLoading ? (
                        <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {iaLoading ? 'Analizando...' : iaSuggestion ? 'Aplicar todos' : 'Analizar y sugerir'}
                    </button>
                  </div>
                </div>

                {/* IA results */}
                {iaLoading && (
                  <div className="px-3 py-4 text-center">
                    <div className="inline-block w-5 h-5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin mb-2" />
                    <p className="text-xs text-violet-500">Analizando copy, industria y tipo de contenido...</p>
                  </div>
                )}
                {iaSuggestion && !iaLoading && (
                  <div className="px-3 py-2.5 space-y-2.5">
                    {(Object.keys(CATEGORY_LABELS) as (keyof HashtagSuggestion)[]).map(cat => {
                      const tags = iaSuggestion[cat];
                      if (!tags.length) return null;
                      const { label, color } = CATEGORY_LABELS[cat];
                      return (
                        <div key={cat}>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                          <div className="flex flex-wrap gap-1">
                            {tags.map(tag => (
                              <button
                                key={tag}
                                onClick={() => {
                                  if (!hashtags.includes(tag)) setHashtags(prev => [...prev, tag]);
                                }}
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${color} hover:ring-1 hover:ring-current transition-all`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!iaSuggestion && !iaLoading && (
                  <div className="px-3 py-3 text-xs text-violet-400 text-center">
                    Analiza copy + industria + tipo para sugerir hashtags por categoría
                  </div>
                )}
              </div>

              {/* Future IA features — disabled placeholder */}
              <div className="flex flex-wrap gap-1.5 opacity-40">
                {['✨ Mejorar copy', '✨ Generar CTA', '✨ Variantes', '✨ Engagement'].map(f => (
                  <span key={f} className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded-lg cursor-not-allowed">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Errores de validación */}
        {Object.keys(errors).length > 0 && (
          <div className="px-5 py-2.5 bg-red-50 border-t border-red-100 flex-shrink-0">
            {Object.values(errors).map(msg => (
              <p key={msg} className="text-[11px] text-red-600">• {msg}</p>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleSave('borrador')}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200"
          >
            Guardar borrador
          </button>
          <button
            onClick={() => handleSave(estado === 'borrador' ? 'enviado_cliente' : estado)}
            className="flex-2 py-2.5 px-5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
          >
            Enviar a revisión →
          </button>
        </div>
      </div>
    </div>
  );
}
