import type { JSX, ReactNode } from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardTone = 'default' | 'elevated' | 'static' | 'danger' | 'warning';

export interface CardProps {
  readonly children: ReactNode;
  readonly padding?: CardPadding;
  readonly tone?: CardTone;
  readonly className?: string;
}

const PADDING_CLASS: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

const TONE_CLASS: Record<CardTone, string> = {
  default: 'surface-card',
  elevated: 'surface-card',
  static: 'surface-card',
  danger: 'surface-card !border-accent-red/60',
  warning: 'surface-card !border-accent-amber/50',
};

export function Card({
  children,
  padding = 'md',
  tone = 'default',
  className = '',
}: CardProps): JSX.Element {
  const classes = [TONE_CLASS[tone], PADDING_CLASS[padding], className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
}
