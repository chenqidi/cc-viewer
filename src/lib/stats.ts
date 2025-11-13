import type { ParsedMessage, SessionStats } from '../types/app';

/**
 * 计算会话统计信息
 */
export function calculateStats(messages: ParsedMessage[]): SessionStats {
  let userMessages = 0;
  let assistantMessages = 0;
  let systemMessages = 0;

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCachedTokens = 0;

  const toolUsage: Record<string, number> = {};

  for (const message of messages) {
    // 统计消息类型
    if (message.role === 'user') {
      userMessages++;
    } else if (message.role === 'assistant') {
      assistantMessages++;

      // 统计 Token
      if (message.tokenUsage) {
        totalInputTokens += message.tokenUsage.input_tokens;
        totalOutputTokens += message.tokenUsage.output_tokens;
        totalCachedTokens += (message.tokenUsage.cache_read_input_tokens || 0) +
                            (message.tokenUsage.cache_creation_input_tokens || 0);
      }

      // 统计工具使用
      if (message.toolCalls) {
        for (const tool of message.toolCalls) {
          toolUsage[tool.name] = (toolUsage[tool.name] || 0) + 1;
        }
      }
    } else if (message.role === 'system') {
      systemMessages++;
    }
  }

  // 计算时长
  let duration = 0;
  if (messages.length > 0) {
    const first = messages[0];
    const last = messages[messages.length - 1];
    duration = last.timestamp.getTime() - first.timestamp.getTime();
  }

  return {
    totalMessages: messages.length,
    userMessages,
    assistantMessages,
    systemMessages,
    totalTokens: {
      input: totalInputTokens,
      output: totalOutputTokens,
      cached: totalCachedTokens,
    },
    toolUsage,
    duration,
  };
}

/**
 * 格式化 Token 数量
 */
export function formatTokenCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
