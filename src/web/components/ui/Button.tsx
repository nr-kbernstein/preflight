import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'className' | 'disabled' | 'type'
>;

export interface ButtonProps extends NativeButtonProps {
  readonly children: ReactNode;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly className?: string;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-primary border border-transparent text-on-primary hover:bg-primary-hover',
  secondary:
    'bg-bg-base border border-border-subtle text-ink-base shadow-[0_1px_0_0_rgba(0,0,0,0.05)] hover:bg-surface-5',
  ghost:
    'bg-transparent border border-transparent text-ink-subtle hover:text-ink-base hover:bg-surface-8',
  danger:
    'bg-bg-base border border-border-subtle text-accent-red hover:bg-accent-red/10 hover:border-accent-red/40',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
};

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  ...rest
}: ButtonProps): JSX.Element {
  const isDisabled = disabled || loading;
  const classes = [
    'inline-flex items-center justify-center gap-x-1.5 rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    isDisabled ? 'opacity-50 cursor-not-allowed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      {children}
    </button>
  );
}
