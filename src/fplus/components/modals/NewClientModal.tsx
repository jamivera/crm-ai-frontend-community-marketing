import React, { useState } from 'react';
import { X, UserPlus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFplusStore } from '../../store';
import type { HealthStatus } from '../../types';

interface Props { onClose: () => void; }

export function NewClientModal({ onClose }: Props) {
  const createClient = useFplusStore(s => s.createClient);
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [industria, setIndustria] = useState('');
  const [accountManager, setAccountManager] = useState('Andrea Solís');
  const [semaforo, setSemaforo] = useState<HealthStatus>('verde');
  const [saving, setSaving] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !industria.trim()) return;
    setSaving(true);
    const id = `cl-${Date.now()}`;
    createClient({
      id,
      nombre: nombre.trim(),
      industria: industria.trim(),
      account_manager_id: 'u1',
      account_manager_name: accountManager,
      estado: 'activo',
      semaforo,
      piezas_activas: 0,
      piezas_atrasadas: 0,
      leads_mes: 0,
      revenue_mes: 0,
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
            <UserPlus className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-slate-900 text-lg">{nombre} creado</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">¿Qué quieres hacer ahora?</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { onClose(); navigate(`/fplus/clients/${createdId}`); }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Ver ficha del cliente <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { onClose(); navigate(`/fplus/clients/${createdId}/brief`); }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Completar Brief Maestro <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-full px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
              Quedarme en la lista
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
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Nuevo cliente</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del cliente <span className="text-red-500">*</span></label>
            <input
              autoFocus
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Clínica Smile"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Industria <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={industria}
              onChange={e => setIndustria(e.target.value)}
              placeholder="Ej. Salud, Educación, Retail..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Manager</label>
            <select
              value={accountManager}
              onChange={e => setAccountManager(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Andrea Solís</option>
              <option>Juan Pérez</option>
              <option>María Loor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado inicial</label>
            <div className="flex gap-3">
              {([['verde', '🟢 Verde'], ['amarillo', '🟡 Amarillo'], ['rojo', '🔴 Rojo']] as const).map(([v, l]) => (
                <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" name="semaforo" value={v} checked={semaforo === v} onChange={() => setSemaforo(v)} />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving || !nombre.trim() || !industria.trim()} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
              Crear cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
