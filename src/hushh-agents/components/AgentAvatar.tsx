/**
 * AgentAvatar — Stylish letter avatar with unique gradient per agent name.
 * Center-aligned, not zoomed. Sizes: sm (32px), md (40px), lg (56px), xl (72px).
 */

import React from 'react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AgentAvatarProps {
  name: string;
  size?: AvatarSize;
  featured?: boolean;
  className?: string;
}

/** Gradient pairs — warm, cool, earth, vibrant */
const GRADIENTS = [
  ['#1a1a2e', '#16213e'],   // deep navy
  ['#0f3460', '#533483'],   // indigo-purple
  ['#2c3e50', '#3498db'],   // slate-blue
  ['#1e3a5f', '#4a90d9'],   // ocean
  ['#2d3436', '#636e72'],   // charcoal
  ['#1b4332', '#2d6a4f'],   // forest
  ['#3c1642', '#7b2d8e'],   // plum
  ['#1a1a2e', '#e94560'],   // navy-coral
  ['#0b3d91', '#1e88e5'],   // royal blue
  ['#283618', '#606c38'],   // olive
  ['#3d405b', '#81b29a'],   // sage
  ['#264653', '#2a9d8f'],   // teal
  ['#6b2737', '#d4a5a5'],   // burgundy
  ['#1b263b', '#415a77'],   // steel
  ['#14213d', '#fca311'],   // navy-gold
  ['#1d3557', '#457b9d'],   // french blue
];

/** Featured gradients (for top-rated agents) */
const FEATURED_GRADIENTS = [
  ['#f59e0b', '#d97706'],   // amber
  ['#f97316', '#ea580c'],   // orange
  ['#ef4444', '#dc2626'],   // red
  ['#8b5cf6', '#7c3aed'],   // violet
];

/** Hash a string to get a stable index */
const hashName = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

/** Get initials (1-2 chars) */
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

/** Size configs */
const SIZE_MAP: Record<AvatarSize, { box: string; text: string; radius: string }> = {
  sm: { box: 'w-8 h-8', text: 'text-[11px]', radius: 'rounded-lg' },
  md: { box: 'w-10 h-10', text: 'text-[13px]', radius: 'rounded-xl' },
  lg: { box: 'w-14 h-14', text: 'text-[18px]', radius: 'rounded-2xl' },
  xl: { box: 'w-[72px] h-[72px]', text: 'text-[22px]', radius: 'rounded-2xl' },
};

const AgentAvatar: React.FC<AgentAvatarProps> = ({
  name,
  size = 'md',
  featured = false,
  className = '',
}) => {
  const hash = hashName(name);
  const gradients = featured ? FEATURED_GRADIENTS : GRADIENTS;
  const [from, to] = gradients[hash % gradients.length];
  const initials = getInitials(name);
  const sizeConfig = SIZE_MAP[size];

  return (
    <div
      className={`${sizeConfig.box} ${sizeConfig.radius} flex items-center justify-center font-bold text-white shrink-0 select-none ${className}`}
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
      aria-hidden="true"
    >
      <span className={`${sizeConfig.text} leading-none`}>
        {initials}
      </span>
    </div>
  );
};

export default AgentAvatar;
