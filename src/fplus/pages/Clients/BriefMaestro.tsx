import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Building2, Users, Layers, Radio,
  Save, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useFplusStore } from '../../store';
import type { Platform, ContentType } from '../../types';
import { PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '../../constants';

const TONO_OPTIONS = [
  'Profesional', 'Cercano', 'Informal', 'Humorístico', 'Inspirador',
  'Educativo', 'Urgente', 'Aspiracional', 'Técnico', 'Empático',
];

const PILAR_SUGERIDOS = [
  'Educativo', 'Testimonial', 'Showcase', 'Promocional',
  'Behind the scenes', 'Entretenimiento', 'Noticias', 'Comunidad',
];

const ALL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter', 'google'];
const CONTENT_TYPES: ContentType[] = ['reel', 'carrusel', 'post_imagen', 'historia', 'post_video', 'short', 'tiktok', 'infografia'];
const RANGOS_EDAD = ['18-24', '25-34', '35-44', '45-54', '55+', 'Todos'];

type WizardStep = 'negocio' | 'comercial' | 'audiencia' | 'contenido' | 'canales';
const STEPS: { key: WizardStep; label: string; icon: React.ElementType }[] = [
  { key: 'negocio', label: 'Negocio', icon: Building2 },
  { key: 'comercial', label: 'Comercial', icon: Building2 },
  { key: 'audiencia', label: 'Audiencia', icon: Users },
  { key: 'contenido', label: 'Contenido', icon: Layers },
  { key: 'canales', label: 'Canales', icon: Radio },
];

export default function BriefMaestro() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, getBrief, saveBrief } = useFplusStore();

  const client = clients.find(c => c.id === clientId);
  const existing = clientId ? getBrief(clientId) : undefined;

  const [step, setStep] = useState<WizardStep>('negocio');
  const [saved, setSaved] = useState(false);

  // ── Negocio ──
  const [propuestaValor, setPropuestaValor] = useState(existing?.propuesta_valor ?? '');
  const [diferenciadores, setDiferenciadores] = useState(existing?.diferenciadores ?? '');
  const [competencia, setCompetencia] = useState(existing?.competencia ?? '');
  const [historiaMarca, setHistoriaMarca] = useState(existing?.historia_marca ?? '');

  // Comercial — alimenta la estrategia publicitaria y la IA
  const [objetivosComerciales, setObjetivosComerciales] = useState(existing?.objetivos_comerciales ?? '');
  const [servicios, setServicios] = useState(existing?.servicios ?? '');
  const [productos, setProductos] = useState(existing?.productos ?? '');
  const [ticketPromedio, setTicketPromedio] = useState(existing?.ticket_promedio ?? '');
  const [presupuestoMarketing, setPresupuestoMarketing] = useState(existing?.presupuesto_marketing ?? '');
  const [procesoComercial, setProcesoComercial] = useState(existing?.proceso_comercial ?? '');
  const [embudoActual, setEmbudoActual] = useState(existing?.embudo_actual ?? '');

  // ── Audiencia ──
  const [perfilCliente, setPerfilCliente] = useState(existing?.perfil_cliente ?? '');
  const [rangoEdad, setRangoEdad] = useState(existing?.rango_edad ?? '');
  const [ubicacion, setUbicacion] = useState(existing?.ubicacion ?? '');
  const [painPoints, setPainPoints] = useState(existing?.pain_points ?? '');
  const [motivaciones, setMotivaciones] = useState(existing?.motivaciones ?? '');
  const [objeciones, setObjeciones] = useState(existing?.objeciones ?? '');

  // ── Contenido ──
  const [pilares, setPilares] = useState<string[]>(existing?.pilares ?? []);
  const [tono, setTono] = useState<string[]>(existing?.tono ?? []);
  const [formatos, setFormatos] = useState<ContentType[]>(existing?.formatos_preferidos ?? []);
  const [queNoHacer, setQueNoHacer] = useState(existing?.que_no_hacer ?? '');
  const [hashtags, setHashtags] = useState((existing?.hashtags_habituales ?? []).join(' '));

  // ── Canales ──
  const [plataformas, setPlataformas] = useState<Platform[]>(existing?.plataformas_activas ?? []);
  const [frecuencia, setFrecuencia] = useState(existing?.frecuencia_semanal?.toString() ?? '');
  const [horarios, setHorarios] = useState(existing?.horarios_preferidos ?? '');
  const [objetivo, setObjetivo] = useState(existing?.objetivo_principal ?? '');
  const [urlLanding, setUrlLanding] = useState(existing?.url_landing ?? '');

  if (!client) {
    return (
      <div className="p-6 text-center text-slate-400">
        <p className="text-sm">Cliente no encontrado.</p>
        <button onClick={() => navigate('/fplus/clients')} className="mt-2 text-blue-600 text-sm hover:underline">
          ← Volver
        </button>
      </div>
    );
  }

  function toggleArr<T>(arr: T[], val: T, set: (v: T[]) => void) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  function handleSave() {
    if (!clientId) return;
    saveBrief({
      objetivos_comerciales: objetivosComerciales,
      servicios,
      productos,
      ticket_promedio: ticketPromedio,
      presupuesto_marketing: presupuestoMarketing,
      proceso_comercial: procesoComercial,
      embudo_actual: embudoActual,
      client_id: clientId,
      propuesta_valor: propuestaValor,
      diferenciadores,
      competencia,
      historia_marca: historiaMarca,
      perfil_cliente: perfilCliente,
      rango_edad: rangoEdad,
      ubicacion,
      pain_points: painPoints,
      motivaciones,
      objeciones,
      pilares,
      tono,
      formatos_preferidos: formatos,
      que_no_hacer: queNoHacer,
      hashtags_habituales: hashtags.split(/[\s,]+/).filter(Boolean),
      plataformas_activas: plataformas,
      frecuencia_semanal: parseInt(frecuencia) || 3,
      horarios_preferidos: horarios,
      objetivo_principal: objetivo,
      url_landing: urlLanding || undefined,
      updated_at: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const currentIdx = STEPS.findIndex(s => s.key === step);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/fplus/clients/${clientId}`)}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Brief Maestro
          </h1>
          <p className="text-xs text-slate-400">{client.nombre}</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            saved
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Guardado' : 'Guardar brief'}
        </button>
      </div>

      {/* Step nav */}
      <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const active = step === s.key;
          const done = idx < currentIdx;
          return (
            <button
              key={s.key}
              onClick={() => setStep(s.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                active ? 'bg-blue-600 text-white shadow-sm' :
                done ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Step: Negocio ── */}
      {step === 'negocio' && (
        <Card title="Negocio" subtitle="Define el posicionamiento y diferenciadores de la marca.">
          <Field label="Propuesta de valor" required>
            <textarea
              value={propuestaValor}
              onChange={e => setPropuestaValor(e.target.value)}
              placeholder="¿Qué solución única ofrece esta empresa a su cliente ideal?"
              rows={3}
              className={ta}
            />
          </Field>
          <Field label="Diferenciadores clave">
            <textarea
              value={diferenciadores}
              onChange={e => setDiferenciadores(e.target.value)}
              placeholder="¿En qué es diferente esta marca frente a su competencia?"
              rows={3}
              className={ta}
            />
          </Field>
          <Field label="Competencia principal">
            <input
              type="text"
              value={competencia}
              onChange={e => setCompetencia(e.target.value)}
              placeholder="Nombre de 1-3 competidores directos"
              className={inp}
            />
          </Field>
          <Field label="Historia de marca (opcional)">
            <textarea
              value={historiaMarca}
              onChange={e => setHistoriaMarca(e.target.value)}
              placeholder="Origen, misión, valores. Ayuda a humanizar el contenido."
              rows={3}
              className={ta}
            />
          </Field>
        </Card>
      )}

      {/* ── Step: Audiencia ── */}
      {step === 'comercial' && (
        <Card title="Comercial" subtitle="Cómo vende la empresa — esta información alimenta directamente la estrategia de campañas.">
          <Field label="Objetivos comerciales">
            <textarea value={objetivosComerciales} onChange={e => setObjetivosComerciales(e.target.value)} placeholder="¿Qué quiere lograr el negocio en los próximos 6-12 meses? (ventas, sucursales, nuevos mercados…)" rows={2} className={ta} />
          </Field>
          <Field label="Servicios">
            <textarea value={servicios} onChange={e => setServicios(e.target.value)} placeholder="Servicios que ofrece, del más al menos importante" rows={2} className={ta} />
          </Field>
          <Field label="Productos">
            <textarea value={productos} onChange={e => setProductos(e.target.value)} placeholder="Productos estrella y de temporada" rows={2} className={ta} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ticket promedio">
              <input value={ticketPromedio} onChange={e => setTicketPromedio(e.target.value)} placeholder="Ej: $25 por persona" className={inp} />
            </Field>
            <Field label="Presupuesto de marketing">
              <input value={presupuestoMarketing} onChange={e => setPresupuestoMarketing(e.target.value)} placeholder="Ej: $500/mes en pauta" className={inp} />
            </Field>
          </div>
          <Field label="Proceso comercial">
            <textarea value={procesoComercial} onChange={e => setProcesoComercial(e.target.value)} placeholder="¿Cómo se concreta una venta? (mensaje → cotización → visita → cierre)" rows={2} className={ta} />
          </Field>
          <Field label="Embudo actual">
            <textarea value={embudoActual} onChange={e => setEmbudoActual(e.target.value)} placeholder="¿De dónde llegan hoy los clientes? (recomendación, redes, Google, local físico…)" rows={2} className={ta} />
          </Field>
        </Card>
      )}

      {step === 'audiencia' && (
        <Card title="Audiencia" subtitle="Define con precisión a quién le habla este contenido.">
          <Field label="Perfil del cliente ideal" required>
            <textarea
              value={perfilCliente}
              onChange={e => setPerfilCliente(e.target.value)}
              placeholder="Ej: Mujer profesional de 28-45 años, en Guayaquil, interesada en salud y bienestar personal..."
              rows={3}
              className={ta}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rango de edad">
              <select value={rangoEdad} onChange={e => setRangoEdad(e.target.value)} className={sel}>
                <option value="">Seleccionar...</option>
                {RANGOS_EDAD.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Ubicación principal">
              <input
                type="text"
                value={ubicacion}
                onChange={e => setUbicacion(e.target.value)}
                placeholder="Guayaquil, Ecuador"
                className={inp}
              />
            </Field>
          </div>
          <Field label="Pain points (problemas que resuelve)">
            <textarea
              value={painPoints}
              onChange={e => setPainPoints(e.target.value)}
              placeholder="¿Qué problemas tiene esta audiencia que la marca puede resolver?"
              rows={3}
              className={ta}
            />
          </Field>
          <Field label="Motivaciones de compra">
            <textarea
              value={motivaciones}
              onChange={e => setMotivaciones(e.target.value)}
              placeholder="¿Por qué compran? ¿Qué los impulsa a tomar acción?"
              rows={2}
              className={ta}
            />
          </Field>
          <Field label="Objeciones frecuentes">
            <textarea
              value={objeciones}
              onChange={e => setObjeciones(e.target.value)}
              placeholder="¿Qué los detiene? ¿Qué dudas tienen antes de comprar?"
              rows={2}
              className={ta}
            />
          </Field>
        </Card>
      )}

      {/* ── Step: Contenido ── */}
      {step === 'contenido' && (
        <Card title="Contenido" subtitle="Define la voz, pilares y lineamientos de producción.">
          <Field label="Pilares de contenido" required>
            <div className="flex flex-wrap gap-2">
              {PILAR_SUGERIDOS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleArr(pilares, p, setPilares)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    pilares.includes(p)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Tono de voz">
            <div className="flex flex-wrap gap-2">
              {TONO_OPTIONS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleArr(tono, t, setTono)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    tono.includes(t)
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-violet-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Formatos preferidos">
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleArr(formatos, f, setFormatos)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    formatos.includes(f)
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-emerald-300'
                  }`}
                >
                  {CONTENT_TYPE_LABELS[f]}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Qué NO hacer (límites de marca)">
            <textarea
              value={queNoHacer}
              onChange={e => setQueNoHacer(e.target.value)}
              placeholder="No usar humor inapropiado, no mencionar precios sin autorización, no comparar directamente con competencia..."
              rows={3}
              className={ta}
            />
          </Field>
          <Field label="Hashtags habituales">
            <input
              type="text"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder="#clinicasmile #salud #odontologia"
              className={`${inp} font-mono text-xs`}
            />
            <p className="text-xs text-slate-400 mt-1">Separados por espacio</p>
          </Field>
        </Card>
      )}

      {/* ── Step: Canales ── */}
      {step === 'canales' && (
        <Card title="Canales" subtitle="Define dónde y cómo se distribuye el contenido.">
          <Field label="Plataformas activas" required>
            <div className="grid grid-cols-4 gap-2">
              {ALL_PLATFORMS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleArr(plataformas, p, setPlataformas)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition-all ${
                    plataformas.includes(p)
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg">{getPlatformEmoji(p)}</span>
                  <span className="text-[10px]">{PLATFORM_LABELS[p]}</span>
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Publicaciones por semana">
              <input
                type="number"
                value={frecuencia}
                onChange={e => setFrecuencia(e.target.value)}
                placeholder="5"
                min="1"
                max="30"
                className={inp}
              />
            </Field>
            <Field label="Objetivo principal">
              <select value={objetivo} onChange={e => setObjetivo(e.target.value)} className={sel}>
                <option value="">Seleccionar...</option>
                {['Awareness', 'Leads', 'Engagement', 'Ventas', 'Comunidad'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Horarios de mayor engagement">
            <input
              type="text"
              value={horarios}
              onChange={e => setHorarios(e.target.value)}
              placeholder="Lun-Vie 12:00-13:00, Sáb 10:00-11:00"
              className={inp}
            />
          </Field>
          <Field label="URL de landing page / sitio web">
            <input
              type="url"
              value={urlLanding}
              onChange={e => setUrlLanding(e.target.value)}
              placeholder="https://clinicasmile.com.ec"
              className={inp}
            />
            <p className="text-xs text-slate-400 mt-1">Se usará como base para los UTMs de publicaciones.</p>
          </Field>
        </Card>
      )}

      {/* Bottom nav */}
      <div className="flex justify-between">
        {currentIdx > 0 ? (
          <button
            onClick={() => setStep(STEPS[currentIdx - 1].key)}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            ← Atrás
          </button>
        ) : <span />}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              saved ? 'bg-emerald-100 text-emerald-700' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Guardado' : 'Guardar'}
          </button>
          {currentIdx < STEPS.length - 1 && (
            <button
              onClick={() => setStep(STEPS[currentIdx + 1].key)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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

function getPlatformEmoji(p: Platform): string {
  const m: Record<Platform, string> = {
    instagram: '📸', facebook: '👥', tiktok: '🎵', youtube: '▶️',
    linkedin: '💼', twitter: '🐦', google: '🔍',
  };
  return m[p];
}

const inp = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const ta = `${inp} resize-none`;
const sel = `${inp} cursor-pointer`;
