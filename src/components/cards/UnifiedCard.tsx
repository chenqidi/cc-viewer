import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
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

const COLLAPSIBLE_CARD_TYPES = new Set<CardType>(['assistant', 'user', 'system']);
const COLLAPSED_CONTENT_MAX_HEIGHT = 320; // px

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
  const { expandedCards, toggleCard, registerCard } = useUiStore();

  // 使用全局状态，如果没有记录则使用 defaultExpanded
  const cardId = `${type}-${messageId}`;
  useEffect(() => {
    registerCard(cardId, defaultExpanded);
  }, [cardId, defaultExpanded, registerCard]);
  const storedState = expandedCards[cardId];
  const isExpanded = typeof storedState === 'boolean' ? storedState : defaultExpanded;
  const isThinkingCard = type === 'thinking';

  const isStringContent = typeof content === 'string';
  const isStringArrayContent = Array.isArray(content) && content.every(item => typeof item === 'string');
  const hasCopyText = typeof copyText === 'string' && copyText.length > 0;
  const { Icon, iconColorClass } = typeConfig[type];
  const shouldClampContent =
    COLLAPSIBLE_CARD_TYPES.has(type) && (isStringContent || isStringArrayContent);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const [isContentCollapsed, setIsContentCollapsed] = useState(true);
  const [isContentOverflowing, setIsContentOverflowing] = useState(false);

  useEffect(() => {
    if (!shouldClampContent) {
      setIsContentCollapsed(true);
      setIsContentOverflowing(false);
      return;
    }

    if (!isExpanded) {
      setIsContentCollapsed(true);
      setIsContentOverflowing(false);
      return;
    }

    const element = contentContainerRef.current;
    if (!element) return;

    const checkOverflow = () => {
      const overflow = element.scrollHeight > COLLAPSED_CONTENT_MAX_HEIGHT;
      setIsContentOverflowing(overflow);
    };

    checkOverflow();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      checkOverflow();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [shouldClampContent, isExpanded, content]);

  const handleToggleContentCollapsed = () => {
    setIsContentCollapsed((prev) => !prev);
  };

  const handleCopy = () => {
    if (hasCopyText) {
      navigator.clipboard.writeText(copyText as string);
    }
  };

  const renderContent = (truncateToFirstLine = false) => {
    const applyTruncate = (text: string): string => {
      if (!truncateToFirstLine) return text;
      const index = text.search(/\r?\n/);
      if (index === -1) return text;
      return text.slice(0, index);
    };

    // ReactNode 直接渲染
    if (!isStringContent && !isStringArrayContent) {
      return content;
    }

    // Markdown 渲染
    if (renderAsMarkdown) {
      const renderMarkdownBlock = (markdown: string, key?: number) => {
        const source = applyTruncate(markdown);
        return (
          <div key={key}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code(codeProps) {
                  const { inline, className, children } = codeProps as {
                    inline?: boolean;
                    className?: string;
                    children: ReactNode;
                  };
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
            {source}
          </ReactMarkdown>
        </div>
        );
      };

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
      const baseText = applyTruncate(joined);
      const displayContent = searchQuery ? highlightText(baseText, searchQuery) : baseText;
      return (
        <div
          className="text-text-primary whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      );
    }

    const baseText = applyTruncate(content as string);
    const displayContent = searchQuery ? highlightText(baseText, searchQuery) : baseText;

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

  const thinkingRawText = isThinkingCard
    ? isStringContent
      ? (content as string)
      : isStringArrayContent
        ? (content as string[]).join('\n\n')
        : null
    : null;

  const thinkingLineCount =
    thinkingRawText !== null ? thinkingRawText.split(/\r?\n/).length : null;

  const showThinkingToggleHint =
    isThinkingCard && (thinkingLineCount === null || thinkingLineCount > 1);

  const thinkingToggleLabel = showThinkingToggleHint
    ? isExpanded
      ? '收起'
      : thinkingLineCount && thinkingLineCount > 1
        ? `展开全部（${thinkingLineCount} 行）`
        : '展开全部'
    : '';

  const handleThinkingContentClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!showThinkingToggleHint) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && target.closest('a,button,textarea,input')) {
      return;
    }
    toggleCard(cardId);
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

      {/* Thinking 卡片：折叠状态下也展示内容，但只显示首行；展开后展示完整内容 */}
      {isThinkingCard ? (
        <CardContent className="card-content space-y-1">
          <div
            className={cn(
              'bg-[#2a2a2a] rounded-glass px-3 py-3 border border-white/5 text-sm text-text-primary break-words transition-colors',
              renderAsMarkdown ? 'whitespace-normal' : 'whitespace-pre-wrap',
              showThinkingToggleHint ? 'cursor-pointer hover:bg-white/5' : 'cursor-text'
            )}
            onClick={handleThinkingContentClick}
          >
            {renderContent(!isExpanded)}
          </div>
          {showThinkingToggleHint && (
            <div
              className="text-[10px] text-text-secondary cursor-pointer select-none"
              onClick={() => toggleCard(cardId)}
            >
              {thinkingToggleLabel}
            </div>
          )}
        </CardContent>
      ) : (
        isExpanded && (
          <CardContent className="card-content">
            <div
              ref={shouldClampContent ? contentContainerRef : undefined}
              className={cn(
                shouldClampContent ? 'relative transition-[max-height] duration-300 ease-in-out' : '',
                shouldClampContent && isContentOverflowing && isContentCollapsed
                  ? 'max-h-[320px] overflow-hidden'
                  : ''
              )}
            >
              {renderContent()}
              {shouldClampContent && isContentOverflowing && isContentCollapsed && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1F1F1F] via-[#1F1F1F]/70 to-transparent" />
              )}
            </div>
            {shouldClampContent && isContentOverflowing && (
              <button
                type="button"
                onClick={handleToggleContentCollapsed}
                className="mt-2 text-xs text-accent-blue hover:text-accent-cyan transition-colors"
              >
                {isContentCollapsed ? '展开全部' : '收起'}
              </button>
            )}
          </CardContent>
        )
      )}
    </Card>
  );
}
