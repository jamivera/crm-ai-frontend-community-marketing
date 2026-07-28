import type { Client, Platform } from '../types';
import { getTypeVisual } from '../constants';

export interface DemoMetricsData {
  totalAlcance: number;
  totalSpend: number;
  totalLeads: number;
  totalClicks: number;
  totalImpressions: number;
  avgEngagement: number;
  costoPorResultado: number;
  ctrPromedio: number;
  cpcPromedio: number;
  cpmPromedio: number;
  roasPromedio: number;
  areaData: { name: string; Alcance: number; Impresiones: number }[];
  lineData: { name: string; Clics: number; Leads: number }[];
  bestPosts: {
    id: string;
    nombre: string;
    plataforma: Platform;
    likes: number;
    comments: number;
    reach: number;
    engagement: number;
    visual: { emoji: string; gradient: string };
    url?: string;
  }[];
  campaignsPerformance: {
    id: string;
    nombre: string;
    codigo_interno: string;
    objetivo: string;
    estado: string;
    leads: number;
    cpl: number;
    roas: number;
    presupuesto_total: number;
  }[];
}

// Deterministic seed helper based on client ID to keep values consistent
function getClientSeed(clientId: string): number {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getClientDemoMetrics(
  clientId: string,
  activePlatform: string,
  client?: Client
): DemoMetricsData {
  const seed = getClientSeed(clientId);
  const platformsList = client?.pauta_plataformas || ['Meta Ads'];
  
  // Total budget configured for the client
  const baseBudget = client?.presupuesto_pauta ?? 1000;
  
  // Distribution overrides
  const overrides = client?.distribucion_pauta_overrides || {};

  // Define multipliers per platform
  const PLATFORM_PARAMS: Record<string, {
    cpl: number;
    cpc: number;
    ctr: number;
    reachPerDollar: number;
    roas: number;
    plataformas: ('facebook' | 'instagram' | 'tiktok_ads' | 'google_ads' | 'linkedin_ads')[];
  }> = {
    'Meta Ads': {
      cpl: 1.85 + (seed % 5) * 0.1,
      cpc: 0.45 + (seed % 3) * 0.05,
      ctr: 2.8,
      reachPerDollar: 110,
      roas: 3.8,
      plataformas: ['instagram', 'facebook']
    },
    'Google Ads': {
      cpl: 3.20 + (seed % 4) * 0.15,
      cpc: 0.85 + (seed % 4) * 0.1,
      ctr: 3.5,
      reachPerDollar: 75,
      roas: 4.2,
      plataformas: ['google_ads']
    },
    'TikTok Ads': {
      cpl: 2.10 + (seed % 3) * 0.1,
      cpc: 0.35 + (seed % 3) * 0.05,
      ctr: 1.9,
      reachPerDollar: 140,
      roas: 3.1,
      plataformas: ['tiktok_ads']
    },
    'LinkedIn Ads': {
      cpl: 8.50 + (seed % 7) * 0.25,
      cpc: 2.15 + (seed % 5) * 0.15,
      ctr: 1.2,
      reachPerDollar: 35,
      roas: 5.0,
      plataformas: ['linkedin_ads']
    }
  };

  // Determine budgets for platforms
  const budgetPerPlatform: Record<string, number> = {};
  platformsList.forEach(p => {
    if (overrides[p] !== undefined) {
      budgetPerPlatform[p] = overrides[p];
    } else {
      budgetPerPlatform[p] = Math.round(baseBudget / platformsList.length);
    }
  });

  // Calculate values for active platform
  let activePlatformsToAggregate = platformsList;
  if (activePlatform !== 'todos') {
    activePlatformsToAggregate = [activePlatform];
  }

  let totalSpend = 0;
  let totalAlcance = 0;
  let totalLeads = 0;
  let totalClicks = 0;
  let totalImpressions = 0;
  let sumRoas = 0;
  let sumCtr = 0;
  let sumCpc = 0;
  let activeCount = 0;

  activePlatformsToAggregate.forEach(p => {
    const budget = budgetPerPlatform[p] ?? 0;
    const params = PLATFORM_PARAMS[p] || PLATFORM_PARAMS['Meta Ads'];
    
    totalSpend += budget;
    const alc = budget * params.reachPerDollar;
    totalAlcance += alc;
    totalImpressions += Math.round(alc * 1.45);
    totalLeads += Math.round(budget / params.cpl);
    totalClicks += Math.round(budget / params.cpc);
    sumRoas += params.roas;
    sumCtr += params.ctr;
    sumCpc += params.cpc;
    activeCount++;
  });

  if (activeCount === 0) activeCount = 1;
  const roasPromedio = sumRoas / activeCount;
  const ctrPromedio = sumCtr / activeCount;
  const cpcPromedio = sumCpc / activeCount;
  const costoPorResultado = totalSpend / (totalLeads || 1);
  const cpmPromedio = totalSpend ? (totalSpend / totalImpressions) * 1000 : 0;
  const avgEngagement = 5.2 + (seed % 3) * 0.4;

  // Area data
  const areaData = [
    { name: 'Semana 1', Alcance: Math.round(totalAlcance * 0.22), Impresiones: Math.round(totalImpressions * 0.22) },
    { name: 'Semana 2', Alcance: Math.round(totalAlcance * 0.45), Impresiones: Math.round(totalImpressions * 0.45) },
    { name: 'Semana 3', Alcance: Math.round(totalAlcance * 0.78), Impresiones: Math.round(totalImpressions * 0.78) },
    { name: 'Semana 4', Alcance: totalAlcance, Impresiones: totalImpressions },
  ];

  // Line data
  const lineData = [
    { name: 'Semana 1', Clics: Math.round(totalClicks * 0.18), Leads: Math.round(totalLeads * 0.15) },
    { name: 'Semana 2', Clics: Math.round(totalClicks * 0.42), Leads: Math.round(totalLeads * 0.38) },
    { name: 'Semana 3', Clics: Math.round(totalClicks * 0.75), Leads: Math.round(totalLeads * 0.72) },
    { name: 'Semana 4', Clics: totalClicks, Leads: totalLeads },
  ];

  // Map platform keys to best posts platform types
  const mapPlatform = (plat: string): Platform => {
    if (plat === 'Meta Ads') return seed % 2 === 0 ? 'instagram' : 'facebook';
    if (plat === 'Google Ads') return 'google';
    if (plat === 'TikTok Ads') return 'tiktok';
    return 'linkedin';
  };

  // Best posts
  const bestPosts = activePlatformsToAggregate.map((p, idx) => {
    const mapped = mapPlatform(p);
    const reach = Math.round(totalAlcance * (0.4 - idx * 0.1));
    const likes = Math.round(reach * 0.05);
    const comments = Math.round(likes * 0.12);
    const engagement = Number((5.8 - idx * 0.5).toFixed(1));
    
    // Choose format emoji/gradient
    const types: ('reel' | 'carrusel' | 'post_imagen' | 'infografia')[] = ['reel', 'carrusel', 'post_imagen', 'infografia'];
    const selectedType = types[(seed + idx) % types.length];
    const visual = getTypeVisual(selectedType);

    return {
      id: `best-${p.toLowerCase().replace(' ', '-')}`,
      nombre: `Anuncio Estrella ${p} - V${idx + 1}`,
      plataforma: mapped,
      likes,
      comments,
      reach,
      engagement,
      visual,
      url: mapped === 'instagram' ? 'https://www.instagram.com/' : 'https://www.facebook.com/'
    };
  });

  const campaignsPerformance = activePlatformsToAggregate.map((p) => {
    const budget = budgetPerPlatform[p] ?? 0;
    const params = PLATFORM_PARAMS[p] || PLATFORM_PARAMS['Meta Ads'];
    const campaignLeads = Math.round(budget / params.cpl);
    const cpl = params.cpl;
    const roas = params.roas;

    return {
      id: `camp-${p.toLowerCase().replace(' ', '-')}`,
      nombre: `Campaña ${p === 'Meta Ads' ? 'Conversiones' : 'Pauta Directa'} - ${client?.nombre || 'Client'}`,
      codigo_interno: `${(client?.nombre || 'CLI').toUpperCase().slice(0, 3)}-${p.toUpperCase().slice(0, 2)}-26`,
      objetivo: p === 'Meta Ads' || p === 'TikTok Ads' ? 'Conversión' : 'Tráfico / Leads',
      estado: 'activa',
      leads: campaignLeads,
      cpl,
      roas,
      presupuesto_total: budget
    };
  });

  return {
    totalAlcance,
    totalSpend,
    totalLeads,
    totalClicks,
    totalImpressions,
    avgEngagement,
    costoPorResultado,
    ctrPromedio,
    cpcPromedio,
    cpmPromedio,
    roasPromedio,
    areaData,
    lineData,
    bestPosts,
    campaignsPerformance
  };
}
