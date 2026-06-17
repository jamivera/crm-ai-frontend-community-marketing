import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger' | 'warning';
}

export function StatCard({ label, value, delta, deltaLabel, icon, variant = 'default' }: StatCardProps) {
  const variantClasses = {
    default: 'bg-white border-slate-200',
    danger: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
  };

  const deltaIsPositive = delta !== undefined && delta > 0;
  const deltaIsNegative = delta !== undefined && delta < 0;

  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-2 ${variantClasses[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {delta !== undefined && (
        <div className="flex items-center gap-1">
          {deltaIsPositive && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
          {deltaIsNegative && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
          {delta === 0 && <Minus className="w-3.5 h-3.5 text-slate-400" />}
          <span className={`text-xs font-medium ${deltaIsPositive ? 'text-emerald-600' : deltaIsNegative ? 'text-red-600' : 'text-slate-400'}`}>
            {deltaIsPositive ? '+' : ''}{delta}% {deltaLabel ?? 'vs. mes anterior'}
          </span>
        </div>
      )}
    </div>
  );
}
