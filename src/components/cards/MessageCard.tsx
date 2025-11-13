import type { ParsedMessage } from '../../types/app';
import { UserCard } from './UserCard';
import { AssistantCard } from './AssistantCard';
import { SystemCard } from './SystemCard';
import { ThinkingCard } from './ThinkingCard';
import { ToolCallCard } from './ToolCallCard';

interface MessageCardProps {
  message: ParsedMessage;
  searchQuery?: string;
}

export function MessageCard({ message, searchQuery }: MessageCardProps) {
  return (
    <div className="space-y-3">
      {/* Thinking 卡片（如果存在） */}
      {message.thinkingContent && (
        <ThinkingCard
          messageId={message.id}
          thinkingContent={message.thinkingContent}
          timestamp={message.timestamp}
          searchQuery={searchQuery}
        />
      )}

      {/* 主消息卡片 */}
      {message.role === 'user' && <UserCard message={message} searchQuery={searchQuery} />}
      {message.role === 'assistant' && <AssistantCard message={message} searchQuery={searchQuery} />}
      {message.role === 'system' && <SystemCard message={message} searchQuery={searchQuery} />}

      {/* 工具调用卡片（如果存在） */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <ToolCallCard
          messageId={message.id}
          toolCalls={message.toolCalls}
          timestamp={message.timestamp}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
}
