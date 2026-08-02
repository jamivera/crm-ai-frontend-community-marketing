export interface UnifiedMetricCard {
  key: string;
  label: string;
  value: string | number;
  rawNumericValue: number;
  unit?: string;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
}

export interface UnifiedCampaignRow {
  id: string;
  name: string;
  objective: string;
  status: string;
  spend: number;
  
  // Optional performance metrics
  leads?: number;
  clicks?: number;
  impressions?: number;
  reach?: number;
  ctr?: number;
  cpl?: number;
  cpc?: number;
  roas?: number;
  cpm?: number;
  frequency?: number;
  plataforma?: string;
}

export interface UnifiedChartPoint {
  name: string;
  [key: string]: string | number;
}

export interface UnifiedPlatformMetrics {
  platform: 'Meta Ads' | 'Google Ads' | 'LinkedIn Ads' | 'TikTok Ads' | 'todos';
  kpiCards: UnifiedMetricCard[];
  evolutionChartData: UnifiedChartPoint[];
  evolutionChartSeries: { key: string; name: string; color: string; type?: 'area' | 'line' | 'bar' }[];
  campaigns: UnifiedCampaignRow[];
  extraData?: {
    keywords?: { term: string; clicks: number; conversions?: number }[];
    devices?: { name: string; percentage: number }[];
    audiences?: { segment: string; percentage: number }[];
    adGroups?: { name: string; budget: number; status: string }[];
    videoStats?: { completionRate: number; averageWatchTime: number };
    [key: string]: any;
  };
}
