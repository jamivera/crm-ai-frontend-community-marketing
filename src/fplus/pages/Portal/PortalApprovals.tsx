import { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, MessageSquare, AlertCircle,
  Send, Clock, ChevronRight, X
} from 'lucide-react';
import { usePortalContext } from './PortalContext';
import { CompletePieceModal } from '../../components/modals/CompletePieceModal';
import { LazyMedia } from '../../components/ui/LazyMedia';
import { SocialPreview } from '../../components/ui/SocialPreview';
import { useFplusStore, STATE_TRANSITIONS, ACTION_LABELS } from '../../store';
import { CONTENT_STATE_LABELS, CONTENT_TYPE_LABELS, getPriority } from '../../constants';
import type { ContentState } from '../../types';

import { validatePieceCompleteness } from '../../utils/clientHelpers';

const PENDING_STATES: ContentState[] = ['enviado_cliente', 'en_revision_cliente'];

// ─── List view ────────────────────────────────────────────────────────────────

export function PortalApprovalsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId } = usePortalContext();
  const contentPieces = useFplusStore(s => s.contentPieces);
  const portalComments = useFplusStore(s => s.portalComments);
  const clients = useFplusStore(s => s.clients);
  const client = clients.find(c => c.id === clientId);

  const isAgency = location.pathname.startsWith('/fplus/clients/');

  const pending = contentPieces
    .filter(cp => {
      if (isAgency) {
        return cp.client_id === clientId && cp.estado !== 'publicado' && cp.estado !== 'archivado';
      }
      return cp.client_id === clientId && PENDING_STATES.includes(cp.estado) && validatePieceCompleteness(cp).isComplete;
    })
    .sort((a, b) => getPriority(a.fecha_publicacion).rank - getPriority(b.fecha_publicacion).rank);

  if (pending.length === 0) {
    return (
      <div className="px-4 pt-10 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-base font-semibold text-slate-800 mb-2">¡Todo al día!</h2>
        <p className="text-sm text-slate-400">
          {isAgency 
            ? 'No hay piezas de contenido activas en revisión por el momento.' 
            : 'No tienes piezas pendientes de aprobación por el momento.'}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 pt-6 sm:pt-10 pb-16 sm:pb-20 max-w-6xl mx-auto space-y-8 sm:space-y-12">
      <div>
        <h1 className="text-lg font-bold text-slate-800">
          {isAgency ? 'Control de Aprobaciones' : 'Pendientes'}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {isAgency 
            ? `${pending.length} piezas en proceso de revisión o aprobación`
            : `${pending.length} ${pending.length === 1 ? 'pieza espera' : 'piezas esperan'} tu revisión`}
        </p>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
        <Clock className="w-4 h-4 shrink-0 text-amber-600" />
        {isAgency 
          ? 'Monitorea y gestiona los envíos a aprobación del cliente desde este listado.'
          : 'Revisa y aprueba para que podamos publicar a tiempo.'}
      </div>

      <div className="space-y-3">
        {pending.map(cp => {
          const file = cp.archivos?.find(a => a.url);
          const isSentToClient = PENDING_STATES.includes(cp.estado);
          const isPendingSend = ['borrador', 'en_produccion', 'revision_interna', 'cambios_internos', 'listo_para_cliente', 'bloqueado'].includes(cp.estado);
          const isApproved = ['aprobado_cliente', 'aprobado_final'].includes(cp.estado);
          const isChanges = cp.estado === 'cambios_solicitados';

          return (
            <button
              key={cp.id}
              onClick={() => {
                navigate(`${location.pathname.replace(/\/$/, '')}/${cp.id}`);
              }}
              className="w-full flex gap-3 bg-white border border-slate-200 rounded-2xl p-3 text-left active:scale-[0.98] transition-transform hover:border-slate-300"
            >
              {/* Miniatura del material cargado por la agencia */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                {file ? (
                  <LazyMedia src={file.url} typeHint={file.tipo} className="w-full h-full" />
                ) : (
                  <span className="text-xl">🖼️</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800 truncate flex-1">{cp.nombre}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${getPriority(cp.fecha_publicacion).cls}`}>
                    {getPriority(cp.fecha_publicacion).emoji} {getPriority(cp.fecha_publicacion).label}
                  </span>
                </div>
                
                {/* Visual state indicator badge (Observation 1) */}
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    isSentToClient ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    isPendingSend ? 'bg-slate-50 text-slate-500 border-slate-200' :
                    isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    isChanges ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {isAgency ? (
                      isSentToClient ? `Enviado a ${client?.nombre || 'Cliente'} para revisión` :
                      isPendingSend ? 'Pendiente de enviar a aprobación' :
                      isApproved ? `Aprobado por ${client?.nombre || 'Cliente'}` :
                      isChanges ? 'Cambios solicitados' : 'Borrador'
                    ) : (
                      isSentToClient ? 'Recibido para tu revisión' :
                      isApproved ? 'Aprobado' :
                      isChanges ? 'Cambios solicitados' : 'Borrador'
                    )}
                  </span>
                </div>

                {cp.copy_activo && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug mt-1.5">{cp.copy_activo}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap mt-1 text-[10px] text-slate-400">
                  <span className="capitalize">{CONTENT_TYPE_LABELS[cp.tipo]}</span>
                  {cp.plataforma && <span className="capitalize">· {cp.plataforma}</span>}
                  {cp.fecha_publicacion && (
                    <span>· {new Date(cp.fecha_publicacion).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>
                  )}
                  {(cp.hashtags?.length ?? 0) > 0 && <span># {cp.hashtags!.length}</span>}
                  {portalComments[cp.id]?.length > 0 && (
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="w-3 h-3" /> {portalComments[cp.id].length}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Detail / Review view ─────────────────────────────────────────────────────

export function PortalApprovalDetail() {
  const { approvalId } = useParams<{ approvalId: string }>();
  const id = approvalId;
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId, clientNombre } = usePortalContext();
  const isAgency = location.pathname.startsWith('/fplus/clients/');
  const deleteContent = useFplusStore(s => s.deleteContent);
  const goBack = () => {
    const base = location.pathname.replace(/\/(calendar|multimedia|approvals|cronopost|metrics|brand|pauta|campaigns).*$/, '');
    navigate(`${base}/approvals`);
  };

  const contentPieces = useFplusStore(s => s.contentPieces);
  const briefs = useFplusStore(s => s.briefs);
  const portalComments = useFplusStore(s => s.portalComments);
  const approveContent = useFplusStore(s => s.approveContent);
  const requestChanges = useFplusStore(s => s.requestChanges);
  const addPortalComment = useFplusStore(s => s.addPortalComment);
  const updateContentState = useFplusStore(s => s.updateContentState);

  const cp = contentPieces.find(c => c.id === id && c.client_id === clientId);
  const brief = briefs[clientId];
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));
  const comments = portalComments[id ?? ''] ?? [];

  const activeFile = cp?.archivos?.find(a => a.es_version_activa) ?? cp?.archivos?.[0];
  const hasMedia = !!activeFile?.url;
  const hasMediaReady = hasMedia && (activeFile?.estado_procesamiento === 'ready' || !activeFile?.estado_procesamiento);

  const [commentText, setCommentText] = useState('');
  const [actionTaken, setActionTaken] = useState<'approved' | 'changes' | null>(null);
  const [showChangesInput, setShowChangesInput] = useState(false);
  const [changesText, setChangesText] = useState('');
  const [expandedHistory, setExpandedHistory] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [editPlan, setEditPlan] = useState(false);
  const updateContent = useFplusStore(s => s.updateContent);

  // Edición directa del cliente (V1 Readiness)
  const [isEditing, setIsEditing] = useState(false);
  const [editCopy, setEditCopy] = useState(cp?.copy_activo || '');
  const [editHashtags, setEditHashtags] = useState(cp?.hashtags?.join(' ') || '');
  const [editError, setEditError] = useState('');

  const startEditing = () => {
    if (!cp) return;
    setEditCopy(cp.copy_activo || '');
    setEditHashtags(cp.hashtags?.join(' ') || '');
    setEditError('');
    setIsEditing(true);
  };

  const handleSaveClientEdits = () => {
    if (!cp) return;
    
    // Formatear hashtags
    const rawHashtags = editHashtags.trim()
      ? editHashtags.trim().split(/\s+/).filter(Boolean)
      : [];
    
    const nextHashtags = rawHashtags.map(h => h.startsWith('#') ? h : `#${h}`);
    
    if (nextHashtags.length > 5) {
      setEditError('Por seguridad y buenas prácticas, puedes definir un máximo de 5 hashtags.');
      return;
    }
    
    setEditError('');
    
    // Trazabilidad de cambios detallada
    const previousCopy = cp.copy_activo || '(Vacio)';
    const previousHashtags = cp.hashtags?.join(' ') || '(Ninguno)';
    
    updateContent(cp.id, {
      copy_activo: editCopy,
      hashtags: nextHashtags
    });
    
    addPortalComment(cp.id, {
      id: `edit-${Date.now()}`,
      autor: clientNombre,
      esAgencia: false,
      texto: `📝 Editó el contenido del post:\n\n* **Copy anterior:**\n"${previousCopy}"\n\n* **Nuevo Copy:**\n"${editCopy}"\n\n* **Hashtags anteriores:** ${previousHashtags}\n* **Nuevos Hashtags:** ${nextHashtags.join(' ') || '(Ninguno)'}`,
      timestamp: new Date().toISOString()
    });

    setIsEditing(false);
  };

  // Combinar historial de estados y comentarios en una sola línea de tiempo
  const historyList = useMemo(() => {
    if (!cp) return [];
    const logs: { id: string; type: 'comment' | 'status'; autor: string; esAgencia: boolean; texto: string; timestamp: string; estado_anterior?: string; estado_nuevo?: string }[] = [];
    
    comments.forEach(c => {
      logs.push({
        id: c.id,
        type: 'comment',
        autor: c.autor,
        esAgencia: c.esAgencia,
        texto: c.texto,
        timestamp: c.timestamp
      });
    });
    
    const stateLogs = useFplusStore.getState().stateHistory.filter(sh => sh.content_piece_id === cp.id);
    stateLogs.forEach(sh => {
      logs.push({
        id: sh.id,
        type: 'status',
        autor: sh.actor,
        esAgencia: sh.actor === 'Agencia',
        texto: `Cambió el estado a "${CONTENT_STATE_LABELS[sh.estado_nuevo] || sh.estado_nuevo}"`,
        timestamp: sh.timestamp,
        estado_anterior: sh.estado_anterior,
        estado_nuevo: sh.estado_nuevo
      });
    });
    
    return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [comments, cp]);

  if (!cp) {
    return (
      <div className="px-4 pt-10 text-center text-slate-400">
        <p className="text-sm">Pieza no encontrada.</p>
        <button onClick={goBack} className="mt-3 text-blue-600 text-sm">
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
          onClick={goBack}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm"
        >
          Ver siguiente pendiente
        </button>
      </div>
    );
  }

  const isSentToClient = PENDING_STATES.includes(cp.estado);
  const isPendingSend = ['borrador', 'en_produccion', 'revision_interna', 'cambios_internos', 'listo_para_cliente', 'bloqueado'].includes(cp.estado);
  const isApproved = ['aprobado_cliente', 'aprobado_final'].includes(cp.estado);
  const isChanges = cp.estado === 'cambios_solicitados';

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={goBack}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{cp.nombre}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 capitalize">{CONTENT_TYPE_LABELS[cp.tipo]}</span>
            <span className="text-slate-300 text-[10px]">•</span>
            <span className={`text-[10px] font-bold ${
              isSentToClient ? 'text-indigo-600' :
              isPendingSend ? 'text-slate-500' :
              isApproved ? 'text-emerald-600' :
              isChanges ? 'text-amber-600' : 'text-slate-500'
            }`}>
              {isAgency ? (
                isSentToClient ? `Enviado a ${client?.nombre || 'Cliente'} para revisión` :
                isPendingSend ? 'Pendiente de enviar a aprobación' :
                isApproved ? `Aprobado por ${client?.nombre || 'Cliente'}` :
                isChanges ? 'Cambios solicitados' : 'Borrador'
              ) : (
                isSentToClient ? 'Recibido para tu revisión' :
                isApproved ? 'Aprobado' :
                isChanges ? 'Cambios solicitados' : 'Borrador'
              )}
            </span>
          </div>
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

      {!isAgency && !hasMedia ? (
        <div className="p-8 max-w-md mx-auto text-center space-y-4 mt-8">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col items-center space-y-4">
            <span className="text-4xl">⏳</span>
            <h2 className="text-lg font-bold text-slate-800">Contenido pendiente de carga</h2>
            <p className="text-xs text-slate-500 max-w-sm">
              La agencia aún no ha subido el material multimedia para esta publicación. Vuelve más tarde para revisarlo.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4">
          {/* Visual Indicator Banner (Agency Action Box) */}
          {isAgency && isPendingSend && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-sm">
              <div>
                <p className="text-xs font-bold text-blue-800">Pieza pendiente de envío al cliente</p>
                <p className="text-[10px] text-blue-600 mt-0.5">El cliente no puede visualizar esta pieza en su portal hasta que sea enviada.</p>
              </div>
              <button
                onClick={() => {
                  updateContentState(cp.id, 'enviado_cliente', 'Agencia');
                  useFplusStore.getState().addProjectHistoryEvent(
                    clientId,
                    'Andrea Solís (Agencia)',
                    'aprobacion',
                    `Pieza "${cp.nombre}" enviada formalmente al cliente para su revisión.`
                  );
                  window.alert('🚀 Pieza enviada con éxito. El cliente ya puede verla y aprobarla en su portal.');
                }}
                className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
              >
                🚀 Enviar a aprobación
              </button>
            </div>
          )}
        {/* Pieza planificada por IA: separar edición de planificación vs contenido */}
        {isAgency && cp.origen === 'planificada' && (
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-3 space-y-2.5">
            {((cp.archivos?.length ?? 0) === 0 || !cp.copy_activo) && (
              <div className="flex items-start gap-2">
                <span className="text-sm">✨</span>
                <div>
                  <p className="text-xs font-semibold text-violet-700">Esta publicación fue generada por IA.</p>
                  <p className="text-[11px] text-violet-600 mt-0.5">
                    🟡 Pendiente de completar:
                    {((cp.archivos?.length ?? 0) === 0) && ' subir imagen o video'}
                    {((cp.archivos?.length ?? 0) === 0) && !cp.copy_activo && ' ·'}
                    {!cp.copy_activo && ' copy y hashtags'}.
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setEditPlan(e => !e)}
                className="flex-1 py-2 bg-white border border-violet-200 text-violet-700 text-xs font-semibold rounded-xl hover:bg-violet-100"
              >
                ✏️ Editar planificación
              </button>
              <button
                onClick={() => {
                  const base = location.pathname.replace(/\/(calendar|multimedia|approvals|cronopost|metrics|brand|pauta|campaigns).*$/, '');
                  navigate(`${base}/multimedia?edit=${cp.id}`);
                }}
                className="flex-1 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700"
              >
                📂 Completar contenido
              </button>
            </div>

            {/* Editar solo la planificación: fecha, hora, plataforma, nombre */}
            {editPlan && (
              <div className="bg-white rounded-xl p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={cp.fecha_publicacion?.slice(0, 10) ?? ''}
                    onChange={e => updateContent(cp.id, {
                      fecha_publicacion: `${e.target.value}${cp.fecha_publicacion?.slice(10) ?? 'T12:00:00'}`,
                    })}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5"
                  />
                  <input
                    type="time"
                    value={cp.fecha_publicacion?.slice(11, 16) ?? '12:00'}
                    onChange={e => updateContent(cp.id, {
                      fecha_publicacion: `${cp.fecha_publicacion?.slice(0, 10)}T${e.target.value}:00`,
                    })}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5"
                  />
                </div>
                <input
                  value={cp.nombre}
                  onChange={e => updateContent(cp.id, { nombre: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5"
                  placeholder="Nombre de la pieza"
                />
                <p className="text-[10px] text-slate-400">Los cambios se guardan al instante en las 3 vistas.</p>
              </div>
            )}
          </div>
        )}

        {/* Preview block with realistic SocialPreview */}
        {hasMedia ? (
          hasMediaReady ? (
            <div className="py-2">
              <SocialPreview
                tipo={cp.tipo}
                plataforma={cp.plataforma || 'instagram'}
                mediaUrls={(cp.archivos?.map(a => a.url) ?? []).filter(Boolean)}
                mediaTipo={cp.archivos?.[0]?.tipo ?? 'imagen'}
                copy={cp.copy_activo}
                hashtags={cp.hashtags}
                clientNombre={clientNombre}
                clientLogo={client?.logo_url}
                fechaProgramada={cp.fecha_publicacion ? new Date(cp.fecha_publicacion).toLocaleDateString('es-ES') : undefined}
                objetivo={cp.objetivo_marketing}
                etapaEmbudo={cp.etapa_embudo}
                isClientView={!isAgency}
              />
            </div>
          ) : (
            /* Procesando / Procesamiento Event-driven */
            <div className="bg-slate-900 rounded-3xl h-[420px] max-w-[420px] mx-auto flex flex-col items-center justify-center p-6 text-center text-white border border-slate-800 space-y-4 shadow-xl">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700/60" />
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100 flex items-center justify-center gap-1.5 animate-pulse">
                  {activeFile?.estado_procesamiento === 'pending'
                    ? '⏳ Contenido cargado (En cola)'
                    : '⚙️ Procesando multimedia...'}
                </p>
                <p className="text-[11px] text-slate-400 mt-2 max-w-[280px] leading-relaxed mx-auto">
                  {activeFile?.estado_procesamiento === 'pending'
                    ? 'Preparando pipeline de almacenamiento Supabase...'
                    : 'Comprimiendo material visual y generando layouts de red social...'}
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 h-56 flex flex-col items-center justify-center p-6 text-center">
              <span className="text-4xl mb-2">⏳</span>
              <p className="text-sm font-bold text-slate-700">Contenido pendiente de carga</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                La agencia aún no ha subido el material multimedia para esta publicación.
              </p>
              {!isAgency && (
                <button
                  onClick={() => {
                    useFplusStore.getState().addProjectHistoryEvent(
                      cp.client_id,
                      clientNombre || 'Cliente',
                      'contenido',
                      `El cliente solicitó la carga del contenido de la pieza: "${cp.nombre}"`
                    );
                    window.alert('✉️ Solicitud enviada a la agencia. Tu Account Manager ha sido notificado.');
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Solicitar contenido a la agencia
                </button>
              )}
            </div>
          </div>
        )}

        {/* Copy + Hashtags */}
        {(cp.copy_activo || (brief?.hashtags_habituales?.length ?? 0) > 0) && (
          <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
            {isEditing ? (
              <div className="space-y-3">
                {editError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold rounded-xl animate-shake">
                    ⚠️ {editError}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Editar Copy</label>
                  <textarea
                    value={editCopy}
                    onChange={e => setEditCopy(e.target.value)}
                    rows={4}
                    className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Editar Hashtags</label>
                  <input
                    type="text"
                    value={editHashtags}
                    onChange={e => setEditHashtags(e.target.value)}
                    className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#ejemplo #tag"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-1.5 border border-slate-200 text-slate-500 text-[11px] font-semibold rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveClientEdits}
                    className="flex-1 py-1.5 bg-blue-600 text-white text-[11px] font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            ) : (
              <>
                {cp.copy_activo && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Copy</p>
                      {!isAgency && isPending && cp.iteraciones < 5 && (
                        <button
                          onClick={startEditing}
                          className="text-xs text-blue-600 font-semibold hover:underline"
                        >
                          ✏️ Proponer cambios
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{cp.copy_activo}</p>
                  </div>
                )}
                {((cp.hashtags?.length ?? 0) > 0 || (brief?.hashtags_habituales?.length ?? 0) > 0) && (
                  <div className="pt-2">
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
              </>
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
            </>
          )}
          {/* Mostrar detalles estratégicos solo si la multimedia está cargada y lista */}
          {hasMediaReady && (
            <>
              {cp.pilar && <MetaRow label="Pilar" value={cp.pilar} />}
              {isAgency && cp.tono && cp.tono.length > 0 && <MetaRow label="Tono" value={cp.tono.join(', ')} />}
              {isAgency && cp.tono_sugerido && <MetaRow label="Tono sugerido" value={cp.tono_sugerido} />}
              {!isAgency && cp.objetivo_marketing && <MetaRow label="Objetivo" value={cp.objetivo_marketing} />}
              {isAgency && cp.etapa_embudo && <MetaRow label="Etapa del embudo" value={cp.etapa_embudo} />}
              {isAgency && cp.fecha_limite && (
                <MetaRow
                  label="Fecha límite"
                  value={new Date(cp.fecha_limite).toLocaleDateString('es', { day: 'numeric', month: 'long' })}
                />
              )}
              <MetaRow label="Cambios utilizados" value={`${cp.iteraciones} de 5`} />
            </>
          )}
        </div>

        {/* Timeline Histórico y Comentarios */}
        {historyList.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Historial y Conversación</p>
            <div className="relative pl-4 border-l border-slate-200 space-y-4">
              {(expandedHistory ? historyList : historyList.slice(0, 3)).map(log => {
                const isComment = log.type === 'comment';
                const date = new Date(log.timestamp);
                const timeString = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
                const dateString = date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
                
                return (
                  <div key={log.id} className="relative">
                    {/* Circle dot on left timeline border */}
                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border bg-white ${
                      log.type === 'status'
                        ? log.estado_nuevo === 'aprobado_final'
                          ? 'border-emerald-500 bg-emerald-100'
                          : log.estado_nuevo === 'cambios_solicitados'
                            ? 'border-orange-500 bg-orange-100'
                            : 'border-blue-500 bg-blue-100'
                        : 'border-slate-300 bg-slate-100'
                    }`} />
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                      <span className="font-semibold text-slate-600">{log.autor}</span>
                      <span>{dateString} · {timeString}</span>
                    </div>
                    
                    {isComment ? (
                      <div className={`px-3 py-2 rounded-2xl text-xs inline-block max-w-[90%] leading-relaxed ${
                        log.esAgencia
                          ? 'bg-slate-100 text-slate-700 rounded-tl-none'
                          : 'bg-blue-600 text-white rounded-tr-none'
                      }`}>
                        {log.texto}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        {log.texto}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {historyList.length > 3 && (
              <button
                onClick={() => setExpandedHistory(!expandedHistory)}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-1"
              >
                {expandedHistory ? 'Ver menos' : `Ver más (${historyList.length - 3} eventos anteriores)`}
              </button>
            )}
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

        {/* Acciones de la agencia — flujo de estados (Enviar a revisión, Aprobar, etc.) */}
        {isAgency && (STATE_TRANSITIONS[cp.estado]?.length ?? 0) > 0 && (() => {
          const { isComplete, missing } = validatePieceCompleteness(cp);
          return (
            <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Acciones del equipo</p>
              
              {!isComplete && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 text-red-800 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-bold">Contenido Incompleto</p>
                    <p className="mt-0.5">Para enviar a revisión al cliente, debes completar:</p>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {missing.map((m, idx) => <li key={idx}>{m}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {STATE_TRANSITIONS[cp.estado]!
                  .filter(next => !(next === 'aprobado_cliente' || next === 'cambios_solicitados'))
                  .map(next => {
                    const label = ACTION_LABELS[cp.estado]?.[next] ?? next;
                    const isSend = next === 'enviado_cliente' || next === 'en_revision_cliente';
                    const isApprove = next === 'aprobado_final' || next === 'publicado';
                    const disabled = isSend && !isComplete;
                    return (
                      <button
                        key={next}
                        onClick={() => updateContentState(cp.id, next, 'Agencia')}
                        disabled={disabled}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          disabled ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed' :
                          isSend ? 'bg-blue-600 text-white hover:bg-blue-700' :
                          isApprove ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
                          'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
              </div>
              <p className="text-[10px] text-slate-400">
                Al enviar a revisión, el cliente lo verá en su portal, se habilitan los comentarios y el Dashboard marcará el pendiente.
              </p>
            </div>
          );
        })()}

        {/* Action buttons */}
        {!isAgency && isPending && (
          <div className="space-y-3 pt-2 pb-4">
            {/* Contador de cambios */}
            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-100/50 border border-slate-200/50 rounded-xl px-3 py-2">
              <span className="font-medium">Solicitudes de cambios</span>
              <span className="font-bold text-slate-700">{cp.iteraciones} de 5 utilizadas</span>
            </div>

            {/* Advertencia si llegó al límite */}
            {cp.iteraciones >= 5 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex gap-2 text-orange-855 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-bold text-orange-800">Límite de cambios alcanzado</p>
                  <p className="mt-0.5">Has utilizado las 5 solicitudes de cambio permitidas para esta pieza. Para proceder, debes aprobar el contenido en su estado actual o contactar a tu ejecutivo de cuenta.</p>
                </div>
              </div>
            )}

            {showChangesInput && cp.iteraciones < 5 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-orange-800">
                    ¿Qué cambios necesitas? <span className="text-red-500 font-bold">*</span>
                  </p>
                  <button onClick={() => { setShowChangesInput(false); setChangesText(''); }}>
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
              disabled={!hasMediaReady}
              className={`w-full py-3.5 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${
                hasMediaReady ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed opacity-50'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {hasMediaReady ? 'Aprobar' : 'Aprobar (Espera procesamiento)'}
            </button>

            {cp.iteraciones < 5 ? (
              <button
                onClick={handleRequestChanges}
                disabled={(showChangesInput && !changesText.trim()) || !hasMediaReady}
                className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all border ${
                  showChangesInput
                    ? 'bg-orange-500 text-white border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
                {showChangesInput ? 'Enviar comentarios de revisión' : 'Solicitar revisión'}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              >
                <AlertCircle className="w-5 h-5 text-slate-300" />
                Límite de cambios alcanzado
              </button>
            )}
          </div>
        )}
      </div>
      )}

      {showComplete && (
        <CompletePieceModal piece={cp} onClose={() => setShowComplete(false)} />
      )}
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

