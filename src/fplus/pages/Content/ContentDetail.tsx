import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, FileImage, MessageSquare, Lock, Globe,
  ChevronDown, CheckCircle2, XCircle, Clock, Send,
  Upload,
} from 'lucide-react';
import { ContentStateChip } from '../../components/ui/StateChip';
import { EmptyState } from '../../components/ui/EmptyState';
import { mockContent } from '../../mock';
import type { ContentPiece } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

function timeAgo(ts: string) {
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true, locale: es }); } catch { return ts; }
}

const MOCK_COMMENTS = [
  { id: 'cm1', autor: 'Juan Pérez', texto: 'Ojo con la música, el cliente prefiere sin música de fondo.', interno: true, ts: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'cm2', autor: 'Ana Cliente', texto: 'El texto del overlay es muy pequeño. Por favor agrandar al menos 2 puntos.', interno: false, ts: new Date(Date.now() - 86400000).toISOString() },
  { id: 'cm3', autor: 'María Loor', texto: 'Ajustando el copy según el feedback de la cliente.', interno: true, ts: new Date(Date.now() - 3600000).toISOString() },
];

const MOCK_HISTORY = [
  { estado: 'borrador' as const, actor: 'Juan Pérez', ts: new Date(Date.now() - 5 * 86400000).toISOString() },
  { estado: 'en_produccion' as const, actor: 'Carlos Ramos', ts: new Date(Date.now() - 4 * 86400000).toISOString() },
  { estado: 'revision_interna' as const, actor: 'Juan Pérez', ts: new Date(Date.now() - 3 * 86400000).toISOString() },
  { estado: 'enviado_cliente' as const, actor: 'Juan Pérez', ts: new Date(Date.now() - 2 * 86400000).toISOString() },
];

type CommentTab = 'todos' | 'internos' | 'cliente';

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [commentTab, setCommentTab] = useState<CommentTab>('todos');
  const [commentText, setCommentText] = useState('');
  const [commentInternal, setCommentInternal] = useState(true);

  const piece = mockContent.find(c => c.id === id);

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
  const filteredComments = MOCK_COMMENTS.filter(c =>
    commentTab === 'todos' ? true : commentTab === 'internos' ? c.interno : !c.interno
  );

  const handleAction = (action: string) => {
    alert(`Acción: "${action}" — Se conectará al backend en la siguiente fase.`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back + breadcrumb */}
      <div className="px-6 pt-6 pb-0">
        <button onClick={() => navigate('/fplus/content')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Contenido
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
          {piece.fecha_limite && (
            <div className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg flex-shrink-0 ${isOverdue ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'}`}>
              <Clock className="w-4 h-4" />
              {isOverdue ? 'Vencida: ' : 'Vence: '}
              {new Date(piece.fecha_limite).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* Two column layout */}
      <div className="flex flex-col lg:flex-row min-h-0">
        {/* Left — preview */}
        <div className="lg:w-2/5 flex-shrink-0 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-5">
          {/* Media preview */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Archivo</h3>
            <div className="w-full aspect-video bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200">
              <FileImage className="w-10 h-10 mb-2" />
              <span className="text-sm text-slate-400">Sin archivos subidos</span>
              <button
                onClick={() => handleAction('subir archivo')}
                className="mt-3 flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Subir archivo
              </button>
            </div>
          </div>

          {/* Copy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Copy</h3>
              <button className="text-xs text-blue-600 hover:underline">+ Versión</button>
            </div>
            {piece.copy_activo ? (
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
                {piece.copy_activo}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-400 mb-2">No hay copy registrado</p>
                <button className="text-xs text-blue-600 hover:underline">+ Agregar copy</button>
              </div>
            )}
          </div>

          {/* Brief summary */}
          <div>
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
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Acciones</h3>
              <ActionButtons piece={piece} onAction={handleAction} />
            </div>

            {/* State history */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Historial de estados</h3>
              <div className="space-y-2">
                {MOCK_HISTORY.map((event, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-700">
                        <ContentStateChip state={event.estado} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{event.actor} · {timeAgo(event.ts)}</div>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-3 opacity-40">
                  <div className="w-5 h-5 rounded-full border-2 border-dashed border-slate-300 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-400 mt-0.5">Estado actual: <ContentStateChip state={piece.estado} size="sm" /></div>
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="border-t border-slate-200 bg-white">
            <div className="px-6 pt-4">
              <div className="flex items-center gap-4 border-b border-slate-100 -mx-6 px-6 pb-3">
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> Comentarios
                </span>
                {(['todos', 'internos', 'cliente'] as CommentTab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setCommentTab(t)}
                    className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${commentTab === t ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {t === 'todos' ? 'Todos' : t === 'internos' ? '🔒 Internos' : '💬 Cliente'}
                    {' '}({t === 'todos' ? MOCK_COMMENTS.length : MOCK_COMMENTS.filter(c => t === 'internos' ? c.interno : !c.interno).length})
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {filteredComments.map(comment => (
                <div key={comment.id} className="px-6 py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold flex-shrink-0">
                      {comment.autor.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-800">{comment.autor}</span>
                        <span className="text-[10px] text-slate-400">{timeAgo(comment.ts)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${comment.interno ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                          {comment.interno ? <Lock className="w-2.5 h-2.5 inline" /> : <Globe className="w-2.5 h-2.5 inline" />}
                          {' '}{comment.interno ? 'Interno' : 'Cliente'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-snug">{comment.texto}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment input */}
            <div className="px-6 py-4 border-t border-slate-100">
              <div className="flex gap-3">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Escribe un comentario..."
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
                    onClick={() => { if (commentText.trim()) { alert('Comentario enviado (sin backend)'); setCommentText(''); } }}
                    className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-3 h-3" /> Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButtons({ piece, onAction }: { piece: ContentPiece; onAction: (a: string) => void }) {
  const actions: Record<string, { label: string; variant: 'primary' | 'secondary' | 'danger' }[]> = {
    borrador: [{ label: 'Pasar a producción', variant: 'primary' }],
    en_produccion: [
      { label: 'Enviar a revisión interna', variant: 'primary' },
      { label: 'Marcar como bloqueado', variant: 'danger' },
    ],
    revision_interna: [
      { label: 'Enviar al cliente', variant: 'primary' },
      { label: 'Solicitar cambios internos', variant: 'secondary' },
    ],
    enviado_cliente: [
      { label: 'Registrar aprobación', variant: 'primary' },
      { label: 'Registrar cambios del cliente', variant: 'secondary' },
    ],
    cambios_solicitados: [{ label: 'Iniciar correcciones', variant: 'primary' }],
    aprobado_final: [{ label: 'Programar publicación', variant: 'primary' }],
    bloqueado: [{ label: 'Desbloquear', variant: 'secondary' }],
  };

  const currentActions = actions[piece.estado] ?? [];

  if (currentActions.length === 0) {
    return <p className="text-xs text-slate-400">No hay acciones disponibles en el estado actual.</p>;
  }

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'border border-slate-200 hover:bg-slate-50 text-slate-700',
    danger: 'border border-red-200 hover:bg-red-50 text-red-700',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {currentActions.map(action => (
        <button
          key={action.label}
          onClick={() => onAction(action.label)}
          className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${variantClasses[action.variant]}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
