import type { JSX } from 'react';

export type TabsSize = 'sm' | 'md';
export type TabsTone = 'green' | 'cyan';

export interface TabOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
}

export interface TabsProps<T extends string = string> {
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly options: ReadonlyArray<TabOption<T>>;
  readonly size?: TabsSize;
  readonly tone?: TabsTone;
  readonly ariaLabel?: string;
  readonly className?: string;
}

const SIZE_CLASS: Record<TabsSize, string> = {
  sm: 'px-2 py-0.5 text-[11px] rounded-md',
  md: 'px-2.5 py-1 text-xs rounded-md',
};

const ACTIVE_TONE_CLASS: Record<TabsTone, string> = {
  green: 'bg-bg-base text-ink-base font-medium shadow-sm',
  cyan: 'bg-bg-base text-primary font-medium shadow-sm',
};

export function Tabs<T extends string = string>({
  value,
  onChange,
  options,
  size = 'md',
  tone = 'green',
  ariaLabel,
  className = '',
}: TabsProps<T>): JSX.Element {
  const wrapperClasses = [
    'inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-8',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div role="tablist" aria-label={ariaLabel} className={wrapperClasses}>
      {options.map((opt) => {
        const active = opt.value === value;
        const tabClasses = [
          'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          SIZE_CLASS[size],
          active ? ACTIVE_TONE_CLASS[tone] : 'text-ink-subtle hover:text-ink-base',
        ].join(' ');
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={tabClasses}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
