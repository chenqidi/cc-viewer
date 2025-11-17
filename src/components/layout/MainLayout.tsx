import { ReactNode, useState, useRef, useEffect } from 'react';

interface MainLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
}

export function MainLayout({ sidebar, content }: MainLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_SIDEBAR_WIDTH = 250;
  const MAX_SIDEBAR_WIDTH = 400;

  // 处理鼠标拖动调整宽度
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  return (
    <div
      ref={containerRef}
      className="flex h-screen overflow-hidden bg-background"
    >
      {/* 侧边栏 */}
      <div
        className="flex-shrink-0 bg-background-sidebar relative"
        style={{ width: `${sidebarWidth}px` }}
      >
        {sidebar}

        {/* 拖动手柄 - hover 时才显示指示线 */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2 bg-transparent hover:bg-accent/30 transition-colors group z-10 select-none cursor-col-resize"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-accent-bright opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        {content}
      </div>
    </div>
  );
}
