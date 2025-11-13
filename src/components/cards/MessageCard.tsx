import type { ParsedMessage } from '../../types/app';
import { UnifiedCard } from './UnifiedCard';
import { ToolCallContent } from './ToolCallContent';

interface MessageCardProps {
  message: ParsedMessage;
  searchQuery?: string;
}

export function MessageCard({ message, searchQuery }: MessageCardProps) {
  return (
    <div className="space-y-3">
      {/* Thinking 卡片（如果存在） */}
      {message.thinkingContent && (
        <UnifiedCard
          type="thinking"
          messageId={message.id}
          timestamp={message.timestamp}
          content={message.thinkingContent}
          searchQuery={searchQuery}
          metadata={`${message.thinkingContent.length} 字符`}
          defaultExpanded={false}
        />
      )}

      {/* 主消息卡片 */}
      {message.role === 'user' && (
        <UnifiedCard
          type="user"
          messageId={message.id}
          timestamp={message.timestamp}
          content={message.textContent || ''}
          searchQuery={searchQuery}
        />
      )}

      {message.role === 'assistant' && (
        <UnifiedCard
          type="assistant"
          messageId={message.id}
          timestamp={message.timestamp}
          content={message.textContent || ''}
          tokenUsage={message.tokenUsage}
          searchQuery={searchQuery}
          renderAsMarkdown={true}
        />
      )}

      {message.role === 'system' && (
        <UnifiedCard
          type="system"
          messageId={message.id}
          timestamp={message.timestamp}
          content={message.textContent || ''}
          searchQuery={searchQuery}
        />
      )}

      {/* 工具调用卡片（如果存在） */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <UnifiedCard
          type="tool"
          messageId={message.id}
          timestamp={message.timestamp}
          content={<ToolCallContent toolCalls={message.toolCalls} searchQuery={searchQuery} />}
          metadata={`${message.toolCalls.length} 个工具`}
          defaultExpanded={false}
        />
      )}
    </div>
  );
}
