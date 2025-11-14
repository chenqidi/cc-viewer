import { ReactNode, useEffect } from 'react';
import { Button } from './button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;
  height?: string;
}

export function Dialog({ open, onClose, title, children, width = '600px', height = 'auto' }: DialogProps) {
  // ESC 键关闭弹窗
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background-sidebar border-4 border-text-primary rounded-lg shadow-xl overflow-hidden"
        style={{ width, maxHeight: height === 'auto' ? '80vh' : height }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b-4 border-text-primary bg-background-header">
            <h3 className="text-lg font-bold text-text-primary">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary"
            >
              ✕
            </Button>
          </div>
        )}

        {/* 内容区域 */}
        <div className="overflow-y-auto" style={{ maxHeight: height === 'auto' ? '70vh' : `calc(${height} - 80px)` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
