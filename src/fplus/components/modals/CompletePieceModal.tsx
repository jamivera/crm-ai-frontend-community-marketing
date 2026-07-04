import { useState, useRef } from 'react';
import { X, Upload, Sparkles, Send } from 'lucide-react';
import { useFplusStore } from '../../store';
import { CONTENT_TYPE_LABELS } from '../../constants';
import { generateCopy } from '../../utils/copyGenerator';
import type { ContentPiece } from '../../types';

// Completar contenido de una pieza planificada por IA:
// la planificación (fecha/tipo/plataforma) ya existe — aquí solo se agrega
// el contenido real: multimedia, copy y hashtags, y se envía a revisión.

interface Props {
  piece: ContentPiece;
  onClose: () => void;
}

export function CompletePieceModal({ piece, onClose }: Props) {
  const updateContent = useFplusStore(s => s.updateContent);
  const updateContentState = useFplusStore(s => s.updateContentState);
  const client = useFplusStore(s => s.clients.find(c => c.id === piece.client_id));

  const [copy, setCopy] = useState(piece.copy_activo ?? '');
  const [hashtags, setHashtags] = useState<string[]>(piece.hashtags ?? []);
  const [filePreview, setFilePreview] = useState<string | null>(piece.archivos[0]?.url ?? null);
  const [fileName, setFileName] = useState<string | null>(piece.archivos[0]?.nombre ?? null);
  const [fileType, setFileType] = useState<'imagen' | 'video' | null>(
    (piece.archivos[0]?.tipo as 'imagen' | 'video') ?? null,
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setFileType(file.type.startsWith('video/') ? 'video' : 'imagen');
    const reader = new FileReader();
    reader.onload = e => setFilePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const generarIA = async () => {
    if (!client) return;
    setGenerating(true);
    try {
      const r = await generateCopy({
        clientNombre: client.nombre,
        industria: client.tipo_mercado ?? client.industria,
        tipo: piece.tipo,
        plataforma: piece.plataforma ?? 'instagram',
        objetivo: client.objetivo_marketing ?? 'alcance',
        tema: piece.nombre,
      });
      setCopy(r.copy);
      setHashtags(prev => {
        const ex = new Set(prev);
        return [...prev, ...r.hashtags.filter(t => !ex.has(t))];
      });
    } finally {
      setGenerating(false);
    }
  };

  const save = (enviar: boolean) => {
    if (enviar && (!filePreview || !copy.trim())) {
      setError(!filePreview ? 'Falta subir imagen o video.' : 'Falta el copy.');
      return;
    }
    const now = new Date().toISOString();
    updateContent(piece.id, {
      copy_activo: copy.trim() || undefined,
      hashtags,
      archivos: filePreview && fileName && fileType ? [{
        id: piece.archivos[0]?.id ?? `cf_${Date.now()}`,
        nombre: fileName,
        tipo: fileType,
        url: filePreview,
        thumbnail_url: fileType === 'imagen' ? filePreview : undefined,
        tamanio_bytes: 0,
        version: (piece.archivos[0]?.version ?? 0) + 1,
        es_version_activa: true,
        subido_por_nombre: 'Agencia',
        created_at: now,
      }] : piece.archivos,
      updated_at: now,
    });
    if (enviar) updateContentState(piece.id, 'enviado_cliente', 'Agencia');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">📂 Completar contenido</h2>
            <p className="text-[11px] text-slate-400">
              {CONTENT_TYPE_LABELS[piece.tipo]} · {piece.fecha_publicacion &&
                new Date(piece.fecha_publicacion).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
              {' · la planificación no se modifica aquí'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Contexto: de planificación a producción */}
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-3.5 py-3">
            <p className="text-xs font-semibold text-violet-700 mb-1.5">
              ✨ Esta publicación ya fue planificada.
            </p>
            <p className="text-[11px] text-violet-600 leading-relaxed">
              Ahora completa la información restante para pasarla a producción:
            </p>
            <div className="mt-1.5 space-y-0.5 text-[11px] text-violet-600">
              <p>{piece.archivos.length > 0 ? '✅' : '⬜'} Subir imagen o video</p>
              <p>{piece.copy_activo ? '✅' : '⬜'} Generar o editar el Copy</p>
              <p>{(piece.hashtags?.length ?? 0) > 0 ? '✅' : '⬜'} Generar Hashtags</p>
              <p>⬜ Revisar plataforma y enviar a revisión</p>
            </div>
          </div>

          {/* Multimedia */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Imagen o video *
            </label>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {filePreview ? (
              <div className="relative rounded-xl overflow-hidden bg-slate-100 h-40">
                {fileType === 'video'
                  ? <video src={filePreview} className="w-full h-full object-cover" muted />
                  : <img src={filePreview} alt="" className="w-full h-full object-cover" />}
                <button
                  onClick={() => { setFilePreview(null); setFileName(null); setFileType(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
              >
                <Upload className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                <p className="text-xs text-slate-500 font-medium">Subir imagen o video</p>
              </button>
            )}
          </div>

          {/* Copy con IA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Copy *</label>
              <button
                onClick={generarIA}
                disabled={generating}
                className="flex items-center gap-1 text-[10px] font-semibold bg-violet-600 text-white px-2.5 py-1 rounded-lg hover:bg-violet-700 disabled:opacity-60"
              >
                {generating
                  ? <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Sparkles className="w-3 h-3" />}
                {generating ? 'Generando…' : 'Generar con IA'}
              </button>
            </div>
            <textarea
              value={copy}
              onChange={e => setCopy(e.target.value)}
              rows={5}
              placeholder="Escribe el copy o genéralo con IA…"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {tag}
                  <button onClick={() => setHashtags(h => h.filter(t => t !== tag))}>
                    <X className="w-2.5 h-2.5 opacity-50" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">• {error}</p>}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 flex gap-2 bg-slate-50">
          <button
            onClick={() => save(false)}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200"
          >
            Guardar avance
          </button>
          <button
            onClick={() => save(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700"
          >
            <Send className="w-3.5 h-3.5" /> Enviar a revisión
          </button>
        </div>
      </div>
    </div>
  );
}
