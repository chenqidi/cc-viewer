import { ReactNode } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { cn, formatTimestamp, highlightText } from '../../lib/utils';
import { useUiStore } from '../../stores/uiStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../CodeBlock';
import type { TokenUsage } from '../../types/app';

type CardType = 'user' | 'assistant' | 'system' | 'thinking' | 'tool';

const headerBgClasses: Record<CardType, string> = {
  user: 'bg-theme-user',
  assistant: 'bg-theme-assistant',
  tool: 'bg-theme-tool',
  thinking: 'bg-theme-thinking',
  system: 'bg-theme-system',
};

interface UnifiedCardProps {
  type: CardType;
  messageId: string;
  timestamp: Date;
  content: string | ReactNode;
  tokenUsage?: TokenUsage;
  searchQuery?: string;
  metadata?: string;
  defaultExpanded?: boolean;
  renderAsMarkdown?: boolean;
}

export function UnifiedCard({
  type,
  messageId,
  timestamp,
  content,
  tokenUsage,
  searchQuery,
  metadata,
  defaultExpanded = true,
  renderAsMarkdown = false,
}: UnifiedCardProps) {
  const { expandedCards, toggleCard } = useUiStore();

  // 使用全局状态，如果没有记录则使用 defaultExpanded
  const cardId = `${type}-${messageId}`;
  const isExpanded = expandedCards.has(cardId) ? true : (expandedCards.size === 0 ? defaultExpanded : false);

  const isStringContent = typeof content === 'string';

  const handleCopy = () => {
    if (isStringContent) {
      navigator.clipboard.writeText(content);
    }
  };

  const renderContent = () => {
    // ReactNode 直接渲染
    if (!isStringContent) {
      return content;
    }

    // 应用搜索高亮
    const displayContent = searchQuery ? highlightText(content, searchQuery) : content;

    // Markdown 渲染
    if (renderAsMarkdown) {
      return (
        <div className="text-text-primary prose prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const code = String(children).replace(/\n$/, '');
                const inline = !className;

                return !inline ? (
                  <CodeBlock code={code} language={language} />
                ) : (
                  <code
                    className="code-glass px-2 py-1 rounded text-sm font-mono text-accent-cyan"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              a({ children, href }) {
                return (
                  <a
                    href={href}
                    className="text-accent-blue hover:text-accent-cyan hover:underline transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                );
              },
              ul({ children }) {
                return <ul className="list-disc list-inside space-y-2 my-3">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal list-inside space-y-2 my-3">{children}</ol>;
              },
              p({ children }) {
                if (searchQuery && typeof children === 'string') {
                  const highlighted = highlightText(children, searchQuery);
                  return <p className="my-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: highlighted }} />;
                }
                return <p className="my-2 leading-relaxed">{children}</p>;
              },
              h1({ children }) {
                return <h1 className="text-2xl font-bold mt-6 mb-3 text-text-primary">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-xl font-bold mt-5 mb-3 text-text-primary">{children}</h2>;
              },
              h3({ children }) {
                return <h3 className="text-lg font-semibold mt-4 mb-2 text-text-primary">{children}</h3>;
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    }

    // 纯文本渲染
    if (searchQuery) {
      return (
        <div
          className="text-text-primary whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      );
    }

    return <div className="text-text-primary whitespace-pre-wrap">{content}</div>;
  };

  return (
    <Card className={`card-${type}`}>
      <CardHeader
        className={cn(
	          'flex flex-row items-center justify-between px-4 py-3 border-b border-border',
          headerBgClasses[type]
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-semibold text-text-primary shrink-0 text-base">
            {type}
          </span>
          {metadata && (
            <span className="text-xs text-text-muted">•</span>
          )}
          {metadata && (
            <span className="text-xs text-text-secondary truncate">
              {metadata}
            </span>
          )}
          <span className="text-sm text-text-muted ml-auto shrink-0">
            {formatTimestamp(timestamp)}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          {isStringContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-3 text-xs hover:bg-white/5 transition-colors rounded-glass"
            >
              复制
            </Button>
          )}
          <button
            className="p-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded transition-all"
            onClick={() => toggleCard(cardId)}
            aria-label={isExpanded ? '折叠' : '展开'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="card-content">
          {renderContent()}
        </CardContent>
      )}

      {isExpanded && tokenUsage && (
        <CardFooter className="card-footer">
          <div className="token-stats">
            <span className="text-accent-cyan">📊</span>
            <span>{tokenUsage.input_tokens.toLocaleString()} ↑</span>
            <span className="text-text-muted">/</span>
            <span>{tokenUsage.output_tokens.toLocaleString()} ↓</span>
            {(tokenUsage.cache_read_input_tokens ?? 0) > 0 && (
              <span className="ml-2 text-xs text-accent-green">
                缓存: {(tokenUsage.cache_read_input_tokens ?? 0).toLocaleString()}
              </span>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
