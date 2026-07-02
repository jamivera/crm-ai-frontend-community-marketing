import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, FileImage, MessageSquare, Lock, Globe,
  ChevronDown, CheckCircle2, Clock, Send, Upload,
  Edit3, Save, X, CalendarPlus,
} from 'lucide-react';
import { ContentStateChip } from '../../components/ui/StateChip';
import { EmptyState } from '../../components/ui/EmptyState';
import { useFplusStore, STATE_TRANSITIONS, ACTION_LABELS } from '../../store';
import { CONTENT_STATE_LABELS } from '../../constants';
import type { ContentPiece, ContentState } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import PublicationForm from '../Publications/PublicationForm';

function timeAgo(ts: string) {
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true, locale: es }); } catch { return ts; }
}

type CommentTab = 'todos' | 'internos' | 'cliente';

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const contentPieces = useFplusStore(s => s.contentPieces);
  const updateContentState = useFplusStore(s => s.updateContentState);
  const updateContent = useFplusStore(s => s.updateContent);
  const addContentComment = useFplusStore(s => s.addContentComment);
  const getContentComments = useFplusStore(s => s.getContentComments);
  const getStateHistory = useFplusStore(s => s.getStateHistory);

  const [commentTab, setCommentTab] = useState<CommentTab>('todos');
  const [commentText, setCommentText] = useState('');
  const [commentInternal, setCommentInternal] = useState(true);
  const [editingCopy, setEditingCopy] = useState(false);
  const [copyDraft, setCopyDraft] = useState('');
  const [showPublicationForm, setShowPublicationForm] = useState(false);

  const piece = contentPieces.find(c => c.id === id);
  const comments = getContentComments(id ?? '');
  const history = getStateHistory(id ?? '');

  useEffect(() => {
    if (piece) setCopyDraft(piece.copy_activo ?? '');
  }, [piece?.id]);

  if (!piece) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/fplus/content')} className="flex items-center gap-1.5 text-sm text-blue-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <EmptyState title="Pieza no encontrada" />
      </div>
    );
  }

  const isOverdue = piece.fecha_limite && new Date(piece.fecha_limite) < new Date();
  const canSchedule = piece.estado === 'aprobado_final' || piece.estado === 'aprobado_cliente';

  const filteredComments = comments.filter(c =>
    commentTab === 'todos' ? true : commentTab === 'internos' ? c.interno : !c.interno
  );
  const internalCount = comments.filter(c => c.interno).length;
  const clientCount = comments.filter(c => !c.interno).length;

  function handleTransition(newState: ContentState) {
    updateContentState(piece!.id, newState, 'Agencia');
  }

  function handleSaveCopy() {
    updateContent(piece!.id, { copy_activo: copyDraft.trim() || undefined });
    setEditingCopy(false);
  }

  function handleCancelCopy() {
    setCopyDraft(piece!.copy_activo ?? '');
    setEditingCopy(false);
  }

  function handleSendComment() {
    if (!commentText.trim()) return;
    addContentComment({
      id: `cc-${Date.now()}`,
      content_piece_id: piece!.id,
      autor: commentInternal ? 'Agencia' : piece!.client_nombre,
      texto: commentText.trim(),
      interno: commentInternal,
      timestamp: new Date().toISOString(),
    });
    setCommentText('');
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back */}
      <div className="px-6 pt-6 pb-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
      </div>

      {/* Page header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900">{piece.nombre}</h1>
              <ContentStateChip state={piece.estado} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
              <span>{piece.client_nombre}</span>
              {piece.campaign_nombre && <span>· {piece.campaign_nombre}</span>}
              <span className="capitalize">· {piece.tipo}</span>
              {piece.pilar && <span>· Pilar: {piece.pilar}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {piece.fecha_limite && (
              <div className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg flex-shrink-0 ${isOverdue ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'}`}>
                <Clock className="w-4 h-4" />
                {isOverdue ? 'Vencida: ' : 'Vence: '}
                {new Date(piece.fecha_limite).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {/* P0-B: Programar publicación */}
            {canSchedule && (
              <button
                onClick={() => setShowPublicationForm(true)}
                className="flex items-center gap-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <CalendarPlus className="w-4 h-4" />
                Programar publicación
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="flex flex-col lg:flex-row min-h-0">
        {/* Left — preview + copy + brief */}
        <div className="lg:w-2/5 flex-shrink-0 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-5">
          {/* Media preview */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Archivo</h3>
            <div className="w-full aspect-video bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200">
              <FileImage className="w-10 h-10 mb-2" />
              <span className="text-sm text-slate-400">Sin archivos subidos</span>
              <button className="mt-3 flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Subir archivo
              </button>
            </div>
          </div>

          {/* P0-A: Editable copy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Copy</h3>
              {!editingCopy ? (
                <button
                  onClick={() => { setCopyDraft(piece.copy_activo ?? ''); setEditingCopy(true); }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  {piece.copy_activo ? 'Editar' : 'Agregar'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveCopy}
                    className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium"
                  >
                    <Save className="w-3 h-3" /> Guardar
                  </button>
                  <button onClick={handleCancelCopy} className="text-xs text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {editingCopy ? (
              <textarea
                autoFocus
                value={copyDraft}
                onChange={e => setCopyDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') handleCancelCopy(); }}
                placeholder="Escribe el copy de esta pieza..."
                rows={6}
                className="w-full text-sm border border-blue-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed"
              />
            ) : piece.copy_activo ? (
              <div
                className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => { setCopyDraft(piece.copy_activo ?? ''); setEditingCopy(true); }}
                title="Clic para editar"
              >
                {piece.copy_activo}
              </div>
            ) : (
              <div
                className="bg-slate-50 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors border-2 border-dashed border-slate-200"
                onClick={() => { setCopyDraft(''); setEditingCopy(true); }}
              >
                <p className="text-xs text-slate-400">Sin copy — clic para agregar</p>
              </div>
            )}
          </div>

          {/* Brief summary */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Brief de la pieza
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-3 space-y-2">
              {[
                { label: 'Tono', value: piece.tono?.join(', ') ?? '—' },
                { label: 'Pilar', value: piece.pilar ?? '—' },
                { label: 'CTA', value: piece.incluye_cta ? 'Sí' : 'No' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-16">{item.label}:</span>
                  <span className="text-slate-700 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Right — info + actions + comments */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-6 space-y-5 flex-1 overflow-auto">
            {/* Assignments */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Asignaciones</h3>
              <div className="space-y-2">
                {[
                  { label: 'Account Manager', name: piece.account_manager_nombre },
                  piece.designer_nombre ? { label: 'Diseñador', name: piece.designer_nombre } : null,
                  piece.content_manager_nombre ? { label: 'Content Manager', name: piece.content_manager_nombre } : null,
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">{item.label}</div>
                      <div className="text-sm font-medium text-slate-800">{item.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revision info */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Estado de revisión</div>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-sm text-slate-700">
                  Ronda <span className="font-bold">{piece.iteraciones}</span> de <span className="font-bold">{piece.max_iteraciones}</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: piece.max_iteraciones }).map((_, i) => (
                    <div key={i} className={`w-5 h-1.5 rounded-full ${i < piece.iteraciones ? 'bg-blue-500' : 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>
              {piece.iteraciones >= piece.max_iteraciones && (
                <div className="text-xs text-red-600 font-medium">⚠ Límite de iteraciones alcanzado</div>
              )}
            </div>

            {/* Actions */}
            <ActionButtons piece={piece} onTransition={handleTransition} onSchedule={() => setShowPublicationForm(true)} />

            {/* State history */}
            {history.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Historial de estados</h3>
                <div className="space-y-2">
                  {history.map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {event.estado_anterior && (
                            <>
                              <ContentStateChip state={event.estado_anterior} size="sm" />
                              <span className="text-[10px] text-slate-300">→</span>
                            </>
                          )}
                          <ContentStateChip state={event.estado_nuevo} size="sm" />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{event.actor} · {timeAgo(event.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-start gap-3 opacity-40">
                    <div className="w-5 h-5 rounded-full border-2 border-dashed border-slate-300 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-400 mt-0.5">Estado actual</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="border-t border-slate-200 bg-white">
            <div className="px-6 pt-4">
              <div className="flex items-center gap-4 border-b border-slate-100 -mx-6 px-6 pb-3">
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> Comentarios
                </span>
                {([
                  { key: 'todos', label: 'Todos', count: comments.length },
                  { key: 'internos', label: '🔒 Internos', count: internalCount },
                  { key: 'cliente', label: '💬 Cliente', count: clientCount },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setCommentTab(t.key as CommentTab)}
                    className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${commentTab === t.key ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {t.label} ({t.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto">
              {filteredComments.length === 0 ? (
                <div className="px-6 py-6 text-center text-xs text-slate-400">
                  No hay comentarios en esta categoría.
                </div>
              ) : (
                filteredComments.map(comment => (
                  <div key={comment.id} className="px-6 py-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold flex-shrink-0">
                        {comment.autor.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-800">{comment.autor}</span>
                          <span className="text-[10px] text-slate-400">{timeAgo(comment.timestamp)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${comment.interno ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                            {comment.interno ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                            {comment.interno ? ' Interno' : ' Cliente'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-snug">{comment.texto}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            <div className="px-6 py-4 border-t border-slate-100">
              <div className="flex gap-3">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendComment(); }}
                  placeholder="Escribe un comentario... (Cmd+Enter para enviar)"
                  rows={2}
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setCommentInternal(p => !p)}
                    className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition-colors ${commentInternal ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-blue-200 bg-blue-50 text-blue-700'}`}
                  >
                    {commentInternal ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    {commentInternal ? 'Privado' : 'Cliente'}
                  </button>
                  <button
                    onClick={handleSendComment}
                    disabled={!commentText.trim()}
                    className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40"
                  >
                    <Send className="w-3 h-3" /> Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* P0-B: Publication form modal */}
      {showPublicationForm && (
        <PublicationForm
          onClose={() => setShowPublicationForm(false)}
          preselectedClientId={piece.client_id}
          preselectedPieceId={piece.id}
        />
      )}
    </div>
  );
}

function ActionButtons({
  piece,
  onTransition,
  onSchedule,
}: {
  piece: ContentPiece;
  onTransition: (s: ContentState) => void;
  onSchedule: () => void;
}) {
  const nextStates = STATE_TRANSITIONS[piece.estado] ?? [];
  const labels = ACTION_LABELS[piece.estado] ?? {};
  const canSchedule = piece.estado === 'aprobado_final' || piece.estado === 'aprobado_cliente';

  if (nextStates.length === 0 && !canSchedule) {
    return (
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Acciones</h3>
        <p className="text-xs text-slate-400">
          {piece.estado === 'publicado' || piece.estado === 'archivado'
            ? 'Esta pieza ya completó su flujo.'
            : 'No hay acciones disponibles en el estado actual.'}
        </p>
      </div>
    );
  }

  const variantFor = (state: ContentState) => {
    if (state === 'bloqueado' || state === 'rechazado') return 'danger';
    if (state === 'publicado' || state === 'aprobado_final') return 'success';
    if (state === 'cambios_internos' || state === 'cambios_solicitados') return 'secondary';
    return 'primary';
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    secondary: 'border border-slate-200 hover:bg-slate-50 text-slate-700',
    danger: 'border border-red-200 hover:bg-red-50 text-red-700',
  };

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Acciones</h3>
      <div className="flex flex-wrap gap-2">
        {nextStates.map(state => {
          const label = labels[state] ?? CONTENT_STATE_LABELS[state];
          const variant = variantFor(state);
          return (
            <button
              key={state}
              onClick={() => onTransition(state)}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${variantClasses[variant]}`}
            >
              {label}
            </button>
          );
        })}
        {canSchedule && (
          <button
            onClick={onSchedule}
            className="flex items-center gap-1.5 text-sm font-medium border border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-colors"
          >
            <CalendarPlus className="w-4 h-4" />
            Programar publicación
          </button>
        )}
      </div>
    </div>
  );
}
