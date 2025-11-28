import { useMemo } from 'react';
import { diffLines, Change } from 'diff';

interface EditDiffViewerProps {
  oldString: string;
  newString: string;
}

/**
 * Edit 工具的 diff 可视化组件
 * 简洁的统一视图，红色删除、绿色新增
 */
export function EditDiffViewer({ oldString, newString }: EditDiffViewerProps) {
  const changes = useMemo(() => {
    return diffLines(oldString, newString);
  }, [oldString, newString]);

  return (
    <div className="bg-surface-muted rounded-glass overflow-hidden text-xs font-mono px-3 py-2">
      <div className="overflow-auto max-h-64 rounded-sm">
        {changes.map((change: Change, index: number) => {
          const lines = change.value.split('\n');
          // 移除最后一个空行（split 产生的）
          if (lines[lines.length - 1] === '') {
            lines.pop();
          }

          return lines.map((line, lineIndex) => {
            const key = `${index}-${lineIndex}`;

            if (change.added) {
              // 新增行 - 绿色
              return (
                <div
                  key={key}
                  className="py-0.5 bg-[rgba(153,204,153,0.18)] text-[#99CC99]"
                >
                  <span className="select-none mr-2 text-[#99CC99]/60">+</span>
                  {line || ' '}
                </div>
              );
            }

            if (change.removed) {
              // 删除行 - 红色
              return (
                <div
                  key={key}
                  className="py-0.5 bg-[rgba(242,119,122,0.18)] text-[#F2777A]"
                >
                  <span className="select-none mr-2 text-[#F2777A]/60">-</span>
                  {line || ' '}
                </div>
              );
            }

            // 未变化行 - 灰色（上下文）
            return (
              <div
                key={key}
                className="py-0.5 text-text-muted"
              >
                <span className="select-none mr-2 opacity-30">&nbsp;</span>
                {line || ' '}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
