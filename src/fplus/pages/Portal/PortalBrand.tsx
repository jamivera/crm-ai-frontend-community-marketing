import { Building2, Target, Users, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { usePortalContext } from './PortalContext';
import { useFplusStore } from '../../store';
import { PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '../../constants';
import type { ContentType } from '../../types';

// Mi Marca — sección de consulta para el cliente: la información estratégica
// de su proyecto (brief, plan, servicios), sin datos internos de la agencia.

export default function PortalBrand() {
  const { clientId } = usePortalContext();
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));
  const brief = useFplusStore(s => s.briefs[clientId]);

  if (!client) return null;

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-slate-100 rounded-2xl p-4">
      <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">
        <Icon className="w-3.5 h-3.5" /> {title}
      </p>
      {children}
    </div>
  );

  const Row = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div className="py-1.5">
        <p className="text-[10px] font-semibold text-slate-400 uppercase">{label}</p>
        <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
      </div>
    ) : null;

  return (
    <div className="px-4 pt-5 pb-8 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Mi Marca</h1>
        <p className="text-xs text-slate-400 mt-0.5">La información estratégica de tu proyecto, siempre a mano</p>
      </div>

      {/* Empresa */}
      <Section icon={Building2} title="Información general">
        <Row label="Empresa" value={client.empresa ?? client.nombre} />
        <Row label="Sector" value={client.tipo_mercado ?? client.industria} />
        <Row label="Contacto" value={client.responsable_cliente} />
      </Section>

      {/* Servicios contratados */}
      <Section icon={CheckCircle2} title="Servicios contratados">
        <p className="text-sm text-slate-700 capitalize font-semibold mb-2">
          {client.plan_contratado === 'platinum' ? '💎 Plan Platinum' :
           client.plan_contratado === 'oro' ? '🥇 Plan Oro' :
           client.plan_contratado === 'plata' ? '🥈 Plan Plata' :
           client.plan_contratado ?? 'Plan personalizado'}
          {client.piezas_mensuales ? ` — ${client.piezas_mensuales} piezas mensuales` : ''}
        </p>
        {client.distribucion_piezas && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(Object.entries(client.distribucion_piezas) as [ContentType, number][]).map(([tipo, qty]) => (
              <span key={tipo} className="text-xs bg-slate-50 border border-slate-100 px-2 py-1 rounded-full text-slate-600">
                {qty} {CONTENT_TYPE_LABELS[tipo]}
              </span>
            ))}
          </div>
        )}
        {client.redes_contratadas && (
          <p className="text-xs text-slate-500">
            Redes: {client.redes_contratadas.map(r => PLATFORM_LABELS[r]).join(' · ')}
          </p>
        )}
      </Section>

      {/* Estrategia (del Brief) */}
      {brief ? (
        <>
          <Section icon={Sparkles} title="Propuesta de valor">
            <Row label="Propuesta de valor" value={brief.propuesta_valor} />
            <Row label="Diferenciadores" value={brief.diferenciadores} />
          </Section>
          <Section icon={Target} title="Objetivos comerciales">
            <Row label="Objetivos" value={brief.objetivos_comerciales} />
            <Row label="Servicios" value={brief.servicios} />
            <Row label="Productos" value={brief.productos} />
          </Section>
          <Section icon={Users} title="Público objetivo">
            <Row label="Perfil del cliente ideal" value={brief.perfil_cliente} />
            <Row label="Ubicación" value={brief.ubicacion} />
            <Row label="Motivaciones" value={brief.motivaciones} />
          </Section>
        </>
      ) : (
        <Section icon={FileText} title="Brief del proyecto">
          <p className="text-xs text-slate-400">
            Tu equipo de Primero Digital está completando el brief estratégico de tu marca.
            Pronto verás aquí toda la información de tu proyecto.
          </p>
        </Section>
      )}
    </div>
  );
}
