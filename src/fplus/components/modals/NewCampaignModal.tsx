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
  const [plataforma, setPlataforma] = useState<'Meta Ads' | 'Google Ads' | 'TikTok Ads' | 'LinkedIn Ads'>('Meta Ads');
  const [objetivo, setObjetivo] = useState('Reconocimiento');
  const [funcionEstrategica, setFuncionEstrategica] = useState('Prospección');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const client = clients.find(c => c.id === clientId);

  const handlePlatformChange = (plat: 'Meta Ads' | 'Google Ads' | 'TikTok Ads' | 'LinkedIn Ads') => {
    setPlataforma(plat);
    if (plat === 'Meta Ads') setObjetivo('Reconocimiento');
    else if (plat === 'Google Ads') setObjetivo('Ventas');
    else if (plat === 'TikTok Ads') setObjetivo('Cobertura (Reach)');
    else if (plat === 'LinkedIn Ads') setObjetivo('Conocimiento de la marca');
  };

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
      plataforma: tipo === 'organica' ? 'Organico' : plataforma,
      objetivo,
      funcion_estrategica: tipo === 'organica' ? 'Orgánica general' : funcionEstrategica,
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
            {tipo !== 'organica' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Plataforma</label>
                <select value={plataforma} onChange={e => handlePlatformChange(e.target.value as any)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Meta Ads">Meta Ads</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="TikTok Ads">TikTok Ads</option>
                  <option value="LinkedIn Ads">LinkedIn Ads</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Objetivo</label>
                <select value={objetivo} onChange={e => setObjetivo(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Branding">Branding</option>
                  <option value="Interacción">Interacción</option>
                  <option value="Seguidores">Seguidores</option>
                  <option value="Conversión">Conversión</option>
                </select>
              </div>
            )}
          </div>

          {tipo !== 'organica' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Objetivo Oficial</label>
                <select value={objetivo} onChange={e => setObjetivo(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                  {plataforma === 'Meta Ads' && (
                    <>
                      <option value="Reconocimiento">Reconocimiento</option>
                      <option value="Tráfico">Tráfico</option>
                      <option value="Interacción">Interacción</option>
                      <option value="Clientes potenciales">Clientes potenciales</option>
                      <option value="Promoción de la app">Promoción de la app</option>
                      <option value="Ventas">Ventas</option>
                    </>
                  )}
                  {plataforma === 'Google Ads' && (
                    <>
                      <option value="Ventas">Ventas</option>
                      <option value="Clientes potenciales">Clientes potenciales</option>
                      <option value="Tráfico del sitio web">Tráfico del sitio web</option>
                      <option value="Cobertura y notoriedad de la marca">Cobertura y notoriedad de la marca</option>
                      <option value="Promoción de la aplicación">Promoción de la aplicación</option>
                    </>
                  )}
                  {plataforma === 'TikTok Ads' && (
                    <>
                      <option value="Cobertura (Reach)">Cobertura (Reach)</option>
                      <option value="Tráfico (Traffic)">Tráfico (Traffic)</option>
                      <option value="Visualizaciones de video (Video Views)">Visualizaciones de video (Video Views)</option>
                      <option value="Generación de Iniciativas (Lead Gen)">Generación de Iniciativas (Lead Gen)</option>
                      <option value="Conversiones">Conversiones</option>
                    </>
                  )}
                  {plataforma === 'LinkedIn Ads' && (
                    <>
                      <option value="Conocimiento de la marca">Conocimiento de la marca</option>
                      <option value="Visitas al sitio web">Visitas al sitio web</option>
                      <option value="Interacción">Interacción</option>
                      <option value="Visualizaciones de video">Visualizaciones de video</option>
                      <option value="Generación de contactos (Lead Gen)">Generación de contactos (Lead Gen)</option>
                      <option value="Conversiones en el sitio web">Conversiones en el sitio web</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Función Estratégica</label>
                <select value={funcionEstrategica} onChange={e => setFuncionEstrategica(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Prospección">Prospección</option>
                  <option value="Remarketing">Remarketing</option>
                  <option value="Reconocimiento/posicionamiento">Reconocimiento/posicionamiento</option>
                  <option value="Visitas al perfil">Visitas al perfil</option>
                  <option value="Captación de leads">Captación de leads</option>
                  <option value="Conversión">Conversión</option>
                  <option value="Reactivación">Reactivación</option>
                </select>
              </div>
            </div>
          )}

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
