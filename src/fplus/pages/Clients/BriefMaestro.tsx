import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Building2, Users, Layers, Radio,
  CheckCircle2, ChevronRight
} from 'lucide-react';
import { useFplusStore } from '../../store';
import { getIndustryProfile } from '../../utils/cronoplanner';
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
  const { clientId = '' } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { clients, getBrief, saveBrief, loadBrief, updateClient, addProjectHistoryEvent } = useFplusStore();

  const client = clients.find(c => c.id === clientId);
  const existing = clientId ? getBrief(clientId) : undefined;

  const [step, setStep] = useState<WizardStep>('negocio');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientId) {
      setLoading(true);
      loadBrief(clientId).finally(() => setLoading(false));
    }
  }, [clientId, loadBrief]);

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
  const [sugiriendo, setSugiriendo] = useState(false);

  // La IA sugiere horario, días fuertes y frecuencia según industria,
  // público y estrategia. El usuario siempre puede modificar la propuesta.
  const sugerirHorarios = async () => {
    if (!client) return;
    setSugiriendo(true);
    await new Promise(r => setTimeout(r, 900)); // simula análisis IA
    const profile = getIndustryProfile(client.tipo_mercado ?? client.industria);
    const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    // días con mayor puntaje promedio entre formatos
    const totals = Array.from({ length: 7 }, (_, d) =>
      Object.values(profile.dayScores).reduce((a, arr) => a + (arr?.[d] ?? 0), 0));
    const topDays = totals.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v).slice(0, 3)
      .sort((a, b) => a.i - b.i).map(x => DAY_NAMES[x.i]);
    const horas = [...new Set(Object.values(profile.horaSugerida))].slice(0, 2).join(' y ');
    setHorarios(`${topDays.join(', ')} · ${horas} (sugerido por IA según tu sector)`);
    if (!frecuencia) {
      const piezas = client.piezas_mensuales ?? 12;
      setFrecuencia(String(Math.max(2, Math.round(piezas / 4))));
    }
    setSugiriendo(false);
  };
  const [objetivo, setObjetivo] = useState(existing?.objetivo_principal ?? '');
  const [urlLanding, setUrlLanding] = useState(existing?.url_landing ?? '');
  const [presupuestoPauta, setPresupuestoPauta] = useState<number>(client?.presupuesto_pauta ?? 0);
  const [pautaPlataformas, setPautaPlataformas] = useState<string[]>(client?.pauta_plataformas ?? ['Meta Ads']);

  // Platform specific states
  const [googleKeywords, setGoogleKeywords] = useState(existing?.metadata?.google_keywords ?? '');
  const [googleLanding, setGoogleLanding] = useState(existing?.metadata?.google_landing ?? '');
  const [googleCpa, setGoogleCpa] = useState(existing?.metadata?.google_cpa ?? '');

  const [tiktokTrends, setTiktokTrends] = useState(existing?.metadata?.tiktok_trends ?? '');
  const [tiktokFormat, setTiktokFormat] = useState(existing?.metadata?.tiktok_format ?? '');
  const [tiktokFatiga, setTiktokFatiga] = useState(existing?.metadata?.tiktok_fatiga ?? '');

  const [linkedinTarget, setLinkedinTarget] = useState(existing?.metadata?.linkedin_target ?? '');
  const [linkedinFormat, setLinkedinFormat] = useState(existing?.metadata?.linkedin_format ?? '');
  const [linkedinLeadMagnet, setLinkedinLeadMagnet] = useState(existing?.metadata?.linkedin_lead_magnet ?? '');

  const [metaSeg, setMetaSeg] = useState(existing?.metadata?.meta_seg ?? '');
  const [metaFormat, setMetaFormat] = useState(existing?.metadata?.meta_format ?? '');
  const [metaHook, setMetaHook] = useState(existing?.metadata?.meta_hook ?? '');

  useEffect(() => {
    if (client) {
      setPresupuestoPauta(client.presupuesto_pauta ?? 0);
      setPautaPlataformas(client.pauta_plataformas ?? ['Meta Ads']);
    }
  }, [client]);

  useEffect(() => {
    if (existing) {
      setPropuestaValor(existing.propuesta_valor ?? '');
      setDiferenciadores(existing.diferenciadores ?? '');
      setCompetencia(existing.competencia ?? '');
      setHistoriaMarca(existing.historia_marca ?? '');
      setObjetivosComerciales(existing.objetivos_comerciales ?? '');
      setServicios(existing.servicios ?? '');
      setProductos(existing.productos ?? '');
      setTicketPromedio(existing.ticket_promedio ?? '');
      setPresupuestoMarketing(existing.presupuesto_marketing ?? '');
      setProcesoComercial(existing.proceso_comercial ?? '');
      setEmbudoActual(existing.embudo_actual ?? '');
      setPerfilCliente(existing.perfil_cliente ?? '');
      setRangoEdad(existing.rango_edad ?? '');
      setUbicacion(existing.ubicacion ?? '');
      setPainPoints(existing.pain_points ?? '');
      setMotivaciones(existing.motivaciones ?? '');
      setObjeciones(existing.objeciones ?? '');
      setPilares(existing.pilares ?? []);
      setTono(existing.tono ?? []);
      setFormatos(existing.formatos_preferidos ?? []);
      setQueNoHacer(existing.que_no_hacer ?? '');
      setHashtags((existing.hashtags_habituales ?? []).join(' '));
      setPlataformas(existing.plataformas_activas ?? []);
      setFrecuencia(existing.frecuencia_semanal?.toString() ?? '');
      setHorarios(existing.horarios_preferidos ?? '');
      setObjetivo(existing.objetivo_principal ?? '');
      setUrlLanding(existing.url_landing ?? '');

      // Sync platform specific metadata
      setGoogleKeywords(existing.metadata?.google_keywords ?? '');
      setGoogleLanding(existing.metadata?.google_landing ?? '');
      setGoogleCpa(existing.metadata?.google_cpa ?? '');
      setTiktokTrends(existing.metadata?.tiktok_trends ?? '');
      setTiktokFormat(existing.metadata?.tiktok_format ?? '');
      setTiktokFatiga(existing.metadata?.tiktok_fatiga ?? '');
      setLinkedinTarget(existing.metadata?.linkedin_target ?? '');
      setLinkedinFormat(existing.metadata?.linkedin_format ?? '');
      setLinkedinLeadMagnet(existing.metadata?.linkedin_lead_magnet ?? '');
      setMetaSeg(existing.metadata?.meta_seg ?? '');
      setMetaFormat(existing.metadata?.meta_format ?? '');
      setMetaHook(existing.metadata?.meta_hook ?? '');
    }
  }, [existing]);

  if (loading && !existing) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Cargando Brief Maestro...</p>
        </div>
      </div>
    );
  }

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

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  async function handleSave(silent = false) {
    if (!clientId) return;
    await saveBrief({
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
      metadata: {
        google_keywords: googleKeywords,
        google_landing: googleLanding,
        google_cpa: googleCpa,
        tiktok_trends: tiktokTrends,
        tiktok_format: tiktokFormat,
        tiktok_fatiga: tiktokFatiga,
        linkedin_target: linkedinTarget,
        linkedin_format: linkedinFormat,
        linkedin_lead_magnet: linkedinLeadMagnet,
        meta_seg: metaSeg,
        meta_format: metaFormat,
        meta_hook: metaHook,
      },
      updated_at: new Date().toISOString(),
    });

    let mappedObjective = 'alcance';
    const objLower = (objetivo || '').toLowerCase();
    if (objLower.includes('leads') || objLower.includes('venta') || objLower.includes('convers')) {
      mappedObjective = 'conversion';
    } else if (objLower.includes('comunidad') || objLower.includes('engage')) {
      mappedObjective = 'comunidad';
    } else if (objLower.includes('lanzamiento')) {
      mappedObjective = 'lanzamiento';
    } else if (objLower.includes('awareness') || objLower.includes('alcance')) {
      mappedObjective = 'alcance';
    }

    updateClient(clientId, {
      presupuesto_pauta: presupuestoPauta,
      pauta_plataformas: pautaPlataformas,
      objetivo_marketing: mappedObjective as any,
    });

    addProjectHistoryEvent(
      clientId,
      'Andrea Solís (Agencia)',
      'brief',
      'Edición y guardado de secciones del Brief Maestro.'
    );
    if (!silent) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    }
  }

  const currentIdx = STEPS.findIndex(s => s.key === step);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Confirmación de guardado — visible desde cualquier parte de la pantalla */}
      {saved && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl">
          <CheckCircle2 className="w-5 h-5" />
          El Brief se ha guardado exitosamente.
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={async () => { await handleSave(true); navigate(`/fplus/clients/${clientId}`); }}
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
              onClick={async () => { await handleSave(true); setStep(s.key); }}
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
            <Field label="Presupuesto de marketing general">
              <input value={presupuestoMarketing} onChange={e => setPresupuestoMarketing(e.target.value)} placeholder="Ej: $500/mes" className={inp} />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Presupuesto Mensual de Pauta (USD)" required>
              <input
                type="number"
                value={presupuestoPauta}
                onChange={e => setPresupuestoPauta(parseFloat(e.target.value) || 0)}
                placeholder="Ej: 500"
                className={inp}
              />
            </Field>
            <Field label="Canales de Pauta Contratados">
              <div className="grid grid-cols-2 gap-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2">
                {['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads'].map(plat => (
                  <label key={plat} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pautaPlataformas.includes(plat)}
                      onChange={() => {
                        setPautaPlataformas(prev =>
                          prev.includes(plat) ? prev.filter(x => x !== plat) : [...prev, plat]
                        );
                      }}
                      className="rounded border-slate-350 text-blue-600 focus:ring-blue-500"
                    />
                    {plat}
                  </label>
                ))}
              </div>
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
            <button
              type="button"
              onClick={sugerirHorarios}
              disabled={sugiriendo}
              className="mb-2 flex items-center gap-1 text-[10px] font-semibold bg-violet-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-violet-700 disabled:opacity-60"
            >
              {sugiriendo
                ? <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : '✨'}
              {sugiriendo ? 'Analizando sector y público…' : 'Sugerir con IA'}
            </button>
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

          {/* Platform Specific Questions (Observation 5) */}
          {(plataformas.includes('instagram') || plataformas.includes('facebook') || plataformas.includes('google') || plataformas.includes('tiktok') || plataformas.includes('linkedin')) && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Preguntas Específicas por Plataforma Contratada</h4>

              {(plataformas.includes('instagram') || plataformas.includes('facebook')) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                    <span>📘</span> Meta Ads (Facebook & Instagram)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Tipo de segmentación clave">
                      <input type="text" value={metaSeg} onChange={e => setMetaSeg(e.target.value)} placeholder="Ej. Advantage+, Intereses locales, Similares" className={inp} />
                    </Field>
                    <Field label="Formatos clave a potenciar">
                      <input type="text" value={metaFormat} onChange={e => setMetaFormat(e.target.value)} placeholder="Ej. Reels, Carruseles de producto" className={inp} />
                    </Field>
                  </div>
                  <Field label="Gancho inicial sugerido (Hook)">
                    <textarea value={metaHook} onChange={e => setMetaHook(e.target.value)} placeholder="Ej. '¿Cansado de perder tiempo con...?'" rows={2} className={ta} />
                  </Field>
                </div>
              )}

              {plataformas.includes('google') && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                    <span>🔍</span> Google Ads (Búsqueda & Performance Max)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Palabras Clave Core (Semillas)">
                      <input type="text" value={googleKeywords} onChange={e => setGoogleKeywords(e.target.value)} placeholder="Ej. crm para agencias, software gestion redes" className={inp} />
                    </Field>
                    <Field label="CPA / CPL objetivo deseado ($)">
                      <input type="text" value={googleCpa} onChange={e => setGoogleCpa(e.target.value)} placeholder="Ej. $5 por lead registrado" className={inp} />
                    </Field>
                  </div>
                  <Field label="Landing Page específica del producto">
                    <input type="text" value={googleLanding} onChange={e => setGoogleLanding(e.target.value)} placeholder="https://miweb.com/landing-producto" className={inp} />
                  </Field>
                </div>
              )}

              {plataformas.includes('tiktok') && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span>🎵</span> TikTok Ads (Spark Ads & In-Feed)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Enfoque de video preferido">
                      <input type="text" value={tiktokFormat} onChange={e => setTiktokFormat(e.target.value)} placeholder="Ej. UGC (User Generated Content), Tendencias/Humor" className={inp} />
                    </Field>
                    <Field label="Frecuencia de renovación (fatiga)">
                      <input type="text" value={tiktokFatiga} onChange={e => setTiktokFatiga(e.target.value)} placeholder="Ej. Cada 2 semanas" className={inp} />
                    </Field>
                  </div>
                  <Field label="Tendencias musicales o retos aplicables">
                    <textarea value={tiktokTrends} onChange={e => setTiktokTrends(e.target.value)} placeholder="Ej. Audios en tendencia del sector B2B, retos de oficina" rows={2} className={ta} />
                  </Field>
                </div>
              )}

              {plataformas.includes('linkedin') && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                    <span>💼</span> LinkedIn Ads (Sponsored Content & InMail)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Segmentación B2B (Cargos/Sectores)">
                      <input type="text" value={linkedinTarget} onChange={e => setLinkedinTarget(e.target.value)} placeholder="Ej. Cargos: CMO, Director Mkt. Sector: SaaS" className={inp} />
                    </Field>
                    <Field label="Formato preferido de anuncio">
                      <input type="text" value={linkedinFormat} onChange={e => setLinkedinFormat(e.target.value)} placeholder="Ej. Document Ads (PDF descarga), Single Image" className={inp} />
                    </Field>
                  </div>
                  <Field label="Lead Magnet / Imán de contactos ofrecido">
                    <textarea value={linkedinLeadMagnet} onChange={e => setLinkedinLeadMagnet(e.target.value)} placeholder="Ej. Ebook de 10 páginas sobre automatización, Demo gratuita de 15 min" rows={2} className={ta} />
                  </Field>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Bottom nav */}
      <div className="flex justify-between">
        {currentIdx > 0 ? (
          <button
            onClick={async () => { await handleSave(true); setStep(STEPS[currentIdx - 1].key); }}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            ← Atrás
          </button>
        ) : <span />}
        <div className="flex gap-2">
          {currentIdx < STEPS.length - 1 ? (
            <button
              onClick={async () => { await handleSave(true); setStep(STEPS[currentIdx + 1].key); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={async () => {
                await handleSave(false);
                navigate(`/fplus/clients/${clientId}/campaigns`);
              }}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
            >
              Guardar y Finalizar Brief
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
