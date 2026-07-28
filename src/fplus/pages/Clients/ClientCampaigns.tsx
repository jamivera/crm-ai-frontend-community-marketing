import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Megaphone, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useFplusStore } from '../../store';
import { usePortalContext } from '../Portal/PortalContext';
import { generateAdStrategy } from '../../utils/adStrategy';
import { getTypeVisual, CONTENT_TYPE_LABELS } from '../../constants';

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
  const brief = useFplusStore(s => s.briefs[clientId]);

  const piezasPauta = contentPieces.filter(p => p.client_id === clientId && p.seleccionado_pauta);
  const updateClient = useFplusStore(s => s.updateClient);

  // --- Platform Budget Distribution ---
  const platforms = useMemo(() => {
    return client?.pauta_plataformas?.length ? client.pauta_plataformas : ['Meta Ads'];
  }, [client?.pauta_plataformas]);

  const [presupuestoEdit, setPresupuestoEdit] = useState<number>(
    client?.presupuesto_pauta ?? Math.round((client?.presupuesto_mensual ?? 500) * 0.4)
  );

  const [platOverrides, setPlatOverrides] = useState<Record<string, number>>(() => {
    return client?.distribucion_pauta_overrides || {};
  });

  const [autoBalance, setAutoBalance] = useState(true);

  // Sync / Reconcile on budget, platforms changes
  useEffect(() => {
    if (!client) return;
    const currentOverrides = { ...platOverrides };
    let hasChanges = false;

    // 1. Remove overrides for platforms that are no longer active
    Object.keys(currentOverrides).forEach(key => {
      if (!platforms.includes(key)) {
        delete currentOverrides[key];
        hasChanges = true;
      }
    });

    // 2. Add overrides for newly added platforms
    platforms.forEach(p => {
      if (currentOverrides[p] === undefined) {
        currentOverrides[p] = 0;
        hasChanges = true;
      }
    });

    // 3. Balance if sum does not match total budget
    const currentSum = Object.values(currentOverrides).reduce((a, b) => a + b, 0);
    if (currentSum !== presupuestoEdit && platforms.length > 0) {
      const diff = presupuestoEdit - currentSum;
      const first = platforms[0];
      currentOverrides[first] = Math.max(0, (currentOverrides[first] ?? 0) + diff);
      hasChanges = true;
    }

    if (hasChanges) {
      setPlatOverrides(currentOverrides);
      updateClient(clientId, { distribucion_pauta_overrides: currentOverrides });
    }
  }, [platforms, presupuestoEdit, clientId]);

  const handleUpdatePresupuesto = (val: number) => {
    setPresupuestoEdit(val);
    updateClient(clientId, { presupuesto_pauta: val });

    // Distribute budget proportionally among platforms
    const currentSum = platforms.reduce((sum, p) => sum + (platOverrides[p] ?? 0), 0) || 1;
    const updated: Record<string, number> = {};
    platforms.forEach(p => {
      const currentVal = platOverrides[p] ?? 0;
      updated[p] = Math.round((currentVal / currentSum) * val);
    });

    const newSum = Object.values(updated).reduce((sum, v) => sum + v, 0);
    const discrepancy = val - newSum;
    if (discrepancy !== 0 && platforms.length > 0) {
      const firstPlat = platforms[0];
      updated[firstPlat] = Math.max(0, (updated[firstPlat] ?? 0) + discrepancy);
    }

    setPlatOverrides(updated);
    updateClient(clientId, { distribucion_pauta_overrides: updated });
  };

  const handleUpdatePlatOverride = (plat: string, val: number) => {
    const currentVal = platOverrides[plat] ?? 0;
    const diff = val - currentVal;

    let updated = { ...platOverrides };
    updated[plat] = val;

    if (autoBalance) {
      const otherPlats = platforms.filter(p => p !== plat);
      if (otherPlats.length > 0) {
        const otherValues = otherPlats.map(p => ({
          name: p,
          val: platOverrides[p] ?? 0
        }));

        let totalOthers = otherValues.reduce((sum, item) => sum + item.val, 0);

        if (diff > 0) {
          let remainingToReduce = diff;
          let safety = 0;
          while (remainingToReduce > 0 && totalOthers > 0 && safety < 10) {
            safety++;
            const activeOthers = otherValues.filter(o => o.val > 0);
            if (activeOthers.length === 0) break;
            const reduction = remainingToReduce / activeOthers.length;
            activeOthers.forEach(o => {
              const toReduce = Math.min(o.val, reduction);
              o.val -= toReduce;
              remainingToReduce -= toReduce;
            });
            totalOthers = otherValues.reduce((sum, item) => sum + item.val, 0);
          }
          otherValues.forEach(o => {
            updated[o.name] = Math.round(o.val);
          });
        } else if (diff < 0) {
          const increase = Math.abs(diff) / otherPlats.length;
          otherValues.forEach(o => {
            o.val += increase;
          });
          otherValues.forEach(o => {
            updated[o.name] = Math.round(o.val);
          });
        }

        // Adjust minor rounding discrepancy
        const sumOfAll = Object.keys(updated).reduce((sum, key) => sum + (updated[key] ?? 0), 0);
        const discrepancy = presupuestoEdit - sumOfAll;
        if (discrepancy !== 0 && otherPlats.length > 0) {
          const firstOther = otherPlats[0];
          updated[firstOther] = Math.max(0, (updated[firstOther] ?? 0) + discrepancy);
        }
      }
    }

    setPlatOverrides(updated);

    // Save immediately if balanced
    const finalSum = Object.values(updated).reduce((a, b) => a + b, 0);
    if (finalSum <= presupuestoEdit) {
      updateClient(clientId, { distribucion_pauta_overrides: updated });
    }
  };

  const sumOfOverrides = Object.keys(platOverrides).reduce((acc, k) => acc + (platOverrides[k] ?? 0), 0);
  const remainingBudget = presupuestoEdit - sumOfOverrides;

  // --- Operational Campaigns Table ---
  const campaignRows = useMemo(() => {
    return client?.campaign_rows || [];
  }, [client?.campaign_rows]);

  const customColumns = useMemo(() => {
    return client?.campaign_custom_columns || [];
  }, [client?.campaign_custom_columns]);

  // Seed default row if list is empty
  useEffect(() => {
    if (client && (!client.campaign_rows || client.campaign_rows.length === 0)) {
      const initialRow = {
        id: `row-${Date.now()}`,
        campaign_name: client.nomenclatura_campana || `Reconocimiento | ${client.nombre} | EC | 07-26`,
        adset_name: 'Público Local | 18-60 | EC',
        ad_name: `AD 01 | Reel | ${client.nombre} | V1`,
        segmentation: 'Público local en un radio de 8km, intereses gourmet',
        budget: Math.round(presupuestoEdit * 0.4) || 200,
        creative_id: piezasPauta[0]?.id || '',
        comments: 'Campaña propuesta por el motor Andrómeda.',
        custom_values: {}
      };
      updateClient(clientId, { campaign_rows: [initialRow] });
    }
  }, [client?.id]);

  const handleAddRow = () => {
    const newRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      campaign_name: `Campaña | ${client?.nombre || 'CLI'} | EC | 07-26`,
      adset_name: 'Conjunto | Público Local | 18-60',
      ad_name: `AD ${campaignRows.length + 1} | Reel | V1`,
      segmentation: 'Segmentación propuesta',
      budget: 0,
      creative_id: piezasPauta[0]?.id || '',
      comments: '',
      custom_values: {}
    };
    const updated = [...campaignRows, newRow];
    updateClient(clientId, { campaign_rows: updated });
  };

  const handleUpdateRowField = (rowId: string, field: string, value: any) => {
    const updated = campaignRows.map(r => {
      if (r.id === rowId) {
        return { ...r, [field]: value };
      }
      return r;
    });
    updateClient(clientId, { campaign_rows: updated });
  };

  const handleUpdateRowCustomField = (rowId: string, colName: string, value: string) => {
    const updated = campaignRows.map(r => {
      if (r.id === rowId) {
        const custom_values = { ...(r.custom_values || {}), [colName]: value };
        return { ...r, custom_values };
      }
      return r;
    });
    updateClient(clientId, { campaign_rows: updated });
  };

  const handleDeleteRow = (rowId: string) => {
    const updated = campaignRows.filter(r => r.id !== rowId);
    updateClient(clientId, { campaign_rows: updated });
  };

  const handleAddColumn = () => {
    const colName = window.prompt('Ingrese el nombre de la columna personalizada:');
    if (!colName) return;
    const trimmed = colName.trim();
    if (!trimmed) return;
    if (customColumns.includes(trimmed)) {
      alert('Esta columna ya existe.');
      return;
    }
    const updatedCols = [...customColumns, trimmed];
    updateClient(clientId, { campaign_custom_columns: updatedCols });
  };

  const handleDeleteColumn = (colName: string) => {
    if (!window.confirm(`¿Está seguro de eliminar la columna "${colName}"?`)) return;
    const updatedCols = customColumns.filter(c => c !== colName);
    const updatedRows = campaignRows.map(r => {
      const cv = { ...(r.custom_values || {}) };
      delete cv[colName];
      return { ...r, custom_values: cv };
    });
    updateClient(clientId, {
      campaign_custom_columns: updatedCols,
      campaign_rows: updatedRows
    });
  };

  // --- Load Strategy ---
  const strategy = useMemo(() => {
    if (!client) return null;
    const c = {
      ...client,
      presupuesto_pauta: presupuestoEdit,
      distribucion_pauta_overrides: platOverrides,
    };
    return generateAdStrategy(c, piezasPauta, brief);
  }, [client, piezasPauta, presupuestoEdit, platOverrides, brief]);

  if (!client || !strategy) return null;

  if (!brief) {
    return (
      <div className="px-4 pt-16 text-center text-slate-400 max-w-md mx-auto">
        <span className="text-4xl block mb-3">🔒</span>
        <p className="text-sm font-medium text-slate-600">Completa el Brief para desbloquear Campañas.</p>
        <p className="text-xs mt-1.5 mb-5">La estrategia publicitaria se construye con la información del Brief: objetivos, productos, público y presupuesto.</p>
        <button
          onClick={() => navigate(location.pathname.replace(/\/campaigns$/, '/brief'))}
          className="px-4 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700"
        >
          Ir al Brief →
        </button>
      </div>
    );
  }

  const incluyePauta = client.pauta_publicitaria && client.pauta_publicitaria !== 'no_incluye';

  if (incluyePauta && piezasPauta.length === 0) {
    return (
      <div className="px-4 pt-16 text-center text-slate-400 max-w-md mx-auto">
        <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium text-slate-600">Aún no existe contenido seleccionado para campañas.</p>
        <p className="text-xs mt-1.5 mb-5">Primero selecciona el material desde Multimedia ("Seleccionar para pauta") para continuar. La estrategia se construye a partir de tu contenido aprobado.</p>
        <button
          onClick={() => navigate(location.pathname.replace(/\/campaigns$/, '/multimedia'))}
          className="px-4 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700"
        >
          Ir a Multimedia →
        </button>
      </div>
    );
  }

  if (!incluyePauta) {
    return (
      <div className="px-4 py-12 max-w-lg mx-auto bg-white border border-slate-100 rounded-2xl p-6 shadow-md text-center space-y-5 mt-8">
        <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center mx-auto">
          <Megaphone className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">Potencia tus resultados con Campañas Publicitarias</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tu plan actual no incluye pauta publicitaria activa. Diseña estrategias segmentadas en Meta Ads, Google Ads y TikTok Ads para captar clientes ideales y multiplicar tu retorno (ROAS).
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3.5 text-left space-y-2 max-w-sm mx-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">¿Qué incluye el módulo de Campañas?</p>
          <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600">
            <p className="flex items-center gap-1.5">🟢 Segmentación estratégica por IA Andrómeda</p>
            <p className="flex items-center gap-1.5">🟢 Distribución óptima de presupuesto de pauta</p>
            <p className="flex items-center gap-1.5">🟢 Dashboard ejecutivo (CPL, Leads, Clics en tiempo real)</p>
            <p className="flex items-center gap-1.5">🟢 Selección y taggeo de creativos por embudo</p>
          </div>
        </div>
        <button
          onClick={() => window.alert("¡Solicitud enviada!\n\nTu account manager se pondrá en contacto para activar el módulo de Campañas en tu contrato.")}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm"
        >
          Solicitar activación de Campañas (Plan Premium)
        </button>
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
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 animate-fade-in">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1.5">Para completar la estrategia</p>
          {strategy.score_detalle.map(d => (
            <p key={d} className="text-xs text-amber-800">• {d}</p>
          ))}
        </div>
      )}

      {/* Distribución de presupuesto por plataforma */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5" /> Distribución de Presupuesto
          </p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={autoBalance}
                onChange={e => setAutoBalance(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Auto-equilibrar
            </label>
            <div className="flex items-center gap-1 bg-blue-50 rounded-full px-2.5 py-1">
              <span className="text-xs font-bold text-blue-600">$</span>
              <input
                type="number"
                min={0}
                value={presupuestoEdit}
                onChange={e => handleUpdatePresupuesto(parseInt(e.target.value) || 0)}
                className="w-16 text-xs font-bold text-blue-600 bg-transparent focus:outline-none"
                title="Edita el presupuesto de pauta total"
              />
              <span className="text-xs font-bold text-blue-600">/mes</span>
            </div>
          </div>
        </div>

        {/* Validation Status Banner */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
          remainingBudget === 0 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : remainingBudget > 0 
              ? 'bg-amber-50 border-amber-200 text-amber-800' 
              : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div>
            <p className="font-bold flex items-center gap-1">
              <span>{remainingBudget === 0 ? '✅ Presupuesto equilibrado' : remainingBudget > 0 ? '⚠️ Presupuesto sub-distribuido' : '❌ Presupuesto excedido'}</span>
            </p>
            <p className="text-[11px] mt-0.5 opacity-90">
              Distribuido: <strong>${sumOfOverrides.toLocaleString()} USD</strong> de <strong>${presupuestoEdit.toLocaleString()} USD</strong>.
              {remainingBudget > 0 && ` Quedan $${remainingBudget.toLocaleString()} USD sin asignar.`}
              {remainingBudget < 0 && ` Exceso de $${Math.abs(remainingBudget).toLocaleString()} USD. Ajusta las plataformas.`}
            </p>
          </div>
          {remainingBudget !== 0 && (
            <button
              onClick={() => {
                const updated = { ...platOverrides };
                if (platforms.length > 0) {
                  const baseShare = Math.round(presupuestoEdit / platforms.length);
                  platforms.forEach(p => {
                    updated[p] = baseShare;
                  });
                  const currentSum = Object.values(updated).reduce((a, b) => a + b, 0);
                  const diff = presupuestoEdit - currentSum;
                  updated[platforms[0]] = Math.max(0, (updated[platforms[0]] ?? 0) + diff);
                  setPlatOverrides(updated);
                  updateClient(clientId, { distribucion_pauta_overrides: updated });
                }
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-bold rounded-lg transition-colors shrink-0 text-slate-700 shadow-sm"
            >
              Reajustar automático
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-1">
          {strategy.plataformas.map(p => (
            <div key={p.plataforma} className="border border-slate-100 rounded-xl p-3 bg-slate-50/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{PLATFORM_EMOJI[p.plataforma] ?? '📣'}</span>
                <span className="text-xs font-bold text-slate-800 flex-1">{p.plataforma}</span>
                <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-0.5">
                  <span className="text-xs font-bold text-slate-400 mr-0.5">$</span>
                  <input
                    type="number"
                    min={0}
                    value={platOverrides[p.plataforma] ?? p.presupuesto}
                    onChange={e => handleUpdatePlatOverride(p.plataforma, parseInt(e.target.value) || 0)}
                    className="w-16 text-xs font-bold text-slate-700 bg-transparent focus:outline-none text-right"
                  />
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full mb-2.5 overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${Math.min(100, Math.round(((platOverrides[p.plataforma] ?? p.presupuesto) / presupuestoEdit) * 100))}%` }} />
              </div>
              <div className="grid grid-cols-1 gap-2 text-[10px] text-slate-500">
                <p><strong>🎯 Objetivo:</strong> {p.objetivo_campana}</p>
                <div>
                  <strong>👥 Audiencias:</strong>
                  {p.audiencias.slice(0, 2).map((a, idx) => (
                    <p key={idx} className="truncate pl-2">· {a}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-400 -mt-3 px-1">
        💡 La inversión publicitaria pertenece al cliente y se paga directamente a Meta, Google, TikTok o LinkedIn.
        Los servicios de {client?.agency_name || 'la Agencia'} se facturan por separado.
      </p>

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

      {/* Tabla Operativa de Campañas */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b pb-3 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-violet-500" />
              Estructura Operativa de Campañas (Planificación de Anuncios)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Define la nomenclatura de 3 niveles, segmentación y asignación de presupuesto por anuncio.</p>
          </div>
          <div className="flex items-center gap-2 self-end">
            <button
              onClick={handleAddColumn}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-xl flex items-center gap-1 transition-colors"
            >
              <span>+ Columna</span>
            </button>
            <button
              onClick={handleAddRow}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 transition-colors"
            >
              <span>+ Fila</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white">
          <table className="w-full text-left border-collapse text-[11px] min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 text-[9px]">
                <th className="p-3 font-semibold min-w-[160px]">Campaña (Nivel 1)</th>
                <th className="p-3 font-semibold min-w-[160px]">Conjunto (Nivel 2)</th>
                <th className="p-3 font-semibold min-w-[160px]">Anuncio (Nivel 3)</th>
                <th className="p-3 font-semibold min-w-[140px]">Segmentación</th>
                <th className="p-3 font-semibold min-w-[90px] text-right">Presupuesto</th>
                <th className="p-3 font-semibold min-w-[150px]">Creativo Seleccionado</th>
                <th className="p-3 font-semibold min-w-[140px]">Comentarios</th>
                {customColumns.map(col => (
                  <th key={col} className="p-3 font-semibold relative group min-w-[120px]">
                    <div className="flex items-center justify-between">
                      <span>{col}</span>
                      <button
                        onClick={() => handleDeleteColumn(col)}
                        className="text-red-500 hover:text-red-700 opacity-80 hover:opacity-100 ml-1.5 font-bold"
                        title="Eliminar columna"
                      >
                        ✕
                      </button>
                    </div>
                  </th>
                ))}
                <th className="p-3 text-center min-w-[50px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaignRows.length === 0 ? (
                <tr>
                  <td colSpan={8 + customColumns.length} className="text-center py-8 text-slate-400 font-medium">
                    No hay anuncios configurados. Haz clic en "+ Fila" para iniciar.
                  </td>
                </tr>
              ) : (
                campaignRows.map(row => {
                  const selectedPiece = piezasPauta.find(cp => cp.id === row.creative_id);
                  const visual = selectedPiece ? getTypeVisual(selectedPiece.tipo) : null;
                  
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Campaña */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.campaign_name}
                          onChange={e => handleUpdateRowField(row.id, 'campaign_name', e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 p-1 text-slate-700 font-medium focus:bg-white focus:outline-none"
                        />
                      </td>
                      {/* Conjunto */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.adset_name}
                          onChange={e => handleUpdateRowField(row.id, 'adset_name', e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 p-1 text-slate-700 focus:bg-white focus:outline-none"
                        />
                      </td>
                      {/* Anuncio */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.ad_name}
                          onChange={e => handleUpdateRowField(row.id, 'ad_name', e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 p-1 text-slate-700 focus:bg-white focus:outline-none"
                        />
                      </td>
                      {/* Segmentación */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.segmentation}
                          onChange={e => handleUpdateRowField(row.id, 'segmentation', e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 p-1 text-slate-600 focus:bg-white focus:outline-none"
                        />
                      </td>
                      {/* Presupuesto */}
                      <td className="p-2">
                        <div className="flex items-center bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus-within:border-blue-500 p-1 focus-within:bg-white">
                          <span className="text-slate-400 mr-0.5">$</span>
                          <input
                            type="number"
                            min={0}
                            value={row.budget}
                            onChange={e => handleUpdateRowField(row.id, 'budget', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent border-0 outline-none p-0 text-slate-700 font-bold text-right"
                          />
                        </div>
                      </td>
                      {/* Creativo */}
                      <td className="p-2">
                        <div className="space-y-1">
                          <select
                            value={row.creative_id || ''}
                            onChange={e => handleUpdateRowField(row.id, 'creative_id', e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-slate-200 focus:border-blue-500 focus:ring-0 p-1 text-slate-700 focus:bg-white text-[10px] focus:outline-none cursor-pointer"
                          >
                            <option value="">-- Sin creativo --</option>
                            {piezasPauta.map(cp => (
                              <option key={cp.id} value={cp.id}>
                                {cp.nombre}
                              </option>
                            ))}
                          </select>
                          {selectedPiece && visual && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] text-slate-500 w-fit">
                              <span>{visual.emoji}</span>
                              <span className="font-semibold uppercase truncate max-w-[90px]">
                                {CONTENT_TYPE_LABELS[selectedPiece.tipo]}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Comentarios */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.comments}
                          onChange={e => handleUpdateRowField(row.id, 'comments', e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 p-1 text-slate-500 focus:bg-white focus:outline-none"
                          placeholder="Notas internas..."
                        />
                      </td>
                      {/* Custom columns values */}
                      {customColumns.map(col => (
                        <td key={col} className="p-2">
                          <input
                            type="text"
                            value={row.custom_values?.[col] || ''}
                            onChange={e => handleUpdateRowCustomField(row.id, col, e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 p-1 text-slate-600 focus:bg-white focus:outline-none"
                            placeholder="Valor..."
                          />
                        </td>
                      ))}
                      {/* Acciones */}
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
              const img = cp.archivos?.find(a => a.url && a.tipo === 'imagen');
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
                    {(() => {
                      const etapa = Object.entries(strategy.creativos_por_etapa).find(([, arr]) => arr.some(x => x.id === cp.id))?.[0];
                      return etapa ? (
                        <span className={`inline-block mt-1 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full ${STAGE_COLORS[etapa]}`}>
                          {etapa}
                        </span>
                      ) : null;
                    })()}
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
