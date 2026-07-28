import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useFplusStore } from '../../store';
import {
  BookOpen,
  Target,
  Mail,
  FileText,
  CheckCircle2,
  MessageSquare,
  Settings,
  History,
  Calendar,
  User,
  Search,
} from 'lucide-react';

type FilterCategory = 'todos' | 'contenido' | 'brief' | 'campana' | 'invitacion' | 'aprobacion' | 'comentario';

export default function ClientHistory() {
  const { clientId = '' } = useParams<{ clientId: string }>();
  const location = useLocation();
  const projectHistory = useFplusStore(s => s.projectHistory || []);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  const isClientView = !location.pathname.startsWith('/fplus/clients/');

  // Filtrar eventos por cliente actual y permisos de cliente (observación 2 / precisión 4)
  const clientEvents = projectHistory
    .filter(ev => ev.client_id === clientId && (!isClientView || !ev.es_interno))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Filtrar por categoría y búsqueda de texto
  const filteredEvents = clientEvents.filter(ev => {
    const matchesCategory = activeFilter === 'todos' || ev.categoria === activeFilter;
    const matchesSearch =
      ev.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.categoria.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'brief':
        return { icon: BookOpen, bg: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'campana':
        return { icon: Target, bg: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
      case 'invitacion':
        return { icon: Mail, bg: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'contenido':
        return { icon: FileText, bg: 'bg-violet-50 text-violet-600 border-violet-100' };
      case 'aprobacion':
        return { icon: CheckCircle2, bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'comentario':
        return { icon: MessageSquare, bg: 'bg-pink-50 text-pink-600 border-pink-100' };
      default:
        return { icon: Settings, bg: 'bg-slate-50 text-slate-600 border-slate-100' };
    }
  };

  const getActorAvatar = (actorName: string) => {
    const clean = actorName.replace(/\s*\(Agencia\)|\s*\(Cliente\)/, '');
    const initials = clean
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    const isAgencia = actorName.includes('Agencia');
    const bgCls = isAgencia
      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
      : 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white';
    return (
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${bgCls}`}>
        {initials || <User className="w-3.5 h-3.5" />}
      </div>
    );
  };

  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString);
    const time = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
    const date = d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
    return `${date} · ${time}`;
  };

  const categories: { key: FilterCategory; label: string }[] = [
    { key: 'todos', label: 'Ver Todo' },
    { key: 'contenido', label: 'Contenidos' },
    { key: 'brief', label: 'Brief Maestro' },
    { key: 'campana', label: 'Campañas' },
    { key: 'invitacion', label: 'Invitaciones' },
    { key: 'aprobacion', label: 'Aprobaciones' },
    { key: 'comentario', label: 'Comentarios' },
  ];

  return (
    <div className="px-5 pt-6 pb-12 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-violet-600" />
            Bitácora de Historial
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro cronológico detallado de toda la actividad de la marca
          </p>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar en el historial..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 w-full sm:w-60 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-400 bg-white"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveFilter(c.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border whitespace-nowrap transition-all ${
              activeFilter === c.key
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-100'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Timeline container */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl py-14 text-center text-slate-400">
          <History className="w-8 h-8 mx-auto mb-2 opacity-35 animate-pulse text-slate-500" />
          <p className="text-sm font-medium">No se encontraron eventos</p>
          <p className="text-xs mt-1">Prueba cambiando los filtros o el término de búsqueda.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
          {/* Vertical line through timeline */}
          <div className="absolute left-8 top-12 bottom-12 w-px bg-slate-100" />

          <div className="space-y-7 relative">
            {filteredEvents.map(ev => {
              const catInfo = getCategoryIcon(ev.categoria);
              const CatIcon = catInfo.icon;
              return (
                <div key={ev.id} className="flex gap-4 items-start group">
                  {/* Left Column: Icon Badge */}
                  <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 z-10 bg-white shadow-sm transition-transform group-hover:scale-105 ${catInfo.bg}`}>
                    <CatIcon className="w-3.5 h-3.5" />
                  </div>

                  {/* Right Column: Event Content Card */}
                  <div className="flex-1 min-w-0 bg-slate-50/50 hover:bg-slate-50/80 border border-slate-100/50 rounded-2xl p-3 sm:p-4 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-2">
                        {getActorAvatar(ev.actor)}
                        <span className="text-xs font-bold text-slate-700">{ev.actor}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formatTimestamp(ev.timestamp)}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {ev.descripcion}
                    </p>

                    {/* Metadata details if any */}
                    {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                      <div className="mt-2.5 bg-white border border-slate-100 rounded-xl p-2.5 text-[10px] text-slate-500 font-mono space-y-1 overflow-x-auto">
                        {Object.entries(ev.metadata).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4">
                            <span className="font-semibold text-slate-400 capitalize">{k}:</span>
                            <span className="text-slate-600 whitespace-pre">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
