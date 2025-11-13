import { ReactNode } from 'react';

interface MessagePanelProps {
  fileInfo?: ReactNode;
  messages?: ReactNode;
}

export function MessagePanel({ fileInfo, messages }: MessagePanelProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* 文件信息栏 */}
      {fileInfo && (
        <div className="flex-shrink-0 bg-background-header py-3 px-6">
          {fileInfo}
        </div>
      )}

      {/* 消息卡片滚动区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[900px] mx-auto px-6 py-8">
          {messages ? (
            messages
          ) : (
            <div className="text-center text-text-secondary py-20">
              <div className="space-y-4">
                <p className="text-6xl">📋</p>
                <p className="text-xl font-semibold">暂无消息</p>
                <p className="text-sm">请从左侧选择一个文件查看对话历史</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
