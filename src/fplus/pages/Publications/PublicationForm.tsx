import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { UTMBuilder, type UTMParams } from '../../components/ui/UTMBuilder';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import { useFplusStore } from '../../store';
import { PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '../../constants';
import type { Publication, Platform } from '../../types';

const PLATFORMS: Platform[] = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter', 'google'];

const OBJETIVOS = ['awareness', 'engagement', 'leads', 'ventas', 'retencion'] as const;
const PILARES = ['Educativo', 'Testimonial', 'Showcase', 'Promocional', 'Entretenimiento', 'Behind the scenes'];
const FORMATOS = ['Reel', 'Carrusel', 'Post imagen', 'Historia', 'Short', 'TikTok', 'Video', 'Banner'];

interface PublicationFormProps {
  onClose: () => void;
  preselectedClientId?: string;
  preselectedPieceId?: string;
}

export function PublicationForm({ onClose, preselectedClientId, preselectedPieceId }: PublicationFormProps) {
  const { clients, contentPieces, createPublication } = useFplusStore();

  const [clientId, setClientId] = useState(preselectedClientId ?? '');
  const [pieceId, setPieceId] = useState(preselectedPieceId ?? '');
  const [plataforma, setPlataforma] = useState<Platform>('instagram');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('12:00');
  const [copyFinal, setCopyFinal] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [menciones, setMenciones] = useState('');
  const [cta, setCta] = useState('');
  const [formato, setFormato] = useState('');
  const [duracion, setDuracion] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [pilar, setPilar] = useState('');
  const [hook, setHook] = useState('');
  const [oferta, setOferta] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [utmParams, setUtmParams] = useState<UTMParams>({
    utm_source: plataforma,
    utm_medium: 'organic',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
  });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);

  const clientPieces = contentPieces.filter(cp =>
    cp.client_id === clientId &&
    ['enviado_cliente', 'en_revision_cliente', 'aprobado_cliente', 'aprobado_final', 'listo_para_cliente'].includes(cp.estado)
  );

  const selectedPiece = contentPieces.find(cp => cp.id === pieceId);
  const selectedClient = clients.find(c => c.id === clientId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !pieceId || !fecha || !plataforma) return;

    const newPub: Publication = {
      id: `pub-${Date.now()}`,
      content_piece_id: pieceId,
      content_piece_nombre: selectedPiece?.nombre ?? '',
      client_id: clientId,
      client_nombre: selectedClient?.nombre ?? '',
      campaign_id: selectedPiece?.campaign_id,
      plataforma,
      fecha_programada: new Date(`${fecha}T${hora}:00`).toISOString(),
      hora_programada: hora,
      copy_final: copyFinal || undefined,
      hashtags: hashtags.split(/[\s,]+/).filter(Boolean),
      menciones: menciones.split(/[\s,]+/).filter(Boolean),
      call_to_action: cta || undefined,
      formato: formato || undefined,
      duracion_segundos: duracion ? parseInt(duracion) : undefined,
      utm_source: utmParams.utm_source || undefined,
      utm_medium: utmParams.utm_medium || undefined,
      utm_campaign: utmParams.utm_campaign || undefined,
      utm_content: utmParams.utm_content || undefined,
      utm_term: utmParams.utm_term || undefined,
      estado: 'planificada',
      leads_atribuidos: 0,
      objetivo: objetivo || undefined,
      pilar: pilar || undefined,
      hook: hook || undefined,
      oferta: oferta || undefined,
    };

    createPublication(newPub);
    setSubmitted(true);
    setTimeout(onClose, 1200);
  }

  if (submitted) {
    return (
      <DrawerShell onClose={onClose}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <Send className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-800 mb-1">Publicación programada</h2>
          <p className="text-sm text-slate-500">Quedó registrada en el sistema.</p>
        </div>
      </DrawerShell>
    );
  }

  return (
    <DrawerShell onClose={onClose}>
      {/* Steps indicator */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        {([1, 2, 3] as const).map(s => (
          <React.Fragment key={s}>
            <button
              type="button"
              onClick={() => setStep(s)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                step === s ? 'text-blue-600' : step > s ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === s ? 'bg-blue-600 text-white' : step > s ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>{s}</span>
              {s === 1 ? 'Programación' : s === 2 ? 'Contenido' : 'UTMs'}
            </button>
            {s < 3 && <div className="flex-1 h-px bg-slate-200" />}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        {/* ── Step 1: Scheduling ── */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <FormSection title="Pieza y cliente">
              <FormField label="Cliente" required>
                <select
                  value={clientId}
                  onChange={e => { setClientId(e.target.value); setPieceId(''); }}
                  className={selectClass}
                  required
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </FormField>
              <FormField label="Pieza de contenido" required>
                <select
                  value={pieceId}
                  onChange={e => {
                    setPieceId(e.target.value);
                    const piece = contentPieces.find(cp => cp.id === e.target.value);
                    if (piece?.copy_activo) setCopyFinal(piece.copy_activo);
                  }}
                  className={selectClass}
                  required
                  disabled={!clientId}
                >
                  <option value="">Seleccionar pieza...</option>
                  {clientPieces.map(cp => (
                    <option key={cp.id} value={cp.id}>
                      {cp.nombre} ({CONTENT_TYPE_LABELS[cp.tipo]})
                    </option>
                  ))}
                </select>
                {clientId && clientPieces.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No hay piezas aprobadas para este cliente.</p>
                )}
              </FormField>
            </FormSection>

            <FormSection title="Plataforma y fecha">
              <FormField label="Plataforma" required>
                <div className="grid grid-cols-4 gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPlataforma(p);
                        setUtmParams(prev => ({ ...prev, utm_source: p }));
                      }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${
                        plataforma === p
                          ? 'border-blue-400 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-500'
                      }`}
                    >
                      <PlatformIcon platform={p} size={18} />
                      <span className="capitalize text-[10px]">{PLATFORM_LABELS[p]}</span>
                    </button>
                  ))}
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Fecha" required>
                  <input
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    className={inputClass}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </FormField>
                <FormField label="Hora">
                  <input
                    type="time"
                    value={hora}
                    onChange={e => setHora(e.target.value)}
                    className={inputClass}
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Blueprint (para análisis futuro)">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Objetivo">
                  <select value={objetivo} onChange={e => setObjetivo(e.target.value)} className={selectClass}>
                    <option value="">Seleccionar...</option>
                    {OBJETIVOS.map(o => <option key={o} value={o} className="capitalize">{o}</option>)}
                  </select>
                </FormField>
                <FormField label="Pilar">
                  <select value={pilar} onChange={e => setPilar(e.target.value)} className={selectClass}>
                    <option value="">Seleccionar...</option>
                    {PILARES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </FormField>
                <FormField label="Formato">
                  <select value={formato} onChange={e => setFormato(e.target.value)} className={selectClass}>
                    <option value="">Seleccionar...</option>
                    {FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </FormField>
                <FormField label="Duración (seg)">
                  <input
                    type="number"
                    value={duracion}
                    onChange={e => setDuracion(e.target.value)}
                    placeholder="30"
                    min="0"
                    className={inputClass}
                  />
                </FormField>
              </div>
            </FormSection>
          </div>
        )}

        {/* ── Step 2: Content ── */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <FormSection title="Copy y contenido">
              <FormField label="Copy final">
                <textarea
                  value={copyFinal}
                  onChange={e => setCopyFinal(e.target.value)}
                  placeholder="Texto que irá en la publicación..."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
                <p className="text-xs text-slate-400 mt-1">{copyFinal.length} caracteres</p>
              </FormField>
              <FormField label="Hashtags">
                <input
                  type="text"
                  value={hashtags}
                  onChange={e => setHashtags(e.target.value)}
                  placeholder="#marketing #contenido #agencia"
                  className={`${inputClass} font-mono text-xs`}
                />
                <p className="text-xs text-slate-400 mt-1">Separados por espacio o coma</p>
              </FormField>
              <FormField label="Menciones">
                <input
                  type="text"
                  value={menciones}
                  onChange={e => setMenciones(e.target.value)}
                  placeholder="@cuenta1 @cuenta2"
                  className={`${inputClass} font-mono text-xs`}
                />
              </FormField>
              <FormField label="Call to action">
                <input
                  type="text"
                  value={cta}
                  onChange={e => setCta(e.target.value)}
                  placeholder="Agenda tu cita ahora · Link en bio"
                  className={inputClass}
                />
              </FormField>
            </FormSection>

            <FormSection title="Hook y oferta (para análisis)">
              <FormField label="Hook de apertura">
                <input
                  type="text"
                  value={hook}
                  onChange={e => setHook(e.target.value)}
                  placeholder="¿Sabías que el 80% de las personas..."
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 mt-1">Primera frase o elemento visual de enganche</p>
              </FormField>
              <FormField label="Oferta o propuesta">
                <input
                  type="text"
                  value={oferta}
                  onChange={e => setOferta(e.target.value)}
                  placeholder="2×1 en blanqueamiento dental"
                  className={inputClass}
                />
              </FormField>
            </FormSection>
          </div>
        )}

        {/* ── Step 3: UTMs ── */}
        {step === 3 && (
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-500">
              Los UTMs permiten rastrear desde qué publicación llegó cada lead a tu landing page.
            </p>
            <UTMBuilder
              value={utmParams}
              onChange={setUtmParams}
              baseUrl={baseUrl}
              onBaseUrlChange={setBaseUrl}
            />
            <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
              <p className="font-medium mb-1">Recomendación para {PLATFORM_LABELS[plataforma]}</p>
              <p>utm_source: <span className="font-mono">{plataforma}</span></p>
              <p>utm_medium: <span className="font-mono">organic</span> o <span className="font-mono">pauta</span></p>
              {selectedPiece?.campaign_nombre && (
                <p>utm_campaign: <span className="font-mono">{selectedPiece.campaign_nombre.toLowerCase().replace(/\s+/g, '_')}</span></p>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Footer navigation */}
      <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-white">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Atrás
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
            disabled={step === 1 && (!clientId || !pieceId || !fecha)}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="submit"
            form="pub-form"
            onClick={handleSubmit}
            disabled={!clientId || !pieceId || !fecha}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Programar publicación
          </button>
        )}
      </div>
    </DrawerShell>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function DrawerShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto bg-white w-full max-w-lg flex flex-col shadow-2xl h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-semibold text-slate-800">Nueva publicación</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';
const selectClass = `${inputClass} cursor-pointer`;

export default PublicationForm;
