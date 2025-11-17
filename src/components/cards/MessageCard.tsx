import type { ParsedMessage } from '../../types/app';
import { ReactNode, useState } from 'react';
import { UnifiedCard } from './UnifiedCard';
import { ToolCallContent } from './ToolCallContent';
import { CollapseToggle } from './CollapseToggle';

interface MessageCardProps {
  message: ParsedMessage;
  messageIndex: number;
  searchQuery?: string;
}

interface ToolResultPreviewProps {
  text: string;
}

function ToolResultPreview({ text }: ToolResultPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split(/\r?\n/);
  const hasMultipleLines = lines.length > 1;
  const displayText = expanded || !hasMultipleLines ? text : lines[0];

  const handleToggle = () => {
    if (hasMultipleLines) {
      setExpanded((prev) => !prev);
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-text-primary bg-surface-badge rounded-glass brutal-border">
          Result
        </span>
      </div>
      <div
        className={
          'code-glass rounded-glass ' +
          (hasMultipleLines ? 'cursor-pointer' : 'cursor-text')
        }
        onClick={handleToggle}
      >
        <pre
          className={
            'px-3 py-2 text-xs text-text-primary whitespace-pre-wrap break-words transition-all ' +
            (expanded ? 'max-h-[480px] overflow-y-auto' : 'max-h-24 overflow-hidden')
          }
        >
          {displayText}
        </pre>
      </div>
      {hasMultipleLines && (
        <CollapseToggle
          label={expanded ? '收起' : `展开全部（${lines.length} 行）`}
          onClick={handleToggle}
        />
      )}
    </div>
  );
}

export function MessageCard({ message, messageIndex, searchQuery }: MessageCardProps) {
  const raw: any = message.raw || {};
  const baseTypeLabel: string = raw.type || message.type;

  // 计算 labelBase：
  // - 默认是原始 JSON 的 type（user/assistant/system/summary/...）
  // - 如果有 message 且 content 是数组，并且所有元素都是 thinking 或 tool_use，
  //   则分别标记为 "type.thinking" 或 "type.tool_use"
  let labelBase = baseTypeLabel;
  let isThinkingOnly = false;
  let isToolUseOnly = false;
  const hasMessage = Object.prototype.hasOwnProperty.call(raw, 'message');
  let isUserToolResultMessage = false;

  if (hasMessage && raw.message && Array.isArray(raw.message.content)) {
    const contentArray = raw.message.content as any[];
    const types = contentArray
      .map((item) => (item && typeof item === 'object' ? item.type : undefined))
      .filter((t): t is string => Boolean(t));

    if (types.length > 0) {
      const allThinking = types.every((t) => t === 'thinking');
      const allToolUse = types.every((t) => t === 'tool_use');
      const allToolResult = types.every((t) => t === 'tool_result');

      if (allThinking) {
        isThinkingOnly = true;
        labelBase = `${baseTypeLabel}.thinking`;
      } else if (allToolUse) {
        isToolUseOnly = true;
        labelBase = `${baseTypeLabel}.tool_use`;
      } else if (allToolResult && baseTypeLabel === 'user') {
        isUserToolResultMessage = true;
        labelBase = `${baseTypeLabel}.tool_result`;
      }
    }
  }

  // 选择用于样式的卡片类型（只控制图标和颜色）
  let cardType: 'user' | 'assistant' | 'system' | 'thinking' | 'tool';
  if (message.type === 'user') {
    cardType = 'user';
  } else if (message.type === 'assistant') {
    if (isToolUseOnly && message.toolCalls && message.toolCalls.length > 0) {
      // 纯 tool_use 的 assistant 消息，用工具风格（wrench 图标），方便 E 键统一控制
      cardType = 'tool';
    } else if (isThinkingOnly) {
      // 纯 thinking 的 assistant 消息，用 thinking 风格（sparkles 图标），方便 T 键统一控制
      cardType = 'thinking';
    } else {
      cardType = 'assistant';
    }
  } else if (message.type === 'system') {
    cardType = 'system';
  } else {
    // 其它类型（summary / file-history-snapshot 等）先按 system 风格展示
    cardType = 'system';
  }

  // 决定内容和是否按 Markdown 渲染
  let content: string | string[] | ReactNode = '';
  let renderAsMarkdown = false;
  let copyText = '';

  // 特殊处理：user.tool_result 消息，展示 toolUseResult 的内容
  let toolResultText: string | undefined;
  if (isUserToolResultMessage && raw.toolUseResult) {
    const toolUseResult: any = raw.toolUseResult;
    if (typeof toolUseResult.content === 'string') {
      toolResultText = toolUseResult.content;
    } else if (
      toolUseResult.file &&
      typeof toolUseResult.file.content === 'string'
    ) {
      toolResultText = toolUseResult.file.content;
    }
  }

  // 1) assistant.tool_use 纯工具调用消息：用专门的 ToolCallContent 渲染
  if (
    message.type === 'assistant' &&
    isToolUseOnly &&
    message.toolCalls &&
    message.toolCalls.length > 0
  ) {
    content = (
      <ToolCallContent
        toolCalls={message.toolCalls}
        searchQuery={searchQuery}
        isExpanded={true}
      />
    );
    renderAsMarkdown = false;
    copyText = JSON.stringify(message.toolCalls, null, 2);

  // 2) user.tool_result 消息：展示工具结果
  } else if (isUserToolResultMessage && toolResultText) {
    content = <ToolResultPreview text={toolResultText} />;
    renderAsMarkdown = false;
    copyText = toolResultText;
  } else if (message.markdownSegments && message.markdownSegments.length > 0) {
    content = message.markdownSegments;
    renderAsMarkdown = true;
    copyText = message.markdownSegments.join('\n\n');
  } else if (typeof message.textContent === 'string') {
    content = message.textContent;
    // 有 message 的记录按 Markdown 渲染；没有则当纯文本（格式化 JSON）展示
    renderAsMarkdown = hasMessage;
    copyText = message.textContent;
  } else {
    content = JSON.stringify(raw, null, 2);
    renderAsMarkdown = false;
    // 这里 content 明确是字符串，但在类型上仍可能是 ReactNode 联合类型，显式断言为字符串
    copyText = content as string;
  }

  // 头部显示形如："assistant" + 右侧 "12:12:34 <2>"
  const indexText = `${messageIndex + 1}`;
  const label = labelBase;

  // assistant.thinking 卡片默认折叠（但后续会在 UnifiedCard 里改成“折叠时展示首行”）
  const defaultExpanded =
    message.type === 'assistant' && isThinkingOnly ? false : true;

  return (
    <div className="space-y-3">
      <UnifiedCard
        type={cardType}
        messageId={message.id}
        timestamp={message.timestamp}
        content={content}
        label={label}
        copyText={copyText}
        metadata={indexText}
        tokenUsage={message.role === 'assistant' ? message.tokenUsage : undefined}
        searchQuery={searchQuery}
        defaultExpanded={defaultExpanded}
        renderAsMarkdown={renderAsMarkdown}
      />
    </div>
  );
}
