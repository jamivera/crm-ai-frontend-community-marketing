import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, ExternalLink, BarChart2,
  Users, MousePointer, Eye, TrendingUp,
  ChevronRight, Plus, X,
} from 'lucide-react';
import { useFplusStore } from '../../store';
import { PLATFORM_LABELS } from '../../constants';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import MetricForm from './MetricForm';

type Tab = 'resumen' | 'metricas' | 'leads';

const PUB_STATE = {
  planificada: { label: 'Planificada', cls: 'bg-blue-100 text-blue-700' },
  publicada: { label: 'Publicada', cls: 'bg-emerald-100 text-emerald-700' },
  sin_confirmar: { label: 'Sin confirmar', cls: 'bg-amber-100 text-amber-700' },
  cancelada: { label: 'Cancelada', cls: 'bg-slate-100 text-slate-500' },
};

export default function PublicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const publications = useFplusStore(s => s.publications);
  const leads = useFplusStore(s => s.leads);
  const getMetricsByPublication = useFplusStore(s => s.getMetricsByPublication);
  const confirmPublication = useFplusStore(s => s.confirmPublication);

  const pub = publications.find(p => p.id === id);
  const [tab, setTab] = useState<Tab>('resumen');
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!pub) {
    return (
      <div className="p-6 text-center py-20 text-slate-400">
        <p>Publicación no encontrada.</p>
        <button onClick={() => navigate('/fplus/publications')} className="mt-3 text-blue-600 text-sm hover:underline">
          ← Volver a publicaciones
        </button>
      </div>
    );
  }

  const metrics = getMetricsByPublication(pub.id);
  const m = metrics[0];
  const attributedLeads = leads.filter(l => l.publication_id === pub.id);
  const stateInfo = PUB_STATE[pub.estado];

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'metricas', label: 'Métricas', badge: metrics.length },
    { key: 'leads', label: 'Leads', badge: attributedLeads.length },
  ];

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <button onClick={() => navigate('/fplus/publications')} className="hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Link to="/fplus/publications" className="hover:text-slate-600">Publicaciones</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-700 font-medium truncate max-w-xs">{pub.content_piece_nombre}</span>
      </div>

      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <PlatformIcon platform={pub.plataforma} size={22} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">{pub.content_piece_nombre}</h1>
              <div className="flex items-center gap-2 mt-0.5 text-sm text-slate-400 flex-wrap">
                <span>{pub.client_nombre}</span>
                <span>·</span>
                <span>{PLATFORM_LABELS[pub.plataforma]}</span>
                <span>·</span>
                <span>{new Date(pub.fecha_programada).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex rounded-full text-xs font-medium px-3 py-1.5 ${stateInfo.cls}`}>
              {stateInfo.label}
            </span>
            {/* P0-C: Confirm button inline */}
            {pub.estado === 'sin_confirmar' && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirmar publicación
              </button>
            )}
            {pub.url_publicacion && (
              <a
                href={pub.url_publicacion}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver post
              </a>
            )}
          </div>
        </div>

        {/* Top KPIs (from latest metric) */}
        {m && (
          <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KPI icon={<Eye className="w-4 h-4 text-blue-500" />} label="Reach" value={fmt(m.reach)} />
            <KPI icon={<TrendingUp className="w-4 h-4 text-violet-500" />} label="Eng. Rate" value={m.engagement_rate != null ? `${m.engagement_rate}%` : '—'} />
            <KPI icon={<MousePointer className="w-4 h-4 text-amber-500" />} label="Clics" value={fmt(m.clicks)} />
            <KPI icon={<Users className="w-4 h-4 text-emerald-500" />} label="Leads" value={fmt(m.leads)} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Resumen */}
      {tab === 'resumen' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoCard title="Publicación">
            <InfoRow label="Cliente" value={pub.client_nombre} />
            <InfoRow label="Plataforma" value={PLATFORM_LABELS[pub.plataforma]} />
            <InfoRow label="Estado" value={stateInfo.label} />
            <InfoRow label="Fecha programada" value={new Date(pub.fecha_programada).toLocaleDateString('es')} />
            {pub.publicada_at && (
              <InfoRow label="Publicada el" value={new Date(pub.publicada_at).toLocaleDateString('es')} />
            )}
          </InfoCard>

          <InfoCard title="Post-publication">
            <InfoRow label="External Post ID" value={pub.external_post_id ?? '—'} />
            {pub.url_publicacion
              ? <div className="flex justify-between text-sm">
                  <span className="text-slate-500">URL</span>
                  <a href={pub.url_publicacion} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium text-xs truncate max-w-40">
                    {pub.url_publicacion}
                  </a>
                </div>
              : <InfoRow label="URL" value="—" />
            }
          </InfoCard>

          {(pub.utm_source || pub.utm_campaign) && (
            <InfoCard title="UTMs">
              {pub.utm_source && <InfoRow label="utm_source" value={pub.utm_source} mono />}
              {pub.utm_medium && <InfoRow label="utm_medium" value={pub.utm_medium} mono />}
              {pub.utm_campaign && <InfoRow label="utm_campaign" value={pub.utm_campaign} mono />}
              {pub.utm_content && <InfoRow label="utm_content" value={pub.utm_content} mono />}
              {pub.utm_term && <InfoRow label="utm_term" value={pub.utm_term} mono />}
            </InfoCard>
          )}

          {(pub.pilar || pub.hook || pub.objetivo) && (
            <InfoCard title="Blueprint">
              {pub.pilar && <InfoRow label="Pilar" value={pub.pilar} />}
              {pub.objetivo && <InfoRow label="Objetivo" value={pub.objetivo} />}
              {pub.hook && <InfoRow label="Hook" value={pub.hook} />}
              {pub.oferta && <InfoRow label="Oferta" value={pub.oferta} />}
            </InfoCard>
          )}
        </div>
      )}

      {/* Tab: Métricas */}
      {tab === 'metricas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {m ? `Última actualización: ${new Date(m.snapshot_at).toLocaleString('es')}` : 'Sin métricas cargadas aún.'}
            </p>
            <button
              onClick={() => setShowMetricForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {m ? 'Actualizar métricas' : 'Cargar métricas'}
            </button>
          </div>

          {m ? (
            <div className="space-y-4">
              {/* Main KPIs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Reach" value={fmt(m.reach)} icon={<Eye className="w-4 h-4 text-blue-500" />} />
                <MetricCard label="Impressions" value={fmt(m.impressions)} icon={<BarChart2 className="w-4 h-4 text-slate-500" />} />
                <MetricCard label="Engagements" value={fmt(m.engagements)} icon={<TrendingUp className="w-4 h-4 text-violet-500" />} />
                <MetricCard label="Clics" value={fmt(m.clicks)} icon={<MousePointer className="w-4 h-4 text-amber-500" />} />
              </div>

              {/* Engagement breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Desglose de engagement</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <BreakdownItem label="Likes" value={fmt(m.likes)} emoji="❤️" />
                  <BreakdownItem label="Comentarios" value={fmt(m.comments)} emoji="💬" />
                  <BreakdownItem label="Shares" value={fmt(m.shares)} emoji="🔁" />
                  <BreakdownItem label="Guardados" value={fmt(m.saves)} emoji="🔖" />
                </div>
                {m.video_views != null && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <span className="text-sm text-slate-500">Video views:</span>
                    <span className="text-sm font-bold text-slate-800">{fmt(m.video_views)}</span>
                  </div>
                )}
              </div>

              {/* Financial metrics */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Inversión y eficiencia</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <BreakdownItem label="Spend" value={m.spend != null ? `$${m.spend}` : '—'} emoji="💰" />
                  <BreakdownItem label="CPM" value={m.cpm != null ? `$${m.cpm}` : '—'} emoji="📊" />
                  <BreakdownItem label="CPC" value={m.cpc != null ? `$${m.cpc}` : '—'} emoji="👆" />
                  <BreakdownItem label="CPL" value={m.cpl != null ? `$${m.cpl}` : '—'} emoji="🎯" />
                </div>
              </div>

              {/* Leads via metric */}
              {m.leads != null && (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Users className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium text-emerald-800">
                    {m.leads} lead{m.leads !== 1 ? 's' : ''} registrados · Engagement Rate: {m.engagement_rate}%
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl py-14 text-center">
              <BarChart2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Carga las métricas manualmente para ver los resultados.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Leads atribuidos */}
      {tab === 'leads' && (
        <div className="space-y-4">
          {attributedLeads.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl py-14 text-center">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No hay leads atribuidos a esta publicación aún.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Fuente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Calidad</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attributedLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{lead.nombre}</td>
                      <td className="px-4 py-3 text-slate-500 capitalize">{lead.fuente}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          lead.calidad === 'alta' ? 'bg-emerald-100 text-emerald-700' :
                          lead.calidad === 'media' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {lead.calidad}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-500">{lead.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showMetricForm && (
        <MetricForm publication={pub} onClose={() => setShowMetricForm(false)} />
      )}

      {/* P0-C: Inline confirm modal */}
      {showConfirmModal && (
        <InlineConfirmModal
          pubName={pub.content_piece_nombre}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={(url, externalPostId) => {
            confirmPublication(pub.id, url, externalPostId);
            setShowConfirmModal(false);
          }}
        />
      )}
    </div>
  );
}

function InlineConfirmModal({
  pubName,
  onClose,
  onConfirm,
}: {
  pubName: string;
  onClose: () => void;
  onConfirm: (url: string, externalPostId?: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [externalPostId, setExternalPostId] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-800">Confirmar publicación</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600">"{pubName}"</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              URL del post <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              autoFocus
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Post ID <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={externalPostId}
              onChange={e => setExternalPostId(e.target.value)}
              placeholder="ID interno de la plataforma"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(url.trim(), externalPostId.trim() || undefined)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">{icon}{label}</div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">{icon}{label}</div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function BreakdownItem({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{emoji} {label}</p>
      <p className="text-base font-bold text-slate-700">{value}</p>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between text-sm gap-2">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={`font-medium text-slate-700 text-right truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

function fmt(v: number | undefined): string {
  if (v == null) return '—';
  return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString();
}
