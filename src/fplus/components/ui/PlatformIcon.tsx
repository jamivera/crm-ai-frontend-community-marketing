import React from 'react';
import type { Platform } from '../../types';
import { PLATFORM_LABELS, PLATFORM_COLORS } from '../../constants';

interface PlatformIconProps {
  platform: Platform;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function PlatformIcon({ platform, showLabel = false, size = 'md' }: PlatformIconProps) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <span className={`inline-flex items-center gap-1 font-medium ${textSize} ${PLATFORM_COLORS[platform]}`}>
      <PlatformDot platform={platform} />
      {showLabel && PLATFORM_LABELS[platform]}
    </span>
  );
}

function PlatformDot({ platform }: { platform: Platform }) {
  const icons: Record<Platform, string> = {
    instagram: '📸',
    facebook: '📘',
    tiktok: '🎵',
    youtube: '▶️',
    linkedin: '💼',
    twitter: '🐦',
    google: '🔍',
  };
  return <span className="text-base leading-none">{icons[platform]}</span>;
}
