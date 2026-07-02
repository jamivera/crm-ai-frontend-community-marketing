import React, { useState } from 'react';
import { X, Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFplusStore } from '../../store';

interface Props { onClose: () => void; }

export function NewCampaignModal({ onClose }: Props) {
  const clients = useFplusStore(s => s.clients);
  const createCampaign = useFplusStore(s => s.createCampaign);
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id ?? '');
  const [tipo, setTipo] = useState<'organica' | 'pauta' | 'mixta'>('organica');
  const [objetivo, setObjetivo] = useState<'awareness' | 'engagement' | 'leads' | 'ventas' | 'retencion'>('awareness');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const client = clients.find(c => c.id === clientId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !clientId || !fechaInicio || !fechaFin) return;
    setSaving(true);
    const id = `camp-${Date.now()}`;
    createCampaign({
      id,
      client_id: clientId,
      client_nombre: client?.nombre ?? '',
      nombre: nombre.trim(),
      codigo_interno: `CAM-${id.slice(-4).toUpperCase()}`,
      tipo,
      objetivo,
      estado: 'planificada',
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      piezas_totales: 0,
      piezas_publicadas: 0,
      leads: 0,
      created_at: new Date().toISOString(),
    });
    setCreatedId(id);
    setSaving(false);
  }

  if (createdId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-slate-900 text-lg">{nombre} creada</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">¿Qué quieres hacer ahora?</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { onClose(); navigate(`/fplus/campaigns/${createdId}`); }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Ver detalle de campaña <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-full px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
              Volver a campañas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Nueva campaña</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la campaña <span className="text-red-500">*</span></label>
            <input
              autoFocus type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Lanzamiento Q3 2026"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente <span className="text-red-500">*</span></label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" required>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="organica">Orgánica</option>
                <option value="pauta">Pauta</option>
                <option value="mixta">Mixta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Objetivo</label>
              <select value={objetivo} onChange={e => setObjetivo(e.target.value as typeof objetivo)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="awareness">Awareness</option>
                <option value="engagement">Engagement</option>
                <option value="leads">Leads</option>
                <option value="ventas">Ventas</option>
                <option value="retencion">Retención</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha inicio <span className="text-red-500">*</span></label>
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha fin <span className="text-red-500">*</span></label>
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
              {saving ? 'Creando...' : 'Crear campaña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
