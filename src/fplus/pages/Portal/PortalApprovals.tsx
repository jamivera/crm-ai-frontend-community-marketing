import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, MessageSquare, AlertCircle,
  Send, Clock, ChevronRight, X
} from 'lucide-react';
import { usePortalContext } from './PortalContext';
import { useFplusStore } from '../../store';
import { CONTENT_STATE_LABELS, CONTENT_TYPE_LABELS } from '../../constants';
import type { ContentState } from '../../types';

const PENDING_STATES: ContentState[] = ['enviado_cliente', 'en_revision_cliente'];

// ─── List view ────────────────────────────────────────────────────────────────

export function PortalApprovalsList() {
  const navigate = useNavigate();
  const { clientId } = usePortalContext();
  const contentPieces = useFplusStore(s => s.contentPieces);
  const portalComments = useFplusStore(s => s.portalComments);

  const pending = contentPieces.filter(
    cp => cp.client_id === clientId && PENDING_STATES.includes(cp.estado)
  );

  if (pending.length === 0) {
    return (
      <div className="px-4 pt-10 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-base font-semibold text-slate-800 mb-2">¡Todo al día!</h2>
        <p className="text-sm text-slate-400">No tienes piezas pendientes de aprobación por el momento.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Pendientes</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {pending.length} {pending.length === 1 ? 'pieza espera' : 'piezas esperan'} tu revisión
        </p>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
        <Clock className="w-4 h-4 shrink-0 text-amber-600" />
        Revisa y aprueba para que podamos publicar a tiempo.
      </div>

      <div className="space-y-3">
        {pending.map((cp, idx) => (
          <button
            key={cp.id}
            onClick={() => navigate(`/fplus/portal/approvals/${cp.id}`)}
            className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{cp.nombre}</p>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">
                {CONTENT_TYPE_LABELS[cp.tipo]}
                {cp.fecha_limite && ` · vence ${new Date(cp.fecha_limite).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`}
              </p>
            </div>
            {portalComments[cp.id]?.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <MessageSquare className="w-3.5 h-3.5" />
                {portalComments[cp.id].length}
              </div>
            )}
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Detail / Review view ─────────────────────────────────────────────────────

export function PortalApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId, clientNombre } = usePortalContext();
  // Vista agencia (workspace) vs portal del cliente
  const isAgency = location.pathname.startsWith('/fplus/clients/');
  const deleteContent = useFplusStore(s => s.deleteContent);

  const contentPieces = useFplusStore(s => s.contentPieces);
  const briefs = useFplusStore(s => s.briefs);
  const portalComments = useFplusStore(s => s.portalComments);
  const approveContent = useFplusStore(s => s.approveContent);
  const requestChanges = useFplusStore(s => s.requestChanges);
  const addPortalComment = useFplusStore(s => s.addPortalComment);

  const cp = contentPieces.find(c => c.id === id && c.client_id === clientId);
  const brief = briefs[clientId];
  const comments = portalComments[id ?? ''] ?? [];

  const [commentText, setCommentText] = useState('');
  const [actionTaken, setActionTaken] = useState<'approved' | 'changes' | null>(null);
  const [showChangesInput, setShowChangesInput] = useState(false);
  const [changesText, setChangesText] = useState('');

  if (!cp) {
    return (
      <div className="px-4 pt-10 text-center text-slate-400">
        <p className="text-sm">Pieza no encontrada.</p>
        <button onClick={() => navigate('/fplus/portal/approvals')} className="mt-3 text-blue-600 text-sm">
          ← Volver
        </button>
      </div>
    );
  }

  const isPending = PENDING_STATES.includes(cp.estado);

  function handleApprove() {
    approveContent(cp!.id, clientNombre);
    setActionTaken('approved');
  }

  function handleRequestChanges() {
    if (!showChangesInput) {
      setShowChangesInput(true);
      return;
    }
    if (!changesText.trim()) return;
    requestChanges(cp!.id, changesText.trim(), clientNombre);
    setChangesText('');
    setActionTaken('changes');
    setShowChangesInput(false);
  }

  function handleSendComment() {
    if (!commentText.trim()) return;
    addPortalComment(cp!.id, {
      id: `cmt-${Date.now()}`,
      autor: clientNombre,
      esAgencia: false,
      texto: commentText.trim(),
      timestamp: new Date().toISOString(),
    });
    setCommentText('');
  }

  if (actionTaken) {
    return (
      <div className="px-4 pt-12 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
          actionTaken === 'approved' ? 'bg-emerald-100' : 'bg-orange-100'
        }`}>
          {actionTaken === 'approved'
            ? <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            : <AlertCircle className="w-10 h-10 text-orange-500" />
          }
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">
          {actionTaken === 'approved' ? '¡Aprobado!' : 'Cambios enviados'}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {actionTaken === 'approved'
            ? 'Tu aprobación fue registrada. El equipo continuará con el proceso de publicación.'
            : 'Tus comentarios fueron enviados. El equipo los revisará y te enviará una nueva versión.'}
        </p>
        <button
          onClick={() => navigate('/fplus/portal/approvals')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm"
        >
          Ver siguiente pendiente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => navigate('/fplus/portal/approvals')}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{cp.nombre}</p>
          <p className="text-xs text-slate-400 capitalize">{CONTENT_TYPE_LABELS[cp.tipo]}</p>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
          isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {CONTENT_STATE_LABELS[cp.estado]}
        </span>
        {isAgency && (
          <button
            onClick={() => {
              if (window.confirm(`¿Eliminar la pieza "${cp.nombre}"? Esta acción no se puede deshacer.`)) {
                deleteContent(cp.id);
                navigate(-1);
              }
            }}
            className="text-[10px] font-medium text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg shrink-0"
          >
            Eliminar
          </button>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Razón estratégica del planificador */}
        {cp.razon_estrategica && (
          <div className="flex items-start gap-2 bg-violet-50 border border-violet-100 rounded-2xl p-3">
            <span className="text-sm">✨</span>
            <p className="text-xs text-violet-700 leading-relaxed">{cp.razon_estrategica}</p>
          </div>
        )}

        {/* Preview placeholder */}
        {cp.archivos.length > 0 && cp.archivos[0].url ? (
          <div className="rounded-2xl overflow-hidden bg-slate-900 max-h-80 flex items-center justify-center">
            {cp.archivos[0].tipo?.startsWith('video') || /\.(mp4|mov)/i.test(cp.archivos[0].nombre ?? '') ? (
              <video src={cp.archivos[0].url} controls className="max-h-80 w-full object-contain" />
            ) : (
              <img src={cp.archivos[0].url} alt={cp.nombre} className="max-h-80 w-full object-contain" />
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 h-52 flex flex-col items-center justify-center">
            <span className="text-5xl mb-2">{getTypeEmoji(cp.tipo)}</span>
            <p className="text-xs text-slate-400 capitalize">{CONTENT_TYPE_LABELS[cp.tipo]}</p>
            <p className="text-xs text-slate-300 mt-1">Archivo aún no cargado</p>
          </div>
        )}

        {/* Copy + Hashtags */}
        {(cp.copy_activo || (brief?.hashtags_habituales?.length ?? 0) > 0) && (
          <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
            {cp.copy_activo && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Copy</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{cp.copy_activo}</p>
              </div>
            )}
            {((cp.hashtags?.length ?? 0) > 0 || (brief?.hashtags_habituales?.length ?? 0) > 0) && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Hashtags</p>
                <div className="flex flex-wrap gap-1.5">
                  {((cp.hashtags?.length ?? 0) > 0 ? cp.hashtags! : brief?.hashtags_habituales ?? []).map(tag => (
                    <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Detalles</p>
          <MetaRow label="Tipo" value={CONTENT_TYPE_LABELS[cp.tipo]} />
          {cp.plataforma && <MetaRow label="Plataforma" value={cp.plataforma} />}
          {cp.fecha_publicacion && (
            <>
              <MetaRow
                label="Fecha de publicación"
                value={new Date(cp.fecha_publicacion).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
              />
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Hora recomendada</span>
                <span className="text-blue-600 font-semibold">
                  🕐 {new Date(cp.fecha_publicacion).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 text-right -mt-1">
                Mayor probabilidad de alcance según la estrategia aplicada
              </p>
            </>
          )}
          {cp.pilar && <MetaRow label="Pilar" value={cp.pilar} />}
          {cp.tono && cp.tono.length > 0 && <MetaRow label="Tono" value={cp.tono.join(', ')} />}
          {cp.fecha_limite && (
            <MetaRow
              label="Fecha límite"
              value={new Date(cp.fecha_limite).toLocaleDateString('es', { day: 'numeric', month: 'long' })}
            />
          )}
          <MetaRow label="Iteración" value={`${cp.iteraciones} de ${cp.max_iteraciones}`} />
        </div>

        {/* Comments thread */}
        {comments.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Comentarios</p>
            {comments.map(c => (
              <div
                key={c.id}
                className={`flex gap-2 ${c.esAgencia ? '' : 'flex-row-reverse'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  c.esAgencia ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {c.autor.charAt(0)}
                </div>
                <div className={`max-w-[78%] ${c.esAgencia ? '' : 'items-end'} flex flex-col gap-0.5`}>
                  <p className={`text-[10px] text-slate-400 ${c.esAgencia ? '' : 'text-right'}`}>{c.autor}</p>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${
                    c.esAgencia
                      ? 'bg-slate-100 text-slate-700 rounded-tl-none'
                      : 'bg-blue-600 text-white rounded-tr-none'
                  }`}>
                    {c.texto}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment input */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl px-3 py-2">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Escribe un comentario..."
              rows={2}
              className="w-full text-sm text-slate-700 bg-transparent resize-none focus:outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={handleSendComment}
            disabled={!commentText.trim()}
            className="p-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-40 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        {isPending && (
          <div className="space-y-2 pt-2 pb-4">
            {showChangesInput && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-orange-800">¿Qué cambios necesitas?</p>
                  <button onClick={() => setShowChangesInput(false)}>
                    <X className="w-4 h-4 text-orange-400" />
                  </button>
                </div>
                <textarea
                  value={changesText}
                  onChange={e => setChangesText(e.target.value)}
                  placeholder="Describe los cambios que necesitas con detalle..."
                  rows={3}
                  className="w-full text-sm text-slate-700 bg-white border border-orange-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                  autoFocus
                />
              </div>
            )}

            <button
              onClick={handleApprove}
              className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <CheckCircle2 className="w-5 h-5" />
              Aprobar esta pieza
            </button>
            <button
              onClick={handleRequestChanges}
              className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all border ${
                showChangesInput
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-orange-600 border-orange-200'
              }`}
            >
              <AlertCircle className="w-5 h-5" />
              {showChangesInput ? 'Enviar cambios' : 'Solicitar cambios'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700 font-medium capitalize">{value}</span>
    </div>
  );
}

function getTypeEmoji(tipo: string): string {
  const map: Record<string, string> = {
    reel: '🎬', carrusel: '🖼️', historia: '📱', historia_video: '📱',
    post_imagen: '🖼️', post_video: '🎥', tiktok: '🎵', video_youtube: '▶️',
    banner: '🎨', infografia: '📊', blog: '📝',
  };
  return map[tipo] ?? '📄';
}
