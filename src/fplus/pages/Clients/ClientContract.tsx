import React, { useState } from 'react';
import { Building2, User, CalendarDays, DollarSign, Megaphone, FileText, StickyNote, CheckCircle2 } from 'lucide-react';
import { useFplusStore } from '../../store';
import { usePortalContext } from '../Portal/PortalContext';
import type { PlanContratado, PautaPublicitaria } from '../../types';

const PLAN_LABELS: Record<PlanContratado, string> = {
  basico:     'Básico',
  estandar:   'Estándar',
  premium:    'Premium',
  enterprise: 'Enterprise',
};

const PLAN_FEATURES: Record<PlanContratado, string[]> = {
  basico:     ['Hasta 8 piezas/mes', 'Instagram', '1 red social', 'Cronopost', 'Portal cliente'],
  estandar:   ['Hasta 16 piezas/mes', 'Instagram + Facebook', '2 redes sociales', 'Cronopost + Calendario', 'Portal cliente', 'Reportes básicos'],
  premium:    ['Hasta 30 piezas/mes', 'Todas las redes', 'Campañas', 'Cronopost + Calendario + Multimedia', 'Portal cliente premium', 'Reportes avanzados', 'Pauta publicitaria'],
  enterprise: ['Piezas ilimitadas', 'Todas las redes', 'Múltiples marcas', 'Acceso completo', 'AM dedicado', 'SLA garantizado'],
};

const PAUTA_LABELS: Record<PautaPublicitaria, string> = {
  no_incluye:            'No incluye pauta',
  incluida_agencia:      'Incluida por agencia',
  cliente_paga:          'Cliente paga directamente',
  presupuesto_compartido: 'Presupuesto compartido',
};

const PAUTA_COLORS: Record<PautaPublicitaria, string> = {
  no_incluye:            'bg-slate-100 text-slate-600',
  incluida_agencia:      'bg-blue-100 text-blue-700',
  cliente_paga:          'bg-violet-100 text-violet-700',
  presupuesto_compartido: 'bg-emerald-100 text-emerald-700',
};

function Field({ label, value, icon: Icon }: { label: string; value?: string; icon: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-800 mt-0.5">{value || <span className="text-slate-300 italic">Sin dato</span>}</p>
      </div>
    </div>
  );
}

export default function ClientContract() {
  const { clientId } = usePortalContext();
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));

  if (!client) return null;

  const plan = client.plan_contratado;
  const pauta = client.pauta_publicitaria;

  const contractStart = client.fecha_inicio_contrato
    ? new Date(client.fecha_inicio_contrato).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
    : undefined;

  const contractEnd = client.fecha_fin_contrato
    ? new Date(client.fecha_fin_contrato).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
    : undefined;

  const isExpiringSoon = client.fecha_fin_contrato
    ? new Date(client.fecha_fin_contrato).getTime() - Date.now() < 30 * 86400000
    : false;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-8 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Contrato & Configuración</h1>
        <p className="text-xs text-slate-400 mt-0.5">Información comercial y operativa del cliente</p>
      </div>

      {/* Plan contratado */}
      {plan && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className={`px-5 py-4 flex items-center justify-between ${
            plan === 'premium' ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
            plan === 'enterprise' ? 'bg-gradient-to-r from-slate-800 to-slate-900' :
            'bg-gradient-to-r from-slate-500 to-slate-600'
          }`}>
            <div>
              <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wide">Plan Contratado</p>
              <p className="text-xl font-bold text-white mt-0.5">{PLAN_LABELS[plan]}</p>
            </div>
            <div className="text-3xl">
              {plan === 'premium' ? '⭐' : plan === 'enterprise' ? '🏢' : plan === 'estandar' ? '✦' : '·'}
            </div>
          </div>
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Servicios incluidos</p>
            <div className="space-y-2">
              {PLAN_FEATURES[plan].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Datos generales */}
      <div className="bg-white border border-slate-100 rounded-2xl px-5 py-2">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide pt-3 pb-1">Datos del cliente</p>
        <Field label="Empresa" value={client.empresa} icon={Building2} />
        <Field label="Responsable cliente" value={client.responsable_cliente} icon={User} />
        <Field label="Account Manager" value={client.account_manager_name} icon={User} />
        <Field label="Industria" value={client.industria} icon={Building2} />
      </div>

      {/* Contrato */}
      <div className="bg-white border border-slate-100 rounded-2xl px-5 py-2">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide pt-3 pb-1">Contrato</p>
        <Field label="Inicio de contrato" value={contractStart} icon={CalendarDays} />
        <div className="flex items-start gap-3 py-3 border-b border-slate-50">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Fin de contrato</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-slate-800">{contractEnd ?? <span className="text-slate-300 italic">Sin dato</span>}</p>
              {isExpiringSoon && (
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  Vence pronto
                </span>
              )}
            </div>
          </div>
        </div>
        <Field
          label="Presupuesto mensual"
          value={client.presupuesto_mensual ? `$${client.presupuesto_mensual.toLocaleString('es')}` : undefined}
          icon={DollarSign}
        />
      </div>

      {/* Pauta publicitaria */}
      <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Pauta Publicitaria</p>
        <div className="grid grid-cols-2 gap-2">
          {(['no_incluye', 'incluida_agencia', 'cliente_paga', 'presupuesto_compartido'] as PautaPublicitaria[]).map(opt => (
            <div
              key={opt}
              className={`p-3 rounded-xl border-2 flex items-center gap-2 ${
                pauta === opt
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                pauta === opt ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
              }`}>
                {pauta === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className={`text-xs font-medium ${pauta === opt ? 'text-blue-700' : 'text-slate-500'}`}>
                {PAUTA_LABELS[opt]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Observaciones */}
      {(client.observaciones || client.notas_internas) && (
        <div className="bg-white border border-slate-100 rounded-2xl px-5 py-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide pt-3 pb-1">Notas</p>
          {client.observaciones && (
            <div className="flex items-start gap-3 py-3 border-b border-slate-50">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Observaciones</p>
                <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">{client.observaciones}</p>
              </div>
            </div>
          )}
          {client.notas_internas && (
            <div className="flex items-start gap-3 py-3">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <StickyNote className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Notas internas</p>
                <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">{client.notas_internas}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
