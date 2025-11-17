import { cn } from '../../lib/utils';

interface CollapseToggleProps {
  label: string;
  onClick: () => void;
  className?: string;
}

/**
 * 统一的折叠/展开切换样式，避免各处风格不一致。
 */
export function CollapseToggle({ label, onClick, className }: CollapseToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary cursor-pointer select-none transition-colors',
        className
      )}
    >
      {label}
    </button>
  );
}
