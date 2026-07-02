import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Building2, FileText, Megaphone, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFplusStore } from '../../store';
import { PLAN_TEMPLATES, MARKET_TYPES, AD_PLATFORMS, CONTENT_TYPE_LABELS, getTypeVisual } from '../../constants';
import type { Client, ContentType, PlanContratado, MarketingObjective, Platform } from '../../types';

interface Props {
  onClose: () => void;
}

const DIST_TYPES: ContentType[] = ['reel', 'carrusel', 'post_imagen', 'historia', 'post_video', 'tiktok'];
const REDES: Platform[] = ['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube'];
const REDES_LABELS: Record<string, string> = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', linkedin: 'LinkedIn', youtube: 'YouTube',
};
const OBJETIVOS: { value: MarketingObjective; label: string }[] = [
  { value: 'alcance', label: '📣 Alcance' },
  { value: 'conversion', label: '🎯 Conversión' },
  { value: 'comunidad', label: '🤝 Comunidad' },
  { value: 'lanzamiento', label: '🚀 Lanzamiento' },
];

const STEPS = [
  { n: 1, label: 'Información', icon: Building2 },
  { n: 2, label: 'Plan', icon: FileText },
  { n: 3, label: 'Pauta y mercado', icon: Megaphone },
];

export function NewClientModal({ onClose }: Props) {
  const createClient = useFplusStore(s => s.createClient);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Paso 1 — información básica
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [contacto, setContacto] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [color, setColor] = useState('#2563eb');

  // Paso 2 — plan y distribución (editable)
  const [planId, setPlanId] = useState<string>('oro');
  const [distribucion, setDistribucion] = useState<Partial<Record<ContentType, number>>>(
    PLAN_TEMPLATES.find(p => p.id === 'oro')!.distribucion,
  );
  const [redes, setRedes] = useState<Platform[]>(['instagram', 'facebook']);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Paso 3 — pauta y mercado
  const [incluyePauta, setIncluyePauta] = useState(false);
  const [pautaPlataformas, setPautaPlataformas] = useState<string[]>([]);
  const [mercado, setMercado] = useState('');
  const [mercadoOtro, setMercadoOtro] = useState('');
  const [objetivo, setObjetivo] = useState<MarketingObjective>('alcance');

  const totalPiezas = Object.values(distribucion).reduce((a: number, b) => a + (b ?? 0), 0);

  const selectPlan = (id: string) => {
    setPlanId(id);
    const tpl = PLAN_TEMPLATES.find(p => p.id === id);
    if (tpl) setDistribucion({ ...tpl.distribucion });
  };

  const setDist = (tipo: ContentType, qty: number) => {
    setDistribucion(d => ({ ...d, [tipo]: Math.max(0, qty) }));
  };

  const toggleRed = (r: Platform) =>
    setRedes(rs => (rs.includes(r) ? rs.filter(x => x !== r) : [...rs, r]));

  const toggleAd = (p: string) =>
    setPautaPlataformas(ps => (ps.includes(p) ? ps.filter(x => x !== p) : [...ps, p]));

  const canNext =
    step === 1 ? nombre.trim().length > 0 :
    step === 2 ? totalPiezas > 0 && redes.length > 0 :
    (mercado !== '' && (mercado !== 'Otro' || mercadoOtro.trim() !== ''));

  const create = () => {
    const id = `cl-${Date.now()}`;
    const tipoMercado = mercado === 'Otro' ? mercadoOtro.trim() : mercado;
    const client: Client = {
      id,
      nombre: nombre.trim(),
      empresa: empresa.trim() || undefined,
      industria: tipoMercado,
      tipo_mercado: tipoMercado,
      responsable_cliente: contacto.trim() || undefined,
      email: email.trim() || undefined,
      telefono: telefono.trim() || undefined,
      color_corporativo: color,
      account_manager_id: 'u1',
      account_manager_name: 'Andrea Solís',
      plan_contratado: planId as PlanContratado,
      fecha_inicio_contrato: fechaInicio || undefined,
      fecha_fin_contrato: fechaFin || undefined,
      pauta_publicitaria: incluyePauta ? 'incluida_agencia' : 'no_incluye',
      pauta_plataformas: incluyePauta ? pautaPlataformas : undefined,
      piezas_mensuales: totalPiezas,
      distribucion_piezas: Object.fromEntries(
        Object.entries(distribucion).filter(([, v]) => (v ?? 0) > 0),
      ) as Partial<Record<ContentType, number>>,
      redes_contratadas: redes,
      objetivo_marketing: objetivo,
      estado: 'activo',
      semaforo: 'verde',
      piezas_activas: 0,
      piezas_atrasadas: 0,
      leads_mes: 0,
      revenue_mes: 0,
      created_at: new Date().toISOString(),
    };
    createClient(client);
    onClose();
    navigate(`/fplus/clients/${id}/calendar`);
  };

  const inputCls = 'w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400';
  const labelCls = 'block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header con pasos */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">➕ Nuevo Cliente</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center gap-2 flex-1 last:flex-initial">
                <div className={`flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap ${
                  step === s.n ? 'text-blue-600' : step > s.n ? 'text-emerald-600' : 'text-slate-300'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                    step === s.n ? 'bg-blue-600 text-white' : step > s.n ? 'bg-emerald-500 text-white' : 'bg-slate-100'
                  }`}>
                    {step > s.n ? <Check className="w-3 h-3" /> : s.n}
                  </div>
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-100" />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nombre del cliente *</label>
                  <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Kinara" className={inputCls} autoFocus />
                </div>
                <div>
                  <label className={labelCls}>Empresa</label>
                  <input value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Kinara Cía. Ltda." className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Persona de contacto</label>
                  <input value={contacto} onChange={e => setContacto(e.target.value)} placeholder="Nombre y apellido" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Teléfono</label>
                  <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+593 …" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Correo</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contacto@cliente.com" className={inputCls} />
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className={labelCls}>Color corporativo (opcional)</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer" />
                    <span className="text-xs text-slate-400 font-mono">{color}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className={labelCls}>Logo</label>
                  <div className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl px-3 py-2.5">
                    Se podrá subir desde el Brief
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className={labelCls}>Tipo de plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLAN_TEMPLATES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => selectPlan(p.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-colors ${
                        planId === p.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="text-xl">{p.emoji}</div>
                      <div className={`text-xs font-bold mt-1 ${planId === p.id ? 'text-blue-700' : 'text-slate-700'}`}>{p.label}</div>
                      <div className="text-[10px] text-slate-400">{p.piezas_mensuales} piezas/mes</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls + ' mb-0'}>Distribución mensual (editable)</label>
                  <span className="text-xs font-bold text-blue-600">{totalPiezas} piezas</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DIST_TYPES.map(tipo => {
                    const v = getTypeVisual(tipo);
                    return (
                      <div key={tipo} className="flex items-center gap-2 border border-slate-100 rounded-xl px-3 py-2">
                        <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                        <span className="text-xs text-slate-600 flex-1">{CONTENT_TYPE_LABELS[tipo]}</span>
                        <input
                          type="number"
                          min={0}
                          value={distribucion[tipo] ?? 0}
                          onChange={e => setDist(tipo, parseInt(e.target.value) || 0)}
                          className="w-14 text-sm text-center border border-slate-200 rounded-lg py-1"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelCls}>Redes sociales</label>
                <div className="flex flex-wrap gap-2">
                  {REDES.map(r => (
                    <button
                      key={r}
                      onClick={() => toggleRed(r)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        redes.includes(r) ? 'border-blue-400 bg-blue-50 text-blue-700 font-semibold' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      {REDES_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Fecha inicio contrato</label>
                  <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Fecha fin contrato</label>
                  <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className={inputCls} />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className={labelCls}>¿Incluye pauta publicitaria?</label>
                <div className="flex gap-2">
                  {[{ v: true, l: 'Sí' }, { v: false, l: 'No' }].map(o => (
                    <button
                      key={o.l}
                      onClick={() => setIncluyePauta(o.v)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-colors ${
                        incluyePauta === o.v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              {incluyePauta && (
                <div>
                  <label className={labelCls}>Plataformas de pauta</label>
                  <div className="flex flex-wrap gap-2">
                    {AD_PLATFORMS.map(p => (
                      <button
                        key={p}
                        onClick={() => toggleAd(p)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          pautaPlataformas.includes(p) ? 'border-blue-400 bg-blue-50 text-blue-700 font-semibold' : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className={labelCls}>Tipo de mercado *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {MARKET_TYPES.map(m => (
                    <button
                      key={m}
                      onClick={() => setMercado(m)}
                      className={`text-xs py-2 rounded-xl border transition-colors ${
                        mercado === m ? 'border-blue-400 bg-blue-50 text-blue-700 font-semibold' : 'border-slate-100 text-slate-500'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                {mercado === 'Otro' && (
                  <input
                    value={mercadoOtro}
                    onChange={e => setMercadoOtro(e.target.value)}
                    placeholder="Escribe el sector del cliente…"
                    className={inputCls + ' mt-2'}
                    autoFocus
                  />
                )}
              </div>

              <div>
                <label className={labelCls}>Objetivo de marketing</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {OBJETIVOS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setObjetivo(o.value)}
                      className={`text-xs py-2 rounded-xl border transition-colors ${
                        objetivo === o.value ? 'border-violet-400 bg-violet-50 text-violet-700 font-semibold' : 'border-slate-100 text-slate-500'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center bg-slate-50">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:bg-slate-100 px-3 py-2 rounded-xl"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Atrás
            </button>
          )}
          <div className="ml-auto">
            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={create}
                disabled={!canNext}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Crear cliente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
