import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 旋转加载指示器
 */
export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2
      className={cn('animate-spin text-accent-cyan', sizeClasses[size], className)}
    />
  );
}

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
}

/**
 * 骨架屏加载效果
 */
export function LoadingSkeleton({ className, rows = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
        >
          <div className="h-4 bg-surface-skeleton rounded w-full mb-2"></div>
          <div className="h-4 bg-surface-skeleton rounded w-5/6"></div>
        </div>
      ))}
    </div>
  );
}

interface LoadingCardProps {
  title?: string;
  description?: string;
}

/**
 * 加载卡片（用于文件列表等）
 */
export function LoadingCard({ title = '加载中...', description }: LoadingCardProps) {
  return (
    <div className="brutal-border bg-background-card p-4 rounded-lg">
      <div className="flex items-center gap-3">
        <LoadingSpinner size="sm" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          {description && (
            <p className="text-xs text-text-secondary mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
}

/**
 * 全屏加载遮罩
 */
export function LoadingOverlay({ message = '加载中...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background-card brutal-border rounded-lg p-8 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-text-primary font-semibold">{message}</p>
      </div>
    </div>
  );
}
