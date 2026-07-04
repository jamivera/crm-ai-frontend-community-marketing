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

  const plataformas: PlatformPlan[] = activos.map(({ p, w }) => {
    const pct = Math.round((w / totalW) * 100);
    const audiencias = audiencesFor(mercado, ciudad);
    if (brief?.perfil_cliente) audiencias.unshift(`Perfil del Brief: ${brief.perfil_cliente.slice(0, 80)}${brief.perfil_cliente.length > 80 ? '…' : ''}`);
    return {
      plataforma: p,
      porcentaje: pct,
      presupuesto: Math.round((presupuesto * pct) / 100),
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
  const embudo: FunnelStage[] = [
    { etapa: 'Reconocimiento', porcentaje: rec, descripcion: 'Reels y video corto a audiencias frías — construir alcance' },
    { etapa: 'Consideración', porcentaje: con, descripcion: 'Carruseles y testimonios a interesados — educar y comparar' },
    { etapa: 'Conversión', porcentaje: cnv, descripcion: 'Ofertas con CTA directo a audiencias calientes' },
    { etapa: 'Remarketing', porcentaje: rmk, descripcion: 'Reimpacto a visitantes e interactores de los últimos 30 días' },
  ];

  // Score estratégico: qué tan completa está la información
  const checks: [boolean, string][] = [
    [!!brief, 'Completar el Brief del cliente'],
    [!!client.tipo_mercado || !!client.industria, 'Definir el tipo de mercado del cliente'],
    [!!client.objetivo_marketing, 'Definir el objetivo de marketing'],
    [(client.pauta_plataformas?.length ?? 0) > 0, 'Seleccionar plataformas de pauta en el contrato'],
    [!!client.presupuesto_pauta || !!client.presupuesto_mensual, 'Definir el presupuesto de pauta'],
    [piezasPauta.length > 0, 'Marcar material aprobado para pauta desde Multimedia'],
    [piezasPauta.length >= 3, 'Tener al menos 3 creativos para rotar (evita fatiga de anuncio)'],
  ];
  const passed = checks.filter(([ok]) => ok).length;
  const score = Math.round((passed / checks.length) * 100);
  const score_detalle = checks.filter(([ok]) => !ok).map(([, msg]) => msg);

  const mes = new Date().toLocaleDateString('es', { month: 'short', year: '2-digit' }).replace(' ', '');
  const nomenclatura = `${client.nombre.toUpperCase().slice(0, 6)}_{PLATAFORMA}_{ETAPA}_{OBJETIVO}_${mes}`;

  return { presupuesto_total: presupuesto, plataformas, embudo, creativos: piezasPauta, nomenclatura, score, score_detalle };
}
