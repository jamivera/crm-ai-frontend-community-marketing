import React from 'react';
import type { HealthStatus } from '../../types';
import { HEALTH_STATUS_COLORS } from '../../constants';

interface HealthLightProps {
  status: HealthStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const LABELS: Record<HealthStatus, string> = {
  verde: 'Normal',
  amarillo: 'Atención',
  rojo: 'Bloqueado',
};

export function HealthLight({ status, showLabel = false, size = 'md' }: HealthLightProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const colors = HEALTH_STATUS_COLORS[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${dotSize} rounded-full ${colors.bg} flex-shrink-0`} />
      {showLabel && (
        <span className={`text-xs font-medium ${colors.text}`}>{LABELS[status]}</span>
      )}
    </span>
  );
}
