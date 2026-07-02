import type { Platform } from '../../types';
import { PLATFORM_LABELS, PLATFORM_COLORS } from '../../constants';

interface PlatformIconProps {
  platform: Platform;
  showLabel?: boolean;
  size?: 'sm' | 'md' | number;
}

export function PlatformIcon({ platform, showLabel = false, size = 'md' }: PlatformIconProps) {
  const isNumeric = typeof size === 'number';
  const textSize = isNumeric ? '' : size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${textSize} ${PLATFORM_COLORS[platform]}`}
      style={isNumeric ? { fontSize: size } : undefined}
    >
      <PlatformDot platform={platform} size={isNumeric ? size : undefined} />
      {showLabel && PLATFORM_LABELS[platform]}
    </span>
  );
}

function PlatformDot({ platform, size }: { platform: Platform; size?: number }) {
  const icons: Record<Platform, string> = {
    instagram: '📸',
    facebook: '📘',
    tiktok: '🎵',
    youtube: '▶️',
    linkedin: '💼',
    twitter: '🐦',
    google: '🔍',
  };
  return (
    <span className="text-base leading-none" style={size ? { fontSize: size } : undefined}>
      {icons[platform]}
    </span>
  );
}
