import { FileX, Search, Inbox, FolderOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  type?: 'no-files' | 'no-results' | 'no-messages' | 'no-selection';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * 空状态组件
 */
export function EmptyState({
  type = 'no-files',
  title,
  description,
  icon,
  action,
  className
}: EmptyStateProps) {
  // 预设配置
  const presets = {
    'no-files': {
      icon: <FolderOpen className="w-16 h-16 text-text-secondary" />,
      title: '没有文件',
      description: '未找到任何 JSONL 文件。请检查目录路径是否正确。',
    },
    'no-results': {
      icon: <Search className="w-16 h-16 text-text-secondary" />,
      title: '未找到匹配结果',
      description: '尝试使用其他关键词搜索',
    },
    'no-messages': {
      icon: <Inbox className="w-16 h-16 text-text-secondary" />,
      title: '没有消息',
      description: '该文件中没有对话消息',
    },
    'no-selection': {
      icon: <FileX className="w-16 h-16 text-text-secondary" />,
      title: '未选择文件',
      description: '从左侧列表选择一个文件以查看对话历史',
    },
  };

  const preset = presets[type];
  const displayIcon = icon || preset.icon;
  const displayTitle = title || preset.title;
  const displayDescription = description || preset.description;

  return (
    <div className={cn('flex items-center justify-center p-12 text-center', className)}>
      <div className="max-w-md">
        <div className="mb-4 flex justify-center">
          {displayIcon}
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {displayTitle}
        </h3>
        <p className="text-sm text-text-secondary mb-6">
          {displayDescription}
        </p>
        {action && (
          <button
            onClick={action.onClick}
            className="brutal-border bg-accent-cyan text-background-primary font-semibold py-2 px-6 rounded hover:bg-accent-cyan/90 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 简单空状态（emoji 版）
 */
export function SimpleEmptyState({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="text-center text-text-secondary py-20">
      <p className="text-4xl mb-3">{emoji}</p>
      <p className="text-lg">{title}</p>
      {description && (
        <p className="text-sm mt-2">{description}</p>
      )}
    </div>
  );
}
