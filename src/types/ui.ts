// ============= UI 组件类型 =============

export interface CardProps {
  variant: 'user' | 'assistant' | 'tool' | 'thinking' | 'system';
  collapsed?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface MessageCardProps {
  message: import('./app').ParsedMessage;
  isExpanded?: boolean;
  onToggle?: () => void;
  searchQuery?: string;
}

export interface ToolCallCardProps {
  toolCalls: import('./app').ToolCall[];
  isExpanded: boolean;
  onToggle: () => void;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface FileListProps {
  files: import('./app').SessionFile[];
  selectedFileId: string | null;
  onFileSelect: (fileId: string) => void;
}

export interface StatsPanelProps {
  stats: import('./app').SessionStats | null;
}

// ============= 工具名称映射 =============

export const TOOL_NAMES: Record<string, string> = {
  'Read': '📖 读取文件',
  'Write': '✍️ 写入文件',
  'Edit': '✏️ 编辑文件',
  'Bash': '💻 执行命令',
  'Grep': '🔍 搜索代码',
  'Glob': '📂 查找文件',
  'WebFetch': '🌐 获取网页',
  'WebSearch': '🔎 网络搜索',
  'Task': '🤖 启动子任务',
};

export const TOOL_ICONS: Record<string, string> = {
  'Read': '📖',
  'Write': '✍️',
  'Edit': '✏️',
  'Bash': '💻',
  'Grep': '🔍',
  'Glob': '📂',
  'WebFetch': '🌐',
  'WebSearch': '🔎',
  'Task': '🤖',
};
