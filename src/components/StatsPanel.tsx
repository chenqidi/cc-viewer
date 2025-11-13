import { useMemo } from 'react';
import { MessageSquare, Wrench, Clock, Cpu } from 'lucide-react';
import type { StatsPanelProps } from '../types/ui';
import { formatTokenCount } from '../lib/stats';
import { formatDuration } from '../lib/utils';
import { TOOL_ICONS } from '../types/ui';
import { cn } from '../lib/utils';

export function StatsPanel({ stats }: StatsPanelProps) {
  // 计算最常用的工具（前5个）
  const topTools = useMemo(() => {
    if (!stats || !stats.toolUsage) return [];

    return Object.entries(stats.toolUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [stats]);

  // 如果没有统计数据，显示空状态
  if (!stats) {
    return (
      <div className="px-4 py-3">
        <div className="text-text-secondary text-sm text-center">
          选择文件以查看统计
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-4">
      {/* 消息统计 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <MessageSquare className="w-3.5 h-3.5 text-accent-blue" />
          <span className="text-text-secondary">消息统计</span>
        </div>
        <div className="pl-5 space-y-1.5">
          <StatItem
            label="总消息"
            value={stats.totalMessages}
            color="text-text-primary"
          />
          <StatItem
            label="用户消息"
            value={stats.userMessages}
            color="text-accent-blue"
          />
          <StatItem
            label="助手消息"
            value={stats.assistantMessages}
            color="text-accent-green"
          />
          {stats.systemMessages > 0 && (
            <StatItem
              label="系统消息"
              value={stats.systemMessages}
              color="text-accent-orange"
            />
          )}
        </div>
      </div>

      {/* Token 统计 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <Cpu className="w-3.5 h-3.5 text-accent-purple" />
          <span className="text-text-secondary">Token 使用</span>
        </div>
        <div className="pl-5 space-y-1.5">
          <StatItem
            label="输入"
            value={formatTokenCount(stats.totalTokens.input)}
            color="text-accent-cyan"
          />
          <StatItem
            label="输出"
            value={formatTokenCount(stats.totalTokens.output)}
            color="text-accent-pink"
          />
          {stats.totalTokens.cached > 0 && (
            <StatItem
              label="缓存"
              value={formatTokenCount(stats.totalTokens.cached)}
              color="text-accent-yellow"
            />
          )}
          <StatItem
            label="总计"
            value={formatTokenCount(
              stats.totalTokens.input +
              stats.totalTokens.output
            )}
            color="text-text-primary"
            bold
          />
        </div>
      </div>

      {/* 工具使用统计 */}
      {topTools.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Wrench className="w-3.5 h-3.5 text-accent-orange" />
            <span className="text-text-secondary">工具使用</span>
          </div>
          <div className="pl-5 space-y-1.5">
            {topTools.map(({ name, count }) => (
              <StatItem
                key={name}
                label={
                  <span className="flex items-center gap-1">
                    <span>{TOOL_ICONS[name] || '🔧'}</span>
                    <span>{name}</span>
                  </span>
                }
                value={`${count}次`}
                color="text-text-primary"
              />
            ))}
          </div>
        </div>
      )}

      {/* 会话时长 */}
      {stats.duration > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-accent-yellow" />
            <span className="text-text-secondary">会话时长</span>
          </div>
          <div className="pl-5">
            <StatItem
              label="总时长"
              value={formatDuration(stats.duration)}
              color="text-text-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// 统计项组件
interface StatItemProps {
  label: React.ReactNode;
  value: React.ReactNode;
  color?: string;
  bold?: boolean;
}

function StatItem({ label, value, color = 'text-text-secondary', bold }: StatItemProps) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-text-secondary">{label}</span>
      <span className={cn(color, bold && 'font-bold')}>{value}</span>
    </div>
  );
}
