import React from 'react';
import type { ContentState, LeadState } from '../../types';
import { CONTENT_STATE_LABELS, CONTENT_STATE_COLORS, LEAD_STATE_LABELS, LEAD_STATE_COLORS } from '../../constants';

interface ContentStateChipProps {
  state: ContentState;
  size?: 'sm' | 'md';
}

export function ContentStateChip({ state, size = 'md' }: ContentStateChipProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${CONTENT_STATE_COLORS[state]}`}>
      {CONTENT_STATE_LABELS[state]}
    </span>
  );
}

interface LeadStateChipProps {
  state: LeadState;
  size?: 'sm' | 'md';
}

export function LeadStateChip({ state, size = 'md' }: LeadStateChipProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${LEAD_STATE_COLORS[state]}`}>
      {LEAD_STATE_LABELS[state]}
    </span>
  );
}
