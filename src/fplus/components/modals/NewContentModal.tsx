import React, { useState } from 'react';
import { X, FileImage, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFplusStore } from '../../store';
import { CONTENT_TYPE_LABELS } from '../../constants';
import type { ContentType } from '../../types';

interface Props { onClose: () => void; preselectedClientId?: string; }

const PILARES = ['Educativo', 'Entretenimiento', 'Testimonial', 'Producto', 'Behind the scenes', 'Promocional'];

export function NewContentModal({ onClose, preselectedClientId }: Props) {
  const clients = useFplusStore(s => s.clients);
  const campaigns = useFplusStore(s => s.campaigns);
  const createContent = useFplusStore(s => s.createContent);
  const navigate = useNavigate();
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [clientId, setClientId] = useState(preselectedClientId ?? clients[0]?.id ?? '');
  const [tipo, setTipo] = useState<ContentType>('reel');
  const [pilar, setPilar] = useState('');
  const [campaignId, setCampaignId] = useState('');
  // P1-E: fecha_limite required
  const [fechaLimite, setFechaLimite] = useState('');
  const [saving, setSaving] = useState(false);

  const client = clients.find(c => c.id === clientId);
  const clientCampaigns = campaigns.filter(c => c.client_id === clientId && c.estado !== 'cancelada');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !clientId || !fechaLimite) return;
    setSaving(true);
    const selectedCampaign = campaigns.find(c => c.id === campaignId);
    const now = new Date().toISOString();
    const id = `cp-${Date.now()}`;
    createContent({
      id,
      client_id: clientId,
      client_nombre: client?.nombre ?? '',
      campaign_id: campaignId || undefined,
      campaign_nombre: selectedCampaign?.nombre,
      nombre: nombre.trim(),
      tipo,
      pilar: pilar || undefined,
      incluye_cta: false,
      estado: 'borrador',
      account_manager_id: 'am1',
      account_manager_nombre: client?.account_manager_name ?? 'Juan Pérez',
      iteraciones: 0,
      max_iteraciones: 3,
      archivos: [],
      fecha_limite: new Date(fechaLimite).toISOString(),
      created_at: now,
      updated_at: now,
    });
    setCreatedId(id);
    setSaving(false);
  }

  if (createdId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <FileImage className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-slate-900 text-lg">{nombre} creada</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">Pieza en estado Borrador. ¿Qué quieres hacer?</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { onClose(); navigate(`/fplus/content/${createdId}`); }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Abrir pieza y empezar <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setCreatedId(null); setNombre(''); setPilar(''); setCampaignId(''); setFechaLimite(''); }}
              className="w-full px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Crear otra pieza
            </button>
            <button onClick={onClose} className="w-full px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
              Volver al contenido
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
            <FileImage className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Nueva pieza de contenido</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la pieza <span className="text-red-500">*</span></label>
            <input
              autoFocus type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Reel apertura clínica junio"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente <span className="text-red-500">*</span></label>
            <select value={clientId} onChange={e => { setClientId(e.target.value); setCampaignId(''); }} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" required>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          {/* P1-E: fecha_limite required */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Fecha límite <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={fechaLimite}
              onChange={e => setFechaLimite(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-slate-400 mt-1">Fecha máxima para publicar esta pieza.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as ContentType)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                {(Object.entries(CONTENT_TYPE_LABELS) as [ContentType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilar</label>
              <select value={pilar} onChange={e => setPilar(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin pilar</option>
                {PILARES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          {clientCampaigns.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Campaña (opcional)</label>
              <select value={campaignId} onChange={e => setCampaignId(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin campaña</option>
                {clientCampaigns.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={saving || !nombre.trim() || !fechaLimite} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
              {saving ? 'Creando...' : 'Crear pieza'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
