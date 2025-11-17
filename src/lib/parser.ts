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

  const baseMessage: Omit<ParsedMessage, 'role'> = {
    id:
      anyRecord.uuid ||
      anyRecord.messageId ||
      anyRecord.leafUuid ||
      `${anyRecord.type || 'unknown'}-${index}`,
    type: anyRecord.type,
    sessionIndex: index,
    timestamp: timestampStr ? new Date(timestampStr) : new Date(0),
    parentId: anyRecord.parentUuid,
    isSidechain: Boolean(anyRecord.isSidechain),
    gitBranch: anyRecord.gitBranch,
    cwd: anyRecord.cwd,
    raw: record,
  };

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

  return messages;
}
