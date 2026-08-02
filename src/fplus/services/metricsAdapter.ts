import { UnifiedPlatformMetrics, UnifiedCampaignRow, UnifiedMetricCard, UnifiedChartPoint } from '../types/metricsSchema';

const PLATFORM_PARAMS = {
  'Meta Ads': { reachPerDollar: 110, cpl: 1.85, cpc: 0.45, ctr: 2.8, roas: 3.8, freq: 1.45 },
  'Google Ads': { reachPerDollar: 75, cpl: 3.20, cpc: 0.85, ctr: 3.5, roas: 4.2, freq: 1.0 },
  'TikTok Ads': { reachPerDollar: 140, cpl: 2.10, cpc: 0.35, ctr: 1.9, roas: 3.1, freq: 1.62 },
  'LinkedIn Ads': { reachPerDollar: 35, cpl: 8.50, cpc: 2.15, ctr: 1.2, roas: 5.0, freq: 1.30 }
};

export function getUnifiedPlatformMetrics(
  clientId: string,
  platform: 'Meta Ads' | 'Google Ads' | 'LinkedIn Ads' | 'TikTok Ads' | 'todos',
  client: any,
  campaigns: any[]
): UnifiedPlatformMetrics {
  const activePlatformsList = client?.pauta_plataformas || [];
  const activeCampaigns = campaigns.filter(c => c.client_id === clientId && c.estado === 'activa');

  // 1. Identify which platforms have campaigns or budget
  const platformsToCalculate = platform === 'todos' 
    ? activePlatformsList 
    : [platform];

  let totalSpend = 0;
  let totalLeads = 0;
  let totalClicks = 0;
  let totalImpressions = 0;
  let totalReach = 0;
  let roasSum = 0;
  let roasCount = 0;

  const unifiedCampaigns: UnifiedCampaignRow[] = [];

  // Calculate metrics platform by platform
  platformsToCalculate.forEach((p: string) => {
    const params = PLATFORM_PARAMS[p as keyof typeof PLATFORM_PARAMS] || PLATFORM_PARAMS['Meta Ads'];
    const pCamps = activeCampaigns.filter(c => c.plataforma === p);

    let pSpend = 0;
    let pLeads = 0;

    if (pCamps.length > 0) {
      pCamps.forEach(c => {
        const cSpend = c.presupuesto_total || 0;
        pSpend += cSpend;
        pLeads += c.leads || 0;
        if (c.roas) {
          roasSum += c.roas;
          roasCount++;
        }

        const cReach = cSpend * params.reachPerDollar;
        const cImps = Math.round(cReach * params.freq);
        const cClicks = Math.round(cSpend / params.cpc);
        const cCtr = cImps > 0 ? (cClicks / cImps) * 100 : 0;
        const cCpl = c.leads > 0 ? cSpend / c.leads : 0;

        unifiedCampaigns.push({
          id: c.id,
          name: c.nombre,
          objective: c.objetivo || 'Conversión',
          status: c.estado,
          spend: cSpend,
          leads: c.leads,
          clicks: cClicks,
          impressions: cImps,
          reach: Math.round(cReach),
          ctr: Number(cCtr.toFixed(2)),
          cpl: Number(cCpl.toFixed(2)),
          cpc: params.cpc,
          roas: c.roas || params.roas,
          plataforma: c.plataforma || p
        });
      });
    } else {
      // No campaigns in store, but check if we have budget overrides allocated to p
      const overrideBudget = client?.distribucion_pauta_overrides?.[p];
      const defaultBudgetShare = client?.presupuesto_pauta 
        ? Math.round(client.presupuesto_pauta / activePlatformsList.length) 
        : 0;
      
      const pBudget = overrideBudget !== undefined ? overrideBudget : defaultBudgetShare;
      pSpend = pBudget;
      pLeads = Math.round(pBudget / params.cpl);
    }

    // Accumulate total variables
    totalSpend += pSpend;
    totalLeads += pLeads;
    const pReach = pSpend * params.reachPerDollar;
    totalReach += pReach;
    totalImpressions += Math.round(pReach * params.freq);
    totalClicks += Math.round(pSpend / params.cpc);
  });

  // Consolidated derived formulas (Safe division)
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

  const kpiCards: UnifiedMetricCard[] = [];

  if (platform === 'todos') {
    kpiCards.push(
      { key: 'spend', label: 'Inversión Consolidada', value: `$${Math.round(totalSpend).toLocaleString('es')} USD`, rawNumericValue: totalSpend, description: 'Presupuesto total invertido en todos los canales' },
      { key: 'leads', label: 'Leads / Conversiones', value: totalLeads.toLocaleString('es'), rawNumericValue: totalLeads, description: 'Prospectos totales acumulados' },
      { key: 'cpl', label: 'Costo por Lead (CPL)', value: `$${cpl.toFixed(2)} USD`, rawNumericValue: cpl, description: 'Inversión / Leads consolidados' },
      { key: 'reach', label: 'Alcance Acumulado (Canales)', value: Math.round(totalReach).toLocaleString('es'), rawNumericValue: totalReach, description: 'Suma de alcance de todos los canales' },
      { key: 'ctr', label: 'CTR General Promedio', value: `${ctr.toFixed(2)}%`, rawNumericValue: ctr, description: 'Clics totales / impresiones' }
    );
  } else if (platform === 'Meta Ads') {
    kpiCards.push(
      { key: 'reach', label: 'Alcance', value: Math.round(totalReach).toLocaleString('es'), rawNumericValue: totalReach, description: 'Personas únicas alcanzadas' },
      { key: 'impressions', label: 'Impresiones', value: Math.round(totalImpressions).toLocaleString('es'), rawNumericValue: totalImpressions, description: 'Visualizaciones totales' },
      { key: 'leads', label: 'Clientes Potenciales', value: totalLeads.toLocaleString('es'), rawNumericValue: totalLeads, description: 'Prospectos de Meta' },
      { key: 'spend', label: 'Gasto', value: `$${Math.round(totalSpend).toLocaleString('es')} USD`, rawNumericValue: totalSpend, description: 'Inversión en Meta Ads' },
      { key: 'freq', label: 'Frecuencia', value: '1.45x', rawNumericValue: 1.45, description: 'Veces promedio por persona' },
      { key: 'cpm', label: 'CPM Promedio', value: `$${cpm.toFixed(2)} USD`, rawNumericValue: cpm, description: 'Costo por mil impresiones' },
      { key: 'ctr', label: 'CTR', value: `${ctr.toFixed(2)}%`, rawNumericValue: ctr, description: 'Porcentaje de clics' },
      { key: 'clicks', label: 'Clics', value: totalClicks.toLocaleString('es'), rawNumericValue: totalClicks, description: 'Clics en enlace' },
      { key: 'cpl', label: 'CPL', value: `$${cpl.toFixed(2)} USD`, rawNumericValue: cpl, description: 'Costo promedio por lead' }
    );
  } else if (platform === 'Google Ads') {
    kpiCards.push(
      { key: 'leads', label: 'Conversiones', value: totalLeads.toLocaleString('es'), rawNumericValue: totalLeads, description: 'Acciones de conversión' },
      { key: 'clicks', label: 'Clics', value: totalClicks.toLocaleString('es'), rawNumericValue: totalClicks, description: 'Visitas generadas' },
      { key: 'impressions', label: 'Impresiones', value: Math.round(totalImpressions).toLocaleString('es'), rawNumericValue: totalImpressions, description: 'Impresiones en búsquedas' },
      { key: 'ctr', label: 'CTR', value: `${ctr.toFixed(2)}%`, rawNumericValue: ctr, description: 'Tasa de interacción' },
      { key: 'cpc', label: 'CPC Promedio', value: `$${cpc.toFixed(2)} USD`, rawNumericValue: cpc, description: 'Costo por clic' },
      { key: 'cpl', label: 'CPA (Costo por Adq.)', value: `$${cpl.toFixed(2)} USD`, rawNumericValue: cpl, description: 'Costo por conversión' },
      { key: 'spend', label: 'Costo', value: `$${Math.round(totalSpend).toLocaleString('es')} USD`, rawNumericValue: totalSpend, description: 'Inversión en Google Ads' }
    );
  } else if (platform === 'LinkedIn Ads') {
    kpiCards.push(
      { key: 'impressions', label: 'Impresiones', value: Math.round(totalImpressions).toLocaleString('es'), rawNumericValue: totalImpressions, description: 'Visualizaciones B2B' },
      { key: 'clicks', label: 'Clics', value: totalClicks.toLocaleString('es'), rawNumericValue: totalClicks, description: 'Clics de profesionales' },
      { key: 'ctr', label: 'CTR', value: `${ctr.toFixed(2)}%`, rawNumericValue: ctr, description: 'Tasa de interacción LinkedIn' },
      { key: 'cpc', label: 'CPC', value: `$${cpc.toFixed(2)} USD`, rawNumericValue: cpc, description: 'Costo promedio por clic' },
      { key: 'leads', label: 'Leads B2B', value: totalLeads.toLocaleString('es'), rawNumericValue: totalLeads, description: 'Prospectos profesionales' },
      { key: 'spend', label: 'Gasto', value: `$${Math.round(totalSpend).toLocaleString('es')} USD`, rawNumericValue: totalSpend, description: 'Inversión en LinkedIn' },
      { key: 'freq', label: 'Frecuencia', value: '1.30x', rawNumericValue: 1.30, description: 'Veces promedio por profesional' }
    );
  } else if (platform === 'TikTok Ads') {
    kpiCards.push(
      { key: 'impressions', label: 'Visualizaciones', value: Math.round(totalImpressions * 2.3).toLocaleString('es'), rawNumericValue: totalImpressions * 2.3, description: 'Visualizaciones del video' },
      { key: 'video_views', label: 'Video Views (Completas)', value: Math.round(totalImpressions).toLocaleString('es'), rawNumericValue: totalImpressions, description: 'Vistas completas de video' },
      { key: 'reach', label: 'Reach', value: Math.round(totalReach).toLocaleString('es'), rawNumericValue: totalReach, description: 'Alcance de video único' },
      { key: 'clicks', label: 'Clicks', value: totalClicks.toLocaleString('es'), rawNumericValue: totalClicks, description: 'Clics de TikTok' },
      { key: 'ctr', label: 'CTR', value: `${ctr.toFixed(2)}%`, rawNumericValue: ctr, description: 'Tasa de clics' },
      { key: 'cpc', label: 'CPC', value: `$${cpc.toFixed(2)} USD`, rawNumericValue: cpc, description: 'Costo por clic' },
      { key: 'leads', label: 'Conversiones', value: totalLeads.toLocaleString('es'), rawNumericValue: totalLeads, description: 'Conversiones completadas' },
      { key: 'spend', label: 'Coste', value: `$${Math.round(totalSpend).toLocaleString('es')} USD`, rawNumericValue: totalSpend, description: 'Inversión en TikTok' }
    );
  }

  // 4. Evolution charts series
  const evolutionChartData: UnifiedChartPoint[] = [
    { name: 'Semana 1', Alcance: Math.round(totalReach * 0.22), Impresiones: Math.round(totalImpressions * 0.22), Clics: Math.round(totalClicks * 0.20), Leads: Math.round(totalLeads * 0.18), CPL: totalLeads > 0 ? Number(((totalSpend * 0.20) / (totalLeads * 0.18)).toFixed(2)) : 0 },
    { name: 'Semana 2', Alcance: Math.round(totalReach * 0.48), Impresiones: Math.round(totalImpressions * 0.48), Clics: Math.round(totalClicks * 0.45), Leads: Math.round(totalLeads * 0.42), CPL: totalLeads > 0 ? Number(((totalSpend * 0.45) / (totalLeads * 0.42)).toFixed(2)) : 0 },
    { name: 'Semana 3', Alcance: Math.round(totalReach * 0.78), Impresiones: Math.round(totalImpressions * 0.78), Clics: Math.round(totalClicks * 0.75), Leads: Math.round(totalLeads * 0.72), CPL: totalLeads > 0 ? Number(((totalSpend * 0.75) / (totalLeads * 0.72)).toFixed(2)) : 0 },
    { name: 'Semana 4', Alcance: Math.round(totalReach), Impresiones: Math.round(totalImpressions), Clics: Math.round(totalClicks), Leads: Math.round(totalLeads), CPL: totalLeads > 0 ? Number((totalSpend / totalLeads).toFixed(2)) : 0 }
  ];

  let evolutionChartSeries: any[] = [];
  if (platform === 'todos') {
    evolutionChartSeries = [
      { key: 'Alcance', name: 'Alcance Acumulado', color: '#4f46e5', type: 'area' },
      { key: 'Leads', name: 'Leads Totales', color: '#10b981', type: 'line' }
    ];
  } else if (platform === 'Google Ads') {
    evolutionChartSeries = [
      { key: 'Clics', name: 'Clics', color: '#3b82f6', type: 'area' },
      { key: 'Leads', name: 'Conversiones', color: '#10b981', type: 'line' }
    ];
  } else if (platform === 'Meta Ads') {
    evolutionChartSeries = [
      { key: 'Alcance', name: 'Alcance', color: '#ec4899', type: 'area' },
      { key: 'Leads', name: 'Leads Captados', color: '#10b981', type: 'line' }
    ];
  } else if (platform === 'LinkedIn Ads') {
    evolutionChartSeries = [
      { key: 'Clics', name: 'Clics', color: '#0284c7', type: 'area' },
      { key: 'Leads', name: 'Leads B2B', color: '#10b981', type: 'line' }
    ];
  } else if (platform === 'TikTok Ads') {
    evolutionChartSeries = [
      { key: 'Impresiones', name: 'Visualizaciones', color: '#8b5cf6', type: 'area' },
      { key: 'Leads', name: 'Conversiones', color: '#10b981', type: 'line' }
    ];
  }

  // Extensible section for API-ready custom properties
  const extraData: any = {};
  
  // Expose campaign planning rows if they exist in the client data (Google Ads / LinkedIn Ads)
  const clientGridRows = client?.campaign_rows || [];
  const platformGridRows = clientGridRows.filter((r: any) => r.platform === platform);
  if (platformGridRows.length > 0) {
    extraData.gridRows = platformGridRows;
  }

  return {
    platform,
    kpiCards,
    evolutionChartData,
    evolutionChartSeries,
    campaigns: unifiedCampaigns,
    extraData
  };
}
