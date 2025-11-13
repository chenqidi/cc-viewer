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

// ============= 主题配色 =============

export const colors = {
  // 背景色
  background: {
    primary: '#2B2B2B',
    sidebar: '#232323',
    card: '#353535',
  },

  // 卡片背景(按类型)
  cardBackground: {
    user: '#3A3A3A',
    assistant: '#353535',
    tool: '#2F4F4F',
    thinking: '#3D3356',
    system: '#4F2F2F',
  },

  // 强调色
  accent: {
    cyan: '#66CCCC',
    pink: '#F2777A',
    yellow: '#FFCC66',
    blue: '#6699CC',
    green: '#99CC99',
    orange: '#F99157',
    purple: '#CC99CC',
  },

  // 文本色
  text: {
    primary: '#D3D0C8',
    secondary: '#999999',
    muted: '#747369',
    link: '#6699CC',
  },

  // 边框和阴影
  border: '#000000',
  shadow: 'rgba(0, 0, 0, 0.6)',

  // 代码高亮(Spacegray Eighties)
  syntax: {
    comment: '#747369',
    keyword: '#CC99CC',
    string: '#99CC99',
    function: '#66CCCC',
    number: '#F99157',
    operator: '#F2777A',
    variable: '#D3D0C8',
  },
};

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
