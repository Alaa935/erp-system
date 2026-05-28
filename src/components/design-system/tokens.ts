import { cn } from '../../lib/utils';
export { m } from 'motion/react';
export { cn };

export type SpacingToken = keyof typeof spacing;
export type TypographyToken = keyof typeof typography;
export type RadiusToken = keyof typeof radius;
export type ShadowToken = keyof typeof shadow;
export type StatusType = keyof typeof statusClasses;
export type StatusStyle = (typeof statusClasses)[StatusType];
export type AnimationToken = keyof typeof animation;
export type SpringAnimation = (typeof animation)['spring'];

export const spacing = {
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '20px',
  '4xl': '24px',
  '5xl': '32px',
} as const;

export const typography = {
  display: 'text-xl font-black tracking-tight',
  h1: 'text-lg font-bold tracking-tight',
  h2: 'text-base font-bold',
  h3: 'text-sm font-bold',
  body: 'text-sm leading-relaxed',
  caption: 'text-xs',
  small: 'text-[11px]',
  label: 'text-xs font-bold text-gray-500',
  labelRequired: 'text-xs font-bold text-gray-500 after:content-["*"] after:text-red-400 after:ms-0.5',
} as const;

export const radius = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
} as const;

export const shadow = {
  card: 'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.02)]',
  elevated: 'shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]',
  hover: 'shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]',
  modal: 'shadow-[0_20px_60px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06)]',
} as const;

export const statusClasses = {
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  danger: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  neutral: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400', badge: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200' },
} as const;

export const animation = {
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',
  spring: { type: 'spring' as const, duration: 0.3, bounce: 0.1 },
  springFast: { type: 'spring' as const, duration: 0.2, bounce: 0 },
} as const;

export const tokens = { spacing, typography, radius, shadow, statusClasses, animation } as const;