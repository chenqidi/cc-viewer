import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { formatTimestamp, highlightText } from '../../lib/utils';
import { TOOL_NAMES, TOOL_ICONS } from '../../types/ui';
import { useUiStore } from '../../stores/uiStore';
import type { ToolCall } from '../../types/app';

interface ToolCallCardProps {
  messageId: string;
  toolCalls: ToolCall[];
  timestamp: Date;
  searchQuery?: string;
}

export function ToolCallCard({ messageId, toolCalls, timestamp, searchQuery }: ToolCallCardProps) {
  const { expandedCards, toggleCard } = useUiStore();
  const cardId = `tool-${messageId}`;
  const isExpanded = expandedCards.has(cardId);

  // 获取工具名称列表
  const toolNames = toolCalls.map((tool) => {
    const icon = TOOL_ICONS[tool.name] || '🛠️';
    const displayName = TOOL_NAMES[tool.name] || tool.name;
    return `${icon} ${displayName}`;
  }).join(', ');

  const handleCopyResult = (result: string) => {
    navigator.clipboard.writeText(result);
  };

  return (
    <Card className="card-tool">
      <CardHeader
        className="cursor-pointer hover:bg-[#2a3a3a] transition-colors"
        onClick={() => toggleCard(cardId)}
      >
        <span className="text-2xl">🛠️</span>
        <span className="font-semibold flex-1">
          工具调用
          <span className="ml-2 text-xs text-text-secondary font-normal">
            ({toolCalls.length} 个工具)
          </span>
        </span>
        <span className="timestamp">
          {formatTimestamp(timestamp)}
        </span>
        <span className="text-sm text-text-secondary">
          {isExpanded ? '▼' : '▶'}
        </span>
      </CardHeader>

      {!isExpanded && (
        <CardContent className="text-text-primary text-sm">
          <p>{toolNames}</p>
        </CardContent>
      )}

      {isExpanded && (
        <CardContent className="text-text-primary space-y-4">
          {toolCalls.map((tool, index) => {
            // 高亮显示工具结果
            const displayResult = searchQuery && tool.result
              ? highlightText(tool.result, searchQuery)
              : tool.result;

            return (
              <div key={tool.id || index} className="border-l-4 border-accent pl-4">
                {/* 工具名称 */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{TOOL_ICONS[tool.name] || '🛠️'}</span>
                  <span className="font-semibold text-lg">
                    {TOOL_NAMES[tool.name] || tool.name}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    tool.status === 'success'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-red-900/30 text-red-400'
                  }`}>
                    {tool.status === 'success' ? '✓ 成功' : '✗ 失败'}
                  </span>
                </div>

                {/* 工具参数 */}
                {Object.keys(tool.input).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-text-secondary mb-1">参数:</p>
                    <pre className="bg-[#212121] p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(tool.input, null, 2)}
                    </pre>
                  </div>
                )}

                {/* 工具结果 */}
                {tool.result && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-text-secondary">结果:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyResult(tool.result!);
                        }}
                      >
                        复制
                      </Button>
                    </div>
                    {searchQuery ? (
                      <pre
                        className="bg-[#212121] p-3 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: displayResult || '' }}
                      />
                    ) : (
                      <pre className="bg-[#212121] p-3 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
                        {tool.result}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
