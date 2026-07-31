import { UnifiedPlatformMetrics } from '../types/metricsSchema';

export interface ReportExportConfig {
  clientId: string;
  clientName: string;
  platform: 'Meta Ads' | 'Google Ads' | 'LinkedIn Ads' | 'TikTok Ads' | 'todos';
  metrics: UnifiedPlatformMetrics;
}

/**
 * Decoupled service to export campaign metrics report to PDF.
 * This function isolates the export engine from the visual UI components.
 * In a future phase, this function can easily be swapped or extended to use:
 * - A client-side library like jsPDF or pdfmake
 * - A server-side PDF generator (Puppeteer, Weasyprint, etc.) via API call
 */
export function exportReportToPDF(config: ReportExportConfig): Promise<void> {
  console.log(`[ReportExporter] Generating PDF for client ${config.clientName} and platform ${config.platform}`);
  
  // Currently triggers browser native print dialog formatted via CSS print styles
  window.print();
  
  return Promise.resolve();
}
