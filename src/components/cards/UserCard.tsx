import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { formatTimestamp, highlightText } from '../../lib/utils';
import type { ParsedMessage } from '../../types/app';

interface UserCardProps {
  message: ParsedMessage;
  searchQuery?: string;
}

export function UserCard({ message, searchQuery }: UserCardProps) {
  const handleCopy = () => {
    if (message.textContent) {
      navigator.clipboard.writeText(message.textContent);
    }
  };

  // 高亮显示搜索结果
  const displayContent = searchQuery && message.textContent
    ? highlightText(message.textContent, searchQuery)
    : message.textContent;

  return (
    <Card className="card-user">
      <CardHeader>
        <span className="text-2xl">👤</span>
        <span className="font-semibold">User</span>
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

      <CardFooter>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          复制
        </Button>
      </CardFooter>
    </Card>
  );
}
