import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { formatTimestamp, highlightText } from '../../lib/utils';
import { CodeBlock } from '../CodeBlock';
import type { ParsedMessage } from '../../types/app';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AssistantCardProps {
  message: ParsedMessage;
  searchQuery?: string;
}

export function AssistantCard({ message, searchQuery }: AssistantCardProps) {
  const handleCopy = () => {
    if (message.textContent) {
      navigator.clipboard.writeText(message.textContent);
    }
  };

  return (
    <Card className="card-assistant">
      <CardHeader>
        <span className="text-2xl">🤖</span>
        <span className="font-semibold">Assistant</span>
        <span className="timestamp">
          {formatTimestamp(message.timestamp)}
        </span>
      </CardHeader>

      <CardContent className="text-text-primary prose prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // 自定义代码块渲染
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const code = String(children).replace(/\n$/, '');
              const inline = !className;

              return !inline ? (
                <CodeBlock code={code} language={language} />
              ) : (
                <code
                  className="bg-[#212121] px-1.5 py-0.5 rounded text-sm font-mono text-accent-bright"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            // 自定义链接样式
            a({ children, href }) {
              return (
                <a
                  href={href}
                  className="text-accent-bright hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              );
            },
            // 自定义列表样式
            ul({ children }) {
              return <ul className="list-disc list-inside space-y-1">{children}</ul>;
            },
            ol({ children }) {
              return <ol className="list-decimal list-inside space-y-1">{children}</ol>;
            },
            // 自定义文本节点 - 添加搜索高亮
            p({ children }) {
              if (searchQuery && typeof children === 'string') {
                const highlighted = highlightText(children, searchQuery);
                return <p dangerouslySetInnerHTML={{ __html: highlighted }} />;
              }
              return <p>{children}</p>;
            },
          }}
        >
          {message.textContent || ''}
        </ReactMarkdown>
      </CardContent>

      <CardFooter>
        {message.tokenUsage && (
          <div className="token-stats">
            📊 {message.tokenUsage.input_tokens.toLocaleString()} ↑ / {message.tokenUsage.output_tokens.toLocaleString()} ↓
            {(message.tokenUsage.cache_read_input_tokens ?? 0) > 0 && (
              <span className="ml-2 text-xs text-text-secondary">
                (缓存: {(message.tokenUsage.cache_read_input_tokens ?? 0).toLocaleString()})
              </span>
            )}
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          复制
        </Button>
      </CardFooter>
    </Card>
  );
}
