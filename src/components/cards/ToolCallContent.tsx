import { Button } from '../ui/button';
import { highlightText } from '../../lib/utils';
import { TOOL_NAMES, TOOL_ICONS } from '../../types/ui';
import type { ToolCall } from '../../types/app';

interface ToolCallContentProps {
  toolCalls: ToolCall[];
  searchQuery?: string;
  isExpanded?: boolean;
}

export function ToolCallContent({ toolCalls, searchQuery, isExpanded = true }: ToolCallContentProps) {
  const handleCopyResult = (result: string) => {
    navigator.clipboard.writeText(result);
  };

  // 获取工具名称列表（折叠时显示）
  const toolNames = toolCalls.map((tool) => {
    const icon = TOOL_ICONS[tool.name] || '🛠️';
    const displayName = TOOL_NAMES[tool.name] || tool.name;
    return `${icon} ${displayName}`;
  }).join(', ');

  if (!isExpanded) {
    return (
      <div className="text-text-primary text-sm">
        <p>{toolNames}</p>
      </div>
    );
  }

  return (
    <div className="text-text-primary space-y-4">
      {toolCalls.map((tool, index) => {
        // 高亮显示工具结果
        const displayResult = searchQuery && tool.result
          ? highlightText(tool.result, searchQuery)
          : tool.result;

        return (
          <div
            key={tool.id || index}
            className="border-l-4 border-accent-cyan pl-4 py-2 bg-black/20 rounded-r-glass backdrop-blur-sm"
          >
            {/* 工具名称 */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{TOOL_ICONS[tool.name] || '🛠️'}</span>
              <span className="font-semibold text-lg text-text-primary">
                {TOOL_NAMES[tool.name] || tool.name}
              </span>
              <span className={`text-xs px-3 py-1 rounded-glass backdrop-blur-sm ${
                tool.status === 'success'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {tool.status === 'success' ? '✓ 成功' : '✗ 失败'}
              </span>
            </div>

            {/* 工具参数 */}
            {Object.keys(tool.input).length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-text-secondary mb-2 font-medium">参数:</p>
                <pre className="code-glass p-4 text-xs overflow-x-auto leading-relaxed">
                  {JSON.stringify(tool.input, null, 2)}
                </pre>
              </div>
            )}

            {/* 工具结果 */}
            {tool.result && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-text-secondary font-medium">结果:</p>
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
                    className="code-glass p-4 text-xs overflow-x-auto max-h-96 overflow-y-auto leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: displayResult || '' }}
                  />
                ) : (
                  <pre className="code-glass p-4 text-xs overflow-x-auto max-h-96 overflow-y-auto leading-relaxed">
                    {tool.result}
                  </pre>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
