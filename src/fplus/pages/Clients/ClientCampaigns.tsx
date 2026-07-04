import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Megaphone, Target, Users, Layers, Image as ImageIcon } from 'lucide-react';
import { useFplusStore } from '../../store';
import { usePortalContext } from '../Portal/PortalContext';
import { generateAdStrategy } from '../../utils/adStrategy';
import { getTypeVisual, CONTENT_TYPE_LABELS } from '../../constants';

// Centro de Estrategia IA — el módulo Campañas deja de ser una lista:
// construye la estrategia publicitaria con todo lo capturado en el sistema
// (contrato, mercado, objetivo, presupuesto, material marcado para pauta).

const STAGE_COLORS: Record<string, string> = {
  Reconocimiento: 'bg-blue-500',
  Consideración: 'bg-violet-500',
  Conversión: 'bg-emerald-500',
  Remarketing: 'bg-orange-500',
};

const PLATFORM_EMOJI: Record<string, string> = {
  'Meta Ads': '📘', 'Google Ads': '🔍', 'TikTok Ads': '🎵', 'LinkedIn Ads': '💼',
};

export default function ClientCampaigns() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId } = usePortalContext();
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));
  const contentPieces = useFplusStore(s => s.contentPieces);

  const piezasPauta = contentPieces.filter(p => p.client_id === clientId && p.seleccionado_pauta);

  const strategy = useMemo(
    () => (client ? generateAdStrategy(client, piezasPauta) : null),
    [client, piezasPauta],
  );

  if (!client || !strategy) return null;

  const incluyePauta = client.pauta_publicitaria && client.pauta_publicitaria !== 'no_incluye';

  if (!incluyePauta) {
    return (
      <div className="px-4 pt-16 text-center text-slate-400 max-w-md mx-auto">
        <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium text-slate-500">Este cliente no tiene pauta contratada.</p>
        <p className="text-xs mt-1.5">Activa la pauta publicitaria en el contrato para construir aquí su estrategia de campañas.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-10 max-w-4xl mx-auto space-y-5">
      {/* Header + score */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            Centro de Estrategia
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Estrategia publicitaria construida con el contrato, el mercado y el material aprobado
          </p>
        </div>
        <div className="text-center bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shrink-0">
          <p className={`text-2xl font-bold leading-none ${
            strategy.score >= 80 ? 'text-emerald-600' : strategy.score >= 50 ? 'text-amber-500' : 'text-red-500'
          }`}>
            {strategy.score}%
          </p>
          <p className="text-[9px] text-slate-400 uppercase tracking-wide mt-1">Score estratégico</p>
        </div>
      </div>

      {/* Pendientes para subir el score */}
      {strategy.score_detalle.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1.5">Para completar la estrategia</p>
          {strategy.score_detalle.map(d => (
            <p key={d} className="text-xs text-amber-800">• {d}</p>
          ))}
        </div>
      )}

      {/* Distribución de presupuesto por plataforma */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5" /> Distribución recomendada
          </p>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            ${strategy.presupuesto_total.toLocaleString('en')}/mes
          </span>
        </div>
        <div className="space-y-3">
          {strategy.plataformas.map(p => (
            <div key={p.plataforma} className="border border-slate-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{PLATFORM_EMOJI[p.plataforma] ?? '📣'}</span>
                <span className="text-sm font-bold text-slate-800 flex-1">{p.plataforma}</span>
                <span className="text-sm font-bold text-slate-700">${p.presupuesto.toLocaleString('en')}</span>
                <span className="text-[10px] font-semibold text-slate-400">({p.porcentaje}%)</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full mb-2.5 overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${p.porcentaje}%` }} />
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p className="flex items-center gap-1 font-semibold text-slate-500 mb-1"><Target className="w-3 h-3" /> Objetivo</p>
                  <p className="text-slate-600">{p.objetivo_campana}</p>
                  <p className="flex items-center gap-1 font-semibold text-slate-500 mt-2 mb-1"><Layers className="w-3 h-3" /> Tipos de campaña</p>
                  {p.tipos_campana.map(t => <p key={t} className="text-slate-600">· {t}</p>)}
                </div>
                <div>
                  <p className="flex items-center gap-1 font-semibold text-slate-500 mb-1"><Users className="w-3 h-3" /> Audiencias sugeridas</p>
                  {p.audiencias.map(a => <p key={a} className="text-slate-600">· {a}</p>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Embudo */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Embudo recomendado</p>
        <div className="flex rounded-xl overflow-hidden h-8 mb-3">
          {strategy.embudo.map(e => (
            <div
              key={e.etapa}
              className={`${STAGE_COLORS[e.etapa]} flex items-center justify-center text-white text-[10px] font-bold`}
              style={{ width: `${e.porcentaje}%` }}
              title={`${e.etapa}: ${e.porcentaje}%`}
            >
              {e.porcentaje}%
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {strategy.embudo.map(e => (
            <div key={e.etapa} className="flex items-start gap-2 text-[11px]">
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${STAGE_COLORS[e.etapa]}`} />
              <p className="text-slate-600"><strong className="text-slate-700">{e.etapa}:</strong> {e.descripcion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nomenclatura */}
      <div className="bg-slate-900 rounded-2xl px-4 py-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Nomenclatura estandarizada</p>
        <p className="text-xs font-mono text-emerald-400">{strategy.nomenclatura}</p>
        <p className="text-[10px] text-slate-500 mt-1">Ej: {client.nombre.toUpperCase().slice(0, 6)}_META_CONVERSION_MENSAJES_{new Date().toLocaleDateString('es', { month: 'short' })}25</p>
      </div>

      {/* Creativos aprobados para pauta */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Material seleccionado para pauta
          </p>
          <span className="text-xs text-slate-400">{piezasPauta.length} {piezasPauta.length === 1 ? 'creativo' : 'creativos'}</span>
        </div>
        {piezasPauta.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            Marca contenido con "Seleccionar para pauta" en Multimedia y aparecerá aquí automáticamente.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {piezasPauta.map(cp => {
              const v = getTypeVisual(cp.tipo);
              const img = cp.archivos.find(a => a.url && a.tipo === 'imagen');
              return (
                <button
                  key={cp.id}
                  onClick={() => navigate(`${location.pathname.replace(/\/campaigns$/, '')}/approvals/${cp.id}`)}
                  className="border border-slate-100 rounded-xl overflow-hidden text-left hover:shadow-md transition-shadow"
                >
                  <div className={`h-16 bg-gradient-to-br ${v.gradient} flex items-center justify-center`}>
                    {img ? <img src={img.url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">{v.emoji}</span>}
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-semibold text-slate-700 line-clamp-1">{cp.nombre}</p>
                    <p className="text-[9px] text-slate-400">{CONTENT_TYPE_LABELS[cp.tipo]}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
