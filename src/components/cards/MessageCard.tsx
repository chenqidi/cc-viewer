import type { ParsedMessage } from '../../types/app';
import { ReactNode, useMemo, useState } from 'react';
import { UnifiedCard } from './UnifiedCard';
import { ToolCallContent } from './ToolCallContent';
import { CollapseToggle } from './CollapseToggle';
import { useFileStore } from '../../stores/fileStore';

interface MessageCardProps {
  message: ParsedMessage;
  messageIndex: number;
  searchQuery?: string;
}

interface ToolResultPreviewProps {
  text: string;
}

/**
 * 去除多行文本的公共前导空白（dedent）
 */
function dedent(text: string): string {
  const lines = text.split(/\r?\n/);

  // 找出所有非空行的最小缩进
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const match = line.match(/^(\s*)/);
    if (match) {
      minIndent = Math.min(minIndent, match[1].length);
    }
  }

  if (minIndent === Infinity || minIndent === 0) {
    return text;
  }

  return lines
    .map(line => line.slice(minIndent))
    .join('\n');
}

function extractAgentId(source: unknown): string | null {
  if (!source || typeof source !== 'object') return null;

  const stack: unknown[] = [source];
  const seen = new WeakSet<object>();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;
    if (seen.has(current as object)) continue;
    seen.add(current as object);

    if (Array.isArray(current)) {
      for (const item of current) {
        stack.push(item);
      }
      continue;
    }

    for (const [key, value] of Object.entries(current as Record<string, unknown>)) {
      if (key === 'agentId') {
        const normalized =
          typeof value === 'string'
            ? value.trim()
            : value !== null && value !== undefined
              ? String(value)
              : '';
        if (normalized) {
          return normalized;
        }
      }
      if (value && typeof value === 'object') {
        stack.push(value);
      }
    }
  }

  return null;
}

function ToolResultPreview({ text }: ToolResultPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const dedentedText = dedent(text);
  const lines = dedentedText.split(/\r?\n/);
  const hasMultipleLines = lines.length > 1;
  const displayText = expanded || !hasMultipleLines ? dedentedText : lines[0];

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
            (expanded ? 'max-h-[320px] overflow-y-auto' : 'max-h-24 overflow-hidden')
          }
        >
          {displayText}
        </pre>
      </div>
      {hasMultipleLines && (
        <CollapseToggle
          label={expanded ? '收起' : '展开全部'}
          onClick={handleToggle}
        />
      )}
    </div>
  );
}

export function MessageCard({ message, messageIndex, searchQuery }: MessageCardProps) {
  const raw: any = message.raw || {};
  const baseTypeLabel: string = raw.type || message.type;
  const { selectedFileId, files } = useFileStore();
  const currentFile = useMemo(
    () => files.find((f) => f.id === selectedFileId) || null,
    [files, selectedFileId]
  );
  const isCurrentFileAgent = useMemo(() => {
    if (!currentFile || !currentFile.fileName) return false;
    return currentFile.fileName.toLowerCase().startsWith('agent-');
  }, [currentFile]);
  const agentIds = useMemo(() => {
    const ids = new Set<string>();
    const rawId = extractAgentId(raw);
    if (rawId) ids.add(rawId);

    message.toolCalls?.forEach((call) => {
      const callId = (call as any).agentId;
      if (typeof callId === 'string' && callId.trim()) {
        ids.add(callId.trim());
      }
    });

    return Array.from(ids);
  }, [raw, message.toolCalls]);
  const agentFileLabels = agentIds.map((id) => `agent-${id}.jsonl`);

  // 计算 labelBase：
  // - 默认是原始 JSON 的 type（user/assistant/system/summary/...）
  // - 如果有 message 且 content 是数组，并且所有元素都是 thinking 或 tool_use，
  //   则分别标记为 "type.thinking" 或 "type.tool_use"
  let labelBase = baseTypeLabel;
  let isThinkingOnly = false;
  let isToolUseOnly = false;
  let hasMixedContent = false; // 同时包含 text 和 tool_use
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
      const hasText = types.some((t) => t === 'text');
      const hasToolUse = types.some((t) => t === 'tool_use');

      if (allThinking) {
        isThinkingOnly = true;
        labelBase = `${baseTypeLabel}.thinking`;
      } else if (allToolUse) {
        isToolUseOnly = true;
        labelBase = `${baseTypeLabel}.tool_use`;
      } else if (allToolResult && baseTypeLabel === 'user') {
        isUserToolResultMessage = true;
        labelBase = `${baseTypeLabel}.tool_result`;
      } else if (hasText && hasToolUse) {
        // 混合内容：同时有文本和工具调用
        hasMixedContent = true;
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

  const formatMetaValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || '-';
    }
    try {
      const text = String(value).trim();
      return text || '-';
    } catch {
      return '-';
    }
  };

  // 1) assistant.tool_use 纯工具调用消息：用专门的 ToolCallContent 渲染
  if (message.type === 'system') {
    const systemText = [
      `cwd: ${formatMetaValue(message.cwd ?? (raw as any).cwd)}`,
      `version: ${formatMetaValue(message.version ?? (raw as any).version)}`,
      `gitBranch: ${formatMetaValue(message.gitBranch ?? (raw as any).gitBranch)}`,
    ].join('\n');

    content = systemText;
    renderAsMarkdown = false;
    copyText = systemText;

  } else if (
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

  // 2) assistant 混合内容：文本 + 工具调用
  } else if (
    message.type === 'assistant' &&
    hasMixedContent &&
    message.toolCalls &&
    message.toolCalls.length > 0
  ) {
    // 从 markdownSegments 中过滤掉工具调用的内容
    // 工具调用的 segment 格式为 "toolName\n\n- key: value..."
    const toolNames = new Set(message.toolCalls.map(tc => tc.name));
    const filteredSegments = (message.markdownSegments || []).filter(segment => {
      // 检查 segment 是否以工具名开头（工具调用的格式）
      const firstLine = segment.split('\n')[0].trim();
      return !toolNames.has(firstLine);
    });

    if (filteredSegments.length > 0) {
      content = filteredSegments;
    } else {
      content = message.textContent || '';
    }
    renderAsMarkdown = true;
    copyText = (typeof content === 'string' ? content : (content as string[]).join('\n\n'))
      + '\n\n' + JSON.stringify(message.toolCalls, null, 2);

  // 3) user.tool_result 消息：展示工具结果
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
  const baseIndex = Number.isFinite(messageIndex) ? messageIndex : message.sessionIndex;
  const indexText = message.indexLabel || `${baseIndex + 1}`;
  const label = labelBase;

  // assistant.thinking 卡片默认折叠（但后续会在 UnifiedCard 里改成"折叠时展示首行"）
  const defaultExpanded =
    message.type === 'assistant' && isThinkingOnly ? false : true;

  // 混合内容时，工具调用作为 appendContent 显示
  const mixedToolCallContent = hasMixedContent && message.toolCalls && message.toolCalls.length > 0
    ? (
      <ToolCallContent
        toolCalls={message.toolCalls}
        searchQuery={searchQuery}
        isExpanded={true}
        showToolCallLabel={true}
      />
    )
    : null;

  const agentBadge =
    !isCurrentFileAgent && agentFileLabels.length > 0
      ? (
        <div className="flex flex-wrap gap-2">
          {agentFileLabels.map((label) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-accent-pink/45 bg-accent-pink/18 px-3 py-1 text-xs font-semibold text-accent-pink shadow-[0_10px_24px_-12px_rgba(255,105,180,0.55)] backdrop-blur"
            >
              <span className="whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
      )
      : null;

  // 组合 appendContent：工具调用 + agentBadge
  const appendContent = (mixedToolCallContent || agentBadge)
    ? (
      <>
        {mixedToolCallContent}
        {agentBadge}
      </>
    )
    : undefined;

  return (
    <div className="space-y-3" data-message-id={message.id}>
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
        appendContent={appendContent}
      />
    </div>
  );
}
