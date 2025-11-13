import type { JsonlRecord, AssistantMessage, UserMessage, SystemMessage } from '../types/jsonl';
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
 */
export function transformToMessage(record: JsonlRecord): ParsedMessage | null {
  if (record.type === 'summary' || record.type === 'file-history-snapshot') {
    return null;
  }

  const baseMessage = {
    id: record.uuid,
    type: record.type,
    timestamp: new Date(record.timestamp),
    parentId: record.parentUuid,
    isSidechain: record.isSidechain || false,
    gitBranch: record.gitBranch,
    cwd: record.cwd,
    raw: record,
  };

  switch (record.type) {
    case 'user': {
      const userMsg = record as UserMessage;
      return {
        ...baseMessage,
        role: 'user',
        textContent: typeof userMsg.message.content === 'string'
          ? userMsg.message.content
          : '',
      } as ParsedMessage;
    }

    case 'assistant': {
      const assistantMsg = record as AssistantMessage;
      let textContent = '';
      let thinkingContent: string | undefined;
      const toolCalls: ToolCall[] = [];

      for (const content of assistantMsg.message.content) {
        if (content.type === 'text') {
          textContent += content.text;
        } else if (content.type === 'thinking') {
          thinkingContent = content.thinking;
        } else if (content.type === 'tool_use') {
          toolCalls.push({
            id: content.id,
            name: content.name,
            input: content.input,
            status: 'success',
          });
        }
      }

      return {
        ...baseMessage,
        role: 'assistant',
        textContent,
        thinkingContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        tokenUsage: assistantMsg.message.usage,
      } as ParsedMessage;
    }

    case 'system': {
      const systemMsg = record as SystemMessage;
      return {
        ...baseMessage,
        role: 'system',
        textContent: systemMsg.content || systemMsg.error?.message || '',
      } as ParsedMessage;
    }

    default:
      return null;
  }
}

/**
 * 解析 JSONL 文件内容为 ParsedMessage 数组
 */
export function parseJsonlFile(content: string): ParsedMessage[] {
  const records = parseJsonl(content);

  const messages: ParsedMessage[] = [];

  for (const record of records) {
    const message = transformToMessage(record);
    if (message) {
      messages.push(message);
    }
  }

  // 按时间升序排序
  messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return messages;
}
