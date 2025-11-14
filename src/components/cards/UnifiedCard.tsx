import { ReactNode } from 'react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { cn, highlightText, formatTimestamp } from '../../lib/utils';
import { useUiStore } from '../../stores/uiStore';
import ReactMarkdown from 'react-markdown';
import type { LucideIcon } from 'lucide-react';
import { User, Bot, Cpu, Sparkles, Wrench, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../CodeBlock';
import type { TokenUsage } from '../../types/app';

type CardType = 'user' | 'assistant' | 'system' | 'thinking' | 'tool';

const typeConfig: Record<
  CardType,
  {
    Icon: LucideIcon;
    iconColorClass: string;
  }
> = {
  user: {
    Icon: User,
    iconColorClass: 'text-accent-blue',
  },
  assistant: {
    Icon: Bot,
    iconColorClass: 'text-accent-green',
  },
  tool: {
    Icon: Wrench,
    iconColorClass: 'text-accent-orange',
  },
  thinking: {
    Icon: Sparkles,
    iconColorClass: 'text-accent-yellow',
  },
  system: {
    Icon: Cpu,
    iconColorClass: 'text-accent-purple',
  },
};

interface UnifiedCardProps {
  type: CardType;
  messageId: string;
  timestamp: Date;
  // 支持字符串、字符串数组（多段 Markdown）以及自定义 ReactNode
  content: string | string[] | ReactNode;
  // 头部展示的类型标签：优先使用原始 JSON 的 type / 派生信息
  label?: string;
  // 点击复制按钮时复制的内容（若不传则不提供复制按钮）
  copyText?: string;
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
  label,
  copyText,
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
  const isStringArrayContent = Array.isArray(content) && content.every(item => typeof item === 'string');
  const hasCopyText = typeof copyText === 'string' && copyText.length > 0;
  const { Icon, iconColorClass } = typeConfig[type];

  const handleCopy = () => {
    if (hasCopyText) {
      navigator.clipboard.writeText(copyText as string);
    }
  };

  const renderContent = () => {
    // ReactNode 直接渲染
    if (!isStringContent && !isStringArrayContent) {
      return content;
    }

    // Markdown 渲染
    if (renderAsMarkdown) {
      const renderMarkdownBlock = (markdown: string, key?: number) => (
        <div key={key}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ inline, className, children }) {
                // 使用 inline 判断块级/行内：
                // - 三反引号 / 缩进代码块：inline === false
                // - 单反引号行内代码：inline === true
                const match = /language-([\w-]+)/.exec(className || '');
                const language = match ? match[1] : '';
                const isCodeBlock = inline === false;
                const code = String(children).replace(/\n$/, '');

                // 块级代码：统一走 CodeBlock（即使没有显式语言）
                if (isCodeBlock) {
                  return (
                    <CodeBlock
                      code={code}
                      language={language || undefined}
                      showHeader={Boolean(language)}
                    />
                  );
                }

                // 行内代码：语义化 <code>，不再透传 node 等内部属性
                return (
                  <code
                    className={cn(
                      'code-glass px-2 py-1 rounded text-sm font-mono text-text-primary',
                      className
                    )}
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
            {markdown}
          </ReactMarkdown>
        </div>
      );

      // 若传入的是字符串数组，则每段单独渲染一个 div（满足“content 里面 N 个 div”的需求）
      if (isStringArrayContent) {
        return (
          <div className="text-text-primary prose-sm prose-invert max-w-none space-y-4">
            {(content as string[]).map((item, index) => renderMarkdownBlock(item, index))}
          </div>
        );
      }

      // 普通字符串 Markdown 渲染
      return (
        <div className="text-text-primary prose-sm prose-invert max-w-none">
          {renderMarkdownBlock(content as string)}
        </div>
      );
    }

    // 纯文本渲染
    // 字符串数组：非 Markdown 模式下简单拼接展示（主要用于调试场景）
    if (!isStringContent && isStringArrayContent) {
      const joined = (content as string[]).join('\n\n');
      const displayContent = searchQuery ? highlightText(joined, searchQuery) : joined;
      return (
        <div
          className="text-text-primary whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      );
    }

    const displayContent = searchQuery ? highlightText(content as string, searchQuery) : (content as string);

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
          'flex flex-row items-center justify-between px-4 py-2 border-b-2 border-border bg-background-header'
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40">
              <Icon className={cn('w-3.5 h-3.5', iconColorClass)} />
            </span>
            <span className="font-semibold text-xs uppercase tracking-wide text-text-primary">
              {label || type}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <span className="text-xs text-text-muted shrink-0">
            {metadata
              ? `${formatTimestamp(timestamp)} <${metadata}>`
              : formatTimestamp(timestamp)}
          </span>
          {hasCopyText && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-8 w-8 text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors rounded-glass"
              aria-label="复制内容"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          )}
          <button
            className="p-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded transition-all"
            onClick={() => toggleCard(cardId)}
            aria-label={isExpanded ? '折叠' : '展开'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="card-content">
          {renderContent()}
        </CardContent>
      )}
    </Card>
  );
}
