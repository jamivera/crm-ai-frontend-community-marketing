import { useState, useMemo } from 'react';
import { X, FileText, Download, Check } from 'lucide-react';
import { getUnifiedPlatformMetrics } from '../../services/metricsAdapter';
import { exportReportToPDF } from '../../services/reportExporter';
import { useFplusStore } from '../../store';

interface Props {
  clientId: string;
  onClose: () => void;
}

export function ReportSelectionModal({ clientId, onClose }: Props) {
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));
  const campaigns = useFplusStore(s => s.campaigns);

  // Available platforms configured for client
  const platforms = useMemo(() => {
    return client?.pauta_plataformas || [];
  }, [client]);

  const [selectedReport, setSelectedReport] = useState<'todos' | 'Meta Ads' | 'Google Ads' | 'LinkedIn Ads' | 'TikTok Ads'>('todos');
  const [generating, setGenerating] = useState(false);

  // Calculate metrics dynamically using the adapter
  const unifiedMetrics = useMemo(() => {
    return getUnifiedPlatformMetrics(clientId, selectedReport, client, campaigns);
  }, [clientId, selectedReport, client, campaigns]);

  const handleExport = async () => {
    setGenerating(true);
    try {
      await exportReportToPDF({
        clientId,
        clientName: client?.nombre || 'Cliente',
        platform: selectedReport,
        metrics: unifiedMetrics
      });
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      {/* Print styles injected locally */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-report-container, #print-report-container * {
            visibility: visible !important;
          }
          #print-report-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 30px !important;
          }
          .no-print-modal {
            display: none !important;
          }
        }
      `}} />

      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col no-print-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-sm">Generador de Informes de Rendimiento</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Reportes unificados listos para exportar a PDF</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Body split in 2 columns: Selector & Preview */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {/* Left Column: Report configuration */}
          <div className="w-full md:w-80 flex flex-col gap-5 border-r border-slate-800/80 pr-0 md:pr-6 shrink-0">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Selecciona el Tipo de Reporte
              </label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport('todos')}
                  className={`px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    selectedReport === 'todos'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>📊 Consolidado (General)</span>
                  {selectedReport === 'todos' && <Check className="w-3.5 h-3.5" />}
                </button>

                {platforms.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedReport(p as any)}
                    className={`px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                      selectedReport === p
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>
                      {p === 'Meta Ads' ? '📘 Meta Ads' : p === 'Google Ads' ? '🔍 Google Ads' : p === 'LinkedIn Ads' ? '💼 LinkedIn Ads' : '🎵 TikTok Ads'}
                    </span>
                    {selectedReport === p && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/20 border border-slate-800/80 rounded-2xl p-4 text-[10px] text-slate-400 space-y-2">
              <p className="font-bold text-slate-300 uppercase tracking-wider">Identidad Corporativa</p>
              <p>Propietario: <strong className="text-slate-200">Jamil Vera Technologies</strong></p>
              <p>Este reporte se genera directamente desde la base de datos de AgencyOS para garantizar total consistencia en las métricas consolidadas.</p>
            </div>

            <button
              onClick={handleExport}
              disabled={generating}
              className="mt-auto w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/10 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {generating ? 'Generando PDF...' : 'Guardar Reporte PDF'}
            </button>
          </div>

          {/* Right Column: Interactive Document Preview */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-3xl p-5 overflow-y-auto max-h-[60vh] md:max-h-none shadow-inner">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">
              Previsualización de Reporte A4
            </p>
            
            {/* The printable target container */}
            <div id="print-report-container" className="bg-white text-slate-900 p-8 rounded-2xl shadow-lg border border-slate-100 max-w-2xl mx-auto space-y-8 font-sans">
              
              {/* Header inside A4 */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                <div>
                  <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">
                    Jamil Vera Technologies · AgencyOS
                  </p>
                  <h1 className="text-xl font-black text-slate-900 mt-1">
                    Reporte Mensual de Rendimiento
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cliente: <strong className="text-slate-800 font-bold">{client?.nombre}</strong> · Canal: <strong className="text-slate-800 font-bold">{selectedReport === 'todos' ? 'Consolidado General' : selectedReport}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Fecha de Generación</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* KPI Cards section */}
              <div className="space-y-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Indicadores de Rendimiento Clave (KPIs)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {unifiedMetrics.kpiCards.map(k => (
                    <div key={k.key} className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</p>
                      <p className="text-lg font-black text-slate-950 mt-1">{k.value}</p>
                      <p className="text-[9px] text-slate-500 mt-1.5 leading-snug">{k.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campaigns list inside A4 */}
              {unifiedMetrics.campaigns.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Rendimiento de Campañas
                  </p>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[9px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider">
                          <th className="p-2.5">Campaña</th>
                          <th className="p-2.5">Objetivo</th>
                          <th className="p-2.5 text-right">Inversión</th>
                          <th className="p-2.5 text-right">Leads</th>
                          <th className="p-2.5 text-right">CPL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {unifiedMetrics.campaigns.map(c => (
                          <tr key={c.id} className="text-slate-700">
                            <td className="p-2.5 font-semibold text-slate-950">{c.name}</td>
                            <td className="p-2.5 capitalize">{c.objective}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">${c.spend.toLocaleString('es')} USD</td>
                            <td className="p-2.5 text-right">{c.leads ?? 0}</td>
                            <td className="p-2.5 text-right font-semibold">${c.cpl?.toFixed(2) ?? '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Print Footer */}
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[8px] text-slate-400">
                <p>© {new Date().getFullYear()} Jamil Vera Technologies. Todos los derechos reservados.</p>
                <p>Generado a través del panel inteligente de AgencyOS.</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
