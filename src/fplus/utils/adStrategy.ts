// ─── Centro de Estrategia IA — generador de estrategia publicitaria ─────────────
// V1: motor determinístico basado en reglas estratégicas (misma arquitectura
// drop-in que cronoplanner y copyGenerator). Usa toda la información ya
// capturada: contrato, mercado, objetivo, presupuesto, plataformas de pauta
// y material aprobado para pauta. Futuro: se enriquece con Andrómeda y las
// métricas reales vía API Meta/Google/TikTok/LinkedIn.

import type { Client, ContentPiece, MarketingObjective, BriefMaestro } from '../types';

export interface PlatformPlan {
  plataforma: string;         // Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads
  porcentaje: number;         // % del presupuesto
  presupuesto: number;        // USD
  objetivo_campana: string;   // ej. Mensajes, Tráfico, Conversiones
  tipos_campana: string[];
  audiencias: string[];
  razon: string;
}

export interface FunnelStage {
  etapa: 'Reconocimiento' | 'Consideración' | 'Conversión' | 'Remarketing';
  porcentaje: number;
  descripcion: string;
}

export interface AdStrategy {
  presupuesto_total: number;
  plataformas: PlatformPlan[];
  embudo: FunnelStage[];
  creativos: ContentPiece[];       // piezas seleccionadas para pauta
  // Cada creativo asignado a su etapa del embudo según formato y ángulo Andrómeda
  creativos_por_etapa: Record<string, ContentPiece[]>;
  nomenclatura: string;            // convención de nombres de campaña
  score: number;                   // 0-100 — qué tan completa está la estrategia
  score_detalle: string[];         // qué falta para subir el score
}

// Peso base por plataforma según tipo de mercado (suma se normaliza)
const MARKET_WEIGHTS: [string[], Record<string, number>][] = [
  [['restaur', 'gastro', 'belleza', 'retail', 'moda'], { 'Meta Ads': 55, 'TikTok Ads': 25, 'Google Ads': 20, 'LinkedIn Ads': 0 }],
  [['salud', 'clinic', 'medic', 'seguros'],            { 'Meta Ads': 40, 'Google Ads': 45, 'TikTok Ads': 10, 'LinkedIn Ads': 5 }],
  [['inmobiliar', 'construc'],                          { 'Meta Ads': 45, 'Google Ads': 35, 'TikTok Ads': 10, 'LinkedIn Ads': 10 }],
  [['b2b', 'industrial', 'servicios', 'legal', 'abogad', 'tecnolog'], { 'LinkedIn Ads': 40, 'Google Ads': 35, 'Meta Ads': 25, 'TikTok Ads': 0 }],
  [['educa', 'academ'],                                 { 'Meta Ads': 45, 'Google Ads': 25, 'TikTok Ads': 25, 'LinkedIn Ads': 5 }],
];

const CAMPAIGN_GOALS: Record<MarketingObjective, Record<string, string>> = {
  alcance:     { 'Meta Ads': 'Alcance / Reconocimiento de marca', 'Google Ads': 'Display — Cobertura', 'TikTok Ads': 'Alcance', 'LinkedIn Ads': 'Brand Awareness' },
  conversion:  { 'Meta Ads': 'Mensajes / Conversiones', 'Google Ads': 'Búsqueda — Conversiones', 'TikTok Ads': 'Conversiones al sitio', 'LinkedIn Ads': 'Generación de leads' },
  comunidad:   { 'Meta Ads': 'Interacción', 'Google Ads': 'YouTube — Interacción', 'TikTok Ads': 'Interacción con la comunidad', 'LinkedIn Ads': 'Interacción' },
  lanzamiento: { 'Meta Ads': 'Alcance + Tráfico (secuencial)', 'Google Ads': 'Búsqueda de marca', 'TikTok Ads': 'Alcance con Spark Ads', 'LinkedIn Ads': 'Brand Awareness' },
};

const CAMPAIGN_TYPES: Record<string, string[]> = {
  'Meta Ads':     ['Advantage+ (IG/FB Feed + Reels)', 'Historias con CTA', 'Remarketing dinámico'],
  'Google Ads':   ['Búsqueda (intención alta)', 'Performance Max', 'Remarketing Display'],
  'TikTok Ads':   ['In-Feed Ads', 'Spark Ads (contenido orgánico ganador)'],
  'LinkedIn Ads': ['Sponsored Content', 'Lead Gen Forms'],
};

function audiencesFor(mercado: string, ciudad = 'Quito'): string[] {
  const key = mercado.toLowerCase();
  const base = [`Intereses del sector en ${ciudad} y alrededores (25–54)`, 'Lookalike de interacciones con el perfil (últimos 90 días)', 'Remarketing: visitantes web + engagers IG/FB (30 días)'];
  if (/b2b|industrial|servicios|legal|tecnolog/.test(key)) {
    return ['Cargos decisores del sector (gerentes, dueños, compras)', `Empresas del sector en Ecuador`, 'Remarketing: visitantes web y perfil de empresa'];
  }
  if (/restaur|gastro/.test(key)) return [`Foodies e intereses gastronómicos en ${ciudad} (radio 8 km)`, ...base.slice(1)];
  return base;
}

export function generateAdStrategy(client: Client, piezasPauta: ContentPiece[], brief?: BriefMaestro): AdStrategy {
  const mercado = client.tipo_mercado ?? client.industria;
  const objetivo = client.objetivo_marketing ?? 'alcance';
  const presupuesto = client.presupuesto_pauta ?? Math.round((client.presupuesto_mensual ?? 500) * 0.4);
  const contratadas = client.pauta_plataformas?.length
    ? client.pauta_plataformas
    : ['Meta Ads'];

  // Pesos por mercado, filtrados a las plataformas contratadas
  const weights = MARKET_WEIGHTS.find(([m]) => m.some(x => mercado.toLowerCase().includes(x)))?.[1]
    ?? { 'Meta Ads': 50, 'Google Ads': 25, 'TikTok Ads': 15, 'LinkedIn Ads': 10 };
  const activos = contratadas.map(p => ({ p, w: weights[p] ?? 10 }));
  const totalW = activos.reduce((a, x) => a + x.w, 0) || 1;

  // El Brief afina las audiencias: ubicación real y perfil del cliente ideal
  const ciudad = brief?.ubicacion?.split(/[,;]/)[0]?.trim() || 'Quito';

  const overrides = client.distribucion_pauta_overrides ?? {};

  const plataformas: PlatformPlan[] = activos.map(({ p, w }) => {
    const pct = Math.round((w / totalW) * 100);
    const suggestedBudget = Math.round((presupuesto * pct) / 100);
    const actualBudget = overrides[p] !== undefined ? overrides[p] : suggestedBudget;
    
    const audiencias = audiencesFor(mercado, ciudad);
    if (brief?.perfil_cliente) audiencias.unshift(`Perfil del Brief: ${brief.perfil_cliente.slice(0, 80)}${brief.perfil_cliente.length > 80 ? '…' : ''}`);
    return {
      plataforma: p,
      porcentaje: pct,
      presupuesto: actualBudget,
      objetivo_campana: CAMPAIGN_GOALS[objetivo][p] ?? 'Tráfico',
      tipos_campana: CAMPAIGN_TYPES[p] ?? [],
      audiencias,
      razon: `${p} pondera ${pct}% para ${mercado.toLowerCase()} con objetivo de ${objetivo}.`,
    };
  }).sort((a, b) => b.porcentaje - a.porcentaje);

  // Embudo según objetivo
  const embudos: Record<MarketingObjective, [number, number, number, number]> = {
    alcance:     [50, 25, 15, 10],
    conversion:  [20, 25, 40, 15],
    comunidad:   [40, 35, 10, 15],
    lanzamiento: [45, 30, 15, 10],
  };
  const [rec, con, cnv, rmk] = embudos[objetivo];

  const getStageDescription = (etapa: string, _obj: MarketingObjective, platforms: string[]): string => {
    const isB2B = platforms.includes('LinkedIn Ads');
    if (etapa === 'Reconocimiento') {
      return isB2B 
        ? `Artículos de opinión y posts de imagen de marca a profesionales`
        : `Video corto, reels o posts visuales de alto impacto a audiencias frías`;
    }
    if (etapa === 'Consideración') {
      return isB2B
        ? `Casos de estudio, testimoniales B2B y guías informativas`
        : `Carruseles informativos, infografías y contenidos de valor/educación`;
    }
    if (etapa === 'Conversión') {
      return `Anuncios con CTA enfocado en soluciones, ofertas o reserva directa`;
    }
    return `Historias, testimonios, reviews y ofertas especiales a interactores recientes`;
  };

  // La estrategia parte del contenido: cada creativo seleccionado se asigna
  // a la etapa del embudo donde su formato y ángulo Andrómeda rinden mejor.
  const stageFor = (cp: ContentPiece): string => {
    const copy = (cp.copy_activo ?? '').toLowerCase();
    const hasDirectCTA = /reserva|compra|escríbenos|agenda|cotiza|link en bio|últim|promo|descuento/.test(copy);
    if (hasDirectCTA && cp.tipo !== 'historia') return 'Conversión';
    if (cp.tipo === 'reel' || cp.tipo === 'post_video' || cp.tipo === 'tiktok') return 'Reconocimiento';
    if (cp.tipo === 'carrusel' || cp.tipo === 'infografia') return 'Consideración';
    if (cp.tipo === 'historia' || cp.tipo === 'historia_video') return 'Remarketing';
    return 'Consideración';
  };
  const creativos_por_etapa: Record<string, ContentPiece[]> = {
    Reconocimiento: [], Consideración: [], Conversión: [], Remarketing: [],
  };
  piezasPauta.forEach(cp => creativos_por_etapa[stageFor(cp)].push(cp));

  const conteo = (etapa: string) => {
    const n = creativos_por_etapa[etapa].length;
    return n > 0 ? ` — ${n} ${n === 1 ? 'creativo asignado' : 'creativos asignados'}` : ' — sin creativos aún';
  };

  const embudo: FunnelStage[] = [
    { etapa: 'Reconocimiento', porcentaje: rec, descripcion: `${getStageDescription('Reconocimiento', objetivo, contratadas)}${conteo('Reconocimiento')}` },
    { etapa: 'Consideración', porcentaje: con, descripcion: `${getStageDescription('Consideración', objetivo, contratadas)}${conteo('Consideración')}` },
    { etapa: 'Conversión', porcentaje: cnv, descripcion: `${getStageDescription('Conversión', objetivo, contratadas)}${conteo('Conversión')}` },
    { etapa: 'Remarketing', porcentaje: rmk, descripcion: `${getStageDescription('Remarketing', objetivo, contratadas)}${conteo('Remarketing')}` },
  ];

  // Dynamic minimum creatives needed based on budget and objective
  const minCreativosRecomendados = objetivo === 'conversion' 
    ? (presupuesto > 1500 ? 5 : presupuesto > 600 ? 3 : 2)
    : (presupuesto > 1000 ? 4 : 2);

  // Recommended baseline budget per platform
  const getMinRecommendedBudget = (platform: string, obj: MarketingObjective): number => {
    if (platform === 'LinkedIn Ads') return 250;
    if (obj === 'conversion') return 150;
    return 100;
  };
  const lowBudgetPlatforms = plataformas.filter(p => p.presupuesto < getMinRecommendedBudget(p.plataforma, objetivo));

  // Score estratégico: qué tan completa está la información
  const checks: [boolean, string][] = [
    [!!brief, 'Completar el Brief del cliente'],
    [!!client.tipo_mercado || !!client.industria, 'Definir el tipo de mercado del cliente'],
    [!!client.objetivo_marketing, 'Definir el objetivo de marketing'],
    [(client.pauta_plataformas?.length ?? 0) > 0, 'Seleccionar plataformas de pauta en el contrato'],
    [!!client.presupuesto_pauta || !!client.presupuesto_mensual, 'Definir el presupuesto de pauta'],
    [piezasPauta.length > 0, 'Marcar material aprobado para pauta desde Multimedia'],
    [piezasPauta.length >= minCreativosRecomendados, `Tener al menos ${minCreativosRecomendados} creativos para rotar (evita fatiga de anuncio)`],
    [lowBudgetPlatforms.length === 0, lowBudgetPlatforms.length > 0 
      ? `Ajustar presupuesto para: ${lowBudgetPlatforms.map(p => `${p.plataforma} (min. sugerido: $${getMinRecommendedBudget(p.plataforma, objetivo)} USD)`).join(', ')}`
      : 'Asignación de presupuesto óptima por plataforma'
    ]
  ];
  const passed = checks.filter(([ok]) => ok).length;
  const score = Math.round((passed / checks.length) * 100);
  const score_detalle = checks.filter(([ok]) => !ok).map(([, msg]) => msg);

  const mes = new Date().toLocaleDateString('es', { month: 'short', year: '2-digit' }).replace(' ', '').replace('.', '');
  const nomenclatura = client.nomenclatura_campana || `${client.nombre.toUpperCase().slice(0, 6)}_{PLATAFORMA}_{ETAPA}_{OBJETIVO}_${mes}`;
  const totalBudget = plataformas.reduce((a, pl) => a + pl.presupuesto, 0);

  return { presupuesto_total: totalBudget, plataformas, embudo, creativos: piezasPauta, creativos_por_etapa, nomenclatura, score, score_detalle };
}
