import { Megaphone, Target, Users, CalendarDays } from 'lucide-react';
import { usePortalContext } from './PortalContext';
import { useFplusStore } from '../../store';
import { generateAdStrategy } from '../../utils/adStrategy';

// Pauta Publicitaria — vista ejecutiva para el cliente: cómo se está usando
// su inversión, sin configuraciones técnicas internas de la agencia.

const PLATFORM_EMOJI: Record<string, string> = {
  'Meta Ads': '📘', 'Google Ads': '🔍', 'TikTok Ads': '🎵', 'LinkedIn Ads': '💼',
};

const STAGE_COLORS: Record<string, string> = {
  Reconocimiento: 'bg-blue-500',
  Consideración: 'bg-violet-500',
  Conversión: 'bg-emerald-500',
  Remarketing: 'bg-orange-500',
};

export default function PortalPauta() {
  const { clientId } = usePortalContext();
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));
  const contentPieces = useFplusStore(s => s.contentPieces);
  const brief = useFplusStore(s => s.briefs[clientId]);

  if (!client) return null;

  const incluyePauta = client.pauta_publicitaria && client.pauta_publicitaria !== 'no_incluye';
  const piezasPauta = contentPieces.filter(p => p.client_id === clientId && p.seleccionado_pauta);

  if (!incluyePauta || piezasPauta.length === 0) {
    return (
      <div className="px-4 pt-16 text-center text-slate-400 max-w-md mx-auto">
        <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium text-slate-600">
          {incluyePauta ? 'Tu campaña está en preparación.' : 'Tu plan actual no incluye pauta publicitaria.'}
        </p>
        <p className="text-xs mt-1.5">
          {incluyePauta
            ? 'Tu equipo de Primero Digital está seleccionando el mejor contenido para tu inversión. Pronto verás aquí la estrategia.'
            : 'Consulta con tu Account Manager para agregar publicidad digital a tu plan.'}
        </p>
      </div>
    );
  }

  const strategy = generateAdStrategy(client, piezasPauta, brief);

  return (
    <div className="px-4 pt-5 pb-8 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Pauta Publicitaria</h1>
        <p className="text-xs text-slate-400 mt-0.5">Así se está utilizando tu inversión publicitaria</p>
      </div>

      {/* Resumen ejecutivo */}
      <div className="bg-gradient-to-r from-[#0f1e3c] to-[#1a2f56] rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-[10px] text-blue-300 uppercase tracking-wide">Inversión mensual aprobada</p>
            <p className="text-xl font-bold">${strategy.presupuesto_total.toLocaleString('en')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-blue-300 uppercase tracking-wide">Estado</p>
            <p className="text-sm font-semibold text-emerald-300">● Activa</p>
          </div>
        </div>
        <p className="text-[10px] text-blue-300/70 mt-2">
          La inversión se paga directamente a las plataformas publicitarias. Primero Digital gestiona la estrategia.
        </p>
      </div>

      {/* Plataformas y distribución */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
          <Megaphone className="w-3.5 h-3.5" /> Distribución de tu inversión
        </p>
        <div className="space-y-3">
          {strategy.plataformas.map(p => (
            <div key={p.plataforma}>
              <div className="flex items-center gap-2 mb-1">
                <span>{PLATFORM_EMOJI[p.plataforma] ?? '📣'}</span>
                <span className="text-xs font-semibold text-slate-700 flex-1">{p.plataforma}</span>
                <span className="text-xs font-bold text-slate-800">${p.presupuesto.toLocaleString('en')}</span>
                <span className="text-[10px] text-slate-400">({p.porcentaje}%)</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.porcentaje}%` }} />
              </div>
              <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                <Target className="w-3 h-3" /> Objetivo: {p.objetivo_campana}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Estrategia (embudo) */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Estrategia aplicada</p>
        <div className="flex rounded-xl overflow-hidden h-7 mb-2">
          {strategy.embudo.map(e => (
            <div
              key={e.etapa}
              className={`${STAGE_COLORS[e.etapa]} flex items-center justify-center text-white text-[9px] font-bold`}
              style={{ width: `${e.porcentaje}%` }}
            >
              {e.porcentaje}%
            </div>
          ))}
        </div>
        <div className="space-y-1">
          {strategy.embudo.map(e => (
            <p key={e.etapa} className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className={`w-2 h-2 rounded-full shrink-0 ${STAGE_COLORS[e.etapa]}`} />
              <strong className="text-slate-600">{e.etapa}</strong>
            </p>
          ))}
        </div>
      </div>

      {/* Público objetivo */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
          <Users className="w-3.5 h-3.5" /> Público objetivo
        </p>
        {(strategy.plataformas[0]?.audiencias ?? []).slice(0, 3).map(a => (
          <p key={a} className="text-xs text-slate-600 py-0.5">· {a}</p>
        ))}
      </div>

      {/* Vigencia */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
          <CalendarDays className="w-3.5 h-3.5" /> Vigencia
        </p>
        <p className="text-xs text-slate-600">
          Inicio: {client.fecha_inicio_contrato
            ? new Date(client.fecha_inicio_contrato).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'según contrato'}
          {client.fecha_fin_contrato && (
            <> · Fin estimado: {new Date(client.fecha_fin_contrato).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</>
          )}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          {strategy.creativos.length} {strategy.creativos.length === 1 ? 'creativo aprobado' : 'creativos aprobados'} en rotación
        </p>
      </div>
    </div>
  );
}
