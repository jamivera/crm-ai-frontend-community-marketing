import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Link2 } from 'lucide-react';

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

interface UTMBuilderProps {
  value: UTMParams;
  onChange: (params: UTMParams) => void;
  baseUrl?: string;
  onBaseUrlChange?: (url: string) => void;
}

const UTM_FIELDS: { key: keyof UTMParams; label: string; placeholder: string; hint: string }[] = [
  { key: 'utm_source', label: 'Fuente', placeholder: 'instagram', hint: 'Canal de origen (instagram, facebook, tiktok)' },
  { key: 'utm_medium', label: 'Medio', placeholder: 'organic', hint: 'Tipo de tráfico (organic, pauta, email)' },
  { key: 'utm_campaign', label: 'Campaña', placeholder: 'blanqueamiento_junio', hint: 'Nombre de la campaña (sin espacios)' },
  { key: 'utm_content', label: 'Contenido', placeholder: 'reel_testimonial', hint: 'Identificador de la pieza' },
  { key: 'utm_term', label: 'Término', placeholder: 'odontologia_guayaquil', hint: 'Opcional: palabra clave segmentada' },
];

function buildUTMUrl(base: string, params: UTMParams): string {
  const filled = Object.entries(params).filter(([, v]) => v && v.trim() !== '') as [string, string][];
  if (filled.length === 0) return base;
  const query = filled.map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`).join('&');
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}${query}`;
}

export function UTMBuilder({ value, onChange, baseUrl = '', onBaseUrlChange }: UTMBuilderProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = buildUTMUrl(baseUrl, value);
  const hasUtms = Object.values(value).some(v => v && v.trim() !== '');

  function handleCopy() {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleField(key: keyof UTMParams, val: string) {
    onChange({ ...value, [key]: val.toLowerCase().replace(/\s+/g, '_') });
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Constructor de UTMs</span>
          {hasUtms && (
            <span className="text-[10px] bg-blue-100 text-blue-700 font-medium px-1.5 py-0.5 rounded-full">
              Configurado
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="p-4 space-y-4 bg-white">
          {/* Base URL */}
          {onBaseUrlChange !== undefined && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">URL destino</label>
              <input
                type="url"
                value={baseUrl}
                onChange={e => onBaseUrlChange(e.target.value)}
                placeholder="https://tudominio.com/landing"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* UTM fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {UTM_FIELDS.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {f.label}
                  {f.key !== 'utm_term' && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                <input
                  type="text"
                  value={value[f.key] ?? ''}
                  onChange={e => handleField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">{f.hint}</p>
              </div>
            ))}
          </div>

          {/* URL preview */}
          {hasUtms && (
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-600">URL con UTMs</p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-slate-500 font-mono break-all leading-relaxed">{fullUrl}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
