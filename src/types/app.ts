import type { JsonlRecord, TokenUsage, MessageType } from './jsonl';

// 重新导出需要的类型
export type { TokenUsage };

// ============= 应用层数据结构 =============

export interface SessionFile {
  id: string; // 文件名(UUID)
  filePath: string; // 完整路径
  fileName: string; // 显示名称
  summary?: string; // 从 SummaryMessage 提取
  messageCount: number;
  fileSize: number; // 字节
  firstTimestamp: string;
  lastTimestamp: string;
  records: JsonlRecord[];
}

export interface ParsedMessage {
  id: string; // uuid
  type: MessageType;
  role: 'user' | 'assistant' | 'system';
  // 在当前会话中的顺序索引（从 0 开始）
  sessionIndex: number;
  // 关联的 tool_result 行（如果有匹配到）
  pairedToolResultIndex?: number;
  // 顶部显示的页码标签，例如 "15><22" -> 渲染成 "<15><22>"
  indexLabel?: string;
  timestamp: Date;
  parentId?: string;
  isSidechain: boolean;

  // 消息内容
  textContent?: string; // Markdown
  // 当 message.content 为数组时，保留原始的分段内容，便于逐段渲染
  markdownSegments?: string[];
  thinkingContent?: string;
  toolCalls?: ToolCall[];

  // 元数据
  tokenUsage?: TokenUsage;
  gitBranch?: string;
  cwd?: string;

  // 原始数据
  raw: JsonlRecord;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
  status: 'success' | 'error';
}

// ============= 统计数据 =============

export interface SessionStats {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  systemMessages: number;
  totalTokens: {
    input: number;
    output: number;
    cached: number;
  };
  toolUsage: Record<string, number>; // 工具名 -> 调用次数
  duration: number; // 会话时长(毫秒)
}

// ============= Tauri 接口 =============

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  modified: number;
}

export interface ProjectInfo {
  project_name: string;    // 从 cwd 提取的显示名称（如 "cc-viewer"）
  project_folder: string;  // 文件夹名称（如 "C--Users-qidi-chen-Desktop-Tools-cc-viewer"）
  cwd: string;            // 完整的 cwd 路径
  files: FileInfo[];      // 该项目下的所有文件
  last_modified: number;  // 最后修改时间
  is_root_level: boolean; // 是否直接对应当前根目录
}

// ============= 项目分组 =============

export interface ProjectGroup {
  projectName: string; // 项目名称
  files: SessionFile[]; // 该项目下的所有文件
  totalSize: number; // 总大小
  fileCount: number; // 文件数量
  lastModified: number; // 最后修改时间
}
