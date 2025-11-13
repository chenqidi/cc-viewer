import { Card, CardHeader, CardContent } from '../ui/card';
import { formatTimestamp, highlightText } from '../../lib/utils';
import { useUiStore } from '../../stores/uiStore';

interface ThinkingCardProps {
  messageId: string;
  thinkingContent: string;
  timestamp: Date;
  searchQuery?: string;
}

export function ThinkingCard({ messageId, thinkingContent, timestamp, searchQuery }: ThinkingCardProps) {
  const { expandedCards, toggleCard } = useUiStore();
  const cardId = `thinking-${messageId}`;
  const isExpanded = expandedCards.has(cardId);

  // 计算思考内容的字符数
  const charCount = thinkingContent.length;

  // 高亮显示搜索结果
  const displayContent = searchQuery
    ? highlightText(thinkingContent, searchQuery)
    : thinkingContent;

  return (
    <Card className="card-thinking">
      <CardHeader
        className="cursor-pointer hover:bg-[#2a2a2a] transition-colors"
        onClick={() => toggleCard(cardId)}
      >
        <span className="text-2xl">💭</span>
        <span className="font-semibold flex-1">
          Thinking
          <span className="ml-2 text-xs text-text-secondary font-normal">
            ({charCount} 字符)
          </span>
        </span>
        <span className="timestamp">
          {formatTimestamp(timestamp)}
        </span>
        <span className="text-sm text-text-secondary">
          {isExpanded ? '▼' : '▶'}
        </span>
      </CardHeader>

      {isExpanded && (
        <CardContent className="text-text-secondary italic">
          {searchQuery ? (
            <div
              className="whitespace-pre-wrap text-sm"
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm">
              {thinkingContent}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
