// ============= 公共字段 =============

export interface BaseMessage {
  type: MessageType;
  uuid: string;
  timestamp: string; // ISO 8601 格式
  sessionId: string;
  version: string; // Claude Code 版本,如 "2.0.35"
  cwd: string; // 工作目录
  gitBranch?: string;
  userType?: 'external' | 'internal';
  isSidechain?: boolean; // 是否为侧链分支
  parentUuid?: string; // 父消息 UUID(构建对话树)
}

export type MessageType =
  | 'user'
  | 'assistant'
  | 'system'
  | 'file-history-snapshot'
  | 'summary'
  | 'queue-operation';

// ============= User 消息 =============

export interface UserMessage extends BaseMessage {
  type: 'user';
  message: {
    role: 'user';
    content: string | (ToolResultContent | TextContent)[];
  };
  thinkingMetadata?: {
    level?: 'high' | 'medium' | 'low';
    disabled?: boolean;
    triggers?: string[];
  };
  toolUseResult?: unknown;
}

export interface ToolResultContent {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

// ============= Assistant 消息 =============

export interface AssistantMessage extends BaseMessage {
  type: 'assistant';
  requestId: string; // API 请求 ID
  message: {
    role: 'assistant';
    model: string; // 如 "claude-sonnet-4-5-20250929"
    id: string;
    type: 'message';
    content: AssistantContent[];
    stop_reason: 'end_turn' | null;
    stop_sequence?: string | null;
    usage: TokenUsage;
  };
}

export type AssistantContent =
  | TextContent
  | ThinkingContent
  | ToolUseContent;

export interface TextContent {
  type: 'text';
  text: string; // Markdown 格式
}

export interface ThinkingContent {
  type: 'thinking';
  thinking: string;
  signature?: string; // 签名验证
}

export interface ToolUseContent {
  type: 'tool_use';
  id: string;
  name: string; // 工具名称:Read, Edit, Write, Bash, Grep 等
  input: Record<string, unknown>; // 工具参数
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

// ============= System 消息 =============

export interface SystemMessage extends BaseMessage {
  type: 'system';
  level: 'error' | 'warning' | 'info';
  subtype?: 'api_error' | 'retry';
  content?: string;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  retryAttempt?: number;
  retryInMs?: number;
  maxRetries?: number;
}

// ============= File History Snapshot =============

export interface FileHistorySnapshot extends BaseMessage {
  type: 'file-history-snapshot';
  snapshot: {
    messageId: string;
    trackedFileBackups: Record<string, FileBackup>;
    timestamp: string;
  };
  isSnapshotUpdate?: boolean;
}

export interface FileBackup {
  backupFileName: string;
  version: number;
  backupTime: string;
}

// ============= Summary =============

export interface SummaryMessage {
  type: 'summary';
  summary: string; // 对话摘要文本
  leafUuid: string; // 指向对话链的叶子节点
}

// ============= 联合类型 =============

export type JsonlRecord =
  | UserMessage
  | AssistantMessage
  | SystemMessage
  | FileHistorySnapshot
  | SummaryMessage;
