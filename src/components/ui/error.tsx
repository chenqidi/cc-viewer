import { AlertCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ErrorAlertProps {
  type?: 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

/**
 * 错误/警告/信息提示组件
 */
export function ErrorAlert({
  type = 'error',
  title,
  message,
  onClose,
  className
}: ErrorAlertProps) {
  const config = {
    error: {
      icon: XCircle,
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-500/50',
      iconColor: 'text-red-400',
      titleColor: 'text-red-300',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-500/50',
      iconColor: 'text-yellow-400',
      titleColor: 'text-yellow-300',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-500/50',
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-300',
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor, titleColor } = config[type];

  return (
    <div
      className={cn(
        'brutal-border rounded-lg p-4',
        bgColor,
        borderColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColor)} />
        <div className="flex-1 min-w-0">
          <h3 className={cn('font-semibold text-sm mb-1', titleColor)}>
            {title}
          </h3>
          {message && (
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {message}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError?: () => void;
}

/**
 * 错误边界回退组件
 */
export function ErrorBoundaryFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background-primary">
      <div className="max-w-lg w-full">
        <ErrorAlert
          type="error"
          title="应用发生错误"
          message={`${error.message}\n\n请尝试刷新页面或联系开发者。`}
        />
        {resetError && (
          <button
            onClick={resetError}
            className="mt-4 w-full brutal-border bg-accent-cyan text-background-primary font-semibold py-2 px-4 rounded hover:bg-accent-cyan/90 transition-colors"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}

interface InlineErrorProps {
  message: string;
  retry?: () => void;
}

/**
 * 内联错误提示（用于组件内部）
 */
export function InlineError({ message, retry }: InlineErrorProps) {
  return (
    <div className="flex items-center justify-center p-8 text-center">
      <div className="max-w-sm">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-text-primary font-semibold mb-2">发生错误</p>
        <p className="text-sm text-text-secondary mb-4">{message}</p>
        {retry && (
          <button
            onClick={retry}
            className="brutal-border bg-accent-cyan text-background-primary font-semibold py-2 px-4 rounded hover:bg-accent-cyan/90 transition-colors text-sm"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}
