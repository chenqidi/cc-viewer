import { Card, CardHeader, CardContent } from '../ui/card';
import { formatTimestamp, highlightText } from '../../lib/utils';
import type { ParsedMessage } from '../../types/app';

interface SystemCardProps {
  message: ParsedMessage;
  searchQuery?: string;
}

export function SystemCard({ message, searchQuery }: SystemCardProps) {
  // 根据内容判断消息级别
  const isError = message.textContent?.toLowerCase().includes('error') ||
                  message.textContent?.toLowerCase().includes('错误') ||
                  message.textContent?.toLowerCase().includes('失败');

  const isWarning = message.textContent?.toLowerCase().includes('warning') ||
                    message.textContent?.toLowerCase().includes('警告');

  const getIcon = () => {
    if (isError) return '❌';
    if (isWarning) return '⚠️';
    return 'ℹ️';
  };

  const getColorClass = () => {
    if (isError) return 'border-red-500/50 bg-red-900/10';
    if (isWarning) return 'border-yellow-500/50 bg-yellow-900/10';
    return 'border-blue-500/50 bg-blue-900/10';
  };

  // 高亮显示搜索结果
  const displayContent = searchQuery && message.textContent
    ? highlightText(message.textContent, searchQuery)
    : message.textContent;

  return (
    <Card className={`card-system ${getColorClass()}`}>
      <CardHeader>
        <span className="text-2xl">{getIcon()}</span>
        <span className="font-semibold">
          {isError ? 'Error' : isWarning ? 'Warning' : 'System'}
        </span>
        <span className="timestamp">
          {formatTimestamp(message.timestamp)}
        </span>
      </CardHeader>

      <CardContent className="text-text-primary">
        {searchQuery ? (
          <p
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: displayContent || '' }}
          />
        ) : (
          <p className="whitespace-pre-wrap">{message.textContent}</p>
        )}
      </CardContent>
    </Card>
  );
}
