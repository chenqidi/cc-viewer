import { ReactNode, useRef, useCallback } from 'react';
import { ChevronsUp, ChevronUp, ChevronDown, ChevronsDown } from 'lucide-react';

interface MessagePanelProps {
  fileInfo?: ReactNode;
  messages?: ReactNode;
}

export function MessagePanel({ fileInfo, messages }: MessagePanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 获取所有消息卡片元素
  const getMessageCards = useCallback(() => {
    if (!scrollContainerRef.current) return [];
    return Array.from(
      scrollContainerRef.current.querySelectorAll<HTMLElement>('[data-message-id]')
    );
  }, []);

  // 获取当前视口中最接近顶部的卡片索引
  const getCurrentCardIndex = useCallback(() => {
    const cards = getMessageCards();
    if (cards.length === 0) return -1;

    const container = scrollContainerRef.current;
    if (!container) return -1;

    const containerRect = container.getBoundingClientRect();

    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      // 找到第一个底部还在视口内的卡片
      if (rect.bottom > containerRect.top + 100) {
        return i;
      }
    }
    return cards.length - 1;
  }, [getMessageCards]);

  // 跳转到第一个卡片
  const goToFirst = useCallback(() => {
    const cards = getMessageCards();
    if (cards.length > 0) {
      cards[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [getMessageCards]);

  // 跳转到上一个卡片
  const goToPrevious = useCallback(() => {
    const cards = getMessageCards();
    const currentIndex = getCurrentCardIndex();
    if (currentIndex > 0) {
      cards[currentIndex - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [getMessageCards, getCurrentCardIndex]);

  // 跳转到下一个卡片
  const goToNext = useCallback(() => {
    const cards = getMessageCards();
    const currentIndex = getCurrentCardIndex();
    if (currentIndex < cards.length - 1) {
      cards[currentIndex + 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [getMessageCards, getCurrentCardIndex]);

  // 跳转到最后一个卡片
  const goToLast = useCallback(() => {
    const cards = getMessageCards();
    if (cards.length > 0) {
      cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [getMessageCards]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 文件信息栏 */}
      {fileInfo && (
        <div className="flex-shrink-0 bg-background-header py-3 px-6">
          {fileInfo}
        </div>
      )}

      {/* 消息卡片滚动区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative" ref={scrollContainerRef}>
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

        {/* 导航按钮组 */}
        {messages && (
          <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
            <button
              onClick={goToFirst}
              className="p-2 rounded-md bg-surface-card/80 hover:bg-surface-muted border border-border-subtle text-text-secondary hover:text-text-primary transition-colors backdrop-blur-sm"
              title="跳转到第一条消息"
            >
              <ChevronsUp className="w-4 h-4" />
            </button>
            <button
              onClick={goToPrevious}
              className="p-2 rounded-md bg-surface-card/80 hover:bg-surface-muted border border-border-subtle text-text-secondary hover:text-text-primary transition-colors backdrop-blur-sm"
              title="跳转到上一条消息"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              className="p-2 rounded-md bg-surface-card/80 hover:bg-surface-muted border border-border-subtle text-text-secondary hover:text-text-primary transition-colors backdrop-blur-sm"
              title="跳转到下一条消息"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={goToLast}
              className="p-2 rounded-md bg-surface-card/80 hover:bg-surface-muted border border-border-subtle text-text-secondary hover:text-text-primary transition-colors backdrop-blur-sm"
              title="跳转到最后一条消息"
            >
              <ChevronsDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
