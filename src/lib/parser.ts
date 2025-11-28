import type { JsonlRecord, AssistantMessage, UserMessage } from '../types/jsonl';
import type { ParsedMessage, ToolCall } from '../types/app';

/**
 * 解析 JSONL 内容为记录数组
 */
export function parseJsonl(content: string): JsonlRecord[] {
  const lines = content.split('\n').filter(line => line.trim());
  const records: JsonlRecord[] = [];

  for (const line of lines) {
    try {
      const record = JSON.parse(line) as JsonlRecord;
      records.push(record);
    } catch (err) {
      console.warn('Failed to parse line:', line, err);
    }
  }

  return records;
}

const extractAgentId = (source: unknown): string | null => {
  if (!source || typeof source !== 'object') return null;
  const queue: unknown[] = [source];
  const seen = new WeakSet<object>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') continue;
    if (seen.has(current as object)) continue;
    seen.add(current as object);

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    for (const [key, value] of Object.entries(current as Record<string, unknown>)) {
      if (key === 'agentId') {
        if (typeof value === 'string' && value.trim()) return value.trim();
        if (value !== null && value !== undefined) {
          const text = String(value).trim();
          if (text) return text;
        }
      }
      if (value && typeof value === 'object') {
        queue.push(value);
      }
    }
  }

  return null;
};

/**
 * 转换 JSONL 记录为 ParsedMessage
 * 注意：每一条 JSON 记录都会对应一条 ParsedMessage（不再返回 null）
 */
export function transformToMessage(record: JsonlRecord, index: number): ParsedMessage {
  const anyRecord = record as any;

  // 是否存在 message 这个 key，用于决定展示策略
  const hasMessageKey = Object.prototype.hasOwnProperty.call(anyRecord, 'message');

  // 尽量从多种字段里推断时间戳，缺失时退回到 0 方便排序
  const timestampStr: string | undefined =
    anyRecord.timestamp ||
    anyRecord.snapshot?.timestamp;

  // 生成唯一 ID：优先使用 uuid/messageId/leafUuid，但始终追加 index 确保唯一性
  const baseId =
    anyRecord.uuid ||
    anyRecord.messageId ||
    anyRecord.leafUuid ||
    `${anyRecord.type || 'unknown'}`;

  const baseMessage: Omit<ParsedMessage, 'role'> = {
    id: `${baseId}-${index}`,
    type: anyRecord.type,
    sessionIndex: index,
    timestamp: timestampStr ? new Date(timestampStr) : new Date(0),
    parentId: anyRecord.parentUuid,
    isSidechain: Boolean(anyRecord.isSidechain),
    version: anyRecord.version,
    gitBranch: anyRecord.gitBranch,
    cwd: anyRecord.cwd,
    raw: record,
  };

  const formatMetaValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || '-';
    }
    try {
      const text = String(value).trim();
      return text || '-';
    } catch {
      return '-';
    }
  };

  if (record.type === 'system') {
    const systemInfoLines = [
      `cwd: ${formatMetaValue(anyRecord.cwd)}`,
      `version: ${formatMetaValue(anyRecord.version)}`,
      `gitBranch: ${formatMetaValue(anyRecord.gitBranch)}`,
    ];
    const systemText = systemInfoLines.join('\n');

    return {
      ...baseMessage,
      role: 'system',
      textContent: systemText,
    } as ParsedMessage;
  }

  // summary 记录没有 message 字段，直接展示 summary 文本
  if (record.type === 'summary') {
    const summaryText = typeof anyRecord.summary === 'string'
      ? anyRecord.summary
      : JSON.stringify(anyRecord.summary ?? anyRecord, null, 2);

    return {
      ...baseMessage,
      role: 'system',
      textContent: summaryText,
      markdownSegments: [summaryText],
    } as ParsedMessage;
  }

  // 没有 message 字段
  if (!hasMessageKey) {
    // 特例：file-history-snapshot 目前仅保留占位符，不展示具体内容
    if (anyRecord.type === 'file-history-snapshot') {
      return {
        ...baseMessage,
        role: 'system',
        textContent: '...',
      };
    }

    // 其它没有 message 的记录：展示整条 JSON（格式化后的字符串）
    return {
      ...baseMessage,
      role: 'system',
      textContent: JSON.stringify(record, null, 2),
    };
  }

  switch (record.type) {
    case 'user': {
      const userMsg = record as UserMessage;
      const content = userMsg.message.content;

      // 字符串内容：直接作为一段 Markdown
      if (typeof content === 'string') {
        return {
          ...baseMessage,
          role: 'user',
          textContent: content,
          markdownSegments: [content],
        } as ParsedMessage;
      }

      // 数组内容：每个元素单独作为一段（保证“数组 -> N 个 div”）
      if (Array.isArray(content)) {
        const segments: string[] = [];

        for (const item of content as any[]) {
          if (!item) continue;

          // 字符串元素
          if (typeof item === 'string') {
            segments.push(item);
            continue;
          }

          // 标准 text 片段
          if (item.type === 'text' && typeof item.text === 'string') {
            segments.push(item.text);
            continue;
          }

          // 工具结果：优先展示 content 字段，否则整个对象 JSON 化
          if (item.type === 'tool_result') {
            if (typeof item.content === 'string') {
              segments.push(item.content);
            } else {
              segments.push('```json\n' + JSON.stringify(item, null, 2) + '\n```');
            }
            continue;
          }

          // 其它未知结构，直接 JSON 作为 Markdown 代码块
          segments.push('```json\n' + JSON.stringify(item, null, 2) + '\n```');
        }

        const textContent = segments.join('\n\n');

        return {
          ...baseMessage,
          role: 'user',
          textContent,
          markdownSegments: segments,
        } as ParsedMessage;
      }

      // 兜底：content 是其它类型，直接展示原始 message 对象
      return {
        ...baseMessage,
        role: 'user',
        textContent: JSON.stringify(userMsg.message, null, 2),
        markdownSegments: ['```json\n' + JSON.stringify(userMsg.message, null, 2) + '\n```'],
      } as ParsedMessage;
    }

    case 'assistant': {
      const assistantMsg = record as AssistantMessage;
      let thinkingContent: string | undefined;
      const toolCalls: ToolCall[] = [];
      const markdownSegments: string[] = [];

      for (const item of assistantMsg.message.content) {
        if (item.type === 'text') {
          markdownSegments.push(item.text);
        } else if (item.type === 'thinking') {
          thinkingContent = item.thinking;
          markdownSegments.push(item.thinking);
        } else if (item.type === 'tool_use') {
          toolCalls.push({
            id: item.id,
            name: item.name,
            input: item.input,
            status: 'success',
          });

          // 针对工具调用：不再假设 input 中有固定字段（如 file_path），
          // 而是通用地展示为：
          //
          // tool: <name>
          //
          // - key1: value1
          // - key2: value2
          //
          const input = item.input as Record<string, unknown> | undefined;
          if (input && typeof input === 'object') {
            const entries = Object.entries(input);

            if (entries.length > 0) {
              const paramLines = entries.map(([key, value]) => {
                let displayValue: string;

                if (value === null || value === undefined) {
                  displayValue = 'null';
                } else if (typeof value === 'string') {
                  displayValue = value;
                } else {
                  try {
                    displayValue = JSON.stringify(value);
                  } catch {
                    displayValue = String(value);
                  }
                }

                return `- ${key}: ${displayValue}`;
              });

              const header = typeof item.name === 'string' ? `${item.name}` : 'tool';
              markdownSegments.push(`${header}\n\n${paramLines.join('\n')}`);
            } else {
              const header = typeof item.name === 'string' ? `${item.name}` : 'tool';
              markdownSegments.push(header);
            }
          } else {
            const header = typeof item.name === 'string' ? `${item.name}` : 'tool';
            markdownSegments.push(header);
          }
        } else {
          // 未知内容类型，直接 JSON 化
          markdownSegments.push('```json\n' + JSON.stringify(item, null, 2) + '\n```');
        }
      }

      const textContent = markdownSegments.join('\n\n');

      return {
        ...baseMessage,
        role: 'assistant',
        textContent,
        markdownSegments,
        thinkingContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        tokenUsage: assistantMsg.message.usage,
      } as ParsedMessage;
    }

    default:
      // 其它类型（包括未来扩展）暂时按原始 JSON 展示
      return {
        ...baseMessage,
        role: 'system',
        textContent: JSON.stringify(record, null, 2),
      } as ParsedMessage;
  }
}

/**
 * 解析 JSONL 文件内容为 ParsedMessage 数组
 */
export function parseJsonlFile(content: string): ParsedMessage[] {
  const records = parseJsonl(content);

  const messages: ParsedMessage[] = records.map((record, index) =>
    transformToMessage(record, index)
  );

  // 将 tool_use 与后续的 tool_result 合并到同一卡片：
  // - 根据 tool_use.id 建立索引
  // - 匹配后把 result 写回对应 toolCall.result
  // - 纯 tool_result 消息（没有其它文本）从展示列表中剔除
  const toolCallMap = new Map<string, { message: ParsedMessage; call: ToolCall }>();

  for (const msg of messages) {
    if (!msg.toolCalls) continue;
    for (const call of msg.toolCalls) {
      if (!call.id) continue;
      toolCallMap.set(call.id, { message: msg, call });
    }
  }

  const hiddenIndexes = new Set<number>();

  const formatToolResult = (content: unknown): string => {
    if (content === null || content === undefined) return '';
    if (typeof content === 'string') return content;
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  };

  messages.forEach((msg, idx) => {
    const raw: any = msg.raw;
    const contentArray = raw?.message?.content;

    if (raw?.type !== 'user' || !Array.isArray(contentArray)) {
      return;
    }

    const hasToolResult = contentArray.some(item => item?.type === 'tool_result');
    if (!hasToolResult) {
      return;
    }

    const hasNonToolResultContent = contentArray.some((item) => {
      if (!item) return false;
      if (item.type === 'tool_result') return false;
      if (typeof item === 'string') return item.trim().length > 0;
      if (item.type === 'text' && typeof item.text === 'string') {
        return item.text.trim().length > 0;
      }
      return true;
    });

    let matchedToolResult = false;

    for (const item of contentArray) {
      if (!item || item.type !== 'tool_result' || typeof item.tool_use_id !== 'string') {
        continue;
      }

      const match = toolCallMap.get(item.tool_use_id);
      if (!match) {
        continue;
      }

      const resultText = formatToolResult(item.content);
      if (resultText) {
        match.call.result = match.call.result
          ? `${match.call.result}\n${resultText}`
          : resultText;
      }
      const agentId = extractAgentId(item) || extractAgentId(raw?.toolUseResult) || extractAgentId(raw);
      if (agentId && !match.call.agentId) {
        match.call.agentId = agentId;
      }
      const existingIndex = match.message.pairedToolResultIndex;
      match.message.pairedToolResultIndex =
        typeof existingIndex === 'number' && existingIndex < msg.sessionIndex
          ? existingIndex
          : msg.sessionIndex;
      matchedToolResult = true;
    }

    if (matchedToolResult && !hasNonToolResultContent && hasToolResult) {
      hiddenIndexes.add(idx);
    }
  });

  const visibleMessages = messages.filter((_, idx) => !hiddenIndexes.has(idx));

  visibleMessages.forEach((msg) => {
    if (!msg.toolCalls || msg.toolCalls.length === 0) return;
    const useIndex = msg.sessionIndex + 1;
    const resultIndex = typeof msg.pairedToolResultIndex === 'number'
      ? msg.pairedToolResultIndex + 1
      : null;
    msg.indexLabel = resultIndex ? `${useIndex}><${resultIndex}` : `${useIndex}`;
  });

  return visibleMessages;
}
