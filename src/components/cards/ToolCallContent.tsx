import { useState } from 'react';
import { Button } from '../ui/button';
import { highlightText } from '../../lib/utils';
import type { ToolCall } from '../../types/app';
import { CollapseToggle } from './CollapseToggle';

interface ToolCallContentProps {
  toolCalls: ToolCall[];
  searchQuery?: string;
  isExpanded?: boolean;
}

interface CollapsibleParamValueProps {
  value: string;
}

function CollapsibleParamValue({ value }: CollapsibleParamValueProps) {
  const [expanded, setExpanded] = useState(false);
  const lines = value.split(/\r?\n/);
  const hasMultipleLines = lines.length > 1;
  const displayText = expanded || !hasMultipleLines ? value : lines[0];

  const handleToggle = () => {
    if (hasMultipleLines) {
      setExpanded((prev) => !prev);
    }
  };

  return (
    <div className="flex-1">
      <div
        className={
          'whitespace-pre-wrap break-words ' +
          (hasMultipleLines ? 'cursor-pointer' : 'cursor-text')
        }
        onClick={handleToggle}
      >
        {displayText}
      </div>
      {hasMultipleLines && (
        <CollapseToggle
          className="mt-1"
          label={expanded ? '收起' : '展开全部'}
          onClick={handleToggle}
        />
      )}
    </div>
  );
}

export function ToolCallContent({ toolCalls, searchQuery, isExpanded = true }: ToolCallContentProps) {
  const handleCopyResult = (result: string) => {
    navigator.clipboard.writeText(result);
  };

  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  // 当前设计：一次只会调用一个工具，取第一个即可
  const tool = toolCalls[0];

  // 获取工具名称列表（折叠时显示）
  const toolNames = `${tool.name}`;

  if (!isExpanded) {
    return (
      <div className="text-text-primary text-sm">
        <p>{toolNames}</p>
      </div>
    );
  }

  // 高亮显示工具结果（如果有的话；当前 assistant.tool_use 卡片一般只关心参数）
  const displayResult = searchQuery && tool.result
    ? highlightText(tool.result, searchQuery)
    : tool.result;

  return (
    <>
      {/* 工具名称（纯文本形式，如 "tool: Read"） */}
      <div className="mb-2">
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-text-primary bg-surface-badge rounded-glass brutal-border">
          {`${tool.name}`}
        </span>
      </div>

      {/* 工具参数：紧跟在 tool 行后面，多个参数就是多块。
          规则：如果某个参数的文本有 2 行或以上，则默认折叠，只展示首行，点击后再展开/收起。 */}
      {Object.keys(tool.input).length > 0 && (
        <div className="space-y-1">
          {Object.entries(tool.input).map(([key, value]) => {
            let displayValue: string;

            if (value === null || value === undefined) {
              displayValue = 'null';
            } else if (typeof value === 'string') {
              displayValue = value;
            } else {
              try {
                displayValue = JSON.stringify(value);
              } catch {
                displayValue = String(value);
              }
            }

            return (
              <div
                key={key}
                className="bg-surface-muted rounded-glass px-3 py-2 text-xs font-mono text-text-primary flex gap-2"
              >
                <span className="font-semibold text-text-secondary break-keep">
                  {key}:
                </span>
                <CollapsibleParamValue value={displayValue} />
              </div>
            );
          })}
        </div>
      )}

      {/* 工具结果（如果存在的话，依然保留在参数块之后） */}
      {tool.result && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-text-primary bg-surface-badge rounded-glass brutal-border">
              Result
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyResult(tool.result!);
              }}
              className="h-7 px-3 text-xs hover:bg-white/5 rounded-glass transition-colors"
            >
              复制
            </Button>
          </div>
          {searchQuery ? (
            <pre
              className="code-glass p-4 text-xs max-h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: displayResult || '' }}
            />
          ) : (
            <pre className="code-glass p-4 text-xs max-h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap break-words">
              {tool.result}
            </pre>
          )}
        </div>
      )}
    </>
  );
}
