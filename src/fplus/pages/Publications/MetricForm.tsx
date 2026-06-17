import React, { useState } from 'react';
import { X, BarChart2, Calculator } from 'lucide-react';
import { useFplusStore } from '../../store';
import type { Publication, PublicationMetric } from '../../types';

interface Props {
  publication: Publication;
  onClose: () => void;
}

interface FormState {
  reach: string;
  impressions: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  clicks: string;
  video_views: string;
  spend: string;
  leads: string;
}

const EMPTY: FormState = {
  reach: '', impressions: '', likes: '', comments: '',
  shares: '', saves: '', clicks: '', video_views: '', spend: '', leads: '',
};

function n(v: string) { return v === '' ? undefined : parseFloat(v); }

function calcDerived(f: FormState) {
  const impressions = n(f.impressions);
  const engagements = (n(f.likes) ?? 0) + (n(f.comments) ?? 0) + (n(f.shares) ?? 0) + (n(f.saves) ?? 0);
  const clicks = n(f.clicks);
  const spend = n(f.spend);
  const leads = n(f.leads);
  const reach = n(f.reach);

  const engagement_rate =
    reach && reach > 0 && engagements > 0
      ? parseFloat(((engagements / reach) * 100).toFixed(2))
      : undefined;
  const cpm =
    spend != null && impressions && impressions > 0
      ? parseFloat(((spend / impressions) * 1000).toFixed(2))
      : undefined;
  const cpc =
    spend != null && clicks && clicks > 0
      ? parseFloat((spend / clicks).toFixed(2))
      : undefined;
  const cpl =
    spend != null && leads && leads > 0
      ? parseFloat((spend / leads).toFixed(2))
      : undefined;

  return { engagements: engagements || undefined, engagement_rate, cpm, cpc, cpl };
}

export default function MetricForm({ publication, onClose }: Props) {
  const addMetric = useFplusStore(s => s.addMetric);
  const getMetricsByPublication = useFplusStore(s => s.getMetricsByPublication);
  const updateMetric = useFplusStore(s => s.updateMetric);

  const existing = getMetricsByPublication(publication.id)[0];

  const [form, setForm] = useState<FormState>(() =>
    existing ? {
      reach: existing.reach?.toString() ?? '',
      impressions: existing.impressions?.toString() ?? '',
      likes: existing.likes?.toString() ?? '',
      comments: existing.comments?.toString() ?? '',
      shares: existing.shares?.toString() ?? '',
      saves: existing.saves?.toString() ?? '',
      clicks: existing.clicks?.toString() ?? '',
      video_views: existing.video_views?.toString() ?? '',
      spend: existing.spend?.toString() ?? '',
      leads: existing.leads?.toString() ?? '',
    } : { ...EMPTY }
  );

  const derived = calcDerived(form);

  function handleChange(key: keyof FormState, value: string) {
    if (value !== '' && isNaN(parseFloat(value))) return;
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const metric: PublicationMetric = {
      id: existing?.id ?? `m-${Date.now()}`,
      publication_id: publication.id,
      plataforma: publication.plataforma,
      snapshot_at: new Date().toISOString(),
      reach: n(form.reach),
      impressions: n(form.impressions),
      engagements: derived.engagements,
      likes: n(form.likes),
      comments: n(form.comments),
      shares: n(form.shares),
      saves: n(form.saves),
      clicks: n(form.clicks),
      video_views: n(form.video_views),
      spend: n(form.spend),
      leads: n(form.leads),
      cpm: derived.cpm,
      cpc: derived.cpc,
      cpl: derived.cpl,
      engagement_rate: derived.engagement_rate,
    };

    if (existing) {
      updateMetric(existing.id, metric);
    } else {
      addMetric(metric);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="font-semibold text-slate-800 text-sm">
                {existing ? 'Actualizar métricas' : 'Cargar métricas'}
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-64">{publication.content_piece_nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5 flex-1">
          {/* Reach & Impressions */}
          <Section title="Alcance">
            <FieldRow label="Reach" value={form.reach} onChange={v => handleChange('reach', v)} />
            <FieldRow label="Impressions" value={form.impressions} onChange={v => handleChange('impressions', v)} />
          </Section>

          {/* Engagement */}
          <Section title="Engagement">
            <FieldRow label="Likes" value={form.likes} onChange={v => handleChange('likes', v)} />
            <FieldRow label="Comentarios" value={form.comments} onChange={v => handleChange('comments', v)} />
            <FieldRow label="Shares" value={form.shares} onChange={v => handleChange('shares', v)} />
            <FieldRow label="Guardados" value={form.saves} onChange={v => handleChange('saves', v)} />
          </Section>

          {/* Traffic */}
          <Section title="Tráfico">
            <FieldRow label="Clics" value={form.clicks} onChange={v => handleChange('clicks', v)} />
            <FieldRow label="Video views" value={form.video_views} onChange={v => handleChange('video_views', v)} />
          </Section>

          {/* Spend & Leads */}
          <Section title="Inversión y resultados">
            <FieldRow label="Spend ($)" value={form.spend} onChange={v => handleChange('spend', v)} prefix="$" />
            <FieldRow label="Leads" value={form.leads} onChange={v => handleChange('leads', v)} />
          </Section>

          {/* Derived metrics preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-3">
              <Calculator className="w-3.5 h-3.5" />
              Métricas calculadas automáticamente
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DerivedKPI label="Engagement Rate" value={derived.engagement_rate != null ? `${derived.engagement_rate}%` : '—'} />
              <DerivedKPI label="CPM" value={derived.cpm != null ? `$${derived.cpm}` : '—'} />
              <DerivedKPI label="CPC" value={derived.cpc != null ? `$${derived.cpc}` : '—'} />
              <DerivedKPI label="CPL" value={derived.cpl != null ? `$${derived.cpl}` : '—'} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {existing ? 'Actualizar' : 'Guardar métricas'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function FieldRow({
  label, value, onChange, prefix,
}: {
  label: string; value: string; onChange: (v: string) => void; prefix?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-slate-600 w-32 shrink-0">{label}</label>
      <div className="relative flex-1">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span>
        )}
        <input
          type="number"
          min="0"
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full ${prefix ? 'pl-7' : 'pl-3'} pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="0"
        />
      </div>
    </div>
  );
}

function DerivedKPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg p-2.5 border border-slate-100">
      <p className="text-[10px] text-slate-400 font-medium">{label}</p>
      <p className="text-sm font-bold text-slate-700 mt-0.5">{value}</p>
    </div>
  );
}
