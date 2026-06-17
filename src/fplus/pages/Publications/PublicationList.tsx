import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle2, AlertTriangle, ExternalLink, X, Plus } from 'lucide-react';
import { useFplusStore } from '../../store';
import { PLATFORM_LABELS } from '../../constants';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import PublicationForm from './PublicationForm';
import type { Publication } from '../../types';

const PUB_STATE = {
  planificada: { label: 'Planificada', cls: 'bg-blue-100 text-blue-700' },
  publicada: { label: 'Publicada', cls: 'bg-emerald-100 text-emerald-700' },
  sin_confirmar: { label: 'Sin confirmar', cls: 'bg-amber-100 text-amber-700' },
  cancelada: { label: 'Cancelada', cls: 'bg-slate-100 text-slate-500' },
};

export default function PublicationList() {
  const navigate = useNavigate();
  const publications = useFplusStore(s => s.publications);
  const contentPieces = useFplusStore(s => s.contentPieces);
  const confirmPublication = useFplusStore(s => s.confirmPublication);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<Publication['estado'] | 'todos'>('todos');
  const [confirmingPub, setConfirmingPub] = useState<Publication | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = publications.filter(p => {
    const matchSearch =
      p.content_piece_nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.client_nombre.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === 'todos' || p.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const counts = {
    todos: publications.length,
    planificada: publications.filter(p => p.estado === 'planificada').length,
    publicada: publications.filter(p => p.estado === 'publicada').length,
    sin_confirmar: publications.filter(p => p.estado === 'sin_confirmar').length,
    cancelada: publications.filter(p => p.estado === 'cancelada').length,
  };

  const sinConfirmar = publications.filter(p => p.estado === 'sin_confirmar');

  function handleConfirm(pub: Publication, url: string) {
    confirmPublication(pub.id, url);
    setConfirmingPub(null);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Publicaciones</h1>
          <p className="text-sm text-slate-500 mt-0.5">{publications.length} publicaciones en total</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva publicación
        </button>
      </div>

      {/* Sin confirmar alert */}
      {sinConfirmar.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800">
            <strong>{sinConfirmar.length}</strong> publicación{sinConfirmar.length > 1 ? 'es' : ''} sin confirmar.
          </span>
          <button
            onClick={() => setFilterEstado('sin_confirmar')}
            className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 underline"
          >
            Ver ahora
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar publicación o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* State tabs */}
      <div className="flex gap-1 flex-wrap">
        {(['todos', 'planificada', 'publicada', 'sin_confirmar', 'cancelada'] as const).map(est => (
          <button
            key={est}
            onClick={() => setFilterEstado(est)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filterEstado === est
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {est === 'todos' ? 'Todas' : PUB_STATE[est].label}{' '}
            <span className="opacity-70">({counts[est] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Pieza</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Plataforma</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Fecha programada</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Estado</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Leads</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(pub => {
              const piece = contentPieces.find(cp => cp.id === pub.content_piece_id);
              const isOverdue = pub.estado === 'sin_confirmar' && new Date(pub.fecha_programada) < new Date();
              return (
                <tr key={pub.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/fplus/publications/${pub.id}`)}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800 hover:text-blue-600 transition-colors">
                      {pub.content_piece_nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{pub.client_nombre}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <PlatformIcon platform={pub.plataforma} size={14} />
                      <span className="text-xs">{PLATFORM_LABELS[pub.plataforma]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                      {new Date(pub.fecha_programada).toLocaleDateString('es', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full text-xs font-medium px-2.5 py-1 ${PUB_STATE[pub.estado].cls}`}>
                      {PUB_STATE[pub.estado].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {pub.leads_atribuidos > 0 ? pub.leads_atribuidos : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {pub.estado === 'sin_confirmar' && (
                      <button
                        onClick={() => setConfirmingPub(pub)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Confirmar
                      </button>
                    )}
                    {pub.estado === 'publicada' && pub.url_publicacion && (
                      <a
                        href={pub.url_publicacion}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver post
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">
            No se encontraron publicaciones.
          </div>
        )}
      </div>

      {/* New Publication Form */}
      {showForm && <PublicationForm onClose={() => setShowForm(false)} />}

      {/* Confirmation Modal */}
      {confirmingPub && (
        <ConfirmPublicationModal
          publication={confirmingPub}
          onClose={() => setConfirmingPub(null)}
          onConfirm={(url) => handleConfirm(confirmingPub, url)}
        />
      )}
    </div>
  );
}

function ConfirmPublicationModal({
  publication,
  onClose,
  onConfirm,
}: {
  publication: Publication;
  onClose: () => void;
  onConfirm: (url: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    // URL is optional — confirm anyway
    onConfirm(url.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-800">Confirmar publicación</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-sm">
            <p className="font-medium text-slate-800">{publication.content_piece_nombre}</p>
            <p className="text-slate-500 mt-0.5">{publication.client_nombre} · {PLATFORM_LABELS[publication.plataforma]}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              URL del post <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.instagram.com/p/..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Pega el enlace directo a la publicación en la plataforma.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitted}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-60"
            >
              {submitted ? 'Confirmando...' : 'Confirmar publicación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
